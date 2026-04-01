import { hashString, mulberry32, pick } from './core/companion'
import type { Companion } from './core/types'

const QUIPS = [
  '…did you mean to commit that?',
  'proud of this line. nervous about the next.',
  'the tests are watching. so am I.',
  'tab tab enter. living dangerously.',
  'squash later, panic now?',
  'green. nice. don\'t jinx it.',
  'that\'s a lot of console.log energy.',
  'ship it? ship it. maybe.',
  'refactor? refactor. tomorrow.',
  'I would have used a tuple. but ok.',
] as const

/**
 * Mirrors REPL's post-query `fireCompanionObserver`: pick a short reaction
 * from recent transcript. No LLM — deterministic toy version.
 */
export function fireCompanionObserver(
  transcriptTail: string[],
  companion: Companion | undefined,
  muted: boolean,
  onReaction: (reaction: string | undefined) => void,
): void {
  if (!companion || muted) {
    onReaction(undefined)
    return
  }
  const tail = transcriptTail.slice(-6).join('\n')
  const seed = hashString(`${tail}:${companion.name}:${companion.species}`)
  const rng = mulberry32(seed)
  // ~40% of "turns" the companion stays quiet (like sparse model output)
  if (rng() > 0.4) {
    onReaction(undefined)
    return
  }
  onReaction(pick(rng, QUIPS))
}
