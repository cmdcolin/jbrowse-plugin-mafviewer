import { BaseFeatureDataAdapter } from '@jbrowse/core/data_adapters/BaseAdapter'
import { Feature, Region, SimpleFeature } from '@jbrowse/core/util'
import { ObservableCreate } from '@jbrowse/core/util/rxjs'
import { getSnapshot } from 'mobx-state-tree'
import { firstValueFrom, toArray } from 'rxjs'

interface OrganismRecord {
  chr: string
  start: number
  srcSize: number
  strand: number
  unknown: number
  data: string
}

export default class MafTabixAdapter extends BaseFeatureDataAdapter {
  public setupP?: Promise<{ adapter: BaseFeatureDataAdapter }>

  async setup() {
    const config = this.config
    if (!this.getSubAdapter) {
      throw new Error('no getSubAdapter available')
    }
    const adapter = await this.getSubAdapter({
      ...getSnapshot(config),
      type: 'BedTabixAdapter',
    })
    return {
      adapter: adapter.dataAdapter as BaseFeatureDataAdapter,
    }
  }
  async setupPre() {
    if (!this.setupP) {
      this.setupP = this.setup().catch((e: unknown) => {
        this.setupP = undefined
        throw e
      })
    }
    return this.setupP
  }

  async getRefNames() {
    const { adapter } = await this.setup()
    return adapter.getRefNames()
  }

  async getHeader() {
    const { adapter } = await this.setup()
    return adapter.getHeader()
  }

  getFeatures(query: Region) {
    return ObservableCreate<Feature>(async observer => {
      const { adapter } = await this.setup()
      const features = await firstValueFrom(
        adapter.getFeatures(query).pipe(toArray()),
      )
      const samples = this.getConf('samples') as string[] | { id: string }[]
      const sampleStrings =
        typeof samples[0] === 'string'
          ? (samples as string[])
          : (samples as { id: string }[]).map(s => s.id)
      const sampleSet = new Set(sampleStrings)
      let i = 0
      for (const feature of features) {
        const data = (feature.get('field5') as string).split(',')
        const alignments = {} as Record<string, OrganismRecord>
        const alns = data.map(elt => elt.split(':')[5])

        for (const [j, elt] of data.entries()) {
          const ad = elt.split(':')
          const idx = ad[0]!.lastIndexOf('.')
          const org = ad[0]!.slice(0, idx)
          const last = ad[0]!.slice(idx + 1)
          const s = sampleSet.has(org)
            ? org
            : sampleStrings.find(f => ad[0]!.startsWith(f))
          if (s) {
            alignments[s] = {
              chr: last,
              start: +ad[1]!,
              srcSize: +ad[2]!,
              strand: ad[3] === '-' ? -1 : 1,
              unknown: +ad[4]!,
              data: alns[j]!,
            }
          } else if (i < 100) {
            console.error(`line not processed ${ad[0]}`)
            i++
          } else if (i > 100) {
            console.error('too many errors, not printing any more')
          }
        }

        observer.next(
          new SimpleFeature({
            id: feature.id(),
            data: {
              start: feature.get('start'),
              end: feature.get('end'),
              refName: feature.get('refName'),
              name: feature.get('name'),
              score: feature.get('score'),
              alignments,
              seq: alns[0],
            },
          }),
        )
      }
      observer.complete()
    })
  }
  freeResources(): void {}
}
