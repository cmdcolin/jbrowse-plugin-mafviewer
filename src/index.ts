import Plugin from '@jbrowse/core/Plugin'
import PluginManager from '@jbrowse/core/PluginManager'

import { version } from '../package.json'
import BigMafAdapterF from './BigMafAdapter'
import LinearMafDisplayF from './LinearMafDisplay'
import LinearMafRendererF from './LinearMafRenderer'
import MafAddTrackWorkflowF from './MafAddTrackWorkflow'
import MafGetSamplesF from './MafGetSamples'
import MafGetSequencesF from './MafGetSequences'
import MafTabixAdapterF from './MafTabixAdapter'
import MafTrackF from './MafTrack'

export default class MafViewerPlugin extends Plugin {
  name = 'MafViewerPlugin'
  version = version

  install(pluginManager: PluginManager) {
    BigMafAdapterF(pluginManager)
    MafTrackF(pluginManager)
    LinearMafDisplayF(pluginManager)
    LinearMafRendererF(pluginManager)
    MafTabixAdapterF(pluginManager)
    MafAddTrackWorkflowF(pluginManager)
    MafGetSequencesF(pluginManager)
    MafGetSamplesF(pluginManager)
  }

  configure(_pluginManager: PluginManager) {}
}
