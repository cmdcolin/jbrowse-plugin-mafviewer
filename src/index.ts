import Plugin from '@jbrowse/core/Plugin'
import PluginManager from '@jbrowse/core/PluginManager'

import { version } from '../package.json'
import BigMafAdapterF from './BigMafAdapter'
import MafTrackF from './MafTrack'
import LinearMafDisplayF from './LinearMafDisplay'
import LinearMafRendererF from './LinearMafRenderer'
import MafTabixAdapterF from './MafTabixAdapter'
import TaffyAdapterF from './TaffyAdapter'
import MafAddTrackWorkflowF from './MafAddTrackWorkflow'

export default class MafViewerPlugin extends Plugin {
  name = 'MafViewerPlugin'
  version = version

  install(pluginManager: PluginManager) {
    BigMafAdapterF(pluginManager)
    MafTrackF(pluginManager)
    LinearMafDisplayF(pluginManager)
    LinearMafRendererF(pluginManager)
    MafTabixAdapterF(pluginManager)
    TaffyAdapterF(pluginManager)
    MafAddTrackWorkflowF(pluginManager)
  }

  configure(_pluginManager: PluginManager) {}
}
