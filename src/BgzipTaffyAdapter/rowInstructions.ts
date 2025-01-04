interface RowInsert {
  type: 'i'
  row: number
  asm: string
  ref: string
  start: number
  strand: number
  length: number
}
interface RowSubstitute {
  type: 's'
  row: number
  asm: string
  ref: string
  start: number
  strand: number
  length: number
}
interface RowDelete {
  type: 'd'
  row: number
}
interface RowGap {
  type: 'g'
  row: number
  gapLen: number
}
interface RowGapSubstring {
  type: 'G'
  row: number
  gapSubstring: string
}
type RowInstruction =
  | RowInsert
  | RowDelete
  | RowGap
  | RowGapSubstring
  | RowSubstitute

export function parseRowInstructions(meta: string) {
  const ret = meta.split(' ')
  const rows = [] as RowInstruction[]

  for (let i = 0; i < ret.length; ) {
    const type = ret[i++]
    if (type === 'i') {
      const row = +ret[i++]!
      const [asm, ref] = ret[i++]!.split('.')
      rows.push({
        type,
        row,
        asm: asm!,
        ref: ref!,
        start: +ret[i++]!,
        strand: ret[i++] === '-' ? -1 : 1,
        length: +ret[i++]!,
      })
    }
    if (type === 's') {
      const row = +ret[i++]!
      const [asm, ref] = ret[i++]!.split('.')
      rows.push({
        type,
        row,
        asm: asm!,
        ref: ref!,
        start: +ret[i++]!,
        strand: ret[i++] === '-' ? -1 : 1,
        length: +ret[i++]!,
      })
    } else if (type === 'd') {
      rows.push({
        type,
        row: +ret[i++]!,
      })
    } else if (type === 'g') {
      rows.push({
        type,
        row: +ret[i++]!,
        gapLen: +ret[i++]!,
      })
    } else if (type === 'G') {
      rows.push({
        type,
        row: +ret[i++]!,
        gapSubstring: ret[i++]!,
      })
    }
  }
  return rows
}
