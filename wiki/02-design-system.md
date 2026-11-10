# 02 — Design System

## Palette

| Token | Hex | Use |
|---|---|---|
| `--canvas` | `#C8D1E1` | Page background |
| `--canvas-soft` | `#D9E1EE` | Alternating sections |
| `--surface` | `#FFFFFF` | Cards |
| `--surface-2` | `#F4F6FA` | Inset panels, chips |
| `--surface-3` | `#E9EEF6` | Hover/selected |
| `--ink` | `#101218` | Primary text |
| `--ink-2` | `#465063` | Secondary text |
| `--ink-3` | `#6B7280` | Tertiary labels on white |
| `--lime` | `#DBEE4D` | Core, primary CTA, chapter numbers |
| `--lime-deep` | `#C6DD35` | Lime hover |
| `--lime-soft` | `#F1F8C9` | Quote backgrounds |
| `--blue` | `#589CFF` | Machine card, data visuals |
| `--blue-strong` | `#2F6BDB` | Links, focus, small blue text |
| `--blue-deep` | `#1E4FA8` | White text on blue when needed |
| `--blue-soft` | `#E4EEFF` | Blue chips/panels |
| `--coral` | `#EF6A5B` | Errors only |
| `--line` | `#E3E8F1` | Hairlines |

Contrast: ink on white 18.7:1; ink on canvas 12.2:1; ink on lime 14.6:1; ink on blue 6.8:1; ink-2 on white 8.1:1; ink-2 on canvas 5.3:1; blue-strong on white 4.9:1; white on blue-deep 7.7:1. Lime is never used as text on white. White is not used as body text on `--blue`.

## Type

| Role | Face | Spec |
|---|---|---|
| Hero | Geist Pixel Square | `clamp(3.5rem, 8vw, 7.5rem)`, uppercase, line-height .92, tracking -.02em |
| Act title | Geist Pixel Square | `clamp(2.25rem, 4.5vw, 4rem)` |
| Chapter number | Geist Pixel Square | 2.5–4rem |
| Metric | Geist Pixel Square | 2–3rem |
| Body | Geist Sans | 17px/1.6 |
| UI | Geist Sans | 14–15px, 500 |
| Label | Geist Sans | 11–12px, 600, uppercase, tracking .12em |
| Code | Geist Mono | 13px |

Pixel is display-only, 24px+. Body copy is always Sans.

## Shape and depth

- Card radius 28px; inner panel 20px; buttons 16px; pills 999px.
- Card shadow: `0 1px 2px rgba(16,18,24,.04), 0 24px 60px -28px rgba(24,39,75,.22)`.
- Hover lift: translateY(-2px) + deeper shadow.
- Background: flat periwinkle + very subtle radial light top-left + 2–3% grain.
- Bento grid: 12 columns desktop, max 1240px, gap 24px.

## Components

- **Nav pill:** fixed, white, radius 999px, monogram + links + lime Ask.
- **Hero card:** eyebrow, pixel headline, sub, lime CTA + white CTA.
- **Core card:** blue, lime orb, dot matrix, status pills.
- **Stat cards:** white, pixel value, uppercase label.
- **Machine card:** blue outer, white inner chat, header pills, source chips, input.
- **Chapter cards:** white, pixel number, title, one-line, status, tech chips, metric.
- **Case study:** white article card, blue hero band, pixel number, numbered sections, lime pull quotes.
- **Contact:** full-width lime card, pixel headline, dark email button.
- **Footer:** periwinkle, colophon.

## Motion

- Hero cards settle: translateY(16px) → 0, 500ms, stagger 70ms.
- Core: breathe scale 1 → 1.04, 2.8s; ready 2.2s; generating 0.9s.
- Chat: 150ms message fade; streaming caret.
- Cards: 180ms lift.
- Reduced motion: static core, no transforms, 150ms opacity only.

## Responsive

- 360–639: 4-col, stacked; hero pixel 44–52px; nav pill + menu.
- 640–1023: 8-col, 2-card rows.
- 1024–1439: 12-col full bento.
- 1440+: max 1240px.
- Touch targets ≥ 44px. No hover-only information.
