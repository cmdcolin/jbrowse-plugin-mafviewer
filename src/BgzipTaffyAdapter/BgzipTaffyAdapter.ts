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

import type { IndexData, OrganismRecord } from './types'

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
        const rows = await this.getRows(lines)

        const alignments = {} as Record<string, OrganismRecord>
        for (const row of rows) {
          if (row.asm) {
            if (!alignments[row.asm]) {
              alignments[row.asm] = {
                chr: row.ref!,
                start: row.start,
                srcSize: 0,
                strand: row.strand,
                unknown: 0,
                data: '',
              }
            }
          }
        }

        const l = rows.length
        const k = lines.length
        let ll = 0
        for (let i = 0; i < l; i++) {
          for (let j = 0; j < k; j++) {
            const r = rows[i]!.asm
            const t = rows[i]!.row
            if (r) {
              if (!lines[j]![t] && ll++ < 100) {
                console.log(lines[j]![t], j, t, lines[j], lines[j]?.length)
              }
              alignments[r]!.data += lines[j]![t] || ''
            }
          }
        }

        // see
        // https://github.com/ComparativeGenomicsToolkit/taffy/blob/f5a5354/docs/taffy_utilities.md#referenced-based-maftaf-and-indexing
        // for the significance of row[0]:
        //
        // "An anchor line in TAF is a column from which all sequence
        // coordinates can be deduced without scanning backwards to previous
        // lines "
        const row0 = rows[0]
        if (row0) {
          const a0 = row0.asm!
          const aln0 = alignments[a0]!
          observer.next(
            new SimpleFeature({
              uniqueId: `${query.refName}-${query.start}`,
              refName: query.refName,
              start: row0.start!,
              end: row0.start! + aln0.data.length,
              strand: row0.strand,
              alignments,
              seq: aln0.data,
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

  async getRows(lines: string[]) {
    const firstLine = lines[0]
    const data = firstLine?.split(';').map(f => f.trim())
    const ret = data?.[1]?.split(' ')
    const rows = []
    if (ret) {
      for (let i = 0; i < ret.length; ) {
        const type = ret[i++]
        if (type === 'i' || type === 's') {
          const row = +ret[i++]!
          const [asm, ref] = ret[i++]!.split('.')
          rows.push({
            type,
            row,
            asm,
            ref,
            start: +ret[i++]!,
            strand: ret[i++] === '-' ? -1 : 1,
            length: +ret[i++]!,
          })
        } else if (type === 'd') {
          rows.push({
            type,
            row: +ret[i++]!,
          })
        } else if (type === 'g') {
          rows.push({
            type,
            row: +ret[i++]!,
            gap_length: +ret[i++]!,
          })
        } else if (type === 'G') {
          rows.push({
            type,
            row: +ret[i++]!,
            gap_string: ret[i++]!,
          })
        }
      }
    }
    return rows.sort((a, b) => a.row - b.row)
  }

  freeResources(): void {}
}
