/**
 * Product profile → PPTX export.
 *
 * Builds a branded 16:9 presentation (the standard deck size) from the
 * project's ProductProfile, ready to send to investors or partners.
 * Runs fully client-side (pptxgenjs), so it works with the static export.
 *
 * Slide order: cover → filled sections (empty ones are skipped) →
 * sub-products → goals/advantages lists → closing contact slide.
 */

import type { Project, ProductProfile } from '@/types'

// Brand palette (mirrors the app's dark theme + iris accent)
const BG       = '0F0F16'
const SURFACE  = '17171F'
const IRIS     = '6366F1'
const FG       = 'E8E8F0'
const FG_MUTED = '9B9BAD'

const FONT = 'Arial' // ships everywhere and shapes Arabic correctly

interface SlideText {
  title: string
  body: string
}

function hexFrom(color: string): string {
  // pptxgenjs expects hex without '#'; fall back to iris for non-hex values.
  const m = color.trim().match(/^#?([0-9a-fA-F]{6})$/)
  return m ? m[1].toUpperCase() : IRIS
}

export async function exportProfilePptx(project: Project, profile: ProductProfile): Promise<void> {
  const { default: PptxGenJS } = await import('pptxgenjs')
  const pptx = new PptxGenJS()

  pptx.defineLayout({ name: 'WIDE', width: 13.33, height: 7.5 })
  pptx.layout = 'WIDE'
  pptx.rtlMode = true

  const accent = hexFrom(project.color)

  const baseSlide = () => {
    const slide = pptx.addSlide()
    slide.background = { color: BG }
    return slide
  }

  // ── Cover ────────────────────────────────────────────────
  {
    const slide = baseSlide()
    // Accent bar on the start (right in RTL) edge
    slide.addShape('rect', { x: 12.93, y: 0, w: 0.4, h: 7.5, fill: { color: accent } })

    slide.addText(project.name, {
      x: 0.8, y: 2.4, w: 11.6, h: 1.4,
      align: 'right', fontFace: FONT, fontSize: 54, bold: true, color: FG, rtlMode: true,
    })
    if (profile.tagline.trim()) {
      slide.addText(profile.tagline.trim(), {
        x: 0.8, y: 3.9, w: 11.6, h: 0.9,
        align: 'right', fontFace: FONT, fontSize: 24, color: IRIS, rtlMode: true,
      })
    }
    if (project.description.trim()) {
      slide.addText(project.description.trim(), {
        x: 0.8, y: 4.9, w: 11.6, h: 1.2,
        align: 'right', fontFace: FONT, fontSize: 16, color: FG_MUTED, rtlMode: true,
      })
    }
    slide.addText('ملف تعريفي', {
      x: 0.8, y: 6.7, w: 11.6, h: 0.5,
      align: 'right', fontFace: FONT, fontSize: 14, color: FG_MUTED, rtlMode: true,
    })
  }

  // ── Text sections (skip empty) ───────────────────────────
  const sections: SlideText[] = [
    { title: 'نبذة عامة',            body: profile.overview },
    { title: 'المشكلة',              body: profile.problem },
    { title: 'الحل',                 body: profile.solution },
    { title: 'الجمهور المستهدف والسوق', body: profile.market },
    { title: 'نموذج العمل',          body: profile.businessModel },
    { title: 'الفريق',               body: profile.team },
  ]

  const addSectionHeader = (slide: ReturnType<typeof baseSlide>, title: string) => {
    slide.addShape('rect', { x: 12.13, y: 0.75, w: 0.4, h: 0.6, fill: { color: accent } })
    slide.addText(title, {
      x: 0.8, y: 0.65, w: 11.13, h: 0.8,
      align: 'right', fontFace: FONT, fontSize: 32, bold: true, color: FG, rtlMode: true,
    })
  }

  for (const section of sections) {
    if (!section.body.trim()) continue
    const slide = baseSlide()
    addSectionHeader(slide, section.title)
    slide.addText(section.body.trim(), {
      x: 0.8, y: 1.9, w: 11.73, h: 5,
      align: 'right', valign: 'top', fontFace: FONT, fontSize: 18,
      color: FG, rtlMode: true, lineSpacingMultiple: 1.4,
    })
  }

  // ── Sub-products as cards ────────────────────────────────
  const subs = profile.subProducts.filter((s) => s.name.trim())
  if (subs.length > 0) {
    const slide = baseSlide()
    addSectionHeader(slide, 'المنتجات والخدمات')

    const cols = subs.length <= 2 ? subs.length : subs.length <= 4 ? 2 : 3
    const rows = Math.ceil(subs.length / cols)
    const gap = 0.3
    const areaX = 0.8, areaY = 1.9, areaW = 11.73, areaH = 5.1
    const cardW = (areaW - gap * (cols - 1)) / cols
    const cardH = Math.min((areaH - gap * (rows - 1)) / rows, 2.4)

    subs.forEach((sub, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      // RTL: first card starts at the right edge of the content area
      const x = areaX + areaW - cardW - col * (cardW + gap)
      const y = areaY + row * (cardH + gap)
      slide.addShape('roundRect', {
        x, y, w: cardW, h: cardH, rectRadius: 0.08,
        fill: { color: SURFACE }, line: { color: accent, width: 0.75 },
      })
      slide.addText(sub.name.trim(), {
        x: x + 0.2, y: y + 0.15, w: cardW - 0.4, h: 0.5,
        align: 'right', fontFace: FONT, fontSize: 17, bold: true, color: IRIS, rtlMode: true,
      })
      if (sub.description.trim()) {
        slide.addText(sub.description.trim(), {
          x: x + 0.2, y: y + 0.7, w: cardW - 0.4, h: cardH - 0.85,
          align: 'right', valign: 'top', fontFace: FONT, fontSize: 12.5,
          color: FG_MUTED, rtlMode: true, lineSpacingMultiple: 1.25,
        })
      }
    })
  }

  // ── Bullet lists (goals / advantages) ────────────────────
  const lists: Array<{ title: string; items: string[] }> = [
    { title: 'الأهداف',          items: profile.goals.filter((g) => g.trim()) },
    { title: 'المزايا التنافسية', items: profile.advantages.filter((a) => a.trim()) },
  ]
  for (const list of lists) {
    if (list.items.length === 0) continue
    const slide = baseSlide()
    addSectionHeader(slide, list.title)
    slide.addText(
      list.items.map((item) => ({
        text: item.trim(),
        options: {
          bullet: { code: '2022', indent: 16 },
          color: FG, fontSize: 18, fontFace: FONT,
          paraSpaceAfter: 14, rtlMode: true, align: 'right' as const,
        },
      })),
      { x: 0.8, y: 1.9, w: 11.73, h: 5, align: 'right', valign: 'top', rtlMode: true }
    )
  }

  // ── Closing / contact ────────────────────────────────────
  {
    const slide = baseSlide()
    slide.addShape('rect', { x: 12.93, y: 0, w: 0.4, h: 7.5, fill: { color: accent } })
    slide.addText('شكراً لكم', {
      x: 0.8, y: 2.6, w: 11.6, h: 1.2,
      align: 'right', fontFace: FONT, fontSize: 44, bold: true, color: FG, rtlMode: true,
    })
    if (profile.contact.trim()) {
      slide.addText(profile.contact.trim(), {
        x: 0.8, y: 4, w: 11.6, h: 1.6,
        align: 'right', valign: 'top', fontFace: FONT, fontSize: 18,
        color: IRIS, rtlMode: true, lineSpacingMultiple: 1.4,
      })
    }
    slide.addText(project.name, {
      x: 0.8, y: 6.7, w: 11.6, h: 0.5,
      align: 'right', fontFace: FONT, fontSize: 14, color: FG_MUTED, rtlMode: true,
    })
  }

  await pptx.writeFile({ fileName: `${project.name} - الملف التعريفي.pptx` })
}
