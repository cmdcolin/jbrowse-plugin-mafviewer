import { BaseFeatureDataAdapter } from '@jbrowse/core/data_adapters/BaseAdapter'
import { Feature, isGzip, Region, SimpleFeature } from '@jbrowse/core/util'
import { ObservableCreate } from '@jbrowse/core/util/rxjs'
import { openLocation } from '@jbrowse/core/util/io'
import { GenericFilehandle } from 'generic-filehandle2'
import { unzip, unzipChunkSlice } from '@gmod/bgzf-filehandle'
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
      // console.log(
      //   { relativizedVirtualOffset },
      //   Number.MAX_SAFE_INTEGER / relativizedVirtualOffset,
      // )
      const ref = chr === '*' ? lastChr : chr
      const r2 = ref.split('.').at(-1)!
      const x = Long.fromNumber(relativizedVirtualOffset)
      const y = x.shiftRightUnsigned(16)
      const z = x.and(0xffff)
      const voff = new VirtualOffset(y.toNumber(), z.toNumber())

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
      console.log({
        lastRawVirtualOffset,
        relativizedVirtualOffset,
        blockPos: relativizedVirtualOffset >>> 16,
        lastBlockPos: lastRawVirtualOffset >>> 16,
        x: Number.isSafeInteger(relativizedVirtualOffset),
      })
      lastRawVirtualOffset = relativizedVirtualOffset
    }
    console.log({ entries })
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
            console.log(
              'fetching from: ' + firstEntry.virtualOffset.blockPosition,
              'length: ' +
                (nextEntry.virtualOffset.blockPosition -
                  firstEntry.virtualOffset.blockPosition),
              { firstEntry, nextEntry },
            )
            const response = await file.read(
              nextEntry.virtualOffset.blockPosition -
                firstEntry.virtualOffset.blockPosition,
              firstEntry.virtualOffset.blockPosition,
            )
            const decoder = new TextDecoder('utf8')
            console.log({
              response,
              len: response.length,
              // @ts-expect-error
              gzip: isGzip(response),
            })
            const buffer = await unzip(response)
            const data = decoder.decode(buffer)
            console.log({ data })
            //
            // const text = await response.text()
            // const lines = text.split('\n').filter(line => line.trim())
            //
            // for (const line of lines) {
            //   const [chr, start, srcSize, strand, unknown, data] =
            //     line.split('\t')
            //
            //   // Only emit features that overlap with query region
            //   const featureStart = parseInt(start, 10)
            //   const featureEnd = featureStart + parseInt(srcSize, 10)
            //
            //   if (
            //     chr === query.refName &&
            //     featureEnd >= query.start &&
            //     featureStart <= query.end
            //   ) {
            //     observer.next(
            //       new SimpleFeature({
            //         uniqueId: `${chr}-${start}-${data}`,
            //         refName: chr,
            //         start: featureStart,
            //         end: featureEnd,
            //         strand: parseInt(strand, 10),
            //         data: data,
            //       }),
            //     )
            //   }
            // }
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
