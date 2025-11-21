import { Sample } from '../LinearMafDisplay/types'

import type { AlignmentRecord } from '../LinearMafRenderer/rendering'
import type { Feature, Region } from '@jbrowse/core/util'

/**
 * Process features into FASTA format
 * @param features - The features to process
 * @param selectedRegion - Optional region to extract
 * @returns FASTA formatted text
 */
export function processFeaturesToFasta({
  regions,
  showAllLetters,
  samples,
  features,
}: {
  regions: Region[]
  samples: Sample[]
  showAsUpperCase?: boolean
  mismatchRendering?: boolean
  showAllLetters?: boolean
  features: Map<string, Feature>
}) {
  const region = regions[0]!
  const sampleToRowMap = new Map(samples.map((s, i) => [s.id, i]))
  const rlen = region.end - region.start

  // Use character arrays instead of strings for O(1) mutations
  const outputRowsArrays = samples.map(() => new Array(rlen).fill('-'))

  for (const feature of features.values()) {
    const leftCoord = feature.get('start')
    const vals = feature.get('alignments') as Record<string, AlignmentRecord>
    const seq = feature.get('seq')

    for (const [sample, val] of Object.entries(vals)) {
      const alignment = val.seq
      const row = sampleToRowMap.get(sample)
      if (row === undefined) {
        continue
      }

      const rowArray = outputRowsArrays[row]!

      // Single-pass processing: handle gaps, matches, and mismatches together
      for (let i = 0, o = 0, l = alignment.length; i < l; i++) {
        if (seq[i] !== '-') {
          const c = alignment[i]
          const pos = leftCoord + o - region.start

          if (pos >= 0 && pos < rlen) {
            if (c === '-') {
              // Gap
              rowArray[pos] = '-'
            } else if (c !== ' ') {
              if (showAllLetters) {
                // Show all letters mode: write character directly
                rowArray[pos] = c
              } else if (seq[i] === c) {
                // Match: use dot notation
                rowArray[pos] = '.'
              } else {
                // Mismatch: write character
                rowArray[pos] = c
              }
            }
          }
          o++
        }
      }
    }
  }

  // Convert character arrays back to strings
  return outputRowsArrays.map(arr => arr.join(''))
}
