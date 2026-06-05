'use client'
import type { ContentPlatform } from '@/types'
import { PLATFORM_LABEL } from './contentMeta'

// ── Individual SVG icons ──────────────────────────────────

function IgSvg({ s }: { s: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

function TwSvg({ s }: { s: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function LiSvg({ s }: { s: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

function TkSvg({ s }: { s: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.3 6.3 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.79 1.53V6.77a4.85 4.85 0 0 1-1.02-.08z" />
    </svg>
  )
}

function YtSvg({ s }: { s: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}

function ScSvg({ s }: { s: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 64 64" fill="currentColor">
      <path d="M32 4C19.3 4 9 14.3 9 27c0 4.2 1.1 8.1 3.1 11.5-.1.4-.3.9-.5 1.5-.6 1.6-1.5 3.4-3.1 4.1-.4.2-.5.6-.4.9.2.5.8.9 1.6 1.1 1.2.3 2.5.1 3.5-.3.5-.2 1-.4 1.5-.4.4 0 .9.1 1.3.4-.4 1.2-.9 2.7-.5 3.9.1.4.5.6.9.5 1.5-.3 3.1-1.5 5.4-2.8 1.3.9 3.1 1.6 5.4 2 .3 0 .5.2.6.5.4 1.1 1.3 1.8 2.2 1.8s1.8-.7 2.2-1.8c.1-.3.3-.5.6-.5 2.3-.4 4.1-1.1 5.4-2 2.3 1.3 3.9 2.5 5.4 2.8.4.1.8-.1.9-.5.4-1.2-.1-2.7-.5-3.9.4-.3.9-.4 1.3-.4.5 0 1 .2 1.5.4 1 .4 2.3.6 3.5.3.8-.2 1.4-.6 1.6-1.1.1-.3 0-.7-.4-.9-1.6-.7-2.5-2.5-3.1-4.1-.2-.6-.4-1.1-.5-1.5C53.9 35.1 55 31.2 55 27 55 14.3 44.7 4 32 4z" />
    </svg>
  )
}

function FbSvg({ s }: { s: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

function GlobeSvg({ s }: { s: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}

// ── Public component ──────────────────────────────────────

const ICON_MAP: Record<ContentPlatform, (s: number) => React.ReactNode> = {
  instagram: (s) => <IgSvg s={s} />,
  twitter:   (s) => <TwSvg s={s} />,
  linkedin:  (s) => <LiSvg s={s} />,
  tiktok:    (s) => <TkSvg s={s} />,
  youtube:   (s) => <YtSvg s={s} />,
  snapchat:  (s) => <ScSvg s={s} />,
  facebook:  (s) => <FbSvg s={s} />,
  other:     (s) => <GlobeSvg s={s} />,
}

export function PlatformIcon({ platform, size = 14, style }: {
  platform: ContentPlatform
  size?: number
  style?: React.CSSProperties
}) {
  return (
    <span
      title={PLATFORM_LABEL[platform]}
      style={{
        width: size, height: size,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        ...style,
      }}
    >
      {ICON_MAP[platform](size)}
    </span>
  )
}

// ── HTML string helper for print windows (no React / no CSS vars) ──

const SVG_INNER: Record<ContentPlatform, string> = {
  instagram: `<rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor"/>`,
  twitter:   `<path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>`,
  linkedin:  `<path fill="currentColor" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>`,
  tiktok:    `<path fill="currentColor" d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.3 6.3 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.79 1.53V6.77a4.85 4.85 0 0 1-1.02-.08z"/>`,
  youtube:   `<path fill="currentColor" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>`,
  snapchat:  `<path fill="currentColor" d="M32 4C19.3 4 9 14.3 9 27c0 4.2 1.1 8.1 3.1 11.5-.1.4-.3.9-.5 1.5-.6 1.6-1.5 3.4-3.1 4.1-.4.2-.5.6-.4.9.2.5.8.9 1.6 1.1 1.2.3 2.5.1 3.5-.3.5-.2 1-.4 1.5-.4.4 0 .9.1 1.3.4-.4 1.2-.9 2.7-.5 3.9.1.4.5.6.9.5 1.5-.3 3.1-1.5 5.4-2.8 1.3.9 3.1 1.6 5.4 2 .3 0 .5.2.6.5.4 1.1 1.3 1.8 2.2 1.8s1.8-.7 2.2-1.8c.1-.3.3-.5.6-.5 2.3-.4 4.1-1.1 5.4-2 2.3 1.3 3.9 2.5 5.4 2.8.4.1.8-.1.9-.5.4-1.2-.1-2.7-.5-3.9.4-.3.9-.4 1.3-.4.5 0 1 .2 1.5.4 1 .4 2.3.6 3.5.3.8-.2 1.4-.6 1.6-1.1.1-.3 0-.7-.4-.9-1.6-.7-2.5-2.5-3.1-4.1-.2-.6-.4-1.1-.5-1.5C53.9 35.1 55 31.2 55 27 55 14.3 44.7 4 32 4z"/>`,
  facebook:  `<path fill="currentColor" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>`,
  other:     `<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.8"/><line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" stroke-width="1.8"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" fill="none" stroke="currentColor" stroke-width="1.8"/>`,
}

const SNAPCHAT_VIEWBOX = '0 0 64 64'

/** HTML string for injecting into a print window (no React, no CSS variables). */
export function platformCellHtml(platform: ContentPlatform | undefined, size = 13, color = '#6b7280'): string {
  if (!platform) return '—'
  const vb = platform === 'snapchat' ? SNAPCHAT_VIEWBOX : '0 0 24 24'
  const svg = `<svg width="${size}" height="${size}" viewBox="${vb}" style="display:inline-block;vertical-align:middle;margin-inline-end:4px" aria-hidden="true">${SVG_INNER[platform]}</svg>`
  return `<span style="display:inline-flex;align-items:center;color:${color}">${svg}${PLATFORM_LABEL[platform]}</span>`
}
