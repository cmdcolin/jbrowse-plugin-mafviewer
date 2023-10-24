import { Instance, types } from 'mobx-state-tree'
import {
  AnyConfigurationModel,
  AnyConfigurationSchemaType,
  ConfigurationReference,
  getConf,
} from '@jbrowse/core/configuration'
import { getEnv, getSession } from '@jbrowse/core/util'
import PluginManager from '@jbrowse/core/PluginManager'
import { ExportSvgDisplayOptions } from '@jbrowse/plugin-linear-genome-view'
import SetRowHeightDialog from './components/SetRowHeight'

function isStrs(array: unknown[]): array is string[] {
  return typeof array[0] === 'string'
}

/**
 * #stateModel LinearMafDisplay
 * extends LinearBasicDisplay
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
        /**
         * #property
         */
        rowHeight: 15,
        /**
         * #property
         */
        rowProportion: 0.8,
      }),
    )
    .volatile(() => ({
      prefersOffset: true,
    }))
    .actions(self => ({
      /**
       * #action
       */
      setRowHeight(n: number) {
        self.rowHeight = n
      },
      /**
       * #action
       */
      setRowProportion(n: number) {
        self.rowProportion = n
      },
    }))
    .views(self => ({
      /**
       * #getter
       */
      get samples() {
        const r = self.adapterConfig.samples as
          | string[]
          | { id: string; label: string; color?: string }[]
        if (isStrs(r)) {
          return r.map(elt => ({ id: elt, label: elt, color: undefined }))
        } else {
          return r
        }
      },

      /**
       * #getter
       */
      get rendererTypeName() {
        return 'LinearMafRenderer'
      },
      /**
       * #getter
       */
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
    .views(self => {
      const {
        trackMenuItems: superTrackMenuItems,
        renderProps: superRenderProps,
      } = self
      return {
        /**
         * #method
         */
        renderProps() {
          return {
            ...superRenderProps(),
            samples: self.samples,
            rowHeight: self.rowHeight,
            rowProportion: self.rowProportion,
          }
        },
        /**
         * #method
         */
        trackMenuItems() {
          return [
            ...superTrackMenuItems(),
            {
              label: 'Set row height',
              onClick: () => {
                getSession(self).queueDialog(handleClose => [
                  SetRowHeightDialog,
                  { model: self, handleClose },
                ])
              },
            },
          ]
        },
      }
    })
    .actions(self => {
      const { renderSvg: superRenderSvg } = self
      return {
        /**
         * #action
         */
        async renderSvg(opts: ExportSvgDisplayOptions): Promise<any> {
          const { renderSvg } = await import('./renderSvg')
          // @ts-expect-error
          return renderSvg(self, opts, superRenderSvg)
        },
      }
    })
}

export type LinearMafDisplayStateModel = ReturnType<typeof stateModelFactory>
export type LinearMafDisplayModel = Instance<LinearMafDisplayStateModel>
