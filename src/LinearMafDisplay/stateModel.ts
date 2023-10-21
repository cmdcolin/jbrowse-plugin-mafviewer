import { types } from 'mobx-state-tree'
import {
  AnyConfigurationSchemaType,
  ConfigurationReference,
  getConf,
} from '@jbrowse/core/configuration'
import { getEnv } from '@jbrowse/core/util'
import PluginManager from '@jbrowse/core/PluginManager'

export default function stateModelFactory(
  configSchema: AnyConfigurationSchemaType,
  pluginManager: PluginManager,
) {
  const LinearGenomePlugin = pluginManager.getPlugin(
    'LinearGenomeViewPlugin',
  ) as import('@jbrowse/plugin-linear-genome-view').default
  // @ts-expect-error
  const { linearBasicDisplayModelFactory } = LinearGenomePlugin.exports

  return types
    .compose(
      'LinearMafDisplay',
      linearBasicDisplayModelFactory(configSchema),
      types.model({
        /**
         * #property
         */
        type: types.literal('LinearMafDisplay'),
        /**
         * #property
         */
        configuration: ConfigurationReference(configSchema),
      }),
    )
    .views(self => ({
      get rendererTypeName() {
        return 'LinearMafRenderer'
      },
      get rendererConfig() {
        const configBlob = getConf(self, ['renderer']) || {}
        const config = configBlob as Omit<typeof configBlob, symbol>

        return self.rendererType.configSchema.create(
          {
            ...config,
            type: 'LinearMafRenderer',
          },
          getEnv(self),
        )
      },
    }))
}
