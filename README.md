# Ember Hollow · Autonomous Dungeon

![Ember Hollow with live status report](assets/preview.jpg)

A small, original, top-down dungeon crawler that plays itself forever. Inspired by the autonomous exploration loop in [Auto Adventurer](https://kody-w.github.io/learnwithkody/demos/77-auto-adventurer.html), independently implemented with Canvas 2D. No external assets, packages, network requests, controls, menus or audio. A live status report sits beside the dungeon.

## The scene

A blocky pixel adventurer in a teal shirt and blue trousers explores a procedurally connected dungeon. Line-of-sight fog reveals walls and floors as it travels; explored areas remain dimly visible. The adventurer automatically finds paths, fights pixel skeletons, moss zombies and cave spiders, collects gold, relics and potions, heals when hurt, gains experience and levels, finds the stairs and descends. Enemies become stronger at deeper levels. Death fades into a new run with a fresh dungeon and reset equipment. Torchlight, dust, attack arcs, pickup rings and subtle scanlines animate the map.

This replaces the first side-view prototype. All rendering and simulation are original; no code or assets were copied from the reference. The status sidebar shows health, attack/defense, level and XP, depth and turns, kills and gold, survival, map exploration, inventory and the current goal. Session records track deepest depth, most kills and longest survival across automatic restarts. A bounded action log reports real discoveries, fights, loot, healing, leveling and descents. Records reset when the page is reloaded; they are not saved to disk. The report is informational and requires no input. Add `?hud=0` for the scene-only screensaver view.

## Run locally

Open **standalone.html** in Safari or another modern browser. This complete offline version needs no companion files. Enter fullscreen using the browser's own command.

For an HTTP preview, run this inside the project folder:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Visit **http://127.0.0.1:8765/**. Keep the server running while using that address; Control-C stops it. If the port is busy, choose another port. The editable `index.html` also opens directly in a normal browser. Python is only an optional preview/export tool, not a runtime dependency.

## WebViewScreenSaver

In WebViewScreenSaver's Options, add the deployed HTTPS URL or the localhost address above. Set duration to **-1** to stay on the page indefinitely. For an offline installation, copy `standalone.html` to a folder such as `~/Screensavers/EmberHollow/`, then use:

```text
file:///Users/YOUR_MAC_USERNAME/Screensavers/EmberHollow/standalone.html
```

Replace the username with yours. Keep this offline copy outside Documents, Desktop and Downloads: the [upstream configuration guide](https://github.com/liquidx/webviewscreensaver#configuration) says those folders can be inaccessible to the screensaver on Catalina and newer. The page starts immediately without audio autoplay permission or user input. JavaScript must be enabled. Verify playback with the full macOS screensaver preview; browser testing does not confirm every native screensaver version.

## GitHub Pages

Publish the contents of this folder at the repository root, with `index.html` at the top level. No build step is needed; relative asset paths support project subpaths and `.nojekyll` enables static publishing.

1. Create an empty GitHub repository named `ember-hollow` (public works with GitHub Free).
2. From this project folder, replace the username and run:

```sh
git init -b main
git add .
git commit -m "Add autonomous dungeon screensaver"
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/ember-hollow.git
git push -u origin main
```

3. Open the repository's **Settings → Pages**.
4. Choose **Deploy from a branch → main → /(root) → Save**.
5. Wait for deployment and open the live URL displayed in Settings. It normally looks like `https://YOUR_GITHUB_USERNAME.github.io/ember-hollow/`.
6. Add that URL to WebViewScreenSaver, duration `-1`.

Later commits pushed to `main` republish automatically. See the [official Pages guide](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Structure

```text
index.html          Editable entry point
style.css           Responsive dungeon / report layout and ambient mode
js/core.js          Dungeon generation, visibility, pathfinding, AI, combat, runs
js/sprites.js       Original directional pixel characters and walk animation
js/render.js        Glyph map, light, particles and animation
js/status.js        Live read-only report and bounded event log
js/main.js          Fixed-step simulation and rendering scheduler
standalone.html     Generated all-in-one offline version
tools/export.py     Rebuild portable HTML (Python standard library)
tests/soak.cjs      Generation, lifecycle and long-run checks
.nojekyll           GitHub Pages static publishing
```

## Optional URL settings

`?seed=cloister` repeats a dungeon sequence. Omit the seed for a new sequence on each page load. `?fps=60` requests 60 rendering frames per second; default is 30. Combine them as `?seed=cloister&fps=60`. The simulation uses 30 steps per second in either mode. There is no on-screen configuration. `?hud=0` hides all status panels and headers; combine options as `?seed=cloister&fps=60&hud=0`.

The 960 × 540 canvas fits the dungeon panel beside the live report. In `hud=0` mode it fills a 16:9 screen. Other aspect ratios contain the entire map without stretching or cropping it, with dark margins. The logical map has 48 × 25 tiles. Three environment palettes cycle with depth. Background dust moves independently; the top-down map stays stable so the route is easy to follow.

## Verification and editing

With Node.js installed:

```sh
node tests/soak.cjs
```

Checks include connectivity across 500 generated maps, walkable placement, death/restart and descent lifecycles, plus twelve simulated hours for each of six seeds. They check continued exploration, combat and collection, finite positions, AI progress and bounded entities/effects and status events. They also verify that session records survive an automatic restart. This is a simulation check, not a wall-clock battery or native WebViewScreenSaver test.

Effects are capped at 120 transient particles and 12 rings. Floor entities, visibility arrays and decorations are replaced on each descent or restart. Hidden pages pause; waking resets timing and avoids catch-up bursts. The adventurer uses a frontier search and shortest paths to find unexplored tiles; after 105 seconds on a floor it heads toward the stairs to ensure continued travel.

Edit character palettes and shapes in `js/sprites.js`, or environment colors and glyphs in `js/render.js`, dungeon generation or AI in `js/core.js`. Rebuild the portable version after changes:

```sh
python3 tools/export.py
```

Reload the browser, and commit both editable sources and `standalone.html` when publishing updates.

## Character sprites

Original blocky pixel characters with directional walk animations.

![Adventurer, skeleton, zombie and spider](assets/characters.jpg)
