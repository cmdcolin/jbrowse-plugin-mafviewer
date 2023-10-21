import { ServerSideRendererType } from '@jbrowse/core/pluggableElementTypes'
import { RenderArgsDeserialized } from '@jbrowse/core/pluggableElementTypes/renderers/ServerSideRendererType'

export default class LinearMafRenderer extends ServerSideRendererType {
  async render(renderProps: RenderArgsDeserialized) {
    const results = await super.render({
      ...renderProps,
    })
    return results
  }
}
