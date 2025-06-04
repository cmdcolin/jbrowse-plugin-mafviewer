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
