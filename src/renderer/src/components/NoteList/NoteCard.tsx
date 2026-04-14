import React from 'react'
import type { Note } from '../../types'
import { makeSnippet } from '../../utils/snippet'
import styles from './NoteCard.module.css'

interface NoteCardProps {
  note: Note
  active: boolean
  onSelect: (id: string) => void
}

/** Single note card shown in the note list. */
const NoteCard: React.FC<NoteCardProps> = ({ note, active, onSelect }) => {
  const snippet = makeSnippet(note.body)

  return (
    <article
      className={`${styles.card} ${active ? styles.active : ''}`}
      onClick={() => onSelect(note.id)}
    >
      <p className={styles.noteId}>{note.id}</p>
      <p className={styles.title}>{note.title || '(Untitled)'}</p>
      {snippet && <p className={styles.snippet}>{snippet}</p>}
      {note.tags.length > 0 && (
        <div className={styles.tags}>
          {note.tags.map((tag) => (
            <span key={tag} className="chip chip-tag">
              {tag}
            </span>
          ))}
        </div>
      )}
    </article>
  )
}

export default NoteCard
