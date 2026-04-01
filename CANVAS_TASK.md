# buddy-toy — Canvas Terminal Renderer

## Goal
Replace the current `<div>` sprite rendering with a Canvas-based terminal window.
The canvas should look like a real terminal: dark bg, monospace font, pixel-perfect character alignment.

## Component: components/TerminalCanvas.tsx

Create a new component that renders ASCII art on a `<canvas>` element.

```tsx
'use client'
import { useEffect, useRef } from 'react'

type Props = {
  lines: string[]        // array of text lines to render
  color?: string         // hex color for text, default '#4ade80' (green-400)
  glowColor?: string     // optional glow color (same as color but with alpha)
  bgColor?: string       // background color, default '#09090b' (zinc-950)
  fontSize?: number      // px, default 14
  padding?: number       // px padding inside canvas, default 16
}

export function TerminalCanvas({
  lines,
  color = '#4ade80',
  glowColor,
  bgColor = '#09090b',
  fontSize = 14,
  padding = 16,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Use a guaranteed monospace font
    const font = `${fontSize}px "Courier New", Courier, monospace`
    ctx.font = font

    // Measure character width using 'M' (standard monospace measure)
    const charWidth = ctx.measureText('M').width
    const lineHeight = fontSize * 1.4

    // Find max line length
    const maxLen = Math.max(...lines.map(l => l.length))

    // Canvas size
    const width = Math.ceil(maxLen * charWidth) + padding * 2
    const height = Math.ceil(lines.length * lineHeight) + padding * 2

    // Set canvas dimensions (physical pixels for crisp rendering)
    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.scale(dpr, dpr)

    // Background
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, width, height)

    // Optional scanline effect (subtle)
    for (let y = 0; y < height; y += 4) {
      ctx.fillStyle = 'rgba(0,0,0,0.08)'
      ctx.fillRect(0, y, width, 1)
    }

    // Text
    ctx.font = font
    ctx.textBaseline = 'top'
    ctx.fillStyle = color

    // Optional glow
    if (glowColor) {
      ctx.shadowColor = glowColor
      ctx.shadowBlur = 6
    }

    lines.forEach((line, i) => {
      ctx.fillText(line, padding, padding + i * lineHeight)
    })

    // Reset shadow
    ctx.shadowBlur = 0
  }, [lines, color, glowColor, bgColor, fontSize, padding])

  return (
    <canvas
      ref={canvasRef}
      className="rounded-lg"
      style={{ imageRendering: 'pixelated' }}
    />
  )
}
```

## Component: components/TerminalWindow.tsx

A full terminal window with title bar + canvas content area:

```tsx
'use client'
import { TerminalCanvas } from './TerminalCanvas'

type Props = {
  title?: string
  lines: string[]
  color?: string
  glowColor?: string
  animated?: boolean
}

export function TerminalWindow({ title = 'buddy-toy', lines, color, glowColor }: Props) {
  return (
    <div className="rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/50">
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border-b border-zinc-800">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/70" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
          <div className="w-3 h-3 rounded-full bg-green-500/70" />
        </div>
        <span className="text-xs text-zinc-500 font-mono mx-auto">{title}</span>
      </div>
      {/* Canvas area */}
      <div className="p-4 bg-zinc-950">
        <TerminalCanvas lines={lines} color={color} glowColor={glowColor} />
      </div>
    </div>
  )
}
```

## Update components/CompanionSprite.tsx

Replace current implementation to use TerminalWindow:

```tsx
'use client'
import { useEffect, useState } from 'react'
import type { CompanionBones } from '@/lib/core/types'
import { renderSprite, spriteFrameCount } from '@/lib/core/sprites'
import { TerminalWindow } from './TerminalWindow'

const RARITY_COLOR: Record<string, string> = {
  common:    '#a1a1aa',  // zinc-400
  uncommon:  '#4ade80',  // green-400
  rare:      '#22d3ee',  // cyan-400
  epic:      '#c084fc',  // purple-400
  legendary: '#facc15',  // yellow-400
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
```

## Also update app/page.tsx companion area

In the companion card section, wrap the stats/info in a matching terminal-style card too.

Add a second `TerminalWindow` below the sprite showing companion info lines:
```
[name]  ★★★ rare
species: rabbit  shiny: false
---
DEBUGGING  ████████░░  82
PATIENCE   ████░░░░░░  41  
CHAOS      ██████░░░░  63
WISDOM     ███████░░░  71
SNARK      ██████████  95
---
"Chaos gremlin with a heart of gold"
```

Generate these lines in page.tsx and pass to a `<TerminalWindow>` component.
Use block characters for the stat bars: `█` for filled, `░` for empty, 10 chars wide.

```typescript
function renderStatBar(value: number): string {
  const filled = Math.round(value / 10)
  return '█'.repeat(filled) + '░'.repeat(10 - filled)
}

function companionInfoLines(companion: Companion): string[] {
  const stars = RARITY_STARS[companion.rarity]
  return [
    `${companion.name}  ${stars} ${companion.rarity}`,
    `species: ${companion.species}  shiny: ${companion.shiny}`,
    '─'.repeat(28),
    ...STAT_NAMES.map(name =>
      `${name.padEnd(10)} ${renderStatBar(companion.stats[name])}  ${companion.stats[name]}`
    ),
    '─'.repeat(28),
    `"${companion.personality}"`,
  ]
}
```

## After implementation

```bash
cd "C:\Users\Lenovo\Dropbox\Github\buddy-toy\web"
npm run build 2>&1
git add -A
git commit -m "feat: canvas terminal renderer for sprite + info panel"
git push
npx vercel --prod --yes
openclaw system event --text "Done: buddy-toy canvas terminal renderer deployed" --mode now
```
