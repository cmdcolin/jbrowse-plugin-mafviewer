import PluginManager from '@jbrowse/core/PluginManager'
import { AdapterType } from '@jbrowse/core/pluggableElementTypes'
import configSchema from './configSchema'
import MafTabixAdapter from './MafTabixAdapter'

export default function MafTabixAdapterF(pluginManager: PluginManager) {
  return pluginManager.addAdapterType(
    () =>
      new AdapterType({
        name: 'MafTabixAdapter',
        AdapterClass: MafTabixAdapter,
        configSchema,
      }),
  )
}
