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
import { openLocation } from '@jbrowse/core/util/io'
import { ObservableCreate } from '@jbrowse/core/util/rxjs'
import { getSnapshot } from 'mobx-state-tree'
import { firstValueFrom, toArray } from 'rxjs'

import parseNewick from '../parseNewick'
import { normalize } from '../util'

interface OrganismRecord {
  chr: string
  start: number
  srcSize: number
  strand: number
  unknown: number
  seq: string
}

export default class MafTabixAdapter extends BaseFeatureDataAdapter {
  public setupP?: Promise<{ adapter: BaseFeatureDataAdapter }>

  async setupPre() {
    if (!this.getSubAdapter) {
      throw new Error('no getSubAdapter available')
    }
    return {
      adapter: (
        await this.getSubAdapter({
          ...getSnapshot(this.config),
          type: 'BedTabixAdapter',
        })
      ).dataAdapter as BaseFeatureDataAdapter,
    }
  }
  async setupPre2() {
    if (!this.setupP) {
      this.setupP = this.setupPre().catch((e: unknown) => {
        this.setupP = undefined
        throw e
      })
    }
    return this.setupP
  }

  async setup(opts?: BaseOptions) {
    const { statusCallback = () => {} } = opts || {}
    return updateStatus('Downloading index', statusCallback, () =>
      this.setupPre2(),
    )
  }

  async getRefNames(opts?: BaseOptions) {
    const { adapter } = await this.setup(opts)
    return adapter.getRefNames()
  }

  async getHeader(opts?: BaseOptions) {
    const { adapter } = await this.setup(opts)
    return adapter.getHeader()
  }

  getFeatures(query: Region, opts?: BaseOptions) {
    const { statusCallback = () => {} } = opts || {}
    return ObservableCreate<Feature>(async observer => {
      const { adapter } = await this.setup(opts)
      const features = await updateStatus(
        'Downloading alignments',
        statusCallback,
        () => firstValueFrom(adapter.getFeatures(query).pipe(toArray())),
      )

      await updateStatus('Processing alignments', statusCallback, () => {
        let firstAssemblyNameFound = ''
        const refAssemblyName = this.getConf('refAssemblyName')

        for (const feature of features) {
          const data = (feature.get('field5') as string).split(',')
          const alignments = {} as Record<string, OrganismRecord>
          const dataLength = data.length

          for (let j = 0; j < dataLength; j++) {
            const elt = data[j]!
            // Cache split result to avoid redundant operations
            const parts = elt.split(':')

            // Use destructuring for better performance than multiple array access
            const [
              assemblyAndChr,
              startStr,
              srcSizeStr,
              strandStr,
              unknownStr,
              seq,
            ] = parts

            // Skip if we don't have all required parts
            if (!assemblyAndChr || !seq) {
              continue
            }

            // Optimized assembly name parsing with simplified logic
            let assemblyName: string
            let chr: string

            const firstDotIndex = assemblyAndChr.indexOf('.')
            if (firstDotIndex === -1) {
              // No dot found, entire string is assembly name
              assemblyName = assemblyAndChr
              chr = ''
            } else {
              const secondDotIndex = assemblyAndChr.indexOf(
                '.',
                firstDotIndex + 1,
              )
              if (secondDotIndex === -1) {
                // Only one dot: assembly.chr
                assemblyName = assemblyAndChr.slice(
                  0,
                  Math.max(0, firstDotIndex),
                )
                chr = assemblyAndChr.slice(Math.max(0, firstDotIndex + 1))
              } else {
                // Multiple dots: check if second part is numeric (version number)
                const secondPart = assemblyAndChr.slice(
                  firstDotIndex + 1,
                  secondDotIndex,
                )
                const isNumeric =
                  secondPart.length > 0 && !Number.isNaN(+secondPart)

                if (isNumeric) {
                  // assembly.version.chr format
                  assemblyName = assemblyAndChr.slice(
                    0,
                    Math.max(0, secondDotIndex),
                  )
                  chr = assemblyAndChr.slice(Math.max(0, secondDotIndex + 1))
                } else {
                  // assembly.chr.more format
                  assemblyName = assemblyAndChr.slice(
                    0,
                    Math.max(0, firstDotIndex),
                  )
                  chr = assemblyAndChr.slice(Math.max(0, firstDotIndex + 1))
                }
              }
            }

            if (assemblyName) {
              // Set first assembly name found (only once)
              if (!firstAssemblyNameFound) {
                firstAssemblyNameFound = assemblyName
              }

              // Create alignment record with optimized number conversion
              alignments[assemblyName] = {
                chr,
                start: +startStr!,
                srcSize: +srcSizeStr!,
                strand: strandStr === '-' ? -1 : 1,
                unknown: +unknownStr!,
                seq,
              }
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
                seq:
                  alignments[refAssemblyName || query.assemblyName]?.seq ||
                  alignments[firstAssemblyNameFound]?.seq,
              },
            }),
          )
        }
      })
      observer.complete()
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

  freeResources(): void {}
}
