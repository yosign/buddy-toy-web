# buddy-toy — Canvas Fix + UI Buttons

## Part 1: Fix Canvas Alignment

### Root cause
`ctx.measureText('M').width` only measures one char. On mobile, the actual fallback font used may differ from desktop, causing wrong charWidth → misaligned columns.

### Fix: components/TerminalCanvas.tsx

Rewrite the rendering loop to draw each character individually at explicit x positions:

```typescript
// After setting up canvas size and clearing bg:

// Measure ONE reference char to get cell width
ctx.font = font
const cellW = ctx.measureText('M').width  // all chars treated as this width
const lineH = fontSize * 1.5

// Draw char by char
lines.forEach((line, row) => {
  const y = padding + row * lineH
  for (let col = 0; col < line.length; col++) {
    const ch = line[col]
    if (ch && ch !== ' ') {
      const x = padding + col * cellW
      ctx.fillText(ch, x, y)
    }
  }
})
```

Also load `Roboto Mono` from Google Fonts and wait for it before drawing:

```typescript
// In useEffect, before drawing:
await document.fonts.load(`${fontSize}px "Roboto Mono"`)
const font = `${fontSize}px "Roboto Mono", monospace`
```

Add to app/layout.tsx `<head>`:
```html
<link href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500&display=swap" rel="stylesheet" />
```

Full rewrite of `components/TerminalCanvas.tsx`:

```tsx
'use client'
import { useEffect, useRef } from 'react'

type Props = {
  lines: string[]
  color?: string
  glowColor?: string
  bgColor?: string
  fontSize?: number
  padding?: number
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
    let cancelled = false

    async function draw() {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Wait for font to load (critical for mobile)
      const fontStr = `${fontSize}px "Roboto Mono"`
      try {
        await document.fonts.load(fontStr)
      } catch {}
      if (cancelled) return

      const font = `${fontStr}, "Courier New", monospace`
      ctx.font = font

      // Measure cell width using a known wide char
      const cellW = ctx.measureText('W').width
      const lineH = Math.ceil(fontSize * 1.5)

      const cols = Math.max(...lines.map(l => l.length), 1)
      const rows = lines.length

      const contentW = Math.ceil(cols * cellW)
      const contentH = rows * lineH
      const width = contentW + padding * 2
      const height = contentH + padding * 2

      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.ceil(width * dpr)
      canvas.height = Math.ceil(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.scale(dpr, dpr)

      // Background
      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, width, height)

      // Scanlines
      for (let y = 0; y < height; y += 3) {
        ctx.fillStyle = 'rgba(0,0,0,0.06)'
        ctx.fillRect(0, y, width, 1)
      }

      // Text setup
      ctx.font = font
      ctx.textBaseline = 'top'
      ctx.fillStyle = color

      if (glowColor) {
        ctx.shadowColor = glowColor
        ctx.shadowBlur = 8
      }

      // Draw char by char at explicit x positions
      lines.forEach((line, row) => {
        const y = padding + row * lineH
        for (let col = 0; col < line.length; col++) {
          const ch = line[col]
          if (ch && ch !== ' ') {
            ctx.fillText(ch, padding + col * cellW, y)
          }
        }
      })

      ctx.shadowBlur = 0
    }

    draw()
    return () => { cancelled = true }
  }, [lines, color, glowColor, bgColor, fontSize, padding])

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block' }}
    />
  )
}
```

---

## Part 2: Interactive Buttons

Update `app/page.tsx` to add action buttons below the companion area.

### Button layout (below the two terminal windows)

```
[ 🥚 Hatch ]   [ 🎲 Re-roll ]   [ 🔇 Mute ]
```

And a collapsible "Rarity Guide" section.

### Buttons spec

**1. Hatch / Re-hatch button**
- If no companion: show `🥚 Hatch Companion` — large emerald button, prominent
- If companion exists: show `🎲 Re-roll` — smaller zinc outline button
- On click: run hatch logic (same as `/buddy hatch` command)
- Show a brief flash animation on the sprite after hatching

**2. Pet button**
- `🐾 Pet` — zinc outline button
- On click: set petAt, show a reaction quip for 3 seconds
- Only show when companion exists

**3. Mute / Unmute toggle**
- `🔇 Mute` / `🔊 Unmute` — zinc outline button
- Toggle companionMuted in config

**4. Stats adjust (fun/debug)**
- Small `⚙ Adjust Stats` button → opens an inline panel (no modal needed)
- Shows 5 sliders (one per stat) — range 1-100
- On change: update companion stats in config (saveConfig with modified companion)
- "Reset" button to restore original rolled stats

**5. Rarity Guide** (collapsible `<details>` element)
```
▸ Rarity Guide

★      Common    60% — base stats 5-45
★★     Uncommon  25% — base stats 15-55, no hat restriction
★★★    Rare      10% — base stats 25-65
★★★★   Epic       4% — base stats 35-75
★★★★★  Legendary  1% — base stats 50-80+
       Shiny     1%  — any rarity, glows ✨
```
Render this as a `<TerminalWindow>` with those lines inside a `<details><summary>` toggle.

### Button styling
- Use shadcn `Button` component
- Primary action (Hatch): `bg-emerald-600 hover:bg-emerald-500 text-white`
- Secondary actions: `variant="outline"` with zinc colors
- Layout: `flex flex-wrap gap-3 justify-center mt-4`

### Stat sliders panel
When open, show below buttons:
```tsx
<div className="grid gap-3 mt-4 p-4 bg-zinc-900 rounded-xl border border-zinc-800">
  <p className="text-xs text-zinc-500 font-mono uppercase tracking-wider">Adjust Stats</p>
  {STAT_NAMES.map(name => (
    <div key={name} className="flex items-center gap-3">
      <span className="text-xs font-mono text-zinc-400 w-24">{name}</span>
      <input type="range" min={1} max={100} value={companion.stats[name]}
        onChange={...}
        className="flex-1 accent-emerald-500" />
      <span className="text-xs font-mono text-zinc-300 w-8 text-right">{companion.stats[name]}</span>
    </div>
  ))}
  <Button variant="outline" size="sm" onClick={resetStats}>Reset</Button>
</div>
```

---

## After implementation

```bash
cd "C:\Users\Lenovo\Dropbox\Github\buddy-toy\web"
npm run build 2>&1
git add -A
git commit -m "fix: char-by-char canvas rendering + Roboto Mono font + interactive buttons"
git push
npx vercel --prod --yes
openclaw system event --text "Done: buddy-toy canvas fix + buttons deployed" --mode now
```
