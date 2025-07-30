import { RenderArgsDeserialized } from '@jbrowse/core/pluggableElementTypes/renderers/BoxRendererType'
import { createJBrowseTheme } from '@jbrowse/core/ui'
import { Feature, featureSpanPx, measureText } from '@jbrowse/core/util'
import RBush from 'rbush'

import {
  fillRect,
  getCharWidthHeight,
  getColorBaseMap,
  getContrastBaseMap,
} from './util'

// Rendering constants
const FONT_CONFIG = 'bold 10px Courier New,monospace'
const CHAR_SIZE_WIDTH = 10
const GAP_STROKE_OFFSET = 0.4
const INSERTION_LINE_WIDTH = 1
const INSERTION_BORDER_WIDTH = 2
const INSERTION_PADDING = 2
const VERTICAL_TEXT_OFFSET = 3
const LARGE_INSERTION_THRESHOLD = 10
const HIGH_ZOOM_THRESHOLD = 0.2
const MIN_ROW_HEIGHT_FOR_BORDERS = 5
const HIGH_BP_PER_PX_THRESHOLD = 10
const INSERTION_BORDER_HEIGHT = 5

interface Sample {
  id: string
  color?: string
}

interface GenomicRegion {
  start: number
  end: number
  refName: string
}

/**
 * Represents a rendered letter/base with its spatial and genomic coordinates
 * This structure is designed for insertion into an RBush spatial index
 */
interface RenderedBase {
  // Spatial bounding box (required by RBush)
  minX: number
  minY: number
  maxX: number
  maxY: number
  // Genomic information
  genomicPosition: number
  sampleId: string
  base: string
  isMatch: boolean
  isMismatch: boolean
  isGap: boolean
  isInsertion: boolean
  // Feature reference
  featureId: string
}
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

function getLetter(a: string, showAsUpperCase: boolean) {
  return showAsUpperCase ? a.toUpperCase() : a
}

/**
 * Creates a RenderedBase object for spatial indexing
 * @param xPos - X coordinate of the base
 * @param rowTop - Y coordinate of the row top
 * @param context - Rendering context with dimensions
 * @param genomicPosition - Genomic coordinate
 * @param sampleId - Sample identifier
 * @param base - The base character
 * @param isMatch - Whether this base matches the reference
 * @param isMismatch - Whether this base is a mismatch
 * @param isGap - Whether this is a gap
 * @param isInsertion - Whether this is an insertion
 * @param featureId - Feature identifier
 */
function createRenderedBase(
  xPos: number,
  rowTop: number,
  context: RenderingContext,
  genomicPosition: number,
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
    genomicPosition,
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
 * Adds a rendered base directly to the RBush spatial index
 * Only inserts if the X position is >0.5px away from the last inserted item
 * This reduces spatial index density while maintaining useful spatial queries
 * 
 * @example
 * // Items at X positions: 100.0, 100.3, 100.8, 101.5
 * // Only items at 100.0, 100.8, 101.5 would be inserted (>0.5px apart)
 */
function addToSpatialIndex(
  context: RenderingContext,
  renderedBase: RenderedBase,
): void {
  const MIN_X_DISTANCE = 0.5
  
  // Check if this item is far enough from the last inserted item
  if (Math.abs(renderedBase.minX - context.lastInsertedX) > MIN_X_DISTANCE) {
    context.spatialIndex.insert(renderedBase)
    context.lastInsertedX = renderedBase.minX
  }
}

/**
 * Shared rendering context containing all necessary parameters for rendering operations
 */
interface RenderingContext {
  ctx: CanvasRenderingContext2D
  scale: number
  canvasWidth: number
  rowHeight: number
  h: number
  hp2: number
  offset: number
  colorForBase: Record<string, string>
  contrastForBase: Record<string, string>
  showAllLetters: boolean
  mismatchRendering: boolean
  showAsUpperCase: boolean

  // RBush spatial index for efficient spatial queries
  spatialIndex: RBush<RenderedBase>
  
  // Track last X position for spatial index optimization
  lastInsertedX: number
}

/**
 * Renders gap indicators (horizontal lines) where the alignment has deletions relative to reference
 * @param context - Rendering context with canvas and styling info
 * @param alignment - The aligned sequence for this sample
 * @param seq - The reference sequence
 * @param leftPx - Left pixel position of the feature
 * @param rowTop - Top pixel position of the row
 */
function renderGaps(
  context: RenderingContext,
  alignment: string,
  seq: string,
  leftPx: number,
  rowTop: number,
  sampleId: string,
  featureId: string,
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

        // Add to spatial index
        const renderedBase = createRenderedBase(
          xPos,
          rowTop,
          context,
          genomicOffset,
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
      genomicOffset++
    }
  }
  ctx.stroke()
}

/**
 * Renders background rectangles for positions where alignment matches reference
 * Only renders when showAllLetters is false
 * @param context - Rendering context with canvas and styling info
 * @param alignment - The aligned sequence for this sample
 * @param seq - The reference sequence
 * @param leftPx - Left pixel position of the feature
 * @param rowTop - Top pixel position of the row
 */
function renderMatches(
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

        // Add to spatial index
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
      genomicOffset++
    }
  }
}

/**
 * Renders colored rectangles for mismatches and matches (when showAllLetters is true)
 * Colors are determined by base type when mismatchRendering is enabled
 * @param context - Rendering context with canvas and styling info
 * @param alignment - The aligned sequence for this sample
 * @param seq - The reference sequence
 * @param leftPx - Left pixel position of the feature
 * @param rowTop - Top pixel position of the row
 */
function renderMismatches(
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

          // Add to spatial index
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

          // Add to spatial index
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
      genomicOffset++
    }
  }
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
function renderText(
  context: RenderingContext,
  alignment: string,
  origAlignment: string,
  seq: string,
  leftPx: number,
  rowTop: number,
  _sampleId: string,
  _featureId: string,
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

/**
 * Renders insertion markers where the alignment has bases not present in reference
 * Large insertions show count, small ones show as colored bars with optional borders
 * @param context - Rendering context with canvas and styling info
 * @param alignment - The aligned sequence for this sample
 * @param seq - The reference sequence
 * @param leftPx - Left pixel position of the feature
 * @param rowTop - Top pixel position of the row
 * @param bpPerPx - Base pairs per pixel (zoom level)
 */
function renderInsertions(
  context: RenderingContext,
  alignment: string,
  seq: string,
  leftPx: number,
  rowTop: number,
  bpPerPx: number,
  sampleId: string,
  featureId: string,
) {
  const { ctx, scale, h, canvasWidth, rowHeight } = context
  const { charHeight } = getCharWidthHeight()

  for (
    let i = 0, genomicOffset = 0, seqLength = alignment.length;
    i < seqLength;
    i++
  ) {
    let insertionSequence = ''
    while (seq[i] === '-') {
      if (alignment[i] !== '-' && alignment[i] !== ' ') {
        insertionSequence += alignment[i]
      }
      i++
    }
    if (insertionSequence.length > 0) {
      // Found an insertion
      const xPos = leftPx + scale * genomicOffset - INSERTION_LINE_WIDTH

      // Large insertions: show count instead of individual bases
      if (insertionSequence.length > LARGE_INSERTION_THRESHOLD) {
        const lengthText = `${insertionSequence.length}`
        if (bpPerPx > HIGH_BP_PER_PX_THRESHOLD) {
          // Very zoomed out: simple line
          fillRect(
            ctx,
            xPos - INSERTION_LINE_WIDTH,
            rowTop,
            INSERTION_BORDER_WIDTH,
            h,
            canvasWidth,
            'purple',
          )
        } else if (h > charHeight) {
          // Medium zoom: show count in colored box
          const textWidth = measureText(lengthText, CHAR_SIZE_WIDTH)
          const padding = INSERTION_PADDING
          fillRect(
            ctx,
            xPos - textWidth / 2 - padding,
            rowTop,
            textWidth + 2 * padding,
            h,
            canvasWidth,
            'purple',
          )
          ctx.fillStyle = 'white'
          ctx.fillText(lengthText, xPos - textWidth / 2, rowTop + h)
        } else {
          const padding = INSERTION_PADDING
          fillRect(
            ctx,
            xPos - padding,
            rowTop,
            2 * padding,
            h,
            canvasWidth,
            'purple',
          )
        }
      } else {
        // Small insertions: vertical line with optional border at high zoom
        fillRect(
          ctx,
          xPos,
          rowTop,
          INSERTION_LINE_WIDTH,
          h,
          canvasWidth,
          'purple',
        )
        if (
          bpPerPx < HIGH_ZOOM_THRESHOLD &&
          rowHeight > MIN_ROW_HEIGHT_FOR_BORDERS
        ) {
          // Add horizontal borders for visibility at high zoom
          fillRect(
            ctx,
            xPos - INSERTION_BORDER_WIDTH,
            rowTop,
            INSERTION_BORDER_HEIGHT,
            INSERTION_LINE_WIDTH,
            canvasWidth,
          )
          fillRect(
            ctx,
            xPos - INSERTION_BORDER_WIDTH,
            rowTop + h - INSERTION_LINE_WIDTH,
            INSERTION_BORDER_HEIGHT,
            INSERTION_LINE_WIDTH,
            canvasWidth,
          )
        }
      }

      // Add insertion to spatial index
      const renderedBase = createRenderedBase(
        xPos,
        rowTop,
        context,
        genomicOffset,
        sampleId,
        insertionSequence,
        false,
        false,
        false,
        true,
        featureId,
      )
      addToSpatialIndex(context, renderedBase)
    }
    genomicOffset++
  }
}

/**
 * Processes alignment data for a single feature, rendering gaps, matches, mismatches, and text
 * @param feature - JBrowse feature containing alignment data
 * @param region - Genomic region being rendered
 * @param bpPerPx - Base pairs per pixel (zoom level)
 * @param sampleToRowMap - Maps sample IDs to row indices
 * @param renderingContext - Shared rendering parameters
 */
function processFeatureAlignment(
  feature: Feature,
  region: GenomicRegion,
  bpPerPx: number,
  sampleToRowMap: Map<string, number>,
  renderingContext: RenderingContext,
) {
  const [leftPx] = featureSpanPx(feature, region, bpPerPx)
  const alignments = feature.get('alignments') as Record<
    string,
    { seq: string }
  >
  const referenceSeq = feature.get('seq').toLowerCase()
  const featureId =
    feature.id() || `feature_${feature.get('start')}_${feature.get('end')}`

  for (const [sampleId, alignmentData] of Object.entries(alignments)) {
    const row = sampleToRowMap.get(sampleId)
    if (row === undefined) {
      continue
    }

    const originalAlignment = alignmentData.seq
    const alignment = originalAlignment.toLowerCase()
    const rowTop = renderingContext.offset + renderingContext.rowHeight * row

    renderGaps(
      renderingContext,
      alignment,
      referenceSeq,
      leftPx,
      rowTop,
      sampleId,
      featureId,
    )
    renderMatches(
      renderingContext,
      alignment,
      referenceSeq,
      leftPx,
      rowTop,
      sampleId,
      featureId,
    )
    renderMismatches(
      renderingContext,
      alignment,
      referenceSeq,
      leftPx,
      rowTop,
      sampleId,
      featureId,
    )
    renderText(
      renderingContext,
      alignment,
      originalAlignment,
      referenceSeq,
      leftPx,
      rowTop,
      sampleId,
      featureId,
    )
  }
}

/**
 * Processes insertion data for a single feature in a separate pass
 * Insertions are rendered on top to ensure visibility
 * @param feature - JBrowse feature containing alignment data
 * @param region - Genomic region being rendered
 * @param bpPerPx - Base pairs per pixel (zoom level)
 * @param sampleToRowMap - Maps sample IDs to row indices
 * @param renderingContext - Shared rendering parameters
 */
function processFeatureInsertions(
  feature: Feature,
  region: GenomicRegion,
  bpPerPx: number,
  sampleToRowMap: Map<string, number>,
  renderingContext: RenderingContext,
) {
  const [leftPx] = featureSpanPx(feature, region, bpPerPx)
  const alignments = feature.get('alignments') as Record<
    string,
    { seq: string }
  >
  const referenceSeq = feature.get('seq').toLowerCase()
  const featureId =
    feature.id() || `feature_${feature.get('start')}_${feature.get('end')}`

  for (const [sampleId, alignmentData] of Object.entries(alignments)) {
    const row = sampleToRowMap.get(sampleId)
    if (row === undefined) {
      continue
    }

    const alignment = alignmentData.seq.toLowerCase()
    const rowTop = renderingContext.offset + renderingContext.rowHeight * row

    renderInsertions(
      renderingContext,
      alignment,
      referenceSeq,
      leftPx,
      rowTop,
      bpPerPx,
      sampleId,
      featureId,
    )
  }
}

/**
 * Main rendering function that creates the MAF alignment visualization
 * Uses a two-pass approach: first renders alignments, then insertions on top
 *
 * The function automatically creates and populates an RBush spatial index with rendered elements.
 * Items are only indexed if they are >0.5px apart in the X-direction to optimize index density:
 *
 * @example
 * ```typescript
 * import RBush from 'rbush'
 *
 * const result = makeImageData({ ctx, renderArgs })
 * const spatialIndex = new RBush<RenderedBase>()
 * spatialIndex.fromJSON(result.spatialIndex)
 *
 * // Query by bounding box (e.g., mouse hover area)
 * const hits = spatialIndex.search({ minX: 100, minY: 50, maxX: 200, maxY: 100 })
 *
 * // Find bases at specific screen position
 * const basesAtPoint = spatialIndex.search({ minX: x-1, minY: y-1, maxX: x+1, maxY: y+1 })
 *
 * // Access all indexed items for custom filtering
 * const allItems = spatialIndex.all()
 * const basesAtGenomicPosition = allItems.filter(b => b.genomicPosition === 12345)
 * ```
 *
 * @param ctx - Canvas 2D rendering context
 * @param renderArgs - All rendering parameters and data
 * @returns Object containing serialized RBush spatial index data
 */
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
    spatialIndex: new RBush<RenderedBase>(),
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

  // Return serialized RBush spatial index
  return {
    rbush: renderingContext.spatialIndex.toJSON(),
  }
}
