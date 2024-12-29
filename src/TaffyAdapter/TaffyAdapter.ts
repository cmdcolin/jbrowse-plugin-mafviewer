import { BaseFeatureDataAdapter } from '@jbrowse/core/data_adapters/BaseAdapter'
import { getSnapshot } from 'mobx-state-tree'
import { Feature, Region, SimpleFeature } from '@jbrowse/core/util'
import { ObservableCreate } from '@jbrowse/core/util/rxjs'
import { openLocation } from '@jbrowse/core/util/io'
import { GenericFilehandle } from 'generic-filehandle2'

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
  fileOffset: number
}
type IndexData = Record<string, ByteRange[]>

export default class TaffyAdapter extends BaseFeatureDataAdapter {
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
    let lastFileOffset = 0
    for (const line of text.split('\n').filter(line => line.trim())) {
      const [chr, chrStart, fileOffset] = line.split('\t')
      const ref = chr === '*' ? lastChr : chr
      const r2 = ref.split('.').at(-1)!

      if (!entries[r2]) {
        entries[r2] = []
        lastChr = ''
        lastChrStart = 0
        lastFileOffset = 0
      }
      const s = +chrStart + lastChrStart
      const f = +fileOffset + lastFileOffset
      entries[r2].push({
        chrStart: s,
        fileOffset: f,
      })
      lastChr = ref
      lastChrStart = s
      lastFileOffset = f
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
          this.getConf('tafLocation'),
        ) as GenericFilehandle

        const records = byteRanges[query.refName]
        console.log({ query, byteRanges, records })
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (records) {
          let firstEntry
          let nextEntry
          for (let i = 0; i < records.length; i++) {
            const entry = records[i]
            console.log({ entry: entry.chrStart, query: query.start })
            if (entry.chrStart >= query.start) {
              firstEntry = records[i - 1]
              nextEntry = records[i]
              break
            }
          }
          console.log({ firstEntry, nextEntry })
          if (firstEntry && nextEntry) {
            console.log(
              firstEntry.fileOffset.toLocaleString(),
              (nextEntry.fileOffset - firstEntry.fileOffset).toLocaleString(),
            )
            const response = await file.read(
              nextEntry.fileOffset - firstEntry.fileOffset,
              firstEntry.fileOffset,
            )
            const decoder = new TextDecoder('utf8')
            console.log({ response }, response.length)
            const data = decoder.decode(response)
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
