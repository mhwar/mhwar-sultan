<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:axis-design-rules -->
# Axis Design System rules
Source: `design-system/Axis Design System/` (git submodule). Tokens file: `src/app/axis-theme.css`.

## Color
- The **only accent color** is `iris-500` (`oklch(0.62 0.21 275)` ≈ `#6366F1`). Use it exclusively on: primary action buttons, the focus ring, and selection states. Never on borders, background fills, or body text.
- Surface stack: `--color-surface-base` (body) → `--color-surface-raised` (cards) → `--color-surface-overlay` (modals/menus). Never invent new background layers.
- Semantic colors for status only: `success-500`, `warning-500`, `danger-500`, `info-500`. Never use them decoratively.

## Typography & copy
- **Sentence case everywhere** — buttons, headings, table headers, menu items, tab labels. Example: `Add project`, not `Add Project`.
- **No Title Case. No emoji in product UI.** Emoji are allowed only in user-generated content (notes, comments).
- **Western Arabic numerals always** (`123`, `1,234`). Never Eastern Arabic-Indic (`١٢٣`).
- No adverbs (`seamlessly`, `easily`, `simply`). No hype words (`revolutionary`, `magical`).
- No trailing period on single-sentence UI strings (buttons, tooltips, empty-state line 1).

## Layout & spacing
- **8-pt grid**: allowed spacing values are 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128 px.
- Use Tailwind logical-property classes (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`) — never `ml-*`/`mr-*`/`pl-*`/`pr-*` for directional spacing. RTL is active on all pages (`dir="rtl"`).

## Icons
- Use **lucide-react** exclusively. Stroke weight: 1.5 px (Lucide default). Sizes: 12 / 14 / 16 / 20 / 24 / 32 px.
- No unicode glyphs as icons. No emoji as icons.
- Directional icons (arrows, chevrons) that need to mirror in RTL get `data-flip-rtl` or explicit `[dir="rtl"]` CSS.

## Motion
- One easing only: `cubic-bezier(0.2, 0.8, 0.2, 1)` (ease-out). Available as `--ease-out` / Tailwind `ease-out`.
- Three durations: `--axis-duration-micro` 120 ms (hover/focus), `--axis-duration-small` 200 ms (popovers), `--axis-duration-large` 320 ms (page transitions).
- **No bounces, springs, or playful motion.**
- Honor `prefers-reduced-motion` — collapse durations to 0 ms.

## Components (Axis primitives)
- Token layer + ported Axis classes live in `src/app/axis-components.css`; thin React wrappers in `src/components/ui/` (`Button`, `IconButton`, `Pill`, `Tag`, `Badge`, `Field`, `Segmented`). Prefer these over bespoke inline-styled controls.
- Use semantic tokens (`--surface-*`, `--fg-*`, `--border-*`, `--feedback-*`, `--action-*`) — never hardcoded `rgba()`/hex. Project identity colors (`project.color`) are the only allowed per-instance colors (dots, progress fills).
- Surfaces: cards `.axis-card`; tables `.axis-table`; task lists `.axis-tasklist`; kanban `.board-*`; headers `PageHeader`/`axis-projhead`; view toggles `Segmented`; reports `MetricCard`/`Donut`/`Sparkline`.
- Theme switches on `data-theme` (dark default) kept in sync with the legacy `.light` class via `themeStore`.
- Project icons are **lucide keys** rendered via `ProjectIcon` (`src/lib/icons.tsx`) — never emoji.

## Cards & components
- Keep the `glass-card` class for the existing glass-morphic card style. Do not replace it with a plain card without approval.
- Cards: `border-radius` `--radius-lg` (12 px), `border` 1 px `--border-subtle`, `box-shadow` `--shadow-sm`. Inner padding 24 px desktop / 16 px mobile.
- Cards never have a colored left-border accent. Status is expressed via an inline badge.
- Touch targets: 44 × 44 px minimum on mobile, 32 × 32 px on dense desktop surfaces.
<!-- END:axis-design-rules -->
