import Store from 'electron-store'
import os from 'os'
import path from 'path'
import fs from 'fs'

interface StoreSchema {
  defaultRoot: string
}

const _defaultRoot = path.join(os.homedir(), 'NoteKast')

const store = new Store<StoreSchema>({
  defaults: { defaultRoot: _defaultRoot }
})

/**
 * Returns the persisted default root, creating the directory on disk if it
 * does not yet exist (e.g. on first launch).
 */
export function getDefaultRoot(): string {
  const root = store.get('defaultRoot')
  if (!fs.existsSync(root)) {
    fs.mkdirSync(root, { recursive: true })
  }
  return root
}

/** Overwrites the persisted default root without any validation. Callers must validate first. */
export function setDefaultRoot(newPath: string): void {
  store.set('defaultRoot', newPath)
}

export default store
