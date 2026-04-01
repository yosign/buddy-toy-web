'use client'
import { useEffect, useEffectEvent, useRef, useState, useSyncExternalStore } from 'react'
import { CompanionSprite } from '@/components/CompanionSprite'
import { TerminalWindow } from '@/components/TerminalWindow'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getCompanion, roll } from '@/lib/core/companion'
import { RARITY_STARS, STAT_NAMES } from '@/lib/core/types'
import type { Companion, StatName } from '@/lib/core/types'
import {
  getConfig,
  loadConfig,
  refreshConfig,
  saveConfig,
  subscribeConfig,
} from '@/lib/configStore'
import { generateSoulFromBones } from '@/lib/soul'
import { fireCompanionObserver } from '@/lib/observer'
import { parseBuddyLine } from '@/lib/buddyCommands'

type LogLine = {
  id: number
  kind: 'user' | 'system' | 'intro'
  text: string
}

const RARITY_COLOR: Record<string, string> = {
  common:    '#a1a1aa',
  uncommon:  '#4ade80',
  rare:      '#22d3ee',
  epic:      '#c084fc',
  legendary: '#facc15',
}

const RARITY_GUIDE_LINES = [
  '★      Common    60%  — base stats 5-45',
  '★★     Uncommon  25%  — base stats 15-55',
  '★★★    Rare      10%  — base stats 25-65',
  '★★★★   Epic       4%  — base stats 35-75',
  '★★★★★  Legendary  1%  — base stats 50-80+',
  '       Shiny     1%   — any rarity, glows ✨',
]

let lineId = 0
function nextId() { return ++lineId }

function renderStatBar(value: number): string {
  const filled = Math.round(value / 10)
  return '█'.repeat(filled) + '░'.repeat(10 - filled)
}

function companionInfoLines(companion: Companion, statsOverride?: Partial<Record<StatName, number>>): string[] {
  const stars = RARITY_STARS[companion.rarity]
  const stats = statsOverride
    ? { ...companion.stats, ...statsOverride }
    : companion.stats
  return [
    `${companion.name}  ${stars} ${companion.rarity}`,
    `species: ${companion.species}  shiny: ${companion.shiny}`,
    '─'.repeat(28),
    ...STAT_NAMES.map(name =>
      `${name.padEnd(10)} ${renderStatBar(stats[name])}  ${stats[name]}`
    ),
    '─'.repeat(28),
    `"${companion.personality}"`,
  ]
}


export default function Home() {
  const [log, setLog] = useState<LogLine[]>([])
  const [input, setInput] = useState('')
  const [reaction, setReaction] = useState<string | undefined>()
  const [petFlash, setPetFlash] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const logEndRef = useRef<HTMLDivElement>(null)
  const petFlashTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const cfg = useSyncExternalStore(subscribeConfig, getConfig, getConfig)

  const addLine = (kind: LogLine['kind'], text: string) => {
    setLog(prev => [...prev, { id: nextId(), kind, text }])
  }

  const addIntroLine = useEffectEvent((text: string) => {
    addLine('intro', text)
  })

  // Mount: load config
  useEffect(() => {
    const c = refreshConfig()
    const companion = getCompanion(c)
    if (companion && c.introShownForName !== companion.name) {
      addIntroLine(`${companion.name} is watching over you.`)
      saveConfig({ introShownForName: companion.name })
    }
  }, [])

  // Auto-scroll log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [log])

  // Auto-dismiss reaction
  useEffect(() => {
    if (!reaction) return
    const t = setTimeout(() => setReaction(undefined), 4000)
    return () => clearTimeout(t)
  }, [reaction])

  useEffect(() => {
    return () => {
      if (petFlashTimeoutRef.current) {
        clearTimeout(petFlashTimeoutRef.current)
      }
    }
  }, [])

  const companion: Companion | undefined = getCompanion(cfg)

  // --- Button handlers ---

  const handleHatch = () => {
    const currentCfg = loadConfig()
    const { bones, inspirationSeed } = roll(currentCfg.userId)
    const soul = generateSoulFromBones(bones, inspirationSeed)
    saveConfig({ companion: soul, statsAdjust: undefined })
    const newCfg = getConfig()
    const newCompanion = getCompanion(newCfg)!
    addLine('intro', `✨ A wild ${newCompanion.rarity} ${newCompanion.species} hatched!`)
    addLine('intro', `Meet ${newCompanion.name} — "${newCompanion.personality}"`)
    // Flash sprite
    setPetFlash(true)
    if (petFlashTimeoutRef.current) clearTimeout(petFlashTimeoutRef.current)
    petFlashTimeoutRef.current = setTimeout(() => {
      setPetFlash(false)
      petFlashTimeoutRef.current = undefined
    }, 600)
  }

  const handlePet = () => {
    const c = getCompanion(loadConfig())
    if (!c) return
    addLine('system', `${c.name} appreciated that. ♥`)
    setPetFlash(true)
    if (petFlashTimeoutRef.current) clearTimeout(petFlashTimeoutRef.current)
    petFlashTimeoutRef.current = setTimeout(() => {
      setPetFlash(false)
      petFlashTimeoutRef.current = undefined
    }, 600)
  }

  const handleMuteToggle = () => {
    const muted = !(cfg.companionMuted ?? false)
    saveConfig({ companionMuted: muted })
    addLine('system', muted ? 'Companion muted.' : 'Companion unmuted.')
  }

  const handleStatChange = (name: StatName, value: number) => {
    const current = cfg.statsAdjust ?? {}
    saveConfig({ statsAdjust: { ...current, [name]: value } })
  }

  const handleResetStats = () => {
    saveConfig({ statsAdjust: undefined })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const line = input.trim()
    if (!line) return
    setInput('')

    const cmd = parseBuddyLine(line)
    if (cmd) {
      switch (cmd.type) {
        case 'help':
          addLine('system', cmd.text)
          break

        case 'hatch_force':
        case 'buddy_default': {
          const currentCfg = loadConfig()
          if (currentCfg.companion) {
            const c = getCompanion(currentCfg)!
            addLine('system', `${RARITY_STARS[c.rarity]} ${c.name} (${c.rarity} ${c.species}) — hatched and ready.`)
          } else {
            handleHatch()
          }
          break
        }

        case 'stats': {
          const c = getCompanion(loadConfig())
          if (!c) {
            addLine('system', 'No companion yet. Type /buddy hatch to get one.')
          } else {
            addLine('system', `${c.name} [${c.rarity} ${c.species}]`)
            for (const stat of STAT_NAMES) {
              addLine('system', `  ${stat}: ${c.stats[stat]}`)
            }
          }
          break
        }

        case 'pet':
          handlePet()
          break

        case 'mute':
          saveConfig({ companionMuted: true })
          addLine('system', 'Companion muted.')
          break

        case 'unmute':
          saveConfig({ companionMuted: false })
          addLine('system', 'Companion unmuted.')
          break
      }
    } else {
      // Regular chat line
      addLine('user', line)
      const currentCfg = loadConfig()
      const c = getCompanion(currentCfg)
      fireCompanionObserver(
        [line],
        c,
        currentCfg.companionMuted ?? false,
        (r) => {
          if (r) setReaction(r)
        },
      )
    }
  }

  const displayStats = companion ? (cfg.statsAdjust ? { ...companion.stats, ...cfg.statsAdjust } : companion.stats) : undefined

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-start p-6 gap-6">
      <div className="max-w-2xl w-full mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">buddy-toy</h1>
          <p className="text-zinc-500 text-sm mt-1">your deterministic dev companion</p>
        </div>

        {/* Companion Card */}
        <div className="bg-zinc-900 rounded-xl p-6">
          {!companion ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <pre className="font-mono text-zinc-600 text-lg select-none leading-snug">{
`  .---------.
  |  [ ??? ]  |
  \`---------\``
              }</pre>
              <p className="text-zinc-500 text-sm italic">No companion yet. Type /buddy to hatch yours.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Sprite row */}
              <div className="flex flex-col items-start gap-2">
                {reaction && (
                  <div className="bg-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 italic max-w-[220px]">
                    {reaction}
                  </div>
                )}
                <div className={petFlash ? 'opacity-30 transition-opacity' : 'opacity-100 transition-opacity'}>
                  <CompanionSprite bones={companion} animated />
                </div>
              </div>

              {/* Info terminal */}
              <TerminalWindow
                title="companion info"
                lines={companionInfoLines(companion, cfg.statsAdjust)}
                color={RARITY_COLOR[companion.rarity] ?? '#a1a1aa'}
              />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 justify-center">
          {!companion ? (
            <Button
              onClick={handleHatch}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-base px-6 py-5"
            >
              🥚 Hatch Companion
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleHatch}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
              >
                🎲 Re-roll
              </Button>
              <Button
                variant="outline"
                onClick={handlePet}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
              >
                🐾 Pet
              </Button>
              <Button
                variant="outline"
                onClick={handleMuteToggle}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
              >
                {cfg.companionMuted ? '🔊 Unmute' : '🔇 Mute'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowStats(s => !s)}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
              >
                ⚙ Adjust Stats
              </Button>
            </>
          )}
        </div>

        {/* Stat Sliders Panel */}
        {showStats && companion && displayStats && (
          <div className="grid gap-3 p-4 bg-zinc-900 rounded-xl border border-zinc-800">
            <p className="text-xs text-zinc-500 font-mono uppercase tracking-wider">Adjust Stats</p>
            {STAT_NAMES.map(name => (
              <div key={name} className="flex items-center gap-3">
                <span className="text-xs font-mono text-zinc-400 w-24">{name}</span>
                <input
                  type="range"
                  min={1}
                  max={100}
                  value={displayStats[name]}
                  onChange={e => handleStatChange(name, Number(e.target.value))}
                  className="flex-1 accent-emerald-500"
                />
                <span className="text-xs font-mono text-zinc-300 w-8 text-right">{displayStats[name]}</span>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={handleResetStats} className="border-zinc-700 text-zinc-400 hover:bg-zinc-800 w-fit">
              Reset
            </Button>
          </div>
        )}

        {/* Rarity Guide */}
        <details className="group">
          <summary className="cursor-pointer text-zinc-500 text-sm font-mono select-none list-none flex items-center gap-1 hover:text-zinc-300 transition-colors">
            <span className="group-open:rotate-90 inline-block transition-transform">▸</span>
            Rarity Guide
          </summary>
          <div className="mt-2">
            <TerminalWindow
              title="rarity guide"
              lines={RARITY_GUIDE_LINES}
              color="#a1a1aa"
            />
          </div>
        </details>

        {/* Chat Log */}
        <div className="bg-zinc-900 rounded-xl p-4 font-mono text-sm space-y-1 max-h-48 overflow-y-auto">
          {log.length === 0 ? (
            <span className="text-zinc-600 italic">no messages yet</span>
          ) : (
            log.map(line => (
              <div
                key={line.id}
                className={
                  line.kind === 'user'
                    ? 'text-cyan-400'
                    : line.kind === 'intro'
                    ? 'text-zinc-500 italic'
                    : 'text-zinc-400 whitespace-pre-wrap'
                }
              >
                {line.kind === 'user' ? `> ${line.text}` : line.text}
              </div>
            ))
          )}
          <div ref={logEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex gap-2 w-full">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type /buddy to hatch, or just chat…"
            className="flex-1 bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 font-mono"
          />
          <Button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-mono"
          >
            Send
          </Button>
        </form>
      </div>
    </main>
  )
}
