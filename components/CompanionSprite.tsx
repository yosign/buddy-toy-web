'use client'
import { useEffect, useState } from 'react'
import type { CompanionBones } from '@/lib/core/types'
import { renderSprite, spriteFrameCount } from '@/lib/core/sprites'

const RARITY_CSS: Record<string, string> = {
  common: 'text-zinc-400',
  uncommon: 'text-green-400',
  rare: 'text-cyan-400',
  epic: 'text-purple-400',
  legendary: 'text-yellow-400',
}

export function CompanionSprite({ bones, animated = true }: { bones: CompanionBones; animated?: boolean }) {
  const [frame, setFrame] = useState(0)
  const frameCount = spriteFrameCount(bones.species)

  useEffect(() => {
    if (!animated || frameCount <= 1) return
    const id = setInterval(() => setFrame(f => (f + 1) % frameCount), 800)
    return () => clearInterval(id)
  }, [animated, frameCount])

  const lines = renderSprite(bones, frame)
  const colorClass = RARITY_CSS[bones.rarity] ?? 'text-zinc-400'

  return (
    <pre
      className={`select-none ${colorClass} ${bones.shiny ? 'drop-shadow-[0_0_8px_currentColor]' : ''}`}
      style={{
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: '14px',
        lineHeight: '1.2',
        letterSpacing: '0',
        whiteSpace: 'pre',
        fontVariantNumeric: 'tabular-nums',
        fontFeatureSettings: '"kern" 0',
      }}
    >
      {lines.join('\n')}
    </pre>
  )
}
