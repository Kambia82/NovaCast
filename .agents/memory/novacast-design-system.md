---
name: Novacast Design System
description: Color palette, design tokens, and philosophy for the Novacast fishing app
---

# Novacast Design System

## Philosophy
Dark page (deep water at night) + nova light accent (brilliant pale blue-white star) so lure COLORS take the visual spotlight.
Not deep-navy. The background is near-black blue-black. Accent is whitish-blue (starlight through water), not cyan.

## Color Tokens (index.css :root)
| Token | Value | Use |
|---|---|---|
| --bg | #060b10 | Page background |
| --surface | #0c1822 | Cards, panels |
| --surface2 | #122030 | Slightly elevated |
| --surface3 | #192c3a | Highlighted cards |
| --nova | #BAE8FF | Primary accent — brilliant pale nova blue-white |
| --nova-bright | #E6F6FF | Near-white nova core (logo glow) |
| --nova-mid | #7CCBE8 | Medium nova blue (secondary text, icons) |
| --aqua | #2DD4BF | Tropical turquoise (tropical water, NOT deep sea) |
| --water | #0E7490 | Deeper teal (depth bar end) |
| --text | #C8E4F0 | Body text |
| --muted | #4A6878 | Muted labels, placeholders |
| --border | #1A3346 | Card/input borders |
| --danger | #FC8181 | Errors, delete |
| --silver | #A8C8D8 | Secondary text |

## Body gradient
Radial nova burst at top-center, deep water teal hints at bottom corners.

## Key decisions
- Lure color swatches get a glow shadow (`boxShadow: 0 0 8px ${hex}40`) so chartreuse/orange/red pop against dark
- Buttons use restrained `rgba(186,232,255,0.06)` backgrounds — NOT filled
- Primary font: Bebas Neue (display), DM Sans (body)
- Nova star glyph: ✦ (U+2726) above logo on Discovery screen
- nova-glow CSS animation on NOVACAST logo (subtle text-shadow pulse)

## Replaced values
Old cyan accent #00e5c7 → nova #BAE8FF
Old bg #0a1628 → #060b10
Old surface #0f1f3d → #0c1822
Old surface2 #152a4f → #122030
Old border #1e3a5f → #1A3346
Old muted #7a8ea6 → #4A6878
