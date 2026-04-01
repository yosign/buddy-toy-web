'use client'
import { useEffect, useRef } from 'react'

const RAINBOW = ['#ff4444', '#ff9900', '#ffee00', '#44ff88', '#44aaff', '#cc44ff']

function rainbowColor(charIndex: number, offset: number): string {
  const i = Math.floor((charIndex + offset) % RAINBOW.length)
  return RAINBOW[(i + RAINBOW.length) % RAINBOW.length]!
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
        // Rainbow mode: per-char color, offset shifts each frame = marching effect
        const offset = frameRef.current
        // subtle glow for shiny
        ctx.shadowBlur = 6

        let globalCol = 0
        lines.forEach((line, row) => {
          const y = padding + row * lineH
          for (let col = 0; col < line.length; col++) {
            const ch = line[col]
            if (ch && ch !== ' ') {
              const c = rainbowColor(globalCol, offset)
              ctx.fillStyle = c
              ctx.shadowColor = c
              ctx.fillText(ch, padding + col * cellW, y)
            }
            globalCol++
          }
          globalCol++ // newline gap
        })
        ctx.shadowBlur = 0
      }
    }

    const startTime = performance.now()
    const SPEED = 0.4 // full rainbow cycle per second (lower = slower)

    function tick() {
      if (cancelled) return
      if (rainbow) {
        const elapsed = (performance.now() - startTime) / 1000 // seconds
        frameRef.current = (elapsed * SPEED * RAINBOW.length) % RAINBOW.length
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
