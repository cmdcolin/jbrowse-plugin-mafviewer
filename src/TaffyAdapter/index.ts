import PluginManager from '@jbrowse/core/PluginManager'
import { AdapterType } from '@jbrowse/core/pluggableElementTypes'
import configSchema from './configSchema'
import TaffyAdapter from './TaffyAdapter'

export default function TaffyAdapterF(pluginManager: PluginManager) {
  return pluginManager.addAdapterType(
    () =>
      new AdapterType({
        name: 'TaffyAdapter',
        AdapterClass: TaffyAdapter,
        configSchema,
      }),
  )
}
