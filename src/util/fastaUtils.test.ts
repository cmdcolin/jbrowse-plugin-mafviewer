import { describe, test, expect } from 'vitest'
import { processFeaturesToFasta, extractSubsequence } from './fastaUtils'
import type { Feature, Region } from '@jbrowse/core/util'

// Mock Feature class for testing
class MockFeature implements Feature {
  private data: Record<string, any>

  constructor(data: Record<string, any>) {
    this.data = data
  }

  get(key: string): any {
    return this.data[key]
  }

  id(): string {
    return this.data.id || 'mock-feature'
  }

  // Implement other required Feature methods with minimal functionality
  toJSON(): Record<string, any> {
    return this.data
  }

  parent(): Feature | undefined {
    return undefined
  }

  children(): Feature[] {
    return []
  }

  tags(): string[] {
    return Object.keys(this.data)
  }

  set(): void {
    // Not implemented for this mock
  }
}

describe('extractSubsequence', () => {
  test('extracts a simple subsequence without gaps', () => {
    const sequence = 'ACGTACGT'
    const { extractedSequence, actualStart } = extractSubsequence(sequence, 2, 6)
    
    expect(extractedSequence).toBe('GTAC')
    expect(actualStart).toBe(2)
  })

  test('handles gaps in the sequence correctly', () => {
    const sequence = 'A-CGT-ACGT'
    const { extractedSequence, actualStart } = extractSubsequence(sequence, 2, 6)
    
    // Gaps are not counted toward positions, so positions 2-6 would be G,T,A,C
    expect(extractedSequence).toBe('GT-AC')
    expect(actualStart).toBe(3)
  })

  test('handles subsequence at the start of the sequence', () => {
    const sequence = 'ACGTACGT'
    const { extractedSequence, actualStart } = extractSubsequence(sequence, 0, 3)
    
    expect(extractedSequence).toBe('ACG')
    expect(actualStart).toBe(0)
  })

  test('handles subsequence at the end of the sequence', () => {
    const sequence = 'ACGTACGT'
    const { extractedSequence, actualStart } = extractSubsequence(sequence, 5, 8)
    
    expect(extractedSequence).toBe('CGT')
    expect(actualStart).toBe(5)
  })

  test('handles a sequence with only gaps', () => {
    const sequence = '----'
    const { extractedSequence, actualStart } = extractSubsequence(sequence, 0, 2)
    
    // Since there are no non-gap characters, the subsequence should be the entire string
    expect(extractedSequence).toBe('----')
    expect(actualStart).toBe(0)
  })

  test('handles a sequence with mixed characters and gaps', () => {
    const sequence = 'A--CGT--ACGT'
    const { extractedSequence, actualStart } = extractSubsequence(sequence, 2, 5)
    
    // Positions 2-5 would be G,T,A after skipping gaps
    expect(extractedSequence).toBe('GT--A')
    expect(actualStart).toBe(5)
  })
})

describe('processFeaturesToFasta', () => {
  test('processes a feature with no selected region', () => {
    const mockFeature = new MockFeature({
      start: 100,
      end: 110,
      alignments: {
        'assembly1': {
          chr: 'chr1',
          start: 100,
          data: 'ACGTACGTAC',
          strand: 1
        },
        'assembly2': {
          chr: 'chr2',
          start: 200,
          data: 'ACGT-CGTAC',
          strand: -1
        }
      }
    })

    const result = processFeaturesToFasta([mockFeature])
    
    expect(result).toContain('>assembly1.chr1:100:+')
    expect(result).toContain('ACGTACGTAC')
    expect(result).toContain('>assembly2.chr2:200:-')
    expect(result).toContain('ACGT-CGTAC')
  })

  test('processes a feature with a selected region', () => {
    const mockFeature = new MockFeature({
      start: 100,
      end: 110,
      alignments: {
        'assembly1': {
          chr: 'chr1',
          start: 100,
          data: 'ACGTACGTAC',
          strand: 1
        },
        'assembly2': {
          chr: 'chr2',
          start: 200,
          data: 'ACGT-CGTAC',
          strand: -1
        }
      }
    })

    const selectedRegion: Region = {
      refName: 'chr1',
      start: 102,
      end: 106,
      assemblyName: 'assembly1'
    }

    const result = processFeaturesToFasta([mockFeature], selectedRegion)
    
    // For assembly1, positions 102-106 correspond to indices 2-6 in the sequence
    expect(result).toContain('>assembly1.chr1:102:+ (selected region 102-106)')
    expect(result).toContain('GTAC')
    
    // For assembly2, the calculation is more complex due to the gap and negative strand
    expect(result).toContain('>assembly2.chr2:')
    expect(result).toContain('(selected region 102-106)')
  })

  test('processes multiple features', () => {
    const mockFeature1 = new MockFeature({
      start: 100,
      end: 110,
      alignments: {
        'assembly1': {
          chr: 'chr1',
          start: 100,
          data: 'ACGTACGTAC',
          strand: 1
        }
      }
    })

    const mockFeature2 = new MockFeature({
      start: 200,
      end: 210,
      alignments: {
        'assembly2': {
          chr: 'chr2',
          start: 200,
          data: 'TGCATGCATG',
          strand: -1
        }
      }
    })

    const result = processFeaturesToFasta([mockFeature1, mockFeature2])
    
    expect(result).toContain('>assembly1.chr1:100:+')
    expect(result).toContain('ACGTACGTAC')
    expect(result).toContain('>assembly2.chr2:200:-')
    expect(result).toContain('TGCATGCATG')
  })

  test('handles a selected region that overlaps partially with the feature', () => {
    const mockFeature = new MockFeature({
      start: 100,
      end: 110,
      alignments: {
        'assembly1': {
          chr: 'chr1',
          start: 100,
          data: 'ACGTACGTAC',
          strand: 1
        }
      }
    })

    const selectedRegion: Region = {
      refName: 'chr1',
      start: 95,
      end: 105,
      assemblyName: 'assembly1'
    }

    const result = processFeaturesToFasta([mockFeature], selectedRegion)
    
    // The selected region starts before the feature, so we should get from position 0
    expect(result).toContain('>assembly1.chr1:100:+ (selected region 95-105)')
    expect(result).toContain('ACGTAC')
  })

  test('handles a selected region that extends beyond the feature', () => {
    const mockFeature = new MockFeature({
      start: 100,
      end: 110,
      alignments: {
        'assembly1': {
          chr: 'chr1',
          start: 100,
          data: 'ACGTACGTAC',
          strand: 1
        }
      }
    })

    const selectedRegion: Region = {
      refName: 'chr1',
      start: 105,
      end: 115,
      assemblyName: 'assembly1'
    }

    const result = processFeaturesToFasta([mockFeature], selectedRegion)
    
    // The selected region extends beyond the feature, so we should get up to the end
    expect(result).toContain('>assembly1.chr1:105:+ (selected region 105-115)')
    expect(result).toContain('CGTAC')
  })
})

