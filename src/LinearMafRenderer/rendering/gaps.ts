import {
  addToSpatialIndex,
  createRenderedBase,
  shouldAddToSpatialIndex,
} from './spatialIndex'
import { GAP_STROKE_OFFSET } from './types'

import type { RenderingContext } from './types'

/**
 * Renders gap indicators (horizontal lines) where the alignment has deletions relative to reference
 * @param context - Rendering context with canvas and styling info
 * @param alignment - The aligned sequence for this sample
 * @param seq - The reference sequence
 * @param leftPx - Left pixel position of the feature
 * @param rowTop - Top pixel position of the row
 * @param alignmentStart - Start position of the alignment
 * @param chr - Chromosome/sequence name
 */
export function renderGaps(
  context: RenderingContext,
  alignment: string,
  seq: string,
  leftPx: number,
  rowTop: number,
  sampleId: string,
  featureId: string,
  alignmentStart: number,
  chr: string,
) {
  const { ctx, scale } = context
  const h2 = context.rowHeight / 2

  ctx.beginPath()
  ctx.fillStyle = 'black'

  for (
    let i = 0, genomicOffset = 0, seqLength = alignment.length;
    i < seqLength;
    i++
  ) {
    if (seq[i] !== '-') {
      if (alignment[i] === '-') {
        const xPos = leftPx + scale * genomicOffset
        ctx.moveTo(xPos, rowTop + h2)
        ctx.lineTo(xPos + scale + GAP_STROKE_OFFSET, rowTop + h2)

        // Add to spatial index if distance filter allows
        if (shouldAddToSpatialIndex(xPos, context)) {
          const renderedBase = createRenderedBase(
            xPos,
            rowTop,
            context,
            genomicOffset + alignmentStart,
            chr,
            sampleId,
            '-',
            false,
            false,
            true,
            false,
            featureId,
          )
          addToSpatialIndex(context, renderedBase)
        }
      }
      genomicOffset++
    }
  }
  ctx.stroke()
}
