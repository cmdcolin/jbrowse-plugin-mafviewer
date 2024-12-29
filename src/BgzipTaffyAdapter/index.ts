import PluginManager from '@jbrowse/core/PluginManager'
import { AdapterType } from '@jbrowse/core/pluggableElementTypes'
import configSchema from './configSchema'
import BgzipTaffyAdapter from './BgzipTaffyAdapter'

export default function BgzipTaffyAdapterF(pluginManager: PluginManager) {
  return pluginManager.addAdapterType(
    () =>
      new AdapterType({
        name: 'BgzipTaffyAdapter',
        AdapterClass: BgzipTaffyAdapter,
        configSchema,
      }),
  )
}
