import { getBpDisplayStr, toLocale } from '@jbrowse/core/util'
import { max } from 'd3-array'

import type { NodeWithIds } from './types'
import type { HierarchyNode } from 'd3-hierarchy'

export interface HoveredInfo {
  sampleId: string
  sampleLabel: string
  pos: number
  base: string
  chr: string
  [key: string]: unknown // Allow additional properties for compatibility
}

export interface GenomicPosition {
  refName: string
  coord: number
}

/**
 * Generates tooltip HTML content for MAF alignments
 * Truncates long sequences to 50 characters, with ellipses added if display exceeds 20 characters
 * @param hoveredInfo - Information about the hovered base/position
 * @param p1 - Start position (for range selections)
 * @param p2 - End position (current mouse position)
 * @returns HTML string for tooltip content
 */
export function generateTooltipContent(
  hoveredInfo: HoveredInfo | undefined,
  p1: GenomicPosition | undefined,
  p2: GenomicPosition,
): string {
  const contentLines: string[] = []

  if (p1) {
    // Range selection mode
    contentLines.push(
      `Start: ${p1.refName}:${toLocale(p1.coord)}`,
      `End: ${p2.refName}:${toLocale(p2.coord)}`,
      `Length: ${getBpDisplayStr(Math.abs(p1.coord - p2.coord))}`,
    )
  } else {
    // Single position mode
    contentLines.push(`Ref: ${p2.refName}:${toLocale(p2.coord)}`)

    if (hoveredInfo) {
      const { base, sampleLabel, pos, chr, isInsertion } = hoveredInfo
      const thresh = 20
      const len = base.length
      const lengthSuffix = len > 1 ? ` ${len}bp` : ''
      const baseDisplay =
        base.length > thresh ? base.slice(0, thresh) + '...' : base
      const insertionLabel = isInsertion ? ' Insertion' : ''

      contentLines.push(
        `Alt ${sampleLabel}: ${chr}:${pos.toLocaleString('en-US')} (${baseDisplay}${lengthSuffix}${insertionLabel})`,
      )
    }
  }

  return contentLines.filter(line => !!line).join('<br/>')
}

// basically same as maxLength from https://observablehq.com/@d3/tree-of-life
export function maxLength(d: HierarchyNode<NodeWithIds>): number {
  return (
    (d.data.length || 0) + (d.children ? max(d.children, maxLength) || 0 : 0)
  )
}

// basically same as setRadius from https://observablehq.com/@d3/tree-of-life
export function setBrLength(
  d: HierarchyNode<NodeWithIds>,
  y0: number,
  k: number,
) {
  // @ts-expect-error
  d.len = (y0 += Math.max(d.data.length || 0, 0)) * k

  if (d.children) {
    d.children.forEach(d => {
      setBrLength(d, y0, k)
    })
  }
}
