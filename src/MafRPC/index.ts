import { getAdapter } from '@jbrowse/core/data_adapters/dataAdapterCache'
import RpcMethodTypeWithFiltersAndRenameRegions from '@jbrowse/core/pluggableElementTypes/RpcMethodTypeWithFiltersAndRenameRegions'
import { firstValueFrom, toArray } from 'rxjs'

import type PluginManager from '@jbrowse/core/PluginManager'
import type { AnyConfigurationModel } from '@jbrowse/core/configuration'
import type { Feature, Region } from '@jbrowse/core/util'

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
    return this.processFeaturesToFasta(features as Feature[], regions[0])
  }

  processFeaturesToFasta(features: Feature[], selectedRegion?: Region): string {
    let fastaText = ''

    for (const feature of features) {
      const alignments = feature.get('alignments') as Record<
        string,
        { chr: string; start: number; data: string; strand: number }
      >

      const featureStart = feature.get('start')
      const featureEnd = feature.get('end')

      if (!selectedRegion) {
        // If no specific region is selected, return the full sequences
        for (const [assemblyName, alignment] of Object.entries(alignments)) {
          const header = `>${assemblyName}.${alignment.chr}:${alignment.start}:${
            alignment.strand === -1 ? '-' : '+'
          }`
          fastaText += `${header}\n${alignment.data}\n`
        }
      } else {
        // Calculate the relative positions within the feature
        const relativeStart = Math.max(0, selectedRegion.start - featureStart)
        const relativeEnd = Math.min(
          featureEnd - featureStart,
          selectedRegion.end - featureStart,
        )

        // Extract the subsequence for each alignment
        for (const [assemblyName, alignment] of Object.entries(alignments)) {
          // Calculate the actual sequence positions accounting for gaps
          const { extractedSequence, actualStart } = this.extractSubsequence(
            alignment.data,
            relativeStart,
            relativeEnd,
          )

          // Calculate the genomic coordinate of the extracted sequence
          const startCoord =
            alignment.strand === -1
              ? alignment.start -
                actualStart -
                extractedSequence.replaceAll('-', '').length
              : alignment.start + actualStart

          const header = `>${assemblyName}.${alignment.chr}:${startCoord}:${
            alignment.strand === -1 ? '-' : '+'
          } (selected region ${selectedRegion.start}-${selectedRegion.end})`

          fastaText += `${header}\n${extractedSequence}\n`
        }
      }
    }

    return fastaText
  }

  // Helper function to extract a subsequence from an alignment string
  // accounting for gaps in the reference sequence
  extractSubsequence(
    sequence: string,
    relativeStart: number,
    relativeEnd: number,
  ): { extractedSequence: string; actualStart: number } {
    // This function extracts a subsequence from an alignment
    // It needs to account for gaps ('-') in the reference sequence

    let nonGapCount = 0
    let startIndex = 0
    let endIndex = sequence.length

    // Find the start index in the alignment string
    for (let i = 0; i < sequence.length; i++) {
      if (nonGapCount >= relativeStart) {
        startIndex = i
        break
      }
      // Only count non-gap characters toward the position
      if (sequence[i] !== '-') {
        nonGapCount++
      }
    }

    // Find the end index in the alignment string
    nonGapCount = 0
    for (let i = 0; i < sequence.length; i++) {
      if (nonGapCount >= relativeEnd) {
        endIndex = i
        break
      }
      // Only count non-gap characters toward the position
      if (sequence[i] !== '-') {
        nonGapCount++
      }
    }

    return {
      extractedSequence: sequence.substring(startIndex, endIndex),
      actualStart: startIndex,
    }
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
