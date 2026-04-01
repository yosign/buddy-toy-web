'use client'
import { useEffect, useRef } from 'react'

const RAINBOW_STOPS = ['#ff4444', '#ff9900', '#ffee00', '#44ff88', '#44aaff', '#cc44ff']

// Get rainbow color for a character position + time offset
function rainbowAt(pos: number, offset: number): string {
  const t = ((pos + offset) % 1 + 1) % 1
  const scaled = t * RAINBOW_STOPS.length
  const i = Math.floor(scaled)
  const frac = scaled - i
  const a = RAINBOW_STOPS[i % RAINBOW_STOPS.length]!
  const b = RAINBOW_STOPS[(i + 1) % RAINBOW_STOPS.length]!
  // linear interpolate between two rainbow stops
  const ar = parseInt(a.slice(1, 3), 16), ag = parseInt(a.slice(3, 5), 16), ab = parseInt(a.slice(5, 7), 16)
  const br = parseInt(b.slice(1, 3), 16), bg = parseInt(b.slice(3, 5), 16), bb = parseInt(b.slice(5, 7), 16)
  return `rgb(${Math.round(ar + (br - ar) * frac)},${Math.round(ag + (bg - ag) * frac)},${Math.round(ab + (bb - ab) * frac)})`
}

// Blend a hex/rgb color string with white at given alpha (0-1)
function blendWhite(base: string, alpha: number): string {
  // parse rgb(...) or #hex
  let r = 160, g = 160, b = 160
  const hexM = base.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i)
  const rgbM = base.match(/^rgb\((\d+),(\d+),(\d+)\)$/)
  if (hexM) { r = parseInt(hexM[1]!, 16); g = parseInt(hexM[2]!, 16); b = parseInt(hexM[3]!, 16) }
  else if (rgbM) { r = +rgbM[1]!; g = +rgbM[2]!; b = +rgbM[3]! }
  return `rgb(${Math.round(r + (255 - r) * alpha)},${Math.round(g + (255 - g) * alpha)},${Math.round(b + (255 - b) * alpha)})`
}

// Given char position (0..1 normalized across all chars) and wave offset (0..1),
// return alpha of white overlay — a smooth pulse wave
function shimmerAlpha(pos: number, offset: number): number {
  // wave travels left to right, wraps around
  const dist = ((pos - offset) % 1 + 1) % 1  // 0..1
  // gaussian-ish peak at dist=0, falloff
  const width = 0.18
  return Math.max(0, 1 - (dist / width) ** 2) * 0.55
}

type Props = {
  lines: string[]
  color?: string
  glowColor?: string
  bgColor?: string
  fontSize?: number
  padding?: number
  rainbow?: boolean  // shiny mode: per-char rainbow cycling
}

export function TerminalCanvas({
  lines,
  color = '#4ade80',
  glowColor,
  bgColor = '#09090b',
  fontSize = 14,
  padding = 16,
  rainbow = false,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef<number>(0)
  const rafRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    let fontReady = false
    let loadedFont = `${fontSize}px "Courier New", monospace`

    async function loadFont() {
      const candidates = [
        `${fontSize}px "Geist Mono"`,
        `${fontSize}px "__GeistMono_Fallback"`,
        `${fontSize}px "Roboto Mono"`,
      ]
      for (const f of candidates) {
        try {
          await document.fonts.load(f)
          if (document.fonts.check(f)) { loadedFont = `${f}, "Courier New", monospace`; break }
        } catch {}
      }
      fontReady = true
    }

    function drawFrame() {
      if (cancelled || !fontReady) return
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const font = loadedFont
      ctx.font = font
      const cellW = ctx.measureText('W').width
      const lineH = Math.ceil(fontSize * 1.5)
      const cols = Math.max(...lines.map(l => l.length), 1)
      const rows = lines.length
      const width = Math.ceil(cols * cellW) + padding * 2
      const height = rows * lineH + padding * 2
      const dpr = window.devicePixelRatio || 1

      // Only resize if needed
      if (canvas.width !== Math.ceil(width * dpr) || canvas.height !== Math.ceil(height * dpr)) {
        canvas.width = Math.ceil(width * dpr)
        canvas.height = Math.ceil(height * dpr)
        canvas.style.width = `${width}px`
        canvas.style.height = `${height}px`
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      // Background
      if (bgColor !== 'transparent') {
        ctx.fillStyle = bgColor
        ctx.fillRect(0, 0, width, height)
        for (let y = 0; y < height; y += 3) {
          ctx.fillStyle = 'rgba(0,0,0,0.06)'
          ctx.fillRect(0, y, width, 1)
        }
      } else {
        ctx.clearRect(0, 0, width, height)
      }

      ctx.font = font
      ctx.textBaseline = 'top'

      if (!rainbow) {
        // Normal mode: single color
        ctx.fillStyle = color
        if (glowColor) { ctx.shadowColor = glowColor; ctx.shadowBlur = 8 }
        lines.forEach((line, row) => {
          const y = padding + row * lineH
          for (let col = 0; col < line.length; col++) {
            const ch = line[col]
            if (ch && ch !== ' ') ctx.fillText(ch, padding + col * cellW, y)
          }
        })
        ctx.shadowBlur = 0
      } else {
        // Shimmer mode: fixed rarity color + white highlight wave sweeping left→right
        const offset = frameRef.current  // 0..1, advances each frame

        // Count total non-space chars for position normalization
        const allChars: { ch: string; row: number; col: number; idx: number }[] = []
        lines.forEach((line, row) => {
          for (let col = 0; col < line.length; col++) {
            const ch = line[col]
            if (ch && ch !== ' ') allChars.push({ ch, row, col, idx: allChars.length })
          }
        })
        const total = Math.max(allChars.length, 1)

        allChars.forEach(({ ch, row, col, idx }) => {
          const pos = idx / total
          // Base: rainbow color per char position (slow drift)
          const base = rainbowAt(pos, offset * 0.3)
          // Overlay: white shimmer wave
          const shimmer = shimmerAlpha(pos, offset)
          const final = shimmer > 0.01 ? blendWhite(base, shimmer * 0.6) : base
          ctx.fillStyle = final
          ctx.fillText(ch, padding + col * cellW, padding + row * lineH)
        })
      }
    }

    const startTime = performance.now()
    const SPEED = 0.33 // shimmer wave cycles per second (1/3 = ~3s per sweep)

    function tick() {
      if (cancelled) return
      if (rainbow) {
        const elapsed = (performance.now() - startTime) / 1000 // seconds
        frameRef.current = (elapsed * SPEED) % 1  // 0..1 wave position
      }
      drawFrame()
      if (rainbow) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    loadFont().then(() => {
      if (!cancelled) tick()
    })

    return () => {
      cancelled = true
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [lines, color, glowColor, bgColor, fontSize, padding, rainbow])

  return <canvas ref={canvasRef} style={{ display: 'block' }} />
}
