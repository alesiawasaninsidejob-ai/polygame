# Polygame: Tribes of the Square World

A turn-based tribal 4X browser game modeled on the gameplay of The Battle of Polytopia. All art is drawn procedurally on a canvas, all sounds are generated with WebAudio, and all names and text are original.

## Run
    npm install
    node server.js            # PORT=8090 default; ROOMS_FILE=data/rooms.json
    open http://localhost:8090
Expose it publicly with any HTTPS tunnel, e.g. `cloudflared tunnel --url http://localhost:8090` (needs outbound TCP 7844).

## Test
    node test.js   # 26 tests: rules, buildings, ships, monuments, specials, diplomacy, fog view, AI difficulty, save/load, server (fog, turn sync, rejoin, persistence+restart, timer, hardening)

## Features
* **Local play**: vs AI (Easy, Normal, Hard or Crazy) or hot-seat, with an optional turn timer. Autosaves, named saves in the browser, and download/upload of save files.
* **Online play**: rooms with a 5-letter code and a share link (`?room=CODE`). The server is authoritative and sends each player only a fog-filtered view: unexplored tiles, unseen units and other tribes' stars are withheld. Seats can be rejoined with a per-tab token. Turn timers auto-end idle turns. Rooms persist to disk and are restored after a restart, and there is in-game chat.
* **Hardening**: 16 KB message cap, rate limiting, name and chat sanitizing, protection against static-file path traversal, a CSP header, a room cap, and a `/health` endpoint.
* **Tribes**: 8 tribes, each with its own city roof style, unit headgear and super unit. Two special tribes: Tidefolk (amphibious) and Wildroot (forest-walkers).
* **Units**: Warrior, Archer, Rider, Defender, Swordsman, Catapult, Knight and Mind Bender, plus 7 super units. Ships come from ports as rafts and are upgraded with stars: Raft → Ship (5, Sailing) → Battleship (15, Navigation). Veterans form after 3 kills.
* **Economy**: windmills, sawmills and forges give population for each adjacent farm, lumber hut or mine. Also ports, shrines, temples, roads, and clearing, burning or growing forests. Five monuments are unlocked by achievements.
* **Diplomacy**: you can only deal with tribes you have met. Peace treaties block attacks and captures, and you can declare war. With the Diplomacy tech, each treaty also gives +1 star per turn.
* Animations (unit tweens, damage numbers, death puffs, waving water, spinning mills), sound effects with a mute toggle, and touch controls (tap, drag, pinch) with a mobile layout.
