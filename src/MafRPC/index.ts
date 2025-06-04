import { getAdapter } from '@jbrowse/core/data_adapters/dataAdapterCache'
import RpcMethodTypeWithFiltersAndRenameRegions from '@jbrowse/core/pluggableElementTypes/RpcMethodTypeWithFiltersAndRenameRegions'

import type PluginManager from '@jbrowse/core/PluginManager'
import type { AnyConfigurationModel } from '@jbrowse/core/configuration'
import type { Region } from '@jbrowse/core/util'
import { firstValueFrom, toArray } from 'rxjs'

export class MafGetSamples extends RpcMethodTypeWithFiltersAndRenameRegions {
  name = 'MafGetSamples'

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
    const pm = this.pluginManager
    const deserializedArgs = await this.deserializeArguments(
      args,
      rpcDriverClassName,
    )
    const { regions, adapterConfig, sessionId } = deserializedArgs
    const { dataAdapter } = await getAdapter(pm, sessionId, adapterConfig)

    // @ts-expect-error
    return dataAdapter.getSamples(regions, deserializedArgs)
  }
}

export class MafGetSequences extends RpcMethodTypeWithFiltersAndRenameRegions {
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
    const pm = this.pluginManager
    const deserializedArgs = await this.deserializeArguments(
      args,
      rpcDriverClassName,
    )
    const { regions, adapterConfig, sessionId } = deserializedArgs
    const { dataAdapter } = await getAdapter(pm, sessionId, adapterConfig)

    // Get features from the adapter
    // @ts-expect-error
    const featuresObservable = dataAdapter.getFeatures(
      regions[0],
      deserializedArgs,
    )
    const features = await firstValueFrom(featuresObservable.pipe(toArray()))
    console.log({ regions, features })

    // Process features into FASTA format
    return this.processFeaturesToFasta(features as unknown[])
  }

  processFeaturesToFasta(features: unknown[]): string {
    let fastaText = ''

    for (const feature of features) {
      // @ts-expect-error
      const alignments = feature.get('alignments') as Record<
        string,
        { chr: string; start: number; data: string; strand: number }
      >

      // Create a FASTA entry for each alignment
      for (const [assemblyName, alignment] of Object.entries(alignments)) {
        const header = `>${assemblyName}.${alignment.chr}:${alignment.start}:${
          alignment.strand === -1 ? '-' : '+'
        }`
        fastaText += `${header}\n${alignment.data}\n`
      }
    }

    return fastaText
  }
}

export default function MafRPCF(pluginManager: PluginManager) {
  pluginManager.addRpcMethod(() => {
    return new MafGetSamples(pluginManager)
  })

  pluginManager.addRpcMethod(() => {
    return new MafGetSequences(pluginManager)
  })
}
