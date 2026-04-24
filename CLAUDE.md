# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running locally

No build step. Serve the repo root over HTTP (required — ES modules don't load from `file://`):

```bash
python3 -m http.server 8181
# then open http://localhost:8181
```

Deploy = push to `main`. GitHub Pages serves from the repo root automatically.

## Architecture

**LoCoPro Championship Run** is a single-button auto-scroll platformer. Phaser 3.60 via CDN + ES modules, no bundler.

### Scene flow

```
BootScene → TitleScene → SelectScene → GameScene (+ UIScene parallel) → LevelCompleteScene or GameOverScene
```

- `game.js` — Phaser config only; registers all scenes
- `BootScene` — preloads ALL assets and generates ALL programmatic textures (character sprites, zone backgrounds, obstacle sprites, flag/checkpoint). Nothing is loaded after boot.
- `UIScene` — launched in parallel with `GameScene` via `scene.launch()`. Communicates via GameScene's event emitter (`heartLost`, `checkpointReached`, `scoreUpdate`). Must be explicitly stopped before `GameScene` transitions away (`this.scene.stop('UIScene')`).
- `GameScene.create()` is **async** (fetches level JSON). Phaser calls `update()` before `create()` resolves — the guard `if (!this._player || ...) return;` at the top of `update()` is load-bearing; don't remove it.

### Data flow

- **Characters** (`src/characters.js`) — each character has an `id`, `faction` (`rising`/`pillars`), `trait` (`balanced`/`floaty`/`heavy`/`quick`), and color values used to generate in-game sprites. `getTraitPhysics(trait)` returns physics modifiers.
- **Levels** (`levels/level-NN.json`) — declare `zone` (1–5), `endX`, `gaps[]`, `platforms[]`, `obstacles[]`, `checkpoints[]`. Zone determines scroll speed (220–380 px/s) and visual theme.
- **Obstacles** (`src/obstacles.js`) — `DEFS` registry with `draw()`, dimensions, and `behavior`. `spawnObstacle()` reads config params from level JSON (e.g. `speed`, `amp`). `updateObstacle()` handles per-frame behavior (sine motion, pacing). Textures are generated on first spawn, cached by `obs_<type>` key.
- **Save** (`src/saveSystem.js`) — `localStorage` key `locopro_save`. Stores stars per character per level and `unlockedLevels`.

### Asset pipeline

Original artwork lives in `Assets/players/` and `Assets/logos/` (not committed — too large). Web-optimized copies are in `Assets/players-web/` and `Assets/logos-web/` with **lowercase filenames** (required for GitHub Pages / Linux). To regenerate after adding new artwork:

```bash
# Portraits → players-web (max 400px)
for f in Assets/players/*; do
  out=$(basename "$f" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')
  sips -Z 400 "$f" --out "Assets/players-web/$out"
done

# Logos → logos-web (max 300px)
for f in Assets/logos/*; do
  out=$(basename "$f" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')
  sips -Z 300 "$f" --out "Assets/logos-web/$out"
done
```

## Key constraints

- **No build step** — keep everything as plain ES modules. No npm, no bundler.
- **Texture keys** — character sprites use `char_<id>`, portraits use `portrait_<id>`, logos use `logo_<id>`. All generated in BootScene; missing keys cause silent Phaser failures.
- **`window.__LCP__`** — `BootScene` sets this to `{ CHARACTERS }` so `characterSprite.js` can access it without re-importing (Phaser plugin context limitation).
- **Async create() error handling** — if any code after `await loadLevel()` throws, the async function silently stops. Uncaught errors here cause a permanent black screen with no console output. Wrap risky post-await code in try/catch when debugging.
- **Scene lifecycle** — always call `this.scene.stop('UIScene')` before using `this.scene.start()` to leave GameScene; otherwise UIScene leaks.
