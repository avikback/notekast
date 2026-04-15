import Store from 'electron-store'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'

interface StoreSchema {
  defaultRoot: string
}

const store = new Store<StoreSchema>()

/** Returns true when the user has never completed first-run setup. */
export function isFirstRun(): boolean {
  return !store.has('defaultRoot')
}

/**
 * Returns the persisted save location, creating the directory if it does not
 * exist yet. Falls back to Documents/NoteKast if the store entry is missing
 * (should not happen after first-run setup, but guards against edge cases).
 */
export function getDefaultRoot(): string {
  const stored = store.get('defaultRoot') as string | undefined
  const root = stored ?? path.join(app.getPath('documents'), 'NoteKast')
  if (!fs.existsSync(root)) fs.mkdirSync(root, { recursive: true })
  return root
}

/** Overwrites the persisted default root without any validation. Callers must validate first. */
export function setDefaultRoot(newPath: string): void {
  store.set('defaultRoot', newPath)
}

export default store
