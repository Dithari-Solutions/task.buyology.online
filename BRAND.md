# Buyology brand in this app

Everything here comes from *Buyology Brand Identity Guidelines* (February 2024).
That PDF is not kept in this repository — ask the brand owner for the current
copy before changing anything below.

## Colour

| Token | Hex | Guideline name | Where it is used |
|---|---|---|---|
| `brand-600` | `#402F75` | American Blue (secondary) | Buttons, links, active states, focus rings |
| `brand-700`…`brand-950` | `#372866` … `#17102C` | darker steps | Hovers, the sidebar rail, the login panel |
| `brand-200`…`brand-500` | `#D9D5E3` `#B3ACC8` `#8C82AC` `#665991` | the four official American Blue tints | Borders, muted surfaces, secondary text |
| `accent-500` | `#FFBE12` | Mikado Yellow (primary) | The logo's B-wave, the active-nav marker, highlights |
| `accent-100`…`accent-400` | `#FFF2D0` `#FFE5A0` `#FFD871` `#FFCB41` | the four official Mikado Yellow tints | Selection, soft badges |
| `ink-*` | slate scale | Black / White (tertiary) | Body text, neutral chrome |

Mikado Yellow is the *primary* brand colour, but the guidelines ask for it
"sparingly, for impact" — so American Blue carries the interface and yellow is
kept for the logo and for accents. Yellow is never used behind white text: it
does not carry enough contrast.

Tokens live in [`tailwind.config.ts`](tailwind.config.ts).

## Type

**Manrope** (`next/font/google`, wired up in [`src/app/layout.tsx`](src/app/layout.tsx))
carries the whole interface. Biennale, the other approved face, is a licensed
font and is not distributable with the app, so it is not used here.

## Logo

The marks were traced from the vector artwork in the guideline PDF, so they are
the real letterforms and the real B-wave — not a look-alike font.

[`src/components/brand/logo.tsx`](src/components/brand/logo.tsx) exports:

- `<BuyologyLogo />` — the primary lock-up. The wordmark inherits `currentColor`
  and the B-wave is Mikado Yellow, which covers the two approved primary
  lock-ups: black on white, and white on American Blue.
- `<BuyologyMark />` — the secondary mark (the B inside the broken ring). Use it
  where the full lock-up will not fit, e.g. a 32 px avatar slot.
- `<BuyologyWave />` — the B-wave on its own, the standalone logo mark.

Pass `tone="mono"` to either lock-up to draw the wave in `currentColor` too —
that is the single-colour usage, for placing the logo on a Mikado Yellow ground.

Static copies for e-mail, Open Graph and anything outside React live in
[`public/brand/`](public/brand/); `src/app/icon.svg` and `src/app/apple-icon.png`
are the favicon and the iOS home-screen icon.

## Voice

The brand line is **"Buy the why"**. It appears on the login panel and in the
e-mail header; do not reword it.
