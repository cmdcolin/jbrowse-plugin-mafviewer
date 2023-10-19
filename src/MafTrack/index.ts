import PluginManager from '@jbrowse/core/PluginManager'
import {
  TrackType,
  createBaseTrackModel,
} from '@jbrowse/core/pluggableElementTypes'
import configSchemaF from './configSchema'

export default function MafTrackF(pluginManager: PluginManager) {
  const configSchema = configSchemaF(pluginManager)
  return pluginManager.addTrackType(() => {
    return new TrackType({
      name: 'MafTrack',
      configSchema,
      displayName: 'MAF track',
      stateModel: createBaseTrackModel(pluginManager, 'MafTrack', configSchema),
    })
  })
}
