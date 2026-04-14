/**
 * Utilities for classic Luhmann ID parsing, ordering, and assignment.
 *
 * A Luhmann ID is a sequence of alternating digit-groups and letter-groups:
 *   "1"       → [1]
 *   "1a"      → [1, "a"]
 *   "1a2"     → [1, "a", 2]
 *   "1a2b"    → [1, "a", 2, "b"]
 *
 * Root IDs are pure integers. Children alternate letter then digit then letter…
 */

type Segment = number | string

/** Splits a Luhmann ID into alternating numeric/letter segments. */
export function parseSegments(id: string): Segment[] {
  const segments: Segment[] = []
  let i = 0
  while (i < id.length) {
    if (/\d/.test(id[i])) {
      let j = i
      while (j < id.length && /\d/.test(id[j])) j++
      segments.push(parseInt(id.slice(i, j), 10))
      i = j
    } else {
      // Single letter per classic Luhmann convention
      segments.push(id[i])
      i++
    }
  }
  return segments
}

/**
 * Compares two Luhmann IDs for sort ordering.
 * Returns negative if a < b, positive if a > b, 0 if equal.
 */
export function compareLuhmann(a: string, b: string): number {
  const sa = parseSegments(a)
  const sb = parseSegments(b)
  const len = Math.max(sa.length, sb.length)
  for (let i = 0; i < len; i++) {
    if (i >= sa.length) return -1
    if (i >= sb.length) return 1
    const pa = sa[i]
    const pb = sb[i]
    if (typeof pa === 'number' && typeof pb === 'number') {
      if (pa !== pb) return pa - pb
    } else if (typeof pa === 'string' && typeof pb === 'string') {
      if (pa !== pb) return pa < pb ? -1 : 1
    } else {
      // Mixed types shouldn't happen in valid IDs; numbers sort before letters
      return typeof pa === 'number' ? -1 : 1
    }
  }
  return 0
}

/** Returns true if `candidateId` is a direct child of `parentId`. */
export function isDirectChild(candidateId: string, parentId: string): boolean {
  const parentSegs = parseSegments(parentId)
  const childSegs = parseSegments(candidateId)
  if (childSegs.length !== parentSegs.length + 1) return false
  for (let i = 0; i < parentSegs.length; i++) {
    if (childSegs[i] !== parentSegs[i]) return false
  }
  return true
}

/**
 * Increments the last segment of a Luhmann ID to produce the next sibling.
 * e.g. "1b" → "1c", "1a3" → "1a4", "1z" throws (no more single letters).
 */
function _incrementLastSegment(id: string): string {
  const segs = parseSegments(id)
  const last = segs[segs.length - 1]
  const prefix = segs.slice(0, -1)
  const _rebuildPrefix = (): string =>
    prefix
      .map((s) => (typeof s === 'number' ? String(s) : s))
      .join('')

  if (typeof last === 'number') {
    return _rebuildPrefix() + String(last + 1)
  }
  // Single letter — increment the character
  const next = String.fromCharCode(last.charCodeAt(0) + 1)
  if (next > 'z') throw new Error(`Luhmann letter overflow at ID "${id}"`)
  return _rebuildPrefix() + next
}

/**
 * Given all existing note IDs in a project, returns the next root-level ID.
 * Finds the highest existing root integer and increments it.
 */
export function nextRootId(existingIds: string[]): string {
  const rootIds = existingIds
    .map(parseSegments)
    .filter((s) => s.length === 1 && typeof s[0] === 'number')
    .map((s) => s[0] as number)
  const max = rootIds.length > 0 ? Math.max(...rootIds) : 0
  return String(max + 1)
}

/**
 * Given all existing note IDs in a project and a parent ID, returns the next
 * direct child ID under that parent.
 */
export function nextChildId(existingIds: string[], parentId: string): string {
  const parentSegs = parseSegments(parentId)
  const directChildren = existingIds.filter((id) => isDirectChild(id, parentId))

  if (directChildren.length === 0) {
    // First child: append "a" (letter) if parent ends in digit, else "1" (digit)
    const lastParentSeg = parentSegs[parentSegs.length - 1]
    const suffix = typeof lastParentSeg === 'number' ? 'a' : '1'
    return parentId + suffix
  }

  // Find the highest existing direct child and increment it
  const sorted = [...directChildren].sort(compareLuhmann)
  const highest = sorted[sorted.length - 1]
  return _incrementLastSegment(highest)
}

/** Sorts an array of notes by Luhmann ID in place and returns it. */
export function sortByLuhmann<T extends { id: string }>(notes: T[]): T[] {
  return [...notes].sort((a, b) => compareLuhmann(a.id, b.id))
}

/**
 * Returns a display-safe depth indicator for a Luhmann ID.
 * Root = 0, first child level = 1, etc.
 */
export function luhmannDepth(id: string): number {
  return parseSegments(id).length - 1
}
