import { BaseFeatureDataAdapter } from '@jbrowse/core/data_adapters/BaseAdapter'
import { Feature, Region, SimpleFeature } from '@jbrowse/core/util'
import { ObservableCreate } from '@jbrowse/core/util/rxjs'
import { openLocation } from '@jbrowse/core/util/io'
import { GenericFilehandle } from 'generic-filehandle2'
import { unzip } from '@gmod/bgzf-filehandle'
import VirtualOffset from './virtualOffset'
import Long from 'long'

interface OrganismRecord {
  chr: string
  start: number
  srcSize: number
  strand: number
  unknown: number
  data: string
}

interface ByteRange {
  chrStart: number
  virtualOffset: VirtualOffset
}
type IndexData = Record<string, ByteRange[]>

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
    const entries = {} as IndexData
    let lastChr = ''
    let lastChrStart = 0
    let lastRawVirtualOffset = 0
    for (const line of text.split('\n').filter(line => line.trim())) {
      const [chr, chrStart, virtualOffset] = line.split('\t')
      const relativizedVirtualOffset = lastRawVirtualOffset + +virtualOffset
      const ref = chr === '*' ? lastChr : chr
      const r2 = ref.split('.').at(-1)!
      const x = Long.fromNumber(relativizedVirtualOffset)
      const y = x.shiftRightUnsigned(16)
      const z = x.and(0xffff)
      const voff = new VirtualOffset(y.toNumber(), z.toNumber())

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!entries[r2]) {
        entries[r2] = []
        lastChr = ''
        lastChrStart = 0
        lastRawVirtualOffset = 0
      }
      const s = +chrStart + lastChrStart

      entries[r2].push({
        chrStart: s,
        virtualOffset: voff,
      })
      lastChr = ref
      lastChrStart = s
      lastRawVirtualOffset = relativizedVirtualOffset
    }
    return entries
  }

  getFeatures(query: Region) {
    return ObservableCreate<Feature>(async observer => {
      try {
        const byteRanges = await this.setup()

        // @ts-expect-error
        const file = openLocation(
          this.getConf('tafGzLocation'),
        ) as GenericFilehandle

        const records = byteRanges[query.refName]
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (records) {
          let firstEntry
          let nextEntry
          for (let i = 0; i < records.length; i++) {
            const entry = records[i]
            if (entry.chrStart >= query.start) {
              firstEntry = records[i - 1]
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
            console.log(buffer.length / 1_000_000)
            const decoder = new TextDecoder('utf8')
            const str = decoder.decode(
              buffer.slice(firstEntry.virtualOffset.dataPosition),
            )

            const [firstLine, ...rest] = str.split('\n')
            const [firstLineAlignment, info] = firstLine
              .split(';')
              .map(f => f.trim())
            const ret = info.split(' ')
            const rows = []
            for (let i = 0; i < ret.length; i += 6) {
              const [asm, ref] = ret[i + 2].split('.')
              rows.push({
                type: ret[i],
                u0: ret[i + 1],
                asm,
                ref,
                start: +ret[i + 3],
                strand: ret[i + 4] === '-' ? -1 : 1,
                u1: ret[i + 5],
              })
            }

            const alignments = {} as Record<string, OrganismRecord>
            for (const row of rows) {
              // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
              if (!alignments[row.asm]) {
                alignments[row.asm] = {
                  chr: row.ref,
                  start: row.start,
                  srcSize: 0,
                  strand: row.strand,
                  unknown: 0,
                  data: '',
                }
              }
            }

            const lines = [firstLineAlignment, ...rest]
            const l = rows.length
            const k = lines.length
            for (let i = 0; i < l; i++) {
              for (let j = 0; j < k; j++) {
                alignments[rows[i].asm].data += lines[j][i]
              }
            }

            const row0 = rows[0]
            const aln0 = alignments[row0.asm]
            observer.next(
              new SimpleFeature({
                uniqueId: `${query.refName}-${query.start}`,
                refName: query.refName,
                start: row0.start,
                end: row0.start + aln0.data.length,
                strand: row0.strand,
                alignments,
                seq: alignments[rows[0].asm],
              }),
            )
          }
        }
        observer.complete()
      } catch (e) {
        observer.error(e)
      }
    })
  }
  freeResources(): void {}
}
