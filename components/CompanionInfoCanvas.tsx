'use client'
import type { Companion, StatName } from '@/lib/core/types'
import { RARITY_STARS, STAT_NAMES } from '@/lib/core/types'
import { TerminalCanvas } from './TerminalCanvas'

const RARITY_COLOR: Record<string, string> = {
  common:    '#a1a1aa',
  uncommon:  '#4ade80',
  rare:      '#22d3ee',
  epic:      '#c084fc',
  legendary: '#facc15',
}

function renderStatBar(value: number): string {
  const filled = Math.round(value / 10)
  return '█'.repeat(filled) + '░'.repeat(10 - filled)
}

export function CompanionInfoCanvas({
  companion,
  statsAdjust,
}: {
  companion: Companion
  statsAdjust?: Partial<Record<StatName, number>>
}) {
  const stats = statsAdjust ? { ...companion.stats, ...statsAdjust } : companion.stats
  const color = RARITY_COLOR[companion.rarity] ?? '#a1a1aa'

  const lines = [
    `${companion.name}`,
    `${RARITY_STARS[companion.rarity]} ${companion.rarity}${companion.shiny ? '  ✨ shiny' : ''}`,
    `species: ${companion.species}`,
    `─`.repeat(26),
    ...STAT_NAMES.map(name =>
      `${name.padEnd(10)} ${renderStatBar(stats[name]!)}  ${String(stats[name]).padStart(3)}`
    ),
    `─`.repeat(26),
    `"${companion.personality}"`,
  ]

  return (
    <TerminalCanvas
      lines={lines}
      color={color}
      glowColor={companion.shiny ? color : undefined}
      bgColor="transparent"
      padding={4}
      rainbow={companion.shiny}
    />
  )
}
