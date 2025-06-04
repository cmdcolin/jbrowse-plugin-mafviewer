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
