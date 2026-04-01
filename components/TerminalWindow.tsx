'use client'
import { TerminalCanvas } from './TerminalCanvas'

type Props = {
  title?: string
  lines: string[]
  color?: string
  glowColor?: string
  className?: string
  variant?: 'light' | 'dark'
}

export function TerminalWindow({ title = 'buddy-toy', lines, color, glowColor, className = '', variant = 'light' }: Props) {
  const isDark = variant === 'dark'

  const wrapperCls = isDark
    ? `rounded-xl border border-zinc-700 bg-zinc-950 shadow-md shadow-black/40 ${className}`
    : `rounded-xl border border-zinc-200 bg-white shadow-md shadow-zinc-100 ${className}`

  const titleBarCls = isDark
    ? 'flex items-center gap-2 px-4 py-2 bg-zinc-900 border-b border-zinc-700 rounded-t-xl'
    : 'flex items-center gap-2 px-4 py-2 bg-zinc-50 border-b border-zinc-200 rounded-t-xl'

  const titleTextCls = isDark ? 'text-xs text-zinc-500 font-mono mx-auto' : 'text-xs text-zinc-400 font-mono mx-auto'

  const contentBg = isDark ? '#09090b' : '#ffffff'
  const defaultColor = isDark ? '#a1a1aa' : '#3d4451'

  return (
    <div className={wrapperCls}>
      {/* Title bar */}
      <div className={titleBarCls}>
        <div className="flex gap-1.5 shrink-0">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <span className={titleTextCls}>{title}</span>
      </div>
      {/* Canvas area — no scroll, fits content */}
      <div className={`p-4 rounded-b-xl`} style={{ backgroundColor: contentBg }}>
        <TerminalCanvas lines={lines} color={color ?? defaultColor} glowColor={glowColor} bgColor={contentBg} />
      </div>
    </div>
  )
}
