import PluginManager from '@jbrowse/core/PluginManager'
import { ConfigurationSchema } from '@jbrowse/core/configuration'

export default function configSchemaF(pluginManager: PluginManager) {
  const LinearGenomePlugin = pluginManager.getPlugin(
    'LinearGenomeViewPlugin',
  ) as import('@jbrowse/plugin-linear-genome-view').default
  // @ts-expect-error
  const { linearBasicDisplayConfigSchemaFactory } = LinearGenomePlugin.exports
  return ConfigurationSchema(
    'LinearMafDisplay',
    {
      /**
       * #slot
       */
      renderer: pluginManager.pluggableConfigSchemaType('renderer'),
    },
    {
      baseConfiguration: linearBasicDisplayConfigSchemaFactory(pluginManager),
      explicitlyTyped: true,
    },
  )
}
