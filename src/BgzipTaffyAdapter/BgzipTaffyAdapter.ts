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
import QuickLRU from '@jbrowse/core/util/QuickLRU'
import { openLocation } from '@jbrowse/core/util/io'
import { ObservableCreate } from '@jbrowse/core/util/rxjs'
import AbortablePromiseCache from 'abortable-promise-cache'
import Long from 'long'

import VirtualOffset from './virtualOffset'
import parseNewick from '../parseNewick'
import { normalize } from '../util'
import { parseRowInstructions } from './rowInstructions'
import { parseLineByLine } from './util'

import type { IndexData, OrganismRecord } from './types'

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

  private cache = new AbortablePromiseCache({
    cache: new QuickLRU({ maxSize: 50 }),
    // @ts-expect-error
    fill: async ({ nextEntry, firstEntry }, signal, statusCallback) => {
      const file = openLocation(this.getConf('tafGzLocation'))
      const response = await file.read(
        nextEntry.virtualOffset.blockPosition -
          firstEntry.virtualOffset.blockPosition,
        firstEntry.virtualOffset.blockPosition,
      )
      const buffer = await unzip(response)
      const slice = buffer.slice(firstEntry.virtualOffset.dataPosition)
      return this.getChunk(slice, {
        statusCallback: statusCallback as (arg: string) => void,
        signal,
      })
    },
  })

  async getRefNames() {
    const data = await this.setup()
    return Object.keys(data)
  }

  async getChunk(buffer: Uint8Array, opts?: BaseOptions) {
    const { statusCallback = () => {} } = opts || {}
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
              e.data += ' '.repeat(Math.max(0, j - e.data.length - 1)) // catch it up
            } else if (ins.type === 's') {
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
              e.data += ' '.repeat(Math.max(0, j - e.data.length - 1)) // catch it up
              data[ins.row] = ins
            } else if (ins.type === 'd') {
              data.splice(ins.row, 1)
            }

            // no gaps for now(?)
            // else if (ins.type === 'g') {
            //   console.log('g??')
            // } else if (ins.type === 'G') {
            //   console.log('G??')
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
      return {
        uniqueId: `${row0.start}-${row0.data.length}`,
        start: row0.start,
        end: row0.start + row0.data.length,
        strand: row0.strand,
        alignments,
        seq: row0.data,
      }
    }
    return undefined
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
    return ObservableCreate<Feature>(async observer => {
      try {
        const byteRanges = await this.setup()
        const feat = await updateStatus(
          'Downloading alignments',
          statusCallback,
          () => this.getLines(query, byteRanges),
        )
        if (feat) {
          observer.next(
            // @ts-expect-error
            new SimpleFeature({
              ...feat,
              refName: query.refName,
            }),
          )
        } else {
          console.error('no feature found')
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
    const records = byteRanges[query.refName]
    if (records) {
      let firstEntry
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
      // we NEED at least a firstEntry (validate behavior?) because othrwise it fetches whole
      // file whn you request e.g. out of range region (e.g. taf in chr22:1-100
      // and you are at chr22:200-300)
      if (firstEntry && nextEntry) {
        return this.cache.get(
          `${JSON.stringify(nextEntry)}_${JSON.stringify(firstEntry)}`,
          {
            nextEntry,
            firstEntry,
          },
        )
      }
    }
    return undefined
  }

  freeResources(): void {}
}
