import type { StoredCompanion } from './core/types'

export type ToyConfig = {
  userId: string
  companion?: StoredCompanion
  companionMuted?: boolean
  introShownForName?: string
}

const STORAGE_KEY = 'buddy-toy-config'

let cache: ToyConfig = { userId: 'anon' }

function defaultUserId(): string {
  // Use a random persistent ID stored in localStorage
  if (typeof window === 'undefined') return 'anon'
  let id = localStorage.getItem('buddy-toy-userid')
  if (!id) {
    id = `user-${Math.random().toString(36).slice(2, 10)}`
    localStorage.setItem('buddy-toy-userid', id)
  }
  return id
}

export function loadConfig(): ToyConfig {
  if (typeof window === 'undefined') return cache
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ToyConfig>
      cache = {
        userId: parsed.userId ?? defaultUserId(),
        companion: parsed.companion,
        companionMuted: parsed.companionMuted,
        introShownForName: parsed.introShownForName,
      }
    } else {
      cache = { userId: defaultUserId() }
    }
  } catch {
    cache = { userId: defaultUserId() }
  }
  return cache
}

export function getConfig(): ToyConfig {
  return cache
}

export function saveConfig(patch: Partial<ToyConfig>): void {
  cache = { ...cache, ...patch }
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cache))
    } catch {}
  }
}
