import { SimpleFeature } from '@jbrowse/core/util'
import { expect, test } from 'vitest'

import { processFeaturesToFasta } from './fastaUtils'

test('processes a feature with no selected region', () => {
  const mockFeature = new SimpleFeature({
    uniqueId: '123',
    start: 4095950,
    end: 4096616,
    refName: 'chrI',
    name: 'ce10_16654',
    score: 1,
    alignments: {
      ce10: {
        chr: 'chrI',
        start: 4095950,
        srcSize: 666,
        strand: 1,
        unknown: 15072423,
        data: 'AAGAA---AAAT---ATAAT--TAAACGGCAAAAAAAGTCTTCAAAT------CTTTCAGCTCATGACGAAGCGGAAACATATTTCCAAAATCACACCGACTTCCAAATTATCAAATTTCTACGGACGGCAGGATACGATTGTGGGGAAATGTTCATGACATGTTACTTTGGAGGAAGAAGGTACTTTTTTCAAAAACAAAAAACAACATGGTCTTTCAGTTTCAAATTTTCAGTTTGAACCAAATTTTGCAAAACTCTACTAACTTTCGGGTATTTCAATGTTGATATTGGAAAATTTA-------GTTTTTGAAGAATTTTTTAAATTTCCATTAATTCCAGATTCGATTGTTGCAAGTACATGAAGCAAAAAGTGACGTCACTTGGAAAATGTTGGGAGCTTGATCTCCGAAACTTGGCGCCCGAATGGATGAGAAAACAAATATCGCCGGGAAGTGAAGCAGGACTTCAAATAGTTGTAGACGCTCAATTAGAAGAGGAATTAAAAGGAGAAAATGATGATGCAAAAGCTATCTTCTCAGATATCTATGAAAATGGATTTCGTTACTTTATTCATCCACCTGGGACCAATGCTCAACTGACTTCCGAGGGAATAAGTGTTTCGCCATCTCGAACTGTATACTCTGCTATCAAGACCGTTACTGTAAG----TGTT--------------GTTTTCA--AACTG',
      },
      cb4: {
        chr: 'chrI',
        start: 7760171,
        srcSize: 565,
        strand: -1,
        unknown: 15455979,
        data: 'gagat---catt----tggg--aaaaaattgaaagaca-----AAAGTGTGGAATTTCAGCACATGACGAAGCGGAAACATACTTTCAAAACCATACAGACTTTCAAATCATTAATTTTCTGAGGACCGCTGGATACGATTGTGGAGAAATGTTTCTGACATGTTATTTCGGAGGAAGAAggttt-----------------------------------------------------------------------------------ggattactgtaa----------gatcACTGCA-------GTCTAGTCACCTT------------------TTTAAGATTTGATTGCTGTAAATACATGAAACCAAAAGTCACATCACTAGGAAAATGTTGGGAACTGGATCTTCAAAATCTGGCGCCTGAATGGATGCGAAAACAAATATCTCCTGGAAGTGAAGCAGGGCTTCAAATGATTGTTGATGCACAATTGGAAGAAGAATTAAGAGGAGAAAATGGAGATGCAAAAGCGATTTTCTCAGATATCTATGAAAATGGATTCAGATATTACATTCATCCGCCAGGAGCAAATGCTGAGTTGTCATCAGAAGGTATTAGTGTTTCCCCTTCAAGAACTGTTTACTCTGCTATCAAAACTGTCTCGGTGAG----TGGTTGAATCATA----CTTTTTCA--TACGG',
      },
      caeRem4: {
        chr: 'Crem_Contig36',
        start: 394777,
        srcSize: 575,
        strand: -1,
        unknown: 636794,
        data: 'gagaa---aattaaaatggg----gaaattgaatgaaa-----aaaa-ggaaaattgcaGCGCACGATGAGGCGGAGacgtattttcaaaatcacacagattttcaaatcattaaGTTTCTGCGGACTGCTGGATACGATTGCGGAGAAATGTTCTTGACTTGTTATTTTGGAGGAAGAAGGTACAT-----AAAAACAGAG------------------------------------------------------------------gaattattacaa----------aaagaaaatatatgaatatttatttgaatta-----------------tttcagattcgattGCTGCAAATatatgaaacaaaaagtgacaTCTCTCGGGAAGTGTTGGGAGCTTGATCTACAGAATCTTGCTCCAGAATGGATGAGGAAGCAAATATCACCGGGAAGTGAATCAGGACTTCAGATGATTGTTGACGCTCAATTAGAAGAAGAACTGAGAGGAGAAGATGGAGATGCAAACGCAATATTCTCTGATATCTATGAAAATGGATTCAGATATTATATTCATCCACCAGGTGCGAATGCTGAATTAACTTCCGAAGGAATCAGTGTTTCTCCGTCGAGAACTGTTTATTCTGCTATCAAAACGATTTCGGTGAG----TAG---------------TTTGTCa--caaaa',
      },
      caeSp111: {
        chr: 'Scaffold627',
        start: 194453,
        srcSize: 573,
        strand: 1,
        unknown: 908941,
        data: 'aaggA---AATT---AGAGAATGAAAGggggaaaaagg-----aaga------attaCAGCTCATGATGAAGCAGAAACATACTTTCAAAATCACaccgattttcaaattattaaatttcTGAGAACTGCTGGTTATGATTGTggagaaatgtttttgactTGTTATTTCGGTGGAAGAaggt-------------------------------------------------------------------------------------ttttttattcaa----------gagACAACTG-------CTTTTCGAACATTA---------------ATTCTCAGATTTGATTGCTGTAAATacatgaaacaaaaagtgacgTCACTCGGAAAATGTTGGGAATTGGATCTTCAGAATCTCGCTCCAGAATGGATGAGAAAACAGATTTCACCGGGAAGCGAATCAGGACTTCAAATGATTGTTGACGCtcaattagaagaagaattaaGAGGAGAAGATGGCGATGCAAATGCTATTTTCTCTgatatttatgaaaatggaTTCCGTTATTACATTCATCCACCGGGTGCAAATGCTGAATTATCATCTGAAGGAATCAGTGTTTCGCCTTCAAGAACTGTTTATTCTGCTATCAAAACTGTTTCGGTTCGTTTCTTTTAACATTACAGTATCCTTCCCAATCAGAG',
      },
      caePb3: {
        chr: 'Scfld02_110',
        start: 185268,
        srcSize: 578,
        strand: -1,
        unknown: 521291,
        data: 'GAGGATCGAATG---ATAGA--GAAGCACTGAAGAATC-----AAAG------ATTTCAGCTCATGATGAAGCAGAAACGTACTTTCAAAACCAcacagattttcaaattatcaagtttttgagaactgCCGGATATGACTGTGGAGAGATGTTCCTGACTTGCTACTTCGGGGGGCGAAGGTAA-----------------------------------------------------------------------------------TAATTAACTGAAT-TCGGT-TTGAAGTATCCG-------ATTCAACAACAGCA--------------CAATTATAGATTCGACTGCTGTAAAtacatgaaacaaaaagtaacaTCACTCGGAAAGTGTTGGGAACTGGATCTCCAAACATTGGCTCCAGAATGGATGAGAAAACAGATTTCCCCTGGAAGTGAATCTGGACTTCAATTGATTGTTGATGCTCAGTTAGAAGAAGAACTACGAGGAGAAAATGGTGATGCGAATGCAATATTCTCGGATATTTATGAAAATGGATTCCGATATTATATCCATCCACCAGGTGCAAATGCAGAGTTATCATCCGAAGGAATCAGTGTATCACCCTCAAGGACCGTTTACTCTGCTATCAAAACTGTGTCGGTTAG----TTTTCGAGTTACCTTATACATCCAA--TAGA-',
      },
    },
    seq: 'AAGAA---AAAT---ATAAT--TAAACGGCAAAAAAAGTCTTCAAAT------CTTTCAGCTCATGACGAAGCGGAAACATATTTCCAAAATCACACCGACTTCCAAATTATCAAATTTCTACGGACGGCAGGATACGATTGTGGGGAAATGTTCATGACATGTTACTTTGGAGGAAGAAGGTACTTTTTTCAAAAACAAAAAACAACATGGTCTTTCAGTTTCAAATTTTCAGTTTGAACCAAATTTTGCAAAACTCTACTAACTTTCGGGTATTTCAATGTTGATATTGGAAAATTTA-------GTTTTTGAAGAATTTTTTAAATTTCCATTAATTCCAGATTCGATTGTTGCAAGTACATGAAGCAAAAAGTGACGTCACTTGGAAAATGTTGGGAGCTTGATCTCCGAAACTTGGCGCCCGAATGGATGAGAAAACAAATATCGCCGGGAAGTGAAGCAGGACTTCAAATAGTTGTAGACGCTCAATTAGAAGAGGAATTAAAAGGAGAAAATGATGATGCAAAAGCTATCTTCTCAGATATCTATGAAAATGGATTTCGTTACTTTATTCATCCACCTGGGACCAATGCTCAACTGACTTCCGAGGGAATAAGTGTTTCGCCATCTCGAACTGTATACTCTGCTATCAAGACCGTTACTGTAAG----TGTT--------------GTTTTCA--AACTG',
  })

  const reg = { refName: 'chrI', start: 4095951, end: 4095960 }
  const result = processFeaturesToFasta([mockFeature], reg)

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

  const result = processFeaturesToFasta([mockFeature], {
    refName: 'chr1',
    start: 102,
    end: 106,
    assemblyName: 'assembly1',
  })

  // For assembly1, positions 102-106 correspond to indices 2-6 in the sequence
  expect(result).toContain('>assembly1.chr1:102:+')
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

  const result = processFeaturesToFasta([mockFeature], {
    refName: 'chr1',
    start: 95,
    end: 105,
    assemblyName: 'assembly1',
  })

  // The selected region starts before the feature, so we should get from position 0
  expect(result).toContain('>assembly1.chr1:100:+')
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

  const result = processFeaturesToFasta([mockFeature], {
    refName: 'chr1',
    start: 105,
    end: 115,
    assemblyName: 'assembly1',
  })

  // The selected region extends beyond the feature, so we should get up to the end
  expect(result).toContain('>assembly1.chr1:105:+')
  expect(result).toContain('CGTAC')
})
