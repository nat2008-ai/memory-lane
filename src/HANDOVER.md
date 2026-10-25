# Memory Lane — handover

Interactive mobile anniversary gift for Ryan & Sheila (wedding 25 Oct 2025, proposal 14 Feb 2025). First anniversary: 25 Oct 2026.
Main file: `Memory Lane.dc.html` (+ `support.js`, `image-slot.js`, `assets/`, `fonts/`).

## Format
- Phone frame fixed at **390 × 844** (fills smaller phones).
- Vertical scroll flow: screens slide up over a velvet-maroon base (`#2a0408`). Each screen locks until its interaction is done (swipe up / wheel / gold arrow to advance). Replay button on the last screen fades back to start.
- Tweaks: `startScreen` (0–4) jumps to any screen for testing; `songUrl` sets the photobooth audio (plays once on print when sound is on).

## Type
- Headlines: **Westwood Studio** (`fonts/WestwoodStudio.ttf`, personal-use licence), fallback Instrument Serif
- Screen 1 headline + vows body: **Instrument Serif** (Google Fonts)
- Small copy / chapter labels: **SF Pro Text** (system; falls back to Helvetica Neue off Apple). Chapter labels are 13px, .32em tracking, uppercase.
- Loaded but unused: Gellatio, Galteniya (`@font-face` still in helmet); Maratre in `fonts/`

## Screens
1. **Home — Dear Sheila**: background `assets/home-bg.jpeg` (altar, brightness .74 + dark gradient). Embossed brown-gold vine frame + RS monogram (from user's Figma SVG). Gold-gradient text ("Let’s walk through / down the memory lane", Instrument Serif 31px) and thin gold down-arrow inside the frame. Unlocked immediately.
2. **The Proposal (Chapter I)**: ivory background (`#f6f3ee` + `assets/proposal-bg.png` embossed floral, soft vignette). Ring box built from user's `Ring close/open.svg` (dark red, black lining, silver ring, faceted diamond, glints). Tap → lid opens, ring rises. Reveal: "Will you marry me?" (Instrument Serif 26px) / 14.02.25. Bronze label `#7d6640`, gold-gradient 54px headline.
3. **The Vows (Chapter II)**: maroon velvet. Cream envelope ("Ryan & Sheila" in Westwood) with gold seal (`assets/gold-seal.png` + RS monogram). "Tap to read" → seal fades, flap opens, letter slides out → square-cornered paper card (306px wide) with His/Hers toggle; vows in Instrument Serif 18.75px with fixed 5-line breaks. "Tap to continue" → kiss photo `assets/vows-kiss.jpeg` fades in as background (brightness .8), "You are now husband and wife!" (Westwood 48px, `#e8c97e`), gold arrow pinned bottom.
4. **Wedding Day (Chapter III)** — screen label in code is "04 Our Year Together": full-screen `assets/booth-bg.png` (gold mirror frame on white floral, scales to viewport). Headline 48px. Brass printer slot (LED red→green) + strip scaled 72% inside the frame. Tap → strip prints immediately (no flash); photos develop bottom-first (3 → 2 → 1). Colour photos `assets/booth-1/2/3.jpeg` with custom crops/zoom. After print: "Tap photo to collect" → enlarged strip lightbox.
5. **The Toast (Chapter IV)**: 3D glass champagne flutes; swipe ← → to clink → "Cheers" (Westwood 54px) + confetti. Then the closing card: 25 · 10 · 2025 — 25 · 10 · 2026 / "Happy 1st Anniversary" (Westwood 58px) / Ryan & Sheila / personal message (**still placeholder**) / "Forever yours" / Replay button.

## Open items
- Song: "Before You" (Benson Boone) requested for the photobooth. The `songUrl` hook exists, but it needs a licensed audio file or URL from the user.
- Closing message on screen 5 is still the `[ Your personal message goes here … ]` placeholder.
- Screen 5 visual restyle (still the older plain maroon style, 32px headline, no background texture).
- Colour jumps between screens during scroll (photo → ivory → maroon → white → maroon).
- Rename screen 4 label "Our Year Together" → "Wedding Day" for consistency (cosmetic, code only).
- Optional cleanup: remove the unused Gellatio/Galteniya `@font-face` rules.
