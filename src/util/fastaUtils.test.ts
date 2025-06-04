import { test, expect } from 'vitest'
import { processFeaturesToFasta } from './fastaUtils'
import { SimpleFeature } from '@jbrowse/core/util'
import type { Region } from '@jbrowse/core/util'

test('processes a feature with no selected region', () => {
  const mockFeature = new SimpleFeature({
    uniqueId: '123',
    refName: 'abc',
    start: 100,
    end: 110,
    alignments: {
      assembly1: {
        chr: 'chr1',
        start: 100,
        data: 'ACGTACGTAC',
        strand: 1,
      },
      assembly2: {
        chr: 'chr2',
        start: 200,
        data: 'ACGT-CGTAC',
        strand: -1,
      },
    },
  })

  const result = processFeaturesToFasta([mockFeature])

  expect(result).toContain('>assembly1.chr1:100:+')
  expect(result).toContain('ACGTACGTAC')
  expect(result).toContain('>assembly2.chr2:200:-')
  expect(result).toContain('ACGT-CGTAC')
})

test('processes a feature with a selected region', () => {
  const mockFeature = new SimpleFeature({
    uniqueId: '123',
    refName: 'abc',
    start: 100,
    end: 110,
    alignments: {
      assembly1: {
        chr: 'chr1',
        start: 100,
        data: 'ACGTACGTAC',
        strand: 1,
      },
      assembly2: {
        chr: 'chr2',
        start: 200,
        data: 'ACGT-CGTAC',
        strand: -1,
      },
    },
  })

  const selectedRegion: Region = {
    refName: 'chr1',
    start: 102,
    end: 106,
    assemblyName: 'assembly1',
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
  const mockFeature1 = new SimpleFeature({
    uniqueId: '123',
    refName: 'abc',
    start: 100,
    end: 110,
    alignments: {
      assembly1: {
        chr: 'chr1',
        start: 100,
        data: 'ACGTACGTAC',
        strand: 1,
      },
    },
  })

  const mockFeature2 = new SimpleFeature({
    uniqueId: '123',
    refName: 'abc',
    start: 200,
    end: 210,
    alignments: {
      assembly2: {
        chr: 'chr2',
        start: 200,
        data: 'TGCATGCATG',
        strand: -1,
      },
    },
  })

  const result = processFeaturesToFasta([mockFeature1, mockFeature2])

  expect(result).toContain('>assembly1.chr1:100:+')
  expect(result).toContain('ACGTACGTAC')
  expect(result).toContain('>assembly2.chr2:200:-')
  expect(result).toContain('TGCATGCATG')
})

test('handles a selected region that overlaps partially with the feature', () => {
  const mockFeature = new SimpleFeature({
    uniqueId: '123',
    refName: 'abc',
    start: 100,
    end: 110,
    alignments: {
      assembly1: {
        chr: 'chr1',
        start: 100,
        data: 'ACGTACGTAC',
        strand: 1,
      },
    },
  })

  const selectedRegion: Region = {
    refName: 'chr1',
    start: 95,
    end: 105,
    assemblyName: 'assembly1',
  }

  const result = processFeaturesToFasta([mockFeature], selectedRegion)

  // The selected region starts before the feature, so we should get from position 0
  expect(result).toContain('>assembly1.chr1:100:+ (selected region 95-105)')
  expect(result).toContain('ACGTAC')
})

test('handles a selected region that extends beyond the feature', () => {
  const mockFeature = new SimpleFeature({
    uniqueId: '123',
    refName: 'abc',
    start: 100,
    end: 110,
    alignments: {
      assembly1: {
        chr: 'chr1',
        start: 100,
        data: 'ACGTACGTAC',
        strand: 1,
      },
    },
  })

  const selectedRegion: Region = {
    refName: 'chr1',
    start: 105,
    end: 115,
    assemblyName: 'assembly1',
  }

  const result = processFeaturesToFasta([mockFeature], selectedRegion)

  // The selected region extends beyond the feature, so we should get up to the end
  expect(result).toContain('>assembly1.chr1:105:+ (selected region 105-115)')
  expect(result).toContain('CGTAC')
})
