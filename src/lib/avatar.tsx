'use client'
import { useState } from 'react'

// ── Offline avatar generator + shared <Avatar> component ──────────────
// Profile pictures are stored as data URLs on the team member. They can be
// either an uploaded (down-scaled) photo, or a generated identicon produced
// fully on the client — no external image service required.

const PALETTES: [string, string][] = [
  ['#6366F1', '#8B5CF6'],
  ['#F4581C', '#FB923C'],
  ['#0EA5E9', '#22D3EE'],
  ['#10B981', '#34D399'],
  ['#EC4899', '#F472B6'],
  ['#F59E0B', '#FBBF24'],
  ['#EF4444', '#F87171'],
  ['#14B8A6', '#2DD4BF'],
  ['#8B5CF6', '#6366F1'],
  ['#0D9488', '#22C55E'],
]

function hash(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '؟'
  if (parts.length === 1) return parts[0].slice(0, 2)
  return parts[0][0] + parts[1][0]
}

/**
 * Generate a symmetric identicon avatar (GitHub-style) as an SVG data URL.
 * Bumping `variant` re-rolls the colours and the pattern for the same seed.
 */
export function generateAvatar(seed: string, variant = 0): string {
  const h = hash(`${seed}#${variant}`)
  const [c1, c2] = PALETTES[h % PALETTES.length]
  const grid = 5
  const cell = 100 / grid
  const cells: string[] = []
  for (let y = 0; y < grid; y++) {
    for (let x = 0; x < Math.ceil(grid / 2); x++) {
      const on = ((h >> (y * 3 + x)) & 1) === 1
      if (!on) continue
      const mx = grid - 1 - x
      cells.push(`<rect x="${(x * cell).toFixed(2)}" y="${(y * cell).toFixed(2)}" width="${cell.toFixed(2)}" height="${cell.toFixed(2)}" rx="2"/>`)
      if (mx !== x) cells.push(`<rect x="${(mx * cell).toFixed(2)}" y="${(y * cell).toFixed(2)}" width="${cell.toFixed(2)}" height="${cell.toFixed(2)}" rx="2"/>`)
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/>` +
    `</linearGradient></defs>` +
    `<rect width="100" height="100" fill="url(#g)"/>` +
    `<g fill="#ffffff" fill-opacity="0.9">${cells.join('')}</g>` +
    `</svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

/** Read an uploaded image file, cover-crop it to a square, and return a small JPEG data URL. */
export function fileToAvatarDataUrl(file: File, size = 160): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('read failed'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('decode failed'))
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('no canvas'))
        const scale = Math.max(size / img.width, size / img.height)
        const w = img.width * scale
        const h = img.height * scale
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

/** Profile picture: uploaded photo / generated avatar if present, else colored initials. */
export function Avatar({ name, src, size = 40, color, className }: {
  name: string
  src?: string
  size?: number
  color?: string
  className?: string
}) {
  const [err, setErr] = useState(false)
  if (src && !err) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setErr(true)}
        className={`rounded-full object-cover shrink-0 ${className ?? ''}`}
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <div
      className={`rounded-full flex items-center justify-center shrink-0 font-bold select-none ${className ?? ''}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: `color-mix(in oklch, ${color ?? 'var(--iris-500)'} 18%, transparent)`,
        color: color ?? 'var(--iris-500)',
      }}
    >
      {initialsOf(name)}
    </div>
  )
}
