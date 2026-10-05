# Borgo Lume

A fictional Tuscan village, repainted wall by wall by the people who live in it. Scroll (or swipe, or press ↓) to glide from mural to mural — the camera stops on each one while the wall paints itself in. Tap ☾ to watch the sun set and the village light up.

A content concept by **Punto Due Studio** — inspired by the day/night map interaction of award-winning "place" sites. Not a real place; all murals, names and artists are invented.

## Run it

No server, no install, no build. Double-click `index.html`.

Three.js is bundled in `vendor/`, so it loads instantly and works offline (only the two Google Fonts need a connection; it falls back to system serif/mono without one).

## Recording flags

Add to the URL (`index.html?auto&clean`):

| Flag | What it does |
|---|---|
| `?auto` | Hands-free tour: stops on every mural, switches to night at *Luna Piena*, then loops. `?auto=2` sets how many seconds it holds on each mural (default 3.2 → about 45 s per loop). |
| `?clean` | Hides all UI + loader — pure scene, for compositing your own motion graphics. |
| `?t=1` | Start at night (`0` = day, `0.45` = golden hour). |
| `?p=0.4` | Start at a point along the walk (`0`–`1`). |

Controls: wheel / swipe / `↓ ↑ ← →` / `Space` move one chapter at a time (trackpad inertia is ignored, so one flick = one stop); click the ticks on the right to jump; `Home` / `End` go to the ends; `N` toggles day/night. Mouse movement adds a light parallax.

## Artwork

The six mural paintings were generated with Higgsfield (Nano Banana, ~12 credits total) and embedded in `js/art.js` as data URIs — browsers won't load local image files into WebGL, so this is what lets the site run straight from disk. Prompts followed one shared style (flat folk-art gouache on weathered plaster, limited palette, no text). If `art.js` is missing the site falls back to the procedural paintings in `js/murals.js`.

Tip for vertical video: open in a phone-shaped window (e.g. 430 × 932) — the camera widens automatically for portrait.

## Why it stays smooth

- One draw-call-light scene (buildings merged, windows/doors/props instanced).
- Shadows are baked into a static map and only re-rendered *during* the day↔night transition.
- Window glow, string lights and lamp halos are additive sprites (no post-processing).
- Pixel ratio auto-drops if frames run long.

## Structure

```
index.html        page + UI markup
css/style.css     UI layer
js/util.js        helpers
js/textures.js    procedural plaster / cobbles / roof tiles / clock
js/art.js         the six generated mural images (data URIs)
js/murals.js      mural metadata + procedural fallback paintings
js/sky.js         sky dome (sun, moon, stars, clouds) + hills
js/tod.js         time-of-day curve (day → golden → sunset → blue hour → night)
js/town.js        buildings, facades, church + campanile, ground
js/props.js       lanterns, string lights, fountain, trees, birds, fireflies
js/main.js        renderer, camera rail, scroll, toggle, auto-play, UI
vendor/           three.js r158
```
