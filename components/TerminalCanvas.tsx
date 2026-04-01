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
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const font = `${fontSize}px "Courier New", Courier, monospace`
    ctx.font = font

    const charWidth = ctx.measureText('M').width
    const lineHeight = fontSize * 1.4

    const maxLen = Math.max(...lines.map(l => l.length), 1)

    const width = Math.ceil(maxLen * charWidth) + padding * 2
    const height = Math.ceil(lines.length * lineHeight) + padding * 2

    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.scale(dpr, dpr)

    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, width, height)

    for (let y = 0; y < height; y += 4) {
      ctx.fillStyle = 'rgba(0,0,0,0.08)'
      ctx.fillRect(0, y, width, 1)
    }

    ctx.font = font
    ctx.textBaseline = 'top'
    ctx.fillStyle = color

    if (glowColor) {
      ctx.shadowColor = glowColor
      ctx.shadowBlur = 6
    }

    lines.forEach((line, i) => {
      ctx.fillText(line, padding, padding + i * lineHeight)
    })

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
