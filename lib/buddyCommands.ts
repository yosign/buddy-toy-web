export type BuddyCommandResult =
  | { type: 'buddy_default' }
  | { type: 'hatch_force' }
  | { type: 'pet' }
  | { type: 'mute' }
  | { type: 'unmute' }
  | { type: 'help'; text: string }
  | { type: 'stats' }

const HELP = `buddy-toy — /buddy commands
  /buddy           status, or hatch if you have none
  /buddy hatch     hatch (only if none yet)
  /buddy pet       pet the companion (hearts)
  /buddy mute | unmute
  /buddy stats     rarity + stats
  /help            this help`

export function parseBuddyLine(line: string): BuddyCommandResult | null {
  const t = line.trim()
  if (t === '/help' || t === 'help') {
    return { type: 'help', text: HELP }
  }
  if (!t.startsWith('/buddy')) return null
  const rest = t.slice('/buddy'.length).trim().toLowerCase()
  if (rest === '' || rest === 'status') return { type: 'buddy_default' }
  if (rest === 'hatch' || rest === 'spawn') return { type: 'hatch_force' }
  if (rest === 'pet') return { type: 'pet' }
  if (rest === 'mute') return { type: 'mute' }
  if (rest === 'unmute') return { type: 'unmute' }
  if (rest === 'stats' || rest === 'stat') return { type: 'stats' }
  if (rest === 'help') return { type: 'help', text: HELP }
  return { type: 'help', text: HELP }
}
