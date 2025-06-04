import { SimpleFeature } from '@jbrowse/core/util'
import { expect, test } from 'vitest'

import { processFeaturesToFasta } from './fastaUtils'

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
        data: 'AC-TTCGTAC',
        strand: 1,
      },
    },
  })

  const result = processFeaturesToFasta([mockFeature], {
    refName: 'chr1',
    start: 100,
    end: 105,
    assemblyName: 'assembly1',
  }).split('\n')
  expect(result).toMatchSnapshot()
  expect(result[0]).toContain('>assembly1.chr1:100:+')
  expect(result[1]).toContain('ACGTA')
  expect(result[2]).toContain('>assembly2.chr2:200:+')
  expect(result[3]).toContain('AC-TT')
})

test('gap in assembly1', () => {
  const mockFeature = new SimpleFeature({
    uniqueId: '123',
    refName: 'abc',
    start: 100,
    end: 110,
    alignments: {
      assembly1: {
        chr: 'chr1',
        start: 100,
        data: 'AC-TACGTAC',
        strand: 1,
      },
      assembly2: {
        chr: 'chr2',
        start: 200,
        data: 'ACGTTCGTAC',
        strand: 1,
      },
    },
  })

  const result = processFeaturesToFasta([mockFeature], {
    refName: 'chr1',
    start: 100,
    end: 105,
    assemblyName: 'assembly1',
  }).split('\n')
  expect(result).toMatchSnapshot()
  expect(result[0]).toContain('>assembly1.chr1:100:+')
  expect(result[1]).toContain('AC-TAC')
  expect(result[2]).toContain('>assembly2.chr2:200:+')
  // When there's a gap in the reference assembly (assembly1), those positions should be skipped
  // in all other alignments as well. In this case, the third character in assembly1 is a gap,
  // so we should skip the corresponding position (G) in assembly2.
  expect(result[3]).toContain('ACTTC')
})
