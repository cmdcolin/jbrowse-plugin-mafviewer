import { BaseFeatureDataAdapter } from '@jbrowse/core/data_adapters/BaseAdapter'
import { getSnapshot } from 'mobx-state-tree'
import { Feature, Region, SimpleFeature } from '@jbrowse/core/util'
import { ObservableCreate } from '@jbrowse/core/util/rxjs'
import { openLocation } from '@jbrowse/core/util/io'

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
  fileOffst: number
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
    for (const line of text.split('\n').filter(line => line.trim())) {
      const [chr, chrStart, fileOffset] = line.split('\t')
      const ref = chr === '*' ? lastChr : chr
      const r2 = ref.split('.').at(-1)!

      if (!entries[r2]) {
        entries[r2] = []
      }
      entries[r2].push({
        chrStart: +chrStart,
        fileOffst: +fileOffset,
      })
      lastChr = ref
    }
    return entries
  }

  getFeatures(query: Region) {
    return ObservableCreate<Feature>(async observer => {
      try {
        // const { tafLocation } = getSnapshot(this.config)
        // const byteRanges = await this.setup()
        //
        // for (const range of byteRanges[query.refName] || []) {
        //   const response = await fetch(tafLocation, {
        //     headers: {
        //       Range: `bytes=${range.start}-${range.start + range.length - 1}`,
        //     },
        //   })
        //
        //   const text = await response.text()
        //   const lines = text.split('\n').filter(line => line.trim())
        //
        //   for (const line of lines) {
        //     const [chr, start, srcSize, strand, unknown, data] =
        //       line.split('\t')
        //
        //     // Only emit features that overlap with query region
        //     const featureStart = parseInt(start, 10)
        //     const featureEnd = featureStart + parseInt(srcSize, 10)
        //
        //     if (
        //       chr === query.refName &&
        //       featureEnd >= query.start &&
        //       featureStart <= query.end
        //     ) {
        //       observer.next(
        //         new SimpleFeature({
        //           uniqueId: `${chr}-${start}-${data}`,
        //           refName: chr,
        //           start: featureStart,
        //           end: featureEnd,
        //           strand: parseInt(strand, 10),
        //           data: data,
        //         }),
        //       )
        //     }
        //   }
        // }
        observer.complete()
      } catch (e) {
        observer.error(e)
      }
    })
  }
  freeResources(): void {}
}
