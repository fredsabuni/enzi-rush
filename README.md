# Harakati za Enzi: Delivery Safari (mobile game)

A phone-first skateboard runner for the HZE cafés. Customers scan a QR code at the table, pick a nickname and skater, and deliver hot coffee across Dar (Kariakoo → Posta → Coco Beach → Victoria) while collecting beans. Scores go to a shared leaderboard (today / this week / all time).

## Run it
```
npm start                 # node server/server.js → http://localhost:8080 (no npm install needed, Node 18+)
PORT=3000 DATA_DIR=/var/hze npm start
```
- `/` is the game, `/crew.html` shows the cast, and `/qr.html?loc=victoria` makes a printable table poster. The `loc` tag is saved with each score so you can tell which branch a player came from.
- `/?autoplay=1` skips the menu (handy on a laptop). Keys: Space/↑ jump, ←/↓ brake, P pause.

## How it plays
- **Tap** to jump (hold for higher), **tap again in the air** to kickflip (double jump). **Hold SIMAMA** to brake.
- Each level is one order. **JOTO** (heat) drains as you ride, and a hotter cup earns a bigger delivery bonus (300 + heat × 10, plus 500 for no hits or fines).
- Point-eaters: red lights (Afande Trafiki fines 250), potholes, bodas, crows and chickens (100 each, or land on crows and chickens for +50), puddles (cool your coffee), open drains (lose a cup/life).
- Courses are generated from fixed seeds, so everyone rides the same streets and the rankings are fair.

## Code map (`game/`)
| file | what |
|---|---|
| `js/art.js` | All drawing: skater rig + the crew (Enzi, Zuri, Jabali), customers, hazards, pickups |
| `js/world.js` | Zone backdrops (sky, buildings, traffic, sidewalk) |
| `js/levels.js` | `LEVELS` (zone, customer, length, speed, light positions, hazard mix) + `SCORE` values + course generator |
| `js/game.js` | Physics, collisions, scoring, HUD, order/delivery cards |
| `js/app.js` | Screens, input, canvas sizing, main loop |
| `js/api.js` / `server/server.js` | Leaderboard client / server (JSON file in `server/data/`) |

**Tuning:** physics feel is `PHYS` in `game.js`. Point values are `SCORE` in `levels.js`. Difficulty is per-level `speed`, `len` and `mix`.

**Leaderboard API:** `POST /api/register {name}` returns a token (a name is locked to the phone that claimed it), `POST /api/scores`, `GET /api/leaderboard?period=today|week|all&name=`. "Today" and "week" use East Africa Time. The server rejects implausible scores, but it's a browser game, so treat prizes as for fun. Check the top scores before handing anything out.

---

# The Safari (marketing video, original project)

Vertical 1080×1920, 30fps. Everything is drawn in code on a canvas, rendered frame by frame in headless Chromium, and encoded with ffmpeg. Audio is synthesized in `audio.py` from the cue list.

## Scenes
`js/timeline.js` → `ORDER` is the running order. Each scene lives in `js/scenes/NN-name.js` and holds its own duration, dialogue, sound cues and choreography. **All times inside a scene file are seconds from the start of that scene.** If you change a `dur`, every scene after it shifts automatically.

| # | id | what happens |
|---|----|--------------|
| 1 | home | Man cave: couch + laptop → WhatsApp "Blaza, leo wapi?" → hoverboard + thought bubbles (Mbezi vs Victoria) → picks Victoria → grabs skateboard, out the door |
| 2 | kariakoo | Ride through the market; ollies a chicken and crates |
| 3 | baraka | Stop: Baraka (boda) offers a lift; "nina NGUVU!" |
| 4 | rush | NGUVU RUSH through Posta |
| 5 | coco | Coco Beach; ollies a crab |
| 6 | mzee | Stop: Mzee Juma (madafu): "Kila kikombe ni safari" |
| 7 | victoria | Busy Victoria streets; kids' football |
| 8 | neema | Stop: Neema at the daladala stage; aerobics at Mbezi |
| 9 | arrive | Brake, kick the board up, walk into HZE Victoria |
| 10 | cafe | Crowd cheers, barista greets, shared table, laptop, sip |
| 11 | complete | SAFARI COMPLETE card over the café |
| 12 | endcard | Logo, tagline, handle, locations |

## Common edits
- **Dialogue**: the `lines` array in the stop scene (`[start, end, speaker, Swahili, English]`).
- **Home scene copy/timing**: the `HOME` object at the top of `01-home.js`.
- **Café beats**: the `CAFE` object at the top of `10-cafe.js`.
- **Obstacles/beans on a ride**: `jumps` / `beans` in that scene file.
- **Reorder or drop a scene**: edit `ORDER` in `js/timeline.js`. The street scenes need at least one ride and one `arrive`.

## Render
```
node render.mjs list                     # scene start/end times
node render.mjs stills cafe@3.3 home@6   # spot-check frames → out/stills
node render.mjs scene home               # one scene → out/scenes/home.mp4
node render.mjs video                    # full video_noaudio.mp4 + events.json
python3 audio.py                         # audio.wav from events.json
ffmpeg -i video_noaudio.mp4 -i audio.wav -c:v copy -c:a aac -b:a 192k -shortest final.mp4
```
You can also open `index.html` in a browser for a live preview (`?t=12.5` freezes on a frame).
