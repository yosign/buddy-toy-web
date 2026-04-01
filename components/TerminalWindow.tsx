'use client'
import { TerminalCanvas } from './TerminalCanvas'

type Props = {
  title?: string
  lines: string[]
  color?: string
  glowColor?: string
  className?: string
}

export function TerminalWindow({ title = 'buddy-toy', lines, color, glowColor, className = '' }: Props) {
  return (
    <div className={`rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/50 ${className}`}>
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border-b border-zinc-800 rounded-t-xl">
        <div className="flex gap-1.5 shrink-0">
          <div className="w-3 h-3 rounded-full bg-red-500/70" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
          <div className="w-3 h-3 rounded-full bg-green-500/70" />
        </div>
        <span className="text-xs text-zinc-500 font-mono mx-auto">{title}</span>
      </div>
      {/* Canvas area — no scroll, fits content */}
      <div className="p-4 bg-zinc-950 rounded-b-xl">
        <TerminalCanvas lines={lines} color={color} glowColor={glowColor} />
      </div>
    </div>
  )
}
