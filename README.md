# Preston Thinks

Math explainers, a math battle game, and whatever else I'm working on.

**Live at [prestonthinks.com](https://www.prestonthinks.com)**

## What's on the site

- **Home** -- math explainer videos where I draw out solutions and walk through my thinking
- **Math Battle** -- a math-powered battle game (try it at [/game](https://www.prestonthinks.com/game/))
- **Adventure** -- a tile-based quest with math puzzle gates (try it at [/adventure](https://www.prestonthinks.com/adventure/))
- **About** -- a little about me

## Run it locally

Requires Ruby (via rbenv) and Bundler.

```
make setup   # install dependencies
make serve   # run at http://localhost:4000 with live reload
make clean   # remove generated files
```

## How the games are built

Both games are plain ES modules loaded with `<script type="module">`. There is
no build step: the browser resolves the imports, so a file you edit is the file
that runs.

`assets/adventure/` -- the tile quest.

| File | What it holds |
|---|---|
| `adventure.js` | Entry point: canvas, game loop, keyboard |
| `tiles.js` | Tile types, each owning its collision default and its drawing |
| `grid.js` | `TileGrid`: the terrain layer and the collision layer |
| `maps.js` | The three map builders |
| `zones.js` | Zone contents: NPCs, puzzle gates, exits |
| `player.js`, `camera.js` | Movement between tiles, and following it |
| `interact.js` | What the Spacebar does |
| `dialog.js`, `puzzle.js` | The two overlays that pause the world |
| `boss.js`, `combat.js`, `collectibles.js` | The Forest Guardian fight |
| `sprites.js`, `hud.js`, `draw.js` | Drawing |

A tile's **appearance and its collision are two separate layers**. That is what
lets trees stay standing while a path opens through them, instead of a special
case in the movement check.

`assets/game/` -- Math Battle.

| File | What it holds |
|---|---|
| `game.js` | Entry point: the screen state machine and timers |
| `screens.js` | Markup for each screen |
| `rounds.js` | Turns a boss's mechanic into a prompt and a set of options |
| `bosses.js`, `questions.js` | The content to edit when adding material |
| `storage.js` | Saved name and defeated bosses |
| `html.js` | A tagged template that escapes every value it interpolates |

## Built with

[Jekyll](https://jekyllrb.com/) + [GitHub Pages](https://pages.github.com/)
