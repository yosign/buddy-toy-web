'use client'
import { useEffect, useRef, useState } from 'react'
import { CompanionSprite } from '@/components/CompanionSprite'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getCompanion, roll } from '@/lib/core/companion'
import { RARITY_STARS, STAT_NAMES } from '@/lib/core/types'
import type { Companion } from '@/lib/core/types'
import { loadConfig, saveConfig, type ToyConfig } from '@/lib/configStore'
import { generateSoulFromBones } from '@/lib/soul'
import { fireCompanionObserver } from '@/lib/observer'
import { parseBuddyLine } from '@/lib/buddyCommands'

type LogLine = {
  id: number
  kind: 'user' | 'system' | 'intro'
  text: string
}

const RARITY_TEXT_CSS: Record<string, string> = {
  common: 'text-zinc-400',
  uncommon: 'text-green-400',
  rare: 'text-cyan-400',
  epic: 'text-purple-400',
  legendary: 'text-yellow-400',
}

const RARITY_BADGE_CSS: Record<string, string> = {
  common: 'bg-zinc-700 text-zinc-300',
  uncommon: 'bg-green-900 text-green-300',
  rare: 'bg-cyan-900 text-cyan-300',
  epic: 'bg-purple-900 text-purple-300',
  legendary: 'bg-yellow-900 text-yellow-300',
}

let lineId = 0
function nextId() { return ++lineId }

function statBarColor(val: number): string {
  if (val > 70) return 'bg-emerald-500'
  if (val >= 40) return 'bg-amber-500'
  return 'bg-zinc-600'
}

export default function Home() {
  const [log, setLog] = useState<LogLine[]>([])
  const [input, setInput] = useState('')
  const [cfg, setCfg] = useState<ToyConfig>({ userId: 'anon' })
  const [reaction, setReaction] = useState<string | undefined>()
  const [petFlash, setPetFlash] = useState(false)
  const logEndRef = useRef<HTMLDivElement>(null)

  const addLine = (kind: LogLine['kind'], text: string) => {
    setLog(prev => [...prev, { id: nextId(), kind, text }])
  }

  const reloadCfg = () => {
    const c = loadConfig()
    setCfg({ ...c })
    return c
  }

  // Mount: load config
  useEffect(() => {
    const c = reloadCfg()
    const companion = getCompanion(c)
    if (companion && c.introShownForName !== companion.name) {
      addLine('intro', `${companion.name} is watching over you.`)
      saveConfig({ introShownForName: companion.name })
      setCfg({ ...loadConfig() })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const companion: Companion | undefined = getCompanion(cfg)

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
            // Hatch
            const { bones, inspirationSeed } = roll(currentCfg.userId)
            const soul = generateSoulFromBones(bones, inspirationSeed)
            saveConfig({ companion: soul })
            const newCfg = reloadCfg()
            const newCompanion = getCompanion(newCfg)!
            addLine('intro', `✨ A wild ${newCompanion.rarity} ${newCompanion.species} hatched!`)
            addLine('intro', `Meet ${newCompanion.name} — "${newCompanion.personality}"`)
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

        case 'pet': {
          const c = getCompanion(loadConfig())
          if (!c) {
            addLine('system', 'No companion to pet yet.')
          } else {
            addLine('system', `${c.name} appreciated that. ♥`)
            setPetFlash(true)
            setTimeout(() => setPetFlash(false), 600)
          }
          break
        }

        case 'mute':
          saveConfig({ companionMuted: true })
          reloadCfg()
          addLine('system', 'Companion muted.')
          break

        case 'unmute':
          saveConfig({ companionMuted: false })
          reloadCfg()
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
            <div className="flex gap-6">
              {/* Sprite column */}
              <div className="flex flex-col items-center gap-2 min-w-[140px]">
                {reaction && (
                  <div className="bg-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 italic max-w-[160px] text-center">
                    {reaction}
                  </div>
                )}
                <div className={petFlash ? 'opacity-30 transition-opacity' : 'opacity-100 transition-opacity'}>
                  <CompanionSprite bones={companion} animated />
                </div>
              </div>

              {/* Info column */}
              <div className="flex flex-col gap-2 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xl font-bold ${RARITY_TEXT_CSS[companion.rarity] ?? 'text-zinc-400'}`}>
                    {companion.name}
                  </span>
                  {companion.shiny && (
                    <span className="text-yellow-400 text-sm font-semibold">✨ SHINY</span>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-sm ${RARITY_TEXT_CSS[companion.rarity] ?? 'text-zinc-400'}`}>
                    {RARITY_STARS[companion.rarity]}
                  </span>
                  <Badge className={`text-xs uppercase ${RARITY_BADGE_CSS[companion.rarity] ?? 'bg-zinc-700 text-zinc-300'}`}>
                    {companion.rarity}
                  </Badge>
                  <span className="text-zinc-400 text-sm">{companion.species}</span>
                </div>

                <p className="text-zinc-500 text-xs italic">{companion.personality}</p>

                {/* Stats */}
                <div className="flex flex-col gap-1.5 mt-1">
                  {STAT_NAMES.map(stat => {
                    const val = companion.stats[stat]
                    return (
                      <div key={stat} className="flex items-center gap-2">
                        <span className="text-zinc-400 font-mono uppercase text-xs w-20 shrink-0">{stat}</span>
                        <div className="flex-1 bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${statBarColor(val)}`}
                            style={{ width: `${val}%` }}
                          />
                        </div>
                        <span className="text-zinc-500 font-mono text-xs w-7 text-right">{val}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

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
