import { RenderArgsDeserialized } from '@jbrowse/core/pluggableElementTypes/renderers/BoxRendererType'
import { createJBrowseTheme } from '@jbrowse/core/ui'
import { Feature } from '@jbrowse/core/util'
import Flatbush from 'flatbush'

import {
  FONT_CONFIG,
  RenderingContext,
  Sample,
  processFeatureAlignment,
  processFeatureInsertions,
} from './rendering'
import { getColorBaseMap, getContrastBaseMap } from './util'

interface RenderArgs extends RenderArgsDeserialized {
  samples: Sample[]
  rowHeight: number
  rowProportion: number
  showAllLetters: boolean
  mismatchRendering: boolean
  features: Map<string, Feature>
  statusCallback?: (arg: string) => void
  showAsUpperCase: boolean
}

export function makeImageData({
  ctx,
  renderArgs,
}: {
  ctx: CanvasRenderingContext2D
  renderArgs: RenderArgs
}) {
  const {
    regions,
    bpPerPx,
    rowHeight,
    showAllLetters,
    theme: configTheme,
    mismatchRendering,
    samples,
    rowProportion,
    features,
    showAsUpperCase,
  } = renderArgs

  const region = regions[0]!
  const canvasWidth = (region.end - region.start) / bpPerPx
  const h = rowHeight * rowProportion
  const theme = createJBrowseTheme(configTheme)
  const colorForBase = getColorBaseMap(theme)
  const contrastForBase = getContrastBaseMap(theme)
  const sampleToRowMap = new Map(samples.map((s, i) => [s.id, i]))
  const scale = 1 / bpPerPx
  const hp2 = h / 2
  const offset = (rowHeight - h) / 2

  ctx.font = FONT_CONFIG

  const renderingContext: RenderingContext = {
    ctx,
    scale,
    canvasWidth,
    rowHeight,
    h,
    hp2,
    offset,
    colorForBase,
    contrastForBase,
    showAllLetters,
    mismatchRendering,
    showAsUpperCase,
    spatialIndex: [],
    spatialIndexCoords: [],
    lastInsertedX: -Infinity, // Start with -Infinity so first item is always inserted
  }

  // First pass: render alignments (gaps, matches, mismatches, text)
  for (const feature of features.values()) {
    processFeatureAlignment(
      feature,
      region,
      bpPerPx,
      sampleToRowMap,
      renderingContext,
    )
  }

  // Second pass: render insertions on top
  for (const feature of features.values()) {
    processFeatureInsertions(
      feature,
      region,
      bpPerPx,
      sampleToRowMap,
      renderingContext,
    )
  }
  const flatbush = new Flatbush(renderingContext.spatialIndex.length || 1)
  if (renderingContext.spatialIndex.length === 0) {
    flatbush.add(0, 0, 1, 1)
  } else {
    for (
      let i = 0, l = renderingContext.spatialIndexCoords.length;
      i < l;
      i += 4
    ) {
      flatbush.add(
        renderingContext.spatialIndexCoords[i]!,
        renderingContext.spatialIndexCoords[i + 1]!,
        renderingContext.spatialIndexCoords[i + 2],
        renderingContext.spatialIndexCoords[i + 3],
      )
    }
  }
  flatbush.finish()
  return {
    flatbush: flatbush.data,
    items: renderingContext.spatialIndex,
    samples,
  }
}
