# LoCoPro Championship Run

A single-button auto-scroll platformer for LoCo Pro Wrestling. Pick a wrestler
from the 16-strong roster, then time your jumps through five themed zones —
gaps, moving platforms, and hazards — to reach the finish line. Built with
Phaser 3.60 (via CDN) and plain ES modules. No build step, no bundler.

Live at [run.locopro.pw](https://run.locopro.pw).

## Running locally

Serve the repo root over HTTP (ES modules don't load from `file://`):

```bash
python3 -m http.server 8181
# then open http://localhost:8181
```

Deploy by pushing to `main` — GitHub Pages serves the repo root automatically.

## How to play

- **One button.** Tap to jump. The level auto-scrolls; your only job is timing.
- Each character has a movement **trait** (`balanced`, `floaty`, `heavy`,
  `quick`) that changes jump feel.
- Clear checkpoints, avoid obstacles and gaps, and reach `endX`. Stars and
  unlocked levels are saved to `localStorage`.

## Project layout

```text
game.js            Phaser config; registers all scenes
scenes/            Boot, Title, Select, Game, UI, LevelComplete, GameOver
src/characters.js  Roster data + per-trait physics
src/obstacles.js   Obstacle registry: draw, dimensions, behavior
src/saveSystem.js  localStorage save (stars + unlocked levels)
levels/            level-NN.json — zone, endX, gaps, platforms, obstacles
Assets/            Source art (-web/ copies are lowercased for GitHub Pages)
level-editor.html  Visual level editor
walk-editor.html   Walk-cycle / sprite editor
```

`BootScene` preloads every asset and generates all programmatic textures up
front — nothing is loaded after boot. `UIScene` runs in parallel with
`GameScene` and must be explicitly stopped before leaving it.

See `CLAUDE.md` for the scene flow, data-flow details, the asset-regeneration
pipeline, and the gotchas around `GameScene`'s async `create()`.
