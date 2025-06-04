import type PluginManager from '@jbrowse/core/PluginManager'
import MafGetSamples from './MafGetSamples'

export default function MafGetSamplesF(pluginManager: PluginManager) {
  pluginManager.addRpcMethod(() => {
    return new MafGetSamples(pluginManager)
  })
}
