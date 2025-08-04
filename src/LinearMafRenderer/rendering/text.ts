import { getCharWidthHeight } from '../util'
import { CHAR_SIZE_WIDTH, VERTICAL_TEXT_OFFSET } from './types'

import type { RenderingContext } from './types'

function getLetter(a: string, showAsUpperCase: boolean) {
  return showAsUpperCase ? a.toUpperCase() : a
}

/**
 * Renders text labels for bases when zoom level is sufficient
 * Only shows text for mismatches (or all letters when showAllLetters is true)
 * @param context - Rendering context with canvas and styling info
 * @param alignment - The aligned sequence for this sample (lowercase)
 * @param origAlignment - Original alignment preserving case
 * @param seq - The reference sequence
 * @param leftPx - Left pixel position of the feature
 * @param rowTop - Top pixel position of the row
 */
export function renderText(
  context: RenderingContext,
  alignment: string,
  origAlignment: string,
  seq: string,
  leftPx: number,
  rowTop: number,
) {
  const {
    ctx,
    scale,
    hp2,
    rowHeight,
    showAllLetters,
    mismatchRendering,
    contrastForBase,
    showAsUpperCase,
  } = context
  const { charHeight } = getCharWidthHeight()

  // Render text labels when zoomed in enough and row is tall enough
  if (scale >= CHAR_SIZE_WIDTH) {
    for (
      let i = 0, genomicOffset = 0, seqLength = alignment.length;
      i < seqLength;
      i++
    ) {
      if (seq[i] !== '-') {
        // Only process non-gap positions in reference
        const xPos = leftPx + scale * genomicOffset
        const textOffset = (scale - CHAR_SIZE_WIDTH) / 2 + 1 // Center text in available space
        const currentChar = alignment[i]!
        // Show text for mismatches or all letters (depending on setting)
        if ((showAllLetters || seq[i] !== currentChar) && currentChar !== '-') {
          ctx.fillStyle = mismatchRendering
            ? (contrastForBase[currentChar] ?? 'white') // Use contrasting color for readability
            : 'black'
          if (rowHeight > charHeight) {
            // Only render if row is tall enough
            ctx.fillText(
              getLetter(origAlignment[i] || '', showAsUpperCase),
              xPos + textOffset,
              hp2 + rowTop + VERTICAL_TEXT_OFFSET,
            )
          }
        }
        genomicOffset++
      }
    }
  }
}
