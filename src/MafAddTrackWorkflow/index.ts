import PluginManager from '@jbrowse/core/PluginManager'
import { AddTrackWorkflowType } from '@jbrowse/core/pluggableElementTypes'
import { types } from 'mobx-state-tree'

// locals
import MultiMAFWidget from './AddTrackWorkflow'

export default function MafAddTrackWorkflowF(pluginManager: PluginManager) {
  pluginManager.addAddTrackWorkflowType(
    () =>
      new AddTrackWorkflowType({
        name: 'MAF track',
        ReactComponent: MultiMAFWidget,
        stateModel: types.model({}),
      }),
  )
}
