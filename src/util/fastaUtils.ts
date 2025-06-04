import type { Feature, Region } from '@jbrowse/core/util'

/**
 * Process features into FASTA format
 * @param features - The features to process
 * @param selectedRegion - Optional region to extract
 * @returns FASTA formatted text
 */
export function processFeaturesToFasta(
  features: Feature[],
  selectedRegion?: Region,
): string {
  let fastaText = ''

  for (const feature of features) {
    const alignments = feature.get('alignments') as Record<
      string,
      { chr: string; start: number; data: string; strand: number }
    >

    const featureStart = feature.get('start')
    const featureEnd = feature.get('end')

    if (!selectedRegion) {
      // If no specific region is selected, return the full sequences
      for (const [assemblyName, alignment] of Object.entries(alignments)) {
        const header = `>${assemblyName}.${alignment.chr}:${alignment.start}:${
          alignment.strand === -1 ? '-' : '+'
        }`
        fastaText += `${header}\n${alignment.data}\n`
      }
    } else {
      // Calculate the relative positions within the feature
      const relativeStart = Math.max(0, selectedRegion.start - featureStart)
      const relativeEnd = Math.min(
        featureEnd - featureStart,
        selectedRegion.end - featureStart,
      )

      // Extract the subsequence for each alignment
      for (const [assemblyName, alignment] of Object.entries(alignments)) {
        // Calculate the actual sequence positions accounting for gaps
        const { extractedSequence, actualStart } = extractSubsequence(
          alignment.data,
          relativeStart,
          relativeEnd,
        )

        // Calculate the genomic coordinate of the extracted sequence
        const startCoord =
          alignment.strand === -1
            ? alignment.start -
              actualStart -
              extractedSequence.replaceAll('-', '').length
            : alignment.start + actualStart

        const header = `>${assemblyName}.${alignment.chr}:${startCoord}:${
          alignment.strand === -1 ? '-' : '+'
        } (selected region ${selectedRegion.start}-${selectedRegion.end})`

        fastaText += `${header}\n${extractedSequence}\n`
      }
    }
  }

  return fastaText
}

/**
 * Helper function to extract a subsequence from an alignment string
 * accounting for gaps in the reference sequence
 * @param sequence - The alignment sequence
 * @param relativeStart - The start position in the reference sequence (without gaps)
 * @param relativeEnd - The end position in the reference sequence (without gaps)
 * @returns The extracted sequence and the actual start position in the alignment
 */
export function extractSubsequence(
  sequence: string,
  relativeStart: number,
  relativeEnd: number,
): { extractedSequence: string; actualStart: number } {
  // This function extracts a subsequence from an alignment
  // It needs to account for gaps ('-') in the reference sequence

  let nonGapCount = 0
  let startIndex = 0
  let endIndex = sequence.length

  // Find the start index in the alignment string
  for (let i = 0; i < sequence.length; i++) {
    if (nonGapCount >= relativeStart) {
      startIndex = i
      break
    }
    // Only count non-gap characters toward the position
    if (sequence[i] !== '-') {
      nonGapCount++
    }
  }

  // Find the end index in the alignment string
  nonGapCount = 0
  for (let i = 0; i < sequence.length; i++) {
    if (nonGapCount >= relativeEnd) {
      endIndex = i
      break
    }
    // Only count non-gap characters toward the position
    if (sequence[i] !== '-') {
      nonGapCount++
    }
  }

  return {
    extractedSequence: sequence.substring(startIndex, endIndex),
    actualStart: startIndex,
  }
}
