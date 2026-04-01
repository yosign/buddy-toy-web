import 'client-only'

import type { StatName, StoredCompanion } from './core/types'

export type ToyConfig = {
  userId: string
  companion?: StoredCompanion
  companionMuted?: boolean
  introShownForName?: string
  statsAdjust?: Partial<Record<StatName, number>>
  lastRollSeed?: string  // when set, use this seed to roll bones instead of userId
  luckyOverride?: boolean  // force legendary + shiny on companion display
}

const STORAGE_KEY = 'buddy-toy-config'

let cache: ToyConfig = { userId: 'anon' }
const listeners = new Set<() => void>()

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
        statsAdjust: parsed.statsAdjust,
        lastRollSeed: parsed.lastRollSeed,
        luckyOverride: parsed.luckyOverride,
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

export function subscribeConfig(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function refreshConfig(): ToyConfig {
  const next = loadConfig()
  for (const listener of listeners) listener()
  return next
}

export function saveConfig(patch: Partial<ToyConfig>): void {
  cache = { ...cache, ...patch }
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cache))
    } catch {}
  }
  for (const listener of listeners) listener()
}
