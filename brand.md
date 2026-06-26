# Brand — FractionAX

_Status: active_

Agentic RWA (real-world-asset) investing on Solana. Audience: both crypto-native and
non-crypto-native investors. Tone: trustworthy, modern fintech, intelligent/agentic.

The palette is **derived from the FractionAX logo** (`apps/web/public/brand/`). Applied to
`apps/web/app/globals.css` as shadcn-style OKLCH tokens (light + dark). Mood: DeFi × AI ·
premium · technical · minimal.

## Palette — "Teal & Gold" (from the logo)

| Brand color | Hex | OKLCH | Role |
|---|---|---|---|
| Teal | `#16af8e` | `oklch(0.674 0.126 172)` | **Primary** — buttons, links, focus ring (deepened to `0.52` in light mode for AA) |
| Gold | `#f9b73f` | `oklch(0.821 0.150 78)` | `--brand-gold` — yield figures, highlights (deepened in light mode) |
| Forest | `#114036` | `oklch(0.337 0.053 176)` | `--brand-forest` — deep accent; tints the dark-mode background |
| Cream | `#f9f3d9` | `oklch(0.962 0.035 96)` | `--popover` surface (light) |
| Light | `#f6f6f6` | `oklch(0.973 0 90)` | background (light) |
| Dark | `#191919` | `oklch(0.213 0 90)` | foreground text (light) |

Dark mode uses a **forest-tinted near-black** background and a brighter teal primary.
Full token sets live in `app/globals.css` under `:root`, the `prefers-color-scheme: dark`
media query, and `.dark`. All foreground/background pairs pass **WCAG AA**
(body ≥16:1, muted ≥7:1, primary text ≥4.5:1). Tailwind utilities: `bg-primary`,
`text-brand-gold`, `bg-brand-forest`, etc.

## Typography

Direction: **cyber / brutalist** — raw, high-contrast, terminal-flavored.

- **Mono (display + data):** Geist Mono (`geist/font/mono`) — page titles (`h1`)
  and section headings are `font-mono uppercase` (the cyber-terminal/brutalist
  voice), plus all numerics, addresses, code, and the UPPERCASE `kicker` labels.
- **Sans:** Geist (`geist/font/sans`) — body and UI text. `--font-sans`.

Use `font-mono uppercase` for display headings, `font-mono tabular-nums` for any
compared numbers (yields, amounts, balances), and the `.kicker` class for eyebrows.

## Visual language — brutalist

- **Hard corners** — `--radius: 0` (everything is square).
- **Thick borders** — `border-2` on cards and key surfaces.
- **Hard offset shadows** — `.shadow-card` is a solid 3px cast (no blur);
  `.shadow-brutal` is a loud 6px **neon-teal** cast for hero preview / CTA.
- **Neon-teal HUD grid** — `.blueprint-grid` draws teal 48px gridlines behind the
  hero; `.bracket` adds thick teal registration corners.

## Logo

SVGs in `apps/web/public/brand/fractionax-logo-full-{primary,secondary,accent,light,dark,popover}.svg`.
The `Logo` component (`components/logo.tsx`) shows the **dark** mark on light backgrounds and the
**light** mark on dark backgrounds. Wired into the marketing + dashboard nav.

_TODO: add a square mark-only SVG for `app/icon.svg` (favicon) + `app/apple-icon.png` —
the current full wordmark is too wide for a square icon._

## Tone & voice

Trustworthy and grounded — this handles real money and real-world assets, so copy is precise
and never hype-y. Speak to the user in second person ("you stay in control"), active voice,
as few words as possible ("Browse deals", not "Click here to browse the available deals").

Lead with the agentic difference: the product understands plain language and does the work.
But always reinforce control — agents propose, the user approves. Gold is for *value earned*
(yield), teal is for *action* (the primary path); use both sparingly so they stay meaningful.

## Dos & don'ts

- **Do** use `text-brand-gold` for yield/positive value, sparingly.
- **Do** keep numbers in `font-mono tabular-nums`.
- **Don't** hardcode hex — use the tokens (`bg-primary`, `text-muted-foreground`, …).
- **Don't** put the wide wordmark in a square space — use a mark-only asset (see TODO).
