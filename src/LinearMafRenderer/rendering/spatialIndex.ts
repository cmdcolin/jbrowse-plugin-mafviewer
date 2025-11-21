import { GAP_STROKE_OFFSET, MIN_X_DISTANCE } from './types'

import type { RenderedBase, RenderingContext } from './types'

export function createRenderedBaseCoords(
  xPos: number,
  rowTop: number,
  context: RenderingContext,
) {
  return {
    minX: xPos,
    minY: rowTop,
    maxX: xPos + context.scale + GAP_STROKE_OFFSET,
    maxY: rowTop + context.h,
  }
}

export function shouldAddToSpatialIndex(
  xPos: number,
  context: RenderingContext,
  bypassDistanceFilter = false,
): boolean {
  if (bypassDistanceFilter) {
    return true
  }

  // Zoom-aware distance threshold: scale threshold based on zoom level
  // At high zoom (small bpPerPx), use smaller threshold for more precision
  // At low zoom (large bpPerPx), use larger threshold to reduce index size
  const dynamicThreshold = Math.max(
    MIN_X_DISTANCE,
    context.bpPerPx * MIN_X_DISTANCE,
  )

  return Math.abs(xPos - context.lastInsertedX) > dynamicThreshold
}

export function addToSpatialIndex(
  context: RenderingContext,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
  renderedBase: RenderedBase,
) {
  context.spatialIndex.push(renderedBase)
  context.spatialIndexCoords.push(minX, minY, maxX, maxY)
  context.lastInsertedX = minX
}
