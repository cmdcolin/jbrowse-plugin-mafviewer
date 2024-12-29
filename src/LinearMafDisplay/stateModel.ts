import PluginManager from '@jbrowse/core/PluginManager'
import {
  AnyConfigurationModel,
  AnyConfigurationSchemaType,
  ConfigurationReference,
  getConf,
} from '@jbrowse/core/configuration'
import { getEnv, getSession } from '@jbrowse/core/util'
import { getRpcSessionId } from '@jbrowse/core/util/tracks'
import { ExportSvgDisplayOptions } from '@jbrowse/plugin-linear-genome-view'
import { ascending } from 'd3-array'
import { type HierarchyNode, cluster, hierarchy } from 'd3-hierarchy'
import { autorun } from 'mobx'
import { Instance, addDisposer, isAlive, types } from 'mobx-state-tree'

import SetRowHeightDialog from './components/SetRowHeight'
import {
  NodeWithIds,
  NodeWithIdsAndLength,
  maxLength,
  setBrLength,
} from './types'
import { normalize } from '../util'

interface Sample {
  id: string
  label: string
  color?: string
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

        /**
         * #property
         */
        showBranchLen: false,

        /**
         * #property
         */
        treeWidth: 80,
      }),
    )
    .volatile(() => ({
      /**
       * #volatile
       */
      prefersOffset: true,
      /**
       * #volatile
       */
      volatileSamples: [] as Sample[],
      /**
       * #volatile
       */
      tree: undefined as any,
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
      /**
       * #action
       */
      setSamples({ samples, tree }: { samples: Sample[]; tree: unknown }) {
        self.volatileSamples = samples
        self.tree = tree
      },
    }))
    .views(self => ({
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

    .views(self => ({
      /**
       * #getter
       */
      get root() {
        return self.tree
          ? hierarchy(self.tree, d => d.children)
              // todo: investigate whether needed, typescript says children always true
              .sum(d => (d.children ? 0 : 1))
              .sort((a, b) => ascending(a.data.length || 1, b.data.length || 1))
          : undefined
      },
    }))
    .views(self => ({
      /**
       * #getter
       * generates a new tree that is clustered with x,y positions
       */
      get hierarchy(): HierarchyNode<NodeWithIdsAndLength> | undefined {
        const r = self.root
        if (r) {
          const width = self.treeWidth
          const clust = cluster<NodeWithIds>()
            .size([this.totalHeight, width])
            .separation(() => 1)
          clust(r)
          setBrLength(r, (r.data.length = 0), width / maxLength(r))
          return r as HierarchyNode<NodeWithIdsAndLength>
        } else {
          return undefined
        }
      },
      get samples() {
        return this.rowNames ? normalize(this.rowNames) : self.volatileSamples
      },
      /**
       * #getter
       */
      get totalHeight() {
        return this.samples.length * self.rowHeight
      },
      /**
       * #getter
       */
      get leaves() {
        return self.root?.leaves()
      },
      /**
       * #getter
       */
      get rowNames(): string[] | undefined {
        return this.leaves?.map(n => n.data.name)
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
    .actions(self => ({
      afterCreate() {
        addDisposer(
          self,
          autorun(async () => {
            try {
              const { rpcManager } = getSession(self)
              const sessionId = getRpcSessionId(self)

              const results = (await rpcManager.call(
                sessionId,
                'MafGetSamples',
                {
                  sessionId,
                  adapterConfig: self.adapterConfig,
                  statusCallback: (message: string) => {
                    if (isAlive(self)) {
                      self.setMessage(message)
                    }
                  },
                },
              )) as any
              self.setSamples(results)
            } catch (e) {
              console.error(e)
              getSession(self).notifyError(`${e}`, e)
            }
          }),
        )
      },
    }))
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
