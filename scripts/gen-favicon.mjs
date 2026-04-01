// Generate a 32x32 pixel art favicon for buddy-toy
// Run: node scripts/gen-favicon.mjs

import { createCanvas } from 'canvas'
import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const SIZE = 32
const canvas = createCanvas(SIZE, SIZE)
const ctx = canvas.getContext('2d')

// Background: transparent
ctx.clearRect(0, 0, SIZE, SIZE)

// Color palette
const BG   = 'transparent'
const BODY = '#4ade80'   // emerald green
const EYE  = '#09090b'  // zinc-950
const SHINE= '#ffffff'
const DARK = '#16a34a'  // darker green for depth

function px(x, y, color, size = 2) {
  ctx.fillStyle = color
  ctx.fillRect(x * 2, y * 2, size, size)
}

// Simple blob/ghost shape at 16x16 logical pixels → 32x32 output
// Head
ctx.fillStyle = BODY
ctx.beginPath()
ctx.arc(16, 13, 9, Math.PI, 0)  // top half circle
ctx.fill()

// Body
ctx.fillStyle = BODY
ctx.fillRect(7, 13, 18, 10)

// Wavy bottom (ghost style)
ctx.fillStyle = '#09090b'  // bg color to "cut" waves
for (let i = 0; i < 3; i++) {
  ctx.beginPath()
  ctx.arc(9 + i * 6, 23, 3, 0, Math.PI)
  ctx.fill()
}

// Eyes
ctx.fillStyle = EYE
ctx.beginPath()
ctx.arc(12, 13, 2.5, 0, Math.PI * 2)
ctx.fill()
ctx.beginPath()
ctx.arc(20, 13, 2.5, 0, Math.PI * 2)
ctx.fill()

// Eye shine
ctx.fillStyle = SHINE
ctx.beginPath()
ctx.arc(13, 12, 1, 0, Math.PI * 2)
ctx.fill()
ctx.beginPath()
ctx.arc(21, 12, 1, 0, Math.PI * 2)
ctx.fill()

// Small blush
ctx.fillStyle = 'rgba(255,150,150,0.5)'
ctx.beginPath()
ctx.arc(9, 16, 2, 0, Math.PI * 2)
ctx.fill()
ctx.beginPath()
ctx.arc(23, 16, 2, 0, Math.PI * 2)
ctx.fill()

const outPath = join(__dirname, '../public/favicon.png')
writeFileSync(outPath, canvas.toBuffer('image/png'))
console.log('favicon.png written to public/')
