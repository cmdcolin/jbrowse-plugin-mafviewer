import { unzip } from '@gmod/bgzf-filehandle'
import { BaseFeatureDataAdapter } from '@jbrowse/core/data_adapters/BaseAdapter'
import { Feature, Region, SimpleFeature } from '@jbrowse/core/util'
import { openLocation } from '@jbrowse/core/util/io'
import { ObservableCreate } from '@jbrowse/core/util/rxjs'
import { GenericFilehandle } from 'generic-filehandle2'
import Long from 'long'

import VirtualOffset from './virtualOffset'
import parseNewick from '../parseNewick'
import { normalize } from '../util'
import { parseRowInstructions } from './rowInstructions'

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
export default class BgzipTaffyAdapter extends BaseFeatureDataAdapter {
  public setupP?: Promise<IndexData>

  async getRefNames() {
    const data = await this.setup()
    return Object.keys(data)
  }

  setup() {
    if (!this.setupP) {
      this.setupP = this.readTaiFile().catch((e: unknown) => {
        this.setupP = undefined
        throw e
      })
    }
    return this.setupP
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

  getFeatures(query: Region) {
    return ObservableCreate<Feature>(async observer => {
      try {
        const lines = await this.getLines(query)
        const alignments = {} as Record<string, OrganismRecord>

        const k = lines.length
        const data = [] as Entry[]
        let a0: any
        for (let j = 0; j < k; j++) {
          const line = lines[j]!
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
              const r = data[i]!
              alignments[r.asm]!.data += letter
            }
          }
        }
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

  async getLines(query: Region) {
    const byteRanges = await this.setup()

    // @ts-expect-error
    const file = openLocation(
      this.getConf('tafGzLocation'),
    ) as GenericFilehandle

    const decoder = new TextDecoder('utf8')
    const records = byteRanges[query.refName]
    if (records) {
      let firstEntry = records[0]
      let nextEntry
      for (let i = 0; i < records.length; i++) {
        if (records[i]!.chrStart >= query.start) {
          // we use i-1 for firstEntry because the current record is "greater
          // than the query start", we go backwards one record to make sure to
          // cover up until the query start. we use i+1 to ensure we get at
          // least one block in the case that i=0
          firstEntry = records[Math.max(i - 1, 0)]
          nextEntry = records[i + 1]
          break
        }
      }
      if (firstEntry && nextEntry) {
        const response = await file.read(
          nextEntry.virtualOffset.blockPosition -
            firstEntry.virtualOffset.blockPosition,
          firstEntry.virtualOffset.blockPosition,
        )
        const buffer = await unzip(response)
        return decoder
          .decode(buffer.slice(firstEntry.virtualOffset.dataPosition))
          .split('\n')
      }
    }
    return []
  }

  freeResources(): void {}
}
