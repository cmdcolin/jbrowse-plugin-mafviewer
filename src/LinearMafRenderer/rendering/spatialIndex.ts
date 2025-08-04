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
  return (
    bypassDistanceFilter ||
    Math.abs(xPos - context.lastInsertedX) > MIN_X_DISTANCE
  )
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
