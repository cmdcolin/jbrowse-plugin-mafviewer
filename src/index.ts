import Plugin from '@jbrowse/core/Plugin'
import PluginManager from '@jbrowse/core/PluginManager'

import { version } from '../package.json'
import BigMafAdapterF from './BigMafAdapter'

export default class MafViewerPlugin extends Plugin {
  name = 'MafViewerPlugin'
  version = version

  install(pluginManager: PluginManager) {
    BigMafAdapterF(pluginManager)
  }

  configure(pluginManager: PluginManager) {}
}
