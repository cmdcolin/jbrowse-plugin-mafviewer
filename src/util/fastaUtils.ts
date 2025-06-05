import { Sample } from '../LinearMafDisplay/types'

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
  mismatchRendering,
  samples,
  features,
  showAsUpperCase,
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
  const f = 0.4

  console.log({ samples })
  const rlen = region.end - region.start
  const outputRows = samples.map(() => ' '.repeat(rlen))
  for (const feature of features.values()) {
    const leftCoord = feature.get('start')
    const vals = feature.get('alignments') as Record<string, { data: string }>
    const seq = feature.get('seq')
    console.log({ feature, seq })
    const r = Object.entries(vals)
    for (const [sample, val] of r) {
      const origAlignment = val.data
      const alignment = origAlignment

      const row = sampleToRowMap.get(sample)
      if (row === undefined) {
        continue
      }

      // gaps
      for (let i = 0, o = 0, l = alignment.length; i < l; i++) {
        if (seq[i] !== '-') {
          if (alignment[i] === '-') {
            const l = leftCoord + o - region.start
            if (l >= 0 && l < rlen) {
              outputRows[row] =
                outputRows[row]!.slice(0, l) +
                '-' +
                outputRows[row]!.slice(l + 1)
            }
          }
          o++
        }
      }

      if (!showAllLetters) {
        // matches
        for (let i = 0, o = 0, l = alignment.length; i < l; i++) {
          if (seq[i] !== '-') {
            const c = alignment[i]
            const l = leftCoord + o - region.start
            if (l >= 0 && l < rlen) {
              if (seq[i] === c && c !== '-' && c !== ' ') {
                outputRows[row] =
                  outputRows[row]!.slice(0, l) +
                  '.' +
                  outputRows[row]!.slice(l + 1)
              }
            }
            o++
          }
        }
      }

      // mismatches
      for (let i = 0, o = 0, l = alignment.length; i < l; i++) {
        const c = alignment[i]
        if (seq[i] !== '-') {
          if (c !== '-') {
            const l = leftCoord + o - region.start
            if (l >= 0 && l < rlen) {
              if (seq[i] !== c && c !== ' ') {
                outputRows[row] =
                  outputRows[row]!.slice(0, l) +
                  c +
                  outputRows[row]!.slice(l + 1)
              } else if (showAllLetters) {
                outputRows[row] =
                  outputRows[row]!.slice(0, l) +
                  c +
                  outputRows[row]!.slice(l + 1)
              }
            }
          }
          o++
        }
      }
    }
  }
  return outputRows
}
