import PluginManager from '@jbrowse/core/PluginManager'
import { DisplayType } from '@jbrowse/core/pluggableElementTypes'
import configSchemaF from './configSchema'
import stateModelFactory from './stateModel'
import ReactComponent from './components/ReactComponent'

export default function LinearMafDisplayF(pluginManager: PluginManager) {
  pluginManager.addDisplayType(() => {
    const configSchema = configSchemaF()
    const stateModel = stateModelFactory(configSchema)
    return new DisplayType({
      name: 'LinearMafDisplay',
      configSchema,
      stateModel,
      ReactComponent,
      viewType: 'LinearGenomeView',
      trackType: 'MafTrack',
      displayName: 'MAF display',
    })
  })
}
