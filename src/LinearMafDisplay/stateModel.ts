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
  const { BaseLinearDisplay } = LinearGenomePlugin.exports

  return types
    .compose(
      'LinearMafDisplay',
      BaseLinearDisplay,
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
        /**
         * #property
         */
        showAllLetters: false,
        /**
         * #property
         */
        mismatchRendering: true,
      }),
    )
    .volatile(() => ({
      /**
       * #volatile
       */
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
      /**
       * #action
       */
      setShowAllLetters(f: boolean) {
        self.showAllLetters = f
      },
      /**
       * #action
       */
      setMismatchRendering(f: boolean) {
        self.mismatchRendering = f
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
        return isStrs(r)
          ? r.map(elt => ({ id: elt, label: elt, color: undefined }))
          : r
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
        // eslint-disable-next-line @typescript-eslint/unbound-method
        trackMenuItems: superTrackMenuItems,
        // eslint-disable-next-line @typescript-eslint/unbound-method
        renderProps: superRenderProps,
      } = self
      return {
        /**
         * #method
         */
        renderProps() {
          const {
            showAllLetters,
            rendererConfig,
            samples,
            rowHeight,
            rowProportion,
            mismatchRendering,
          } = self
          return {
            ...superRenderProps(),
            config: rendererConfig,
            samples,
            rowHeight,
            rowProportion,
            showAllLetters,
            mismatchRendering,
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
                  {
                    model: self,
                    handleClose,
                  },
                ])
              },
            },
            {
              label: 'Show all letters',
              type: 'checkbox',
              checked: self.showAllLetters,
              onClick: () => {
                self.setShowAllLetters(!self.showAllLetters)
              },
            },
            {
              label: 'Draw mismatches as single color',
              type: 'checkbox',
              checked: !self.mismatchRendering,
              onClick: () => {
                self.setMismatchRendering(!self.mismatchRendering)
              },
            },
          ]
        },
      }
    })
    .actions(self => {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const { renderSvg: superRenderSvg } = self
      return {
        /**
         * #action
         */
        async renderSvg(opts: ExportSvgDisplayOptions) {
          const { renderSvg } = await import('./renderSvg')
          return renderSvg(self, opts, superRenderSvg)
        },
      }
    })
}

export type LinearMafDisplayStateModel = ReturnType<typeof stateModelFactory>
export type LinearMafDisplayModel = Instance<LinearMafDisplayStateModel>
