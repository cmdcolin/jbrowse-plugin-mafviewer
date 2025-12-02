import { fillRect } from '../util'
import { GAP_STROKE_OFFSET } from './types'

import type { RenderingContext } from './types'

export function renderMatches(
  context: RenderingContext,
  alignment: string,
  seq: string,
  leftPx: number,
  rowTop: number,
  _sampleId: number,
  _alignmentStart: number,
  _chr: string,
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
      }
      genomicOffset++
    }
  }
}
