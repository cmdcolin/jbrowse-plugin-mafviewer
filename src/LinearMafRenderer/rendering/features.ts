import { Feature, featureSpanPx } from '@jbrowse/core/util'

import { renderGaps } from './gaps'
import { renderInsertions } from './insertions'
import { renderMatches } from './matches'
import { renderMismatches } from './mismatches'
import { renderText } from './text'

import type { AlignmentRecord, GenomicRegion, RenderingContext } from './types'

/**
 * Processes alignment data for a single feature, rendering gaps, matches, mismatches, and text
 * @param feature - JBrowse feature containing alignment data
 * @param region - Genomic region being rendered
 * @param bpPerPx - Base pairs per pixel (zoom level)
 * @param sampleToRowMap - Maps sample IDs to row indices
 * @param renderingContext - Shared rendering parameters
 */
export function processFeatureAlignment(
  feature: Feature,
  region: GenomicRegion,
  bpPerPx: number,
  sampleToRowMap: Map<string, number>,
  renderingContext: RenderingContext,
) {
  const [leftPx] = featureSpanPx(feature, region, bpPerPx)
  const alignments = feature.get('alignments') as Record<
    string,
    AlignmentRecord
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
      alignmentData.start,
      alignmentData.chr,
    )
    renderMatches(
      renderingContext,
      alignment,
      referenceSeq,
      leftPx,
      rowTop,
      sampleId,
      featureId,
      alignmentData.start,
      alignmentData.chr,
    )
    renderMismatches(
      renderingContext,
      alignment,
      referenceSeq,
      leftPx,
      rowTop,
      sampleId,
      featureId,
      alignmentData.start,
      alignmentData.chr,
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
export function processFeatureInsertions(
  feature: Feature,
  region: GenomicRegion,
  bpPerPx: number,
  sampleToRowMap: Map<string, number>,
  renderingContext: RenderingContext,
) {
  const [leftPx] = featureSpanPx(feature, region, bpPerPx)
  const alignments = feature.get('alignments') as Record<
    string,
    AlignmentRecord
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
      alignmentData.start,
      alignmentData.chr,
    )
  }
}
