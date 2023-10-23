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
    if (!this.getSubAdapter) {
      throw new Error('no getSubAdapter available')
    }
    const adapter = await this.getSubAdapter({
      ...getSnapshot(this.config),
      type: 'BigBedAdapter',
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
        const maf = feature.get('mafBlock') as string
        const blocks = maf.split(';')
        let aln: string | undefined
        const alns = [] as string[]
        const alignments = {} as Record<string, OrganismRecord>
        const blocks2 = [] as string[]
        for (const block of blocks) {
          if (block[0] === 's') {
            if (!aln) {
              aln = block.split(/ +/)[6]
              alns.push(aln)
              blocks2.push(block)
            } else {
              alns.push(block.split(/ +/)[6])
              blocks2.push(block)
            }
          }
        }
        const alns2 = alns.map(() => '')

        if (aln) {
          for (let i = 0; i < aln?.length; i++) {
            if (aln[i] !== '-') {
              for (let j = 0; j < alns.length; j++) {
                alns2[j] += alns[j][i]
              }
            }
          }
        }

        for (let i = 0; i < blocks2.length; i++) {
          const elt = blocks2[i]
          const ad = elt.split(/ +/)
          const y = ad[1].split('.')
          const org = y[0]
          const chr = y[1]

          alignments[org] = {
            chr: chr,
            start: +ad[1],
            srcSize: +ad[2],
            strand: ad[3] === '+' ? 1 : -1,
            unknown: +ad[4],
            data: alns2[i],
          }
        }
        observer.next(
          new SimpleFeature({
            id: feature.id(),
            data: {
              start: feature.get('start'),
              end: feature.get('end'),
              refName: feature.get('refName'),
              seq: alns2[0],
              alignments: alignments,
            },
          }),
        )
      }
      observer.complete()
    })
  }
  freeResources(): void {}
}
