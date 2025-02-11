export function parseLineByLine<T>(
  buffer: Uint8Array,
  cb: (line: string) => T | undefined,
): T[] {
  let blockStart = 0
  const entries: T[] = []
  const decoder = new TextDecoder('utf8')
  while (blockStart < buffer.length) {
    const n = buffer.indexOf(10, blockStart)
    if (n === -1) {
      break
    }
    const b = buffer.subarray(blockStart, n)
    const line = decoder.decode(b).trim()
    if (line) {
      const entry = cb(line)
      if (entry) {
        entries.push(entry)
      }
    }

    blockStart = n + 1
  }
  return entries
}
