import { fillRect } from '../util'
import {
  addToSpatialIndex,
  createRenderedBase,
  shouldAddToSpatialIndex,
} from './spatialIndex'
import { GAP_STROKE_OFFSET } from './types'

import type { RenderingContext } from './types'

/**
 * Renders colored rectangles for mismatches and matches (when showAllLetters is true)
 * Colors are determined by base type when mismatchRendering is enabled
 * @param context - Rendering context with canvas and styling info
 * @param alignment - The aligned sequence for this sample
 * @param seq - The reference sequence
 * @param leftPx - Left pixel position of the feature
 * @param rowTop - Top pixel position of the row
 */
export function renderMismatches(
  context: RenderingContext,
  alignment: string,
  seq: string,
  leftPx: number,
  rowTop: number,
  sampleId: string,
  featureId: string,
) {
  const {
    ctx,
    scale,
    h,
    canvasWidth,
    showAllLetters,
    mismatchRendering,
    colorForBase,
  } = context

  for (
    let i = 0, genomicOffset = 0, seqLength = alignment.length;
    i < seqLength;
    i++
  ) {
    const currentChar = alignment[i]
    if (seq[i] !== '-') {
      if (currentChar !== '-') {
        const xPos = leftPx + scale * genomicOffset
        if (seq[i] !== currentChar && currentChar !== ' ') {
          // Mismatch: use base-specific color or orange
          fillRect(
            ctx,
            xPos,
            rowTop,
            scale + GAP_STROKE_OFFSET,
            h,
            canvasWidth,
            mismatchRendering
              ? (colorForBase[currentChar!] ?? 'black')
              : 'orange',
          )

          // Add to spatial index if distance filter allows
          if (shouldAddToSpatialIndex(xPos, context)) {
            const renderedBase = createRenderedBase(
              xPos,
              rowTop,
              context,
              genomicOffset,
              sampleId,
              currentChar!,
              false,
              true,
              false,
              false,
              featureId,
            )
            addToSpatialIndex(context, renderedBase)
          }
        } else if (showAllLetters) {
          // Match (when showing all letters): use base-specific color or light blue
          fillRect(
            ctx,
            xPos,
            rowTop,
            scale + GAP_STROKE_OFFSET,
            h,
            canvasWidth,
            mismatchRendering
              ? (colorForBase[currentChar!] ?? 'black')
              : 'lightblue',
          )

          // Add to spatial index if distance filter allows
          if (shouldAddToSpatialIndex(xPos, context)) {
            const renderedBase = createRenderedBase(
              xPos,
              rowTop,
              context,
              genomicOffset,
              sampleId,
              currentChar!,
              true,
              false,
              false,
              false,
              featureId,
            )
            addToSpatialIndex(context, renderedBase)
          }
        }
      }
      genomicOffset++
    }
  }
}
