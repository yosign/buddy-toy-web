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
      // Try Geist Mono first (self-hosted via next/font), fall back to Roboto Mono
      const fontCandidates = [
        `${fontSize}px "Geist Mono"`,
        `${fontSize}px "__GeistMono_Fallback"`,
        `${fontSize}px "Roboto Mono"`,
      ]
      let loadedFont = fontCandidates[fontCandidates.length - 1]!
      for (const f of fontCandidates) {
        try {
          await document.fonts.load(f)
          if (document.fonts.check(f)) { loadedFont = f; break }
        } catch {}
      }
      if (cancelled) return

      const font = `${loadedFont}, "Courier New", monospace`
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

      // Background (skip if transparent)
      if (bgColor !== 'transparent') {
        ctx.fillStyle = bgColor
        ctx.fillRect(0, 0, width, height)
        // Scanlines only on opaque bg
        for (let y = 0; y < height; y += 3) {
          ctx.fillStyle = 'rgba(0,0,0,0.06)'
          ctx.fillRect(0, y, width, 1)
        }
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
