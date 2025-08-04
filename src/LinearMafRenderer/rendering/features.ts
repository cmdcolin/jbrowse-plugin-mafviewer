import { Feature, featureSpanPx } from '@jbrowse/core/util'

import { renderGaps } from './gaps'
import { renderInsertions } from './insertions'
import { renderMatches } from './matches'
import { renderMismatches } from './mismatches'
import { renderText } from './text'

import type { AlignmentRecord, GenomicRegion, RenderingContext } from './types'

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

  for (const [sampleId, alignmentData] of Object.entries(alignments)) {
    const row = sampleToRowMap.get(sampleId)
    if (row === undefined) {
      continue
    }

    const originalAlignment = alignmentData.seq
    const alignment = originalAlignment.toLowerCase()
    const rowTop = renderingContext.offset + renderingContext.rowHeight * row

    renderGaps(renderingContext, alignment, referenceSeq, leftPx, rowTop)
    renderMatches(
      renderingContext,
      alignment,
      referenceSeq,
      leftPx,
      rowTop,
      row,
      alignmentData.start,
      alignmentData.chr,
    )
    renderMismatches(
      renderingContext,
      alignment,
      referenceSeq,
      leftPx,
      rowTop,
      row,
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
    )
  }
}

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
      row,
      alignmentData.start,
      alignmentData.chr,
    )
  }
}
