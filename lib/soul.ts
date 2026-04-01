import { mulberry32, pick } from './core/companion'
import type { CompanionBones } from './core/types'

const FIRST = [
  'Tiny',
  'Sir',
  'Pixel',
  'Bug',
  'Neo',
  'Bit',
  'Echo',
  'Glim',
  'Zip',
  'Flo',
] as const
const LAST = [
  'bean',
  'puff',
  'bits',
  'noodle',
  'muffin',
  'squish',
  'spark',
  'wobble',
  'fuzz',
  'loop',
] as const

const PERSONALITIES = [
  'Chaotic good debugger. Speaks in short bursts.',
  'Quietly judges your semicolons. Secretly proud when you ship.',
  'Hypes you up on green builds, side-eyes flaky tests.',
  'Collects stack traces like postcards. Still believes in you.',
  'Snack-motivated. Will trade quips for coffee.',
  'Thinks in diffs. Feels in binary.',
  'Soft shell, sharp logs. Wants fewer `any`.',
  'Chaos gremlin with a heart of gold and a lint rule.',
] as const

/** Procedural "soul" — Claude Code uses the model; toy uses deterministic RNG. */
export function generateSoulFromBones(
  bones: CompanionBones,
  inspirationSeed: number,
): { name: string; personality: string; hatchedAt: number } {
  const rng = mulberry32(inspirationSeed ^ bones.stats.DEBUGGING)
  const name = `${pick(rng, FIRST)} ${pick(rng, LAST)}`
  const personality = pick(rng, PERSONALITIES)
  return { name, personality, hatchedAt: Date.now() }
}
