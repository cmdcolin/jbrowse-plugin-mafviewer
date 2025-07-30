import { fillRect } from '../util'
import {
  addToSpatialIndex,
  createRenderedBase,
  shouldAddToSpatialIndex,
} from './spatialIndex'
import { GAP_STROKE_OFFSET } from './types'

import type { RenderingContext } from './types'

/**
 * Renders background rectangles for positions where alignment matches reference
 * Only renders when showAllLetters is false
 * @param context - Rendering context with canvas and styling info
 * @param alignment - The aligned sequence for this sample
 * @param seq - The reference sequence
 * @param leftPx - Left pixel position of the feature
 * @param rowTop - Top pixel position of the row
 */
export function renderMatches(
  context: RenderingContext,
  alignment: string,
  seq: string,
  leftPx: number,
  rowTop: number,
  sampleId: string,
  featureId: string,
) {
  if (context.showAllLetters) {
    return
  }

  const { ctx, scale, h, canvasWidth } = context
  ctx.fillStyle = 'lightgrey'

  // Highlight matching bases with light grey background
  for (
    let i = 0, genomicOffset = 0, seqLength = alignment.length;
    i < seqLength;
    i++
  ) {
    if (seq[i] !== '-') {
      // Only process non-gap positions in reference
      const currentChar = alignment[i]
      const xPos = leftPx + scale * genomicOffset
      if (
        seq[i] === currentChar &&
        currentChar !== '-' &&
        currentChar !== ' '
      ) {
        fillRect(ctx, xPos, rowTop, scale + GAP_STROKE_OFFSET, h, canvasWidth)

        // Add to spatial index if distance filter allows
        if (shouldAddToSpatialIndex(xPos, context)) {
          const renderedBase = createRenderedBase(
            xPos,
            rowTop,
            context,
            genomicOffset,
            sampleId,
            currentChar || '',
            true,
            false,
            false,
            false,
            featureId,
          )
          addToSpatialIndex(context, renderedBase)
        }
      }
      genomicOffset++
    }
  }
}
