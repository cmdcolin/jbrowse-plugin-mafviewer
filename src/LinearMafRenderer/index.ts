import PluginManager from '@jbrowse/core/PluginManager'
import configSchema from './configSchema'
import LinearMafRenderer from './LinearMafRenderer'
import ReactComponent from './components/ReactComponent'

export default function LinearMafRendererF(pluginManager: PluginManager) {
  pluginManager.addRendererType(
    () =>
      new LinearMafRenderer({
        name: 'LinearMafRenderer',
        ReactComponent,
        configSchema,
        pluginManager,
      }),
  )
}
