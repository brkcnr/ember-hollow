# Ember Hollow · Autonomous Dungeon

![Ember Hollow with live status report](assets/preview.jpg)

A small, original, top-down dungeon crawler that plays itself forever. Inspired by the autonomous exploration loop in [Auto Adventurer](https://kody-w.github.io/learnwithkody/demos/77-auto-adventurer.html), independently implemented with Canvas 2D. No external assets, packages, network requests, controls, menus or audio. A live status report sits beside the dungeon.

## The scene

A blocky pixel adventurer in a teal shirt and blue trousers explores a procedurally connected dungeon. Line-of-sight fog reveals walls and floors as it travels; explored areas remain dimly visible. The adventurer automatically finds paths, fights pixel skeletons, moss zombies and cave spiders, collects gold, relics and potions, heals when hurt, gains experience and levels, finds the stairs and descends. Enemies become stronger at deeper levels. Death fades into a new run with a fresh dungeon and reset equipment. Torchlight, dust, attack arcs, pickup rings and subtle scanlines animate the map.

This replaces the first side-view prototype. All rendering and simulation are original; no code or assets were copied from the reference. The status sidebar shows health, attack/defense, level and XP, depth and turns, kills and gold, survival, map exploration, inventory and the current goal. Session records track deepest depth, most kills and longest survival across automatic restarts. A bounded action log reports real discoveries, fights, loot, healing, leveling and descents. Records reset when the page is reloaded; they are not saved to disk. The report is informational and requires no input. Add `?hud=0` for the scene-only screensaver view.

## Character sprites

Original blocky pixel characters with directional walk animations.

![Adventurer, skeleton, zombie and spider](assets/characters.jpg)
