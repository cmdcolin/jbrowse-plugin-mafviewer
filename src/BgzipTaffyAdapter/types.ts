import VirtualOffset from './virtualOffset'

export interface OrganismRecord {
  chr: string
  start: number
  srcSize: number
  strand: number
  data: string
}

export interface ByteRange {
  chrStart: number
  virtualOffset: VirtualOffset
}

export type IndexData = Record<string, ByteRange[]>
