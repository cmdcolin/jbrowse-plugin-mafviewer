import { Instance, types } from 'mobx-state-tree'
import {
  AnyConfigurationModel,
  AnyConfigurationSchemaType,
  ConfigurationReference,
  getConf,
} from '@jbrowse/core/configuration'
import { getEnv } from '@jbrowse/core/util'
import PluginManager from '@jbrowse/core/PluginManager'

/**
 * #stateModel LinearMafDisplay
 */
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
      get sources() {
        const r = self.adapterConfig.sources as string[]
        return r.slice(1).map(elt => ({ name: elt, color: undefined }))
      },
      get rowHeight() {
        return 20
      },
      get rendererTypeName() {
        return 'LinearMafRenderer'
      },
      get rendererConfig(): AnyConfigurationModel {
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

export type LinearMafDisplayStateModel = ReturnType<typeof stateModelFactory>
export type LinearMafDisplayModel = Instance<LinearMafDisplayStateModel>
