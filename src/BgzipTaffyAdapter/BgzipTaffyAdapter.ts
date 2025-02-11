import { unzip } from '@gmod/bgzf-filehandle'
import {
  BaseFeatureDataAdapter,
  BaseOptions,
} from '@jbrowse/core/data_adapters/BaseAdapter'
import {
  Feature,
  Region,
  SimpleFeature,
  updateStatus,
} from '@jbrowse/core/util'
import { openLocation } from '@jbrowse/core/util/io'
import { ObservableCreate } from '@jbrowse/core/util/rxjs'
import Long from 'long'

import VirtualOffset from './virtualOffset'
import parseNewick from '../parseNewick'
import { normalize } from '../util'
import { parseRowInstructions } from './rowInstructions'

import type { IndexData, OrganismRecord } from './types'
import { parseLineByLine } from './util'
interface Entry {
  type: string
  row: number
  asm: string
  ref: string
  start: number
  strand: number
  length: number
}

const toP = (s = 0) => +(+s).toFixed(1)

export default class BgzipTaffyAdapter extends BaseFeatureDataAdapter {
  public setupP?: Promise<IndexData>

  async getRefNames() {
    const data = await this.setup()
    return Object.keys(data)
  }

  setupPre() {
    if (!this.setupP) {
      this.setupP = this.readTaiFile().catch((e: unknown) => {
        this.setupP = undefined
        throw e
      })
    }
    return this.setupP
  }
  setup(opts?: BaseOptions) {
    const { statusCallback = () => {} } = opts || {}
    return updateStatus('Downloading index', statusCallback, () =>
      this.setupPre(),
    )
  }

  async readTaiFile() {
    const text = await openLocation(this.getConf('taiLocation')).readFile(
      'utf8',
    )
    const lines = text
      .split('\n')
      .map(f => f.trim())
      .filter(line => !!line)
    const entries = {} as IndexData
    let lastChr = ''
    let lastChrStart = 0
    let lastRawVirtualOffset = 0
    for (const line of lines) {
      const [chr, chrStart, virtualOffset] = line.split('\t')
      const relativizedVirtualOffset = lastRawVirtualOffset + +virtualOffset!
      const currChr = chr === '*' ? lastChr : chr!.split('.').at(-1)!

      // bgzip TAF files store virtual offsets in plaintext in the TAI file
      // these virtualoffsets are 64bit values, so the long library is needed
      // to accurately do the bit manipulations needed
      const x = Long.fromNumber(relativizedVirtualOffset)
      const y = x.shiftRightUnsigned(16)
      const z = x.and(0xffff)
      const voff = new VirtualOffset(y.toNumber(), z.toNumber())

      if (!entries[currChr]) {
        entries[currChr] = []
        lastChr = ''
        lastChrStart = 0
        lastRawVirtualOffset = 0
      }
      const currStart = +chrStart! + lastChrStart
      entries[currChr].push({
        chrStart: currStart,
        virtualOffset: voff,
      })
      lastChr = currChr
      lastChrStart = currStart
      lastRawVirtualOffset = relativizedVirtualOffset
    }
    return entries
  }

  getFeatures(query: Region, opts?: BaseOptions) {
    const { statusCallback = () => {} } = opts || {}
    console.log(query.start, query.end, 'wtf')
    return ObservableCreate<Feature>(async observer => {
      try {
        const byteRanges = await this.setup()
        const buffer = await updateStatus(
          'Downloading alignments',
          statusCallback,
          () => this.getLines(query, byteRanges),
        )
        if (buffer) {
          const alignments = {} as Record<string, OrganismRecord>
          const data = [] as Entry[]
          let a0: any
          let j = 0
          let b = 0
          parseLineByLine(buffer, line => {
            if (j++ % 100 === 0) {
              statusCallback(
                `Processing ${toP(b / 1_000_000)}/${toP(buffer.length / 1_000_000)}Mb`,
              )
            }
            b += line.length
            if (line) {
              const [lineData, rowInstructions] = line.split(' ; ')
              if (rowInstructions) {
                for (const ins of parseRowInstructions(rowInstructions)) {
                  if (ins.type === 'i') {
                    data.splice(ins.row, 0, ins)
                    if (!alignments[ins.asm]) {
                      alignments[ins.asm] = {
                        start: ins.start,
                        strand: ins.strand,
                        srcSize: ins.length,
                        chr: ins.ref,
                        data: '',
                      }
                    }
                    const e = alignments[ins.asm]!
                    e.data += ' '.repeat(Math.max(0, j - e.data.length)) // catch it up
                  } else if (ins.type === 's') {
                    if (!alignments[ins.asm]) {
                      alignments[ins.asm] = {
                        start: ins.start,
                        strand: ins.strand,
                        srcSize: ins.length,
                        chr: ins.ref,
                        data: '',
                        asm: ins.asm,
                      }
                    }
                    const e = alignments[ins.asm]!
                    e.data += ' '.repeat(Math.max(0, j - e.data.length)) // catch it up
                    data[ins.row] = ins
                  } else if (ins.type === 'd') {
                    data.splice(ins.row, 1)
                  }

                  // no gaps for now(?)
                  // else if (ins.type === 'g') {
                  // }
                  // else if (ins.type === 'G') {
                  // }
                }
                if (!a0) {
                  a0 = data[0]
                }
              }
              const lineLen = lineData!.length
              for (let i = 0; i < lineLen; i++) {
                const letter = lineData![i]
                const r = data[i]
                if (r) {
                  alignments[r.asm]!.data += letter
                } else {
                  // not sure why but chr22_KI270731v1_random.taf.gz ends up here
                }
              }
            }
          })
          if (a0) {
            const row0 = alignments[a0.asm]!

            // see
            // https://github.com/ComparativeGenomicsToolkit/taffy/blob/f5a5354/docs/taffy_utilities.md#referenced-based-maftaf-and-indexing
            // for the significance of row[0]:
            //
            // "An anchor line in TAF is a column from which all sequence
            // coordinates can be deduced without scanning backwards to previous
            // lines "
            observer.next(
              new SimpleFeature({
                uniqueId: `${row0.start}-${row0.data.length}`,
                refName: query.refName,
                start: row0.start,
                end: row0.start + row0.data.length,
                strand: row0.strand,
                alignments,
                seq: row0.data,
              }),
            )
          }
        }
        statusCallback('')
        observer.complete()
      } catch (e) {
        observer.error(e)
      }
    })
  }

  async getSamples(_query: Region) {
    const nhLoc = this.getConf('nhLocation')
    const nh =
      nhLoc.uri === '/path/to/my.nh'
        ? undefined
        : await openLocation(nhLoc).readFile('utf8')

    // TODO: we may need to resolve the exact set of rows in the visible region
    // here
    return {
      samples: normalize(this.getConf('samples')),
      tree: nh ? parseNewick(nh) : undefined,
    }
  }

  // TODO: cache processed large chunks
  async getLines(query: Region, byteRanges: IndexData) {
    const file = openLocation(this.getConf('tafGzLocation'))
    const records = byteRanges[query.refName]
    if (records) {
      let firstEntry = records[0]
      let nextEntry
      // two pass:
      // first pass: find first block greater than query start, then -1 from
      // that
      for (let i = 0; i < records.length; i++) {
        if (records[i]!.chrStart >= query.start) {
          firstEntry = records[Math.max(i - 1, 0)]
          break
        }
      }
      // second pass: find first block where query end less than record start,
      // and +1 from that
      for (let i = 0; i < records.length; i++) {
        if (query.end <= records[i]!.chrStart) {
          nextEntry = records[i + 1]
          break
        }
      }

      nextEntry = nextEntry ?? records.at(-1)
      if (firstEntry && nextEntry) {
        const response = await file.read(
          nextEntry.virtualOffset.blockPosition -
            firstEntry.virtualOffset.blockPosition,
          firstEntry.virtualOffset.blockPosition,
        )
        const buffer = await unzip(response)
        return buffer.slice(firstEntry.virtualOffset.dataPosition)
      }
    }
    return undefined
  }

  freeResources(): void {}
}
