import PluginManager from '@jbrowse/core/PluginManager'
import { AdapterType } from '@jbrowse/core/pluggableElementTypes'
import configSchema from './configSchema'
import BigMafAdapter from './BigMafAdapter'

export default function BigMafAdapterF(pluginManager: PluginManager) {
  return pluginManager.addAdapterType(
    () =>
      new AdapterType({
        name: 'BigMafAdapter',
        AdapterClass: BigMafAdapter,
        configSchema,
      }),
  )
}
