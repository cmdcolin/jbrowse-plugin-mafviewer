import { types } from 'mobx-state-tree'
import { BaseLinearDisplay } from '@jbrowse/plugin-linear-genome-view'
import {
  AnyConfigurationSchemaType,
  ConfigurationReference,
} from '@jbrowse/core/configuration'

export default function stateModelFactory(
  configSchema: AnyConfigurationSchemaType,
) {
  return types.compose(
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
    }),
  )
}
