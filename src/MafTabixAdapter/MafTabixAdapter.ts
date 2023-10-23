import { BaseFeatureDataAdapter } from '@jbrowse/core/data_adapters/BaseAdapter'
import { getSnapshot } from 'mobx-state-tree'
import { Feature, Region, SimpleFeature } from '@jbrowse/core/util'
import { ObservableCreate } from '@jbrowse/core/util/rxjs'
import { firstValueFrom, toArray } from 'rxjs'

interface OrganismRecord {
  chr: string
  start: number
  srcSize: number
  strand: number
  unknown: number
  data: string
}
export default class BigMafAdapter extends BaseFeatureDataAdapter {
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
      this.setupP = this.setup().catch(e => {
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

  getFeatures(query: Region) {
    return ObservableCreate<Feature>(async observer => {
      const { adapter } = await this.setup()
      const features = await firstValueFrom(
        adapter.getFeatures(query).pipe(toArray()),
      )
      for (const feature of features) {
        const data = (feature.get('field5') as string).split(',')
        console.log({ data })
        const alignments = {} as Record<string, OrganismRecord>
        const main = data[0]
        const aln = main.split(':')[5]
        const alns = data.map(elt => elt.split(':')[5])
        const alns2 = data.map(() => '')
        // remove extraneous data in other alignments
        // reason being: cannot represent missing data in main species that are in others)
        for (let i = 0, o = 0; i < aln.length; i++, o++) {
          if (aln[i] !== '-') {
            for (let j = 0; j < data.length; j++) {
              alns2[j] += alns[j][i]
            }
          }
        }
        for (let j = 0; j < data.length; j++) {
          const elt = data[j]

          const ad = elt.split(':')
          const org = ad[0].split('.')[0]
          const chr = ad[0].split('.')[1]

          alignments[org] = {
            chr: chr,
            start: +ad[1],
            srcSize: +ad[2],
            strand: ad[3] === '-' ? -1 : 1,
            unknown: +ad[4],
            data: alns2[j],
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
              alignments: alignments,
              seq: alns2[0],
            },
          }),
        )
      }
      observer.complete()
    })
  }
  freeResources(): void {}
}
