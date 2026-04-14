const SNIPPET_LENGTH = 120

/** Strips Markdown syntax and returns plain text suitable for a preview snippet. */
function _stripMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, '') // fenced code blocks
    .replace(/`[^`]*`/g, '')        // inline code
    .replace(/!\[.*?\]\(.*?\)/g, '') // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // links → label text
    .replace(/#{1,6}\s*/g, '')       // headings
    .replace(/[*_~]{1,3}([^*_~]*)[*_~]{1,3}/g, '$1') // bold/italic/strike
    .replace(/^\s*[-*+>]\s+/gm, '')  // list markers and blockquotes
    .replace(/\$\$[\s\S]*?\$\$/g, '') // display math
    .replace(/\$[^$]*\$/g, '')        // inline math
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Returns the first 120 characters of plain text from a Markdown body,
 * with an ellipsis appended when the content is longer.
 */
export function makeSnippet(body: string): string {
  const plain = _stripMarkdown(body)
  if (plain.length <= SNIPPET_LENGTH) return plain
  return plain.slice(0, SNIPPET_LENGTH).trimEnd() + '…'
}
