import { FeatureRendererType } from '@jbrowse/core/pluggableElementTypes'
import { RenderArgsDeserialized } from '@jbrowse/core/pluggableElementTypes/renderers/BoxRendererType'
import {
  Region,
  renderToAbstractCanvas,
  updateStatus,
} from '@jbrowse/core/util'

import { makeImageData } from './makeImageData'

interface Sample {
  id: string
  color?: string
}
interface RenderArgs extends RenderArgsDeserialized {
  samples: Sample[]
  rowHeight: number
  rowProportion: number
  showAllLetters: boolean
  mismatchRendering: boolean
  statusCallback?: (arg: string) => void
}

export default class LinearMafRenderer extends FeatureRendererType {
  getExpandedRegion(region: Region) {
    const { start, end } = region
    const bpExpansion = 1

    return {
      // xref https://github.com/mobxjs/mobx-state-tree/issues/1524 for Omit
      ...(region as Omit<typeof region, symbol>),
      start: Math.floor(Math.max(start - bpExpansion, 0)),
      end: Math.ceil(end + bpExpansion),
    }
  }
  async render(renderProps: RenderArgs) {
    const {
      statusCallback = () => {},
      regions,
      bpPerPx,
      samples,
      rowHeight,
    } = renderProps
    const region = regions[0]!
    const height = samples.length * (rowHeight + 1) + 100
    const width = (region.end - region.start) / bpPerPx
    const features = await this.getFeatures(renderProps)
    const res = await renderToAbstractCanvas(
      width,
      height,
      renderProps,
      async ctx => {
        await updateStatus('Rendering alignment', statusCallback, () => {
          makeImageData({
            ctx,
            renderArgs: {
              ...renderProps,
              features,
            },
          })
        })
        return undefined
      },
    )
    const results = await super.render({
      ...renderProps,
      ...res,
      width,
      height,
    })
    return {
      ...results,
      ...res,
      width,
      height,
    }
  }
}
