# BloomX Design System

## Product Context

BloomX is a marketplace for large-model API capacity. Merchants submit model APIs, BloomX tests them before listing, users buy credits or subscriptions, successful calls create merchant revenue, and failed calls are refunded with an after-sales record.

The interface should feel like a trustworthy trading venue for model capacity, not a generic AI product landing page.

## Visual Direction

- Keywords: trusted exchange, liquid technical flow, clear settlement, quiet control room.
- Mood: dark off-black canvas, mineral green, restrained bronze, warm coin material, cold reserve blue.
- Hero direction: scroll-driven monetary exploration. The user feels like they are piloting through model capacity as it is minted, routed, priced, called, and settled.
- 3D direction: real WebGL meshes with physical materials, metalness, roughness, rim light, and depth of field cues. Video is a background layer; interaction and product content stay legible above it.

## Color System

Use Radix UI Colors as the implementation source for neutral and accent ramps:

- Base: `slateDark`
- Trust / route: `mintDark`
- Coin / settlement: `amberDark`
- Metal / ledger: `bronzeDark`

Project aliases:

- Canvas: `#050807`
- Surface: `#07100f`
- Settlement green: `#2f6f5e`
- Signal mint: `#69e2a9`
- Token bronze: `#d76f37`
- Flow coin: `#f0bc61`
- Reserve blue: `#355c8a`

Avoid large purple-blue gradients, neon glow, generic AI shine, unreadable low-contrast text, decorative metrics, emoji, and cards that do not carry real product meaning.

## Typography

- Display / landing: Outfit, Satoshi, SF Pro Display, system sans-serif fallback.
- Operational data: SF Mono, Monaco, Consolas, monospace.
- Do not use Inter, Roboto, Arial, serif typography, or oversized shouting headlines.

## Layout Rules

- Homepage hero uses asymmetric composition: copy and actions on the left, depth/video field on the right and behind.
- Full-page sections are bands or open layouts. Use cards only for product entities such as merchants, model products, subscriptions, calls, and settlement records.
- Mobile collapses to a single column with the video/3D background softened and controls kept reachable.
- Hero sections use `min-h-[100dvh]`, not `h-screen`.

## Motion Rules

- Motion must explain the product loop: merchant capacity flows into platform routing, then buyer calls, then settlement returns to merchants.
- Animate only transform and opacity in UI.
- WebGL, canvas, and video must clean up listeners and animation frames.
- Respect `prefers-reduced-motion`.
- Scroll storytelling should be progressive and inspectable, not a hidden hijack.

## Taste + Open Design Gate

Every UI change must pass:

- Taste: no generic AI visuals, no invented decorative data, no excessive carding, no unreadable states.
- Open Design: record context, expose assumptions, keep artifacts previewable, and summarize remaining risks.
- Delivery: run build or targeted validation and explain what remains unverified.
