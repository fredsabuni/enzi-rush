# Harakati za Enzi: HZE Games (mobile games hub)

Phone-first games for the HZE cafés. Customers scan a QR code at the table, land on the games hub, sign in once with a nickname and a 4-digit PIN, and pick a game. Scores go to a shared leaderboard per game (today / this week / all time).

## Run it
```
npm start                 # node server/server.js → http://localhost:8080 (no npm install needed, Node 18+)
PORT=3000 DATA_DIR=/var/hze npm start
```
- `/` is the hub, `/safari/` is Delivery Safari, `/safari/crew.html` shows the cast, and `/qr.html?loc=victoria` makes a printable table poster. The `loc` tag is saved with each score so you can tell which branch a player came from.
- `/safari/?autoplay=1` skips the menu (handy on a laptop). Keys: Space/↑ jump, ←/↓ brake, P pause.

## Players
- **Sign in on the hub:** nickname + 4-digit PIN. A new name creates the player; a known name + the right PIN signs them in on this phone.
- **Same phone:** the name and a secret token are kept in the browser, so returning players see "Karibu tena, NAME!" and go straight to the games. "Si wewe?" switches name.
- **New phone:** enter the same nickname and PIN. Up to 5 phones can be signed in to one name.
- **Safety:** 5 wrong PINs lock the name for 15 minutes. PINs are stored hashed (scrypt).
- **Players from before PINs** are asked once on the hub to set one. Until they do, their name can't be recovered on another phone.

## Adding a game
1. Make a folder `game/<id>/` with its own `index.html`. Load the shared player code with `<script src="../shared/api.js" data-game="<id>"></script>` and link `../style.css` / `../assets/` as Safari does.
2. In the game, send players without a name to the hub: `if (!API.name) location.replace('../?next=<id>/')`. Then use `API.submit(run)` and `API.board(period)`; they are tagged with the game id automatically.
3. Add an entry to `game/games.json` (`status: "live"` or `"soon"`) with an icon (square SVG/PNG).
4. Add the game's score limit to `GAMES` in `server/server.js`. Scores for games not listed there are rejected.

## Cryptic Crossword (`/cryptic/`)
A standard general cryptic, like the magazine's. **Quick** (small grid, about 3 min) is new every day at 05:00 EAT, and the **Weekly Classic** (15×15) is new every Monday at 05:00. Last week's Classic, with answers and explanations, appears under "Last week's solution".

- **Answers never reach the phone.** It gets the grid and clue text only. Checks, reveals, the "show definition" and "explain" hints, timing and scoring all happen on the server (`server/cryptic/api.js`).
- **Progress is saved on the server** every 10 s, per player, so a Classic started on a café tablet can be finished on a phone (same nickname + PIN).
- **Timer** only runs while the page is open and the player has touched it in the last minute.
- **Score** (spec §6.1): base 1000 / 10000, plus a time bonus under par (×2 Quick, ×1 Classic), minus hint costs (×1 Quick, ×5 Classic), plus 20% if no hints. Solves faster than 20 s (Quick) or 2 min (Classic) are kept off the board.

**Adding puzzles:** drop a JSON file into `server/puzzles/cryptic/` (format at the top of `server/cryptic/validate.js`). Check it first:
```
node server/cryptic/validate.js server/puzzles/cryptic/*.json
```
The checker prints the filled grid and catches clashing letters, wrong numbering, enumerations that don't add up, a definition that isn't at the start or end of the clue, and grids that aren't symmetric or have too many unchecked letters. The server picks up new files within 30 s, no restart needed, and skips (and logs) any file that fails the check. A puzzle goes live on its `date`. If no new Quick is dated for today, yesterday's stays up, so keep a week or two queued.

## Msako wa Maneno (`/msako/`)
A daily themed word hunt. Every day at 05:00 EAT there is a new 8×8 grid on one theme (Fruits, Dar neighbourhoods, Wanyama…) with 7–10 hidden words. Players swipe across the letters, or tap the first letter and then the last, to find words in any straight line, including backwards and diagonally.

- **Neno la siri:** the letters no word uses spell a Swahili phrase (read left to right, top to bottom). Guessing it before finishing earns +300; 3 tries, −50 for each wrong one.
- **Score:** 1000, plus 4 points a second under 4 minutes, plus 200 for no hints, plus the secret-phrase bonus, minus hints (first letter −60, reveal a word −150). Solves under 25 s stay off the board. Time only counts while the page is open and in use, same as the crossword.
- **No puzzle files to write.** Each day's grid is built from the date (`server/msako/api.js`), so everyone gets the same one and the server can rebuild it at any time. The phone gets letters and word lengths only; each swipe is checked on the server.
- **Adding themes or phrases:** edit `server/msako/themes.js` (words A–Z, 3–8 letters, at least 10 per theme). Restart the server. Changing the lists changes upcoming grids, and today's too, so do it before 05:00 if people are mid-game.
- `/msako/#jana` shows yesterday's grid with all the answers.

## How Delivery Safari plays
- **Tap** to jump (hold for higher), **tap again in the air** to kickflip (double jump). **Hold SIMAMA** to brake.
- Each level is one order. **JOTO** (heat) drains as you ride, and a hotter cup earns a bigger delivery bonus (300 + heat × 10, plus 500 for no hits or fines).
- Point-eaters: red lights (Afande Trafiki fines 250), potholes, bodas, crows and chickens (100 each, or land on crows and chickens for +50), puddles (cool your coffee), open drains (lose a cup/life).
- Courses are generated from fixed seeds, so everyone rides the same streets and the rankings are fair.

## Code map (`game/`)
| file | what |
|---|---|
| `index.html` | Games hub: sign-in, welcome back, set PIN, games grid |
| `games.json` | List of games shown on the hub |
| `shared/api.js` | Player sign-in + leaderboard client used by the hub and every game |
| `style.css`, `assets/` | Shared look, fonts, logo |
| `safari/js/art.js` | All drawing: skater rig + the crew (Enzi, Zuri, Jabali), customers, hazards, pickups |
| `safari/js/world.js` | Zone backdrops (sky, buildings, traffic, sidewalk) |
| `safari/js/levels.js` | `LEVELS` (zone, customer, length, speed, light positions, hazard mix) + `SCORE` values + course generator |
| `safari/js/game.js` | Physics, collisions, scoring, HUD, order/delivery cards |
| `safari/js/app.js` | Screens, input, canvas sizing, main loop |
| `server/server.js` | Static files + player/leaderboard API (JSON file in `server/data/`) |
| `cryptic/` | Cryptic Crossword: `app.js` (grid, typing, hints, screens), `cryptic.css` |
| `server/cryptic/` | Crossword API (`api.js`) and puzzle checker (`validate.js`) |
| `msako/` | Msako wa Maneno: `app.js` (board, swipes, hints, secret phrase), `msako.css` |
| `server/msako/` | Word hunt API and daily grid builder (`api.js`), word lists (`themes.js`) |
| `server/puzzles/cryptic/` | Crossword puzzles, one JSON file each |

**Tuning:** physics feel is `PHYS` in `game.js`. Point values are `SCORE` in `levels.js`. Difficulty is per-level `speed`, `len` and `mix`.

**API:** `POST /api/register {name, pin}` or `{name, token}` returns a token (409 taken, 403 wrong PIN, 423 locked). `POST /api/scores {name, token, game, score, duration, …}`. `GET /api/leaderboard?game=safari&period=today|week|all&name=`. "Today" and "week" use East Africa Time. The server rejects implausible scores, but these are browser games, so treat prizes as for fun. Check the top scores before handing anything out.

---

# Cryptic Crossword ad (`promo/cryptic/`)
A 23-second vertical ad (1080×1920, 30fps) for WhatsApp Status, Instagram and TikTok. Every frame is drawn on a canvas in `index.html`; the soundtrack (music + UI sounds) is made in code by `sound.mjs` from the cue list in the page.
```
node promo/cryptic/render.mjs                # → promo/cryptic/out/cryptic-promo.mp4
node promo/cryptic/render.mjs stills 5 12.5  # spot-check frames → promo/cryptic/out/stills/
```
Open `promo/cryptic/index.html` in a browser for a live preview with a scrubber (`?t=12.5` freezes a frame). Copy and timings live at the top of each scene function; scene start/end times are in `SC`. Needs ffmpeg and Playwright's Chromium (set `PLAYWRIGHT` and `CHROMIUM` if they're installed somewhere else).

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
