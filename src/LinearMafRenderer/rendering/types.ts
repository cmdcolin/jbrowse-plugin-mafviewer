// Rendering constants
export const FONT_CONFIG = 'bold 10px Courier New,monospace'
export const CHAR_SIZE_WIDTH = 10
export const GAP_STROKE_OFFSET = 0.4
export const INSERTION_LINE_WIDTH = 1
export const INSERTION_BORDER_WIDTH = 2
export const INSERTION_PADDING = 2
export const VERTICAL_TEXT_OFFSET = 3
export const LARGE_INSERTION_THRESHOLD = 10
export const HIGH_ZOOM_THRESHOLD = 0.2
export const MIN_ROW_HEIGHT_FOR_BORDERS = 5
export const HIGH_BP_PER_PX_THRESHOLD = 10
export const INSERTION_BORDER_HEIGHT = 5
export const MIN_X_DISTANCE = 0.5

export interface Sample {
  id: string
  color?: string
}

export interface GenomicRegion {
  start: number
  end: number
  refName: string
}

/**
 * Represents a rendered letter/base with its spatial and genomic coordinates
 * This structure is designed for insertion into an RBush spatial index
 */
export interface RenderedBase {
  // Spatial bounding box (required by RBush)
  minX: number
  minY: number
  maxX: number
  maxY: number
  // Genomic information
  pos: number
  chr: string
  sampleId: string
  base: string
  isMatch: boolean
  isMismatch: boolean
  isGap: boolean
  isInsertion: boolean
  // Feature reference
  featureId: string
}

/**
 * Shared rendering context containing all necessary parameters for rendering operations
 */
export interface RenderingContext {
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
  spatialIndex: RenderedBase[]

  // Track last X position for spatial index optimization
  lastInsertedX: number
}

export interface AlignmentRecord {
  seq: string
  start: number
  strand: number
  chr: string
}
