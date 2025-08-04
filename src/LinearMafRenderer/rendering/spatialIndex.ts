import { GAP_STROKE_OFFSET, MIN_X_DISTANCE } from './types'

import type { RenderedBase, RenderingContext } from './types'

/**
 * Creates a RenderedBase object for spatial indexing
 * @param xPos - X coordinate of the base
 * @param rowTop - Y coordinate of the row top
 * @param context - Rendering context with dimensions
 * @param pos - Genomic coordinate
 * @param chr - Chromosome/sequence name
 * @param sampleId - Sample identifier
 * @param base - The base character
 * @param isMatch - Whether this base matches the reference
 * @param isMismatch - Whether this base is a mismatch
 * @param isGap - Whether this is a gap
 * @param isInsertion - Whether this is an insertion
 * @param featureId - Feature identifier
 */
export function createRenderedBase(
  xPos: number,
  rowTop: number,
  context: RenderingContext,
  pos: number,
  chr: string,
  sampleId: string,
  base: string,
  isMatch: boolean,
  isMismatch: boolean,
  isGap: boolean,
  isInsertion: boolean,
  featureId: string,
): RenderedBase {
  return {
    minX: xPos,
    minY: rowTop,
    maxX: xPos + context.scale + GAP_STROKE_OFFSET,
    maxY: rowTop + context.h,
    pos,
    chr,
    sampleId,
    base,
    isMatch,
    isMismatch,
    isGap,
    isInsertion,
    featureId,
  }
}

/**
 * Creates a RenderedBase object for insertions with custom width
 * Uses the actual rendered width instead of the standard scale-based width
 * This ensures accurate spatial queries for different insertion rendering types:
 * - Small insertions: INSERTION_LINE_WIDTH (1px) or INSERTION_BORDER_HEIGHT (5px) with borders
 * - Large insertions (text): measured text width + padding
 * - Large insertions (line): INSERTION_BORDER_WIDTH (2px)
 *
 * @param xPos - X coordinate of the insertion
 * @param rowTop - Y coordinate of the row top
 * @param width - Actual rendered width of the insertion
 * @param context - Rendering context with dimensions
 * @param pos - Genomic coordinate
 * @param chr - Chromosome/sequence name
 * @param sampleId - Sample identifier
 * @param insertionSequence - The insertion sequence
 * @param featureId - Feature identifier
 */
export function createRenderedInsertion(
  xPos: number,
  rowTop: number,
  width: number,
  context: RenderingContext,
  pos: number,
  chr: string,
  sampleId: string,
  insertionSequence: string,
  featureId: string,
): RenderedBase {
  return {
    minX: xPos,
    minY: rowTop,
    maxX: xPos + width,
    maxY: rowTop + context.h,
    pos,
    chr,
    sampleId,
    base: insertionSequence,
    isMatch: false,
    isMismatch: false,
    isGap: false,
    isInsertion: true,
    featureId,
  }
}

/**
 * Checks if an item should be added to the spatial index based on distance filtering
 * Only returns true if the X position is >0.5px away from the last inserted item
 * This reduces spatial index density while maintaining useful spatial queries
 *
 * @param xPos - X position to check
 * @param context - Rendering context with lastInsertedX tracking
 * @param bypassDistanceFilter - If true, always return true (e.g., for insertions)
 * @returns Whether the item should be added to spatial index
 *
 * @example
 * // Items at X positions: 100.0, 100.3, 100.8, 101.5
 * // Only items at 100.0, 100.8, 101.5 would return true (>0.5px apart)
 * // Unless bypassDistanceFilter=true, then all would return true
 */
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

/**
 * Adds a rendered base directly to the RBush spatial index
 * Updates the lastInsertedX tracking for distance filtering
 *
 * @param context - Rendering context with spatial index
 * @param renderedBase - The base to add to the spatial index
 */
export function addToSpatialIndex(
  context: RenderingContext,
  renderedBase: RenderedBase,
) {
  context.spatialIndex.push(renderedBase)
  context.lastInsertedX = renderedBase.minX
}
