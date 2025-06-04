import type { AnyConfigurationModel } from '@jbrowse/core/configuration'
import type { BaseFeatureDataAdapter } from '@jbrowse/core/data_adapters/BaseAdapter'
import { getAdapter } from '@jbrowse/core/data_adapters/dataAdapterCache'
import RpcMethodTypeWithFiltersAndRenameRegions from '@jbrowse/core/pluggableElementTypes/RpcMethodTypeWithFiltersAndRenameRegions'
import type { Region } from '@jbrowse/core/util'
import { processFeaturesToFasta } from '../util/fastaUtils'
import { firstValueFrom, toArray } from 'rxjs'

export default class MafGetSequences extends RpcMethodTypeWithFiltersAndRenameRegions {
  name = 'MafGetSequences'

  async execute(
    args: {
      adapterConfig: AnyConfigurationModel
      stopToken?: string
      sessionId: string
      headers?: Record<string, string>
      regions: Region[]
      bpPerPx: number
    },
    rpcDriverClassName: string,
  ) {
    const deserializedArgs = await this.deserializeArguments(
      args,
      rpcDriverClassName,
    )
    const { regions, adapterConfig, sessionId } = deserializedArgs
    const { dataAdapter } = await getAdapter(
      this.pluginManager,
      sessionId,
      adapterConfig,
    )
    if (!regions.length) {
      throw new Error('No regions selected')
    }

    // Get features from the adapter
    const featuresObservable = (
      dataAdapter as BaseFeatureDataAdapter
    ).getFeatures(regions[0]!, deserializedArgs)
    return processFeaturesToFasta(
      await firstValueFrom(featuresObservable.pipe(toArray())),
      regions[0],
    )
  }
}
