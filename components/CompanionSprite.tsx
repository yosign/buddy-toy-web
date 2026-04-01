'use client'
import { useEffect, useState } from 'react'
import type { CompanionBones } from '@/lib/core/types'
import { renderSprite, spriteFrameCount } from '@/lib/core/sprites'
import { TerminalWindow } from './TerminalWindow'

const RARITY_COLOR: Record<string, string> = {
  common:    '#a1a1aa',
  uncommon:  '#4ade80',
  rare:      '#22d3ee',
  epic:      '#c084fc',
  legendary: '#facc15',
}

export function CompanionSprite({
  bones,
  animated = true,
  title,
}: {
  bones: CompanionBones
  animated?: boolean
  title?: string
}) {
  const [frame, setFrame] = useState(0)
  const frameCount = spriteFrameCount(bones.species)

  useEffect(() => {
    if (!animated || frameCount <= 1) return
    const id = setInterval(() => setFrame(f => (f + 1) % frameCount), 800)
    return () => clearInterval(id)
  }, [animated, frameCount])

  const lines = renderSprite(bones, frame)
  const color = RARITY_COLOR[bones.rarity] ?? '#a1a1aa'
  const glowColor = bones.shiny ? color : undefined
  const windowTitle = title ?? `${bones.species} — ${bones.rarity}`

  return (
    <TerminalWindow
      title={windowTitle}
      lines={lines}
      color={color}
      glowColor={glowColor}
    />
  )
}
