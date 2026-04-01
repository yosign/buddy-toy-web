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
    <div className={`rounded-xl border border-zinc-200 bg-white shadow-md shadow-zinc-100 ${className}`}>
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-2 bg-zinc-50 border-b border-zinc-200 rounded-t-xl">
        <div className="flex gap-1.5 shrink-0">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <span className="text-xs text-zinc-400 font-mono mx-auto">{title}</span>
      </div>
      {/* Canvas area — no scroll, fits content */}
      <div className="p-4 bg-white rounded-b-xl">
        <TerminalCanvas lines={lines} color={color ?? '#3d4451'} glowColor={glowColor} bgColor="#ffffff" />
      </div>
    </div>
  )
}
