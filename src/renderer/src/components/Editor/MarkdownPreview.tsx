import React, { useMemo } from 'react'
import MarkdownIt from 'markdown-it'
// @ts-ignore – no bundled types; plugin works fine at runtime
import markdownItKatex from '@traptitech/markdown-it-katex'
import styles from './MarkdownPreview.module.css'

const _md = new MarkdownIt({ html: false, linkify: true, typographer: true })
_md.use(markdownItKatex)

interface MarkdownPreviewProps {
  markdown: string
}

/** Read-only rendered Markdown with CommonMark + KaTeX equation support. */
const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ markdown }) => {
  const html = useMemo(() => _md.render(markdown), [markdown])
  return (
    <div
      className={styles.preview}
      // KaTeX and markdown-it output is sanitised (html: false), so this is safe.
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

export default MarkdownPreview
