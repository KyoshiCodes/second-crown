# User notes / patch notes

Newest first. Plain language for playtesters.

## 2026-09-30 — Missing rim wall segments marked with timber stakes and trench lines (bakeoff/gemini-wall-gap)

- Open gaps in your perimeter **Wall Ring** are now visually obvious at a glance:
  - **Missing Rim Segments**: Every unbuilt perimeter tile along the outer rim of your settlement now shows a faint wooden boundary stake driven into the turf and a scored chalk/trench line tracing where the wall footing will run.
  - **Finished Walls & Gates**: Finished wall curtains and gates stay exactly as they are—no gap marks or stakes appear on completed segments.
  - **Closed Wall Ring**: Once every rim segment is complete and your wall ring is fully closed, all gap marks disappear completely.
  - Distinct from courtyard work plots: rim gap stakes are subtle, weathered timber pegs with no red ribbons and no gold hint rings, giving an immediate, intuitive read of where your defenses still need stone.
  - In winter, each stake top receives a gentle dusting of snow and frost.
- Purely cosmetic visual update; strictly `pointer-events: none` and never interferes with map clicks, camera movement, or building interactions.

## 2026-09-30 — Watchtower beacon lit when staffed, unlit and cold when empty (bakeoff/gemini-tower-unlit)

- Your **Watchtowers** now clearly signal whether a worker is stationed on lookout:
  - **Staffed Watchtower**: When a citizen or guard is assigned to the watchtower, its beacon fire burns bright with leaping orange flames, a radiant golden ambient halo, rising ember sparks, and a sparkling gold glint star atop the masthead.
  - **No Worker (Unstaffed)**: When no worker is stationed at the tower, the beacon fire is cold and unlit, showing only a quiet bed of dark charcoal and spent ash in the iron brazier basket with no flames, no glow, and no glint.
  - Supported across all cultural styles (Western stone lookout, Cedar Kin trestle cage, Sand Banner minaret cupola, Wind Host nomad pylon, and Tide Clans bamboo lighthouse).
- Purely cosmetic visual update; strictly `pointer-events: none` and never interferes with map clicks, zooming, or interactions.

## 2026-09-30 — Soft gold ground ring hint glow on empty work plots (bakeoff/gemini-hint-glow)

- Recommended building plots in your settlement now receive a **soft gold ground ring**:
  - **Hinted Empty Plot**: When the application suggests a building plot, that specific open plot is highlighted with a glowing 2:1 isometric golden ground circle with a breathing ambient light pool and shimmering cardinal pips.
  - **Other Empty Stakes Stay Plain**: Other open plots keep their plain wooden surveyor's stake with no gold ring.
  - **Low Opacity Courtyard Glow (Fallback)**: When no specific plot is targeted by the application, all open courtyard plots receive a subtle, low-opacity warm ground glow—softly signaling available building ground across the hold without visual clutter.
  - **Built Plots**: Built buildings and structures remain completely untouched with zero stakes and zero empty rings.
- Purely cosmetic visual update; strictly `pointer-events: none` and never interferes with map clicks, zooming, or building placement.

## 2026-09-30 — Wooden surveyor stakes on empty work plots (bakeoff/gemini-plot-stake)

- Open building plots in your settlement now receive a small **wooden surveyor's stake**:
  - **Empty Work Plots**: Every open, unbuilt plot in your courtyard turf has a small hand-carved oak peg driven into the ground, tied with hemp twine and a bright vermilion red surveyor's marker ribbon fluttering in the wind.
  - **Built Plots**: Once a building (or scaffolding) is placed on a plot, the stake is replaced by your construction, leaving existing buildings untouched.
  - **Rim & Cobblestone Streets**: The perimeter wall/gate rim and cobblestone roads remain completely clear and unblocked.
  - In winter, a delicate dusting of frost and snow rests on the head of each stake.
- Purely cosmetic visual update; strictly `pointer-events: none` and never interferes with map clicks, zooming, or building placement.

- Your **Keep** now visually reflects whether people reside in your hold:
  - **Hold Has People**: When citizens or garrisoned troops are in your settlement, the keep's hearth chimney burns bright with a warm golden hearth glow and lively, billowing smoke plumes rising and drifting across the roofline.
  - **Empty Hold**: When your hold has no people, the chimney fires die down to a quiet, faint lazy wisp—signaling an empty hold at a glance.
  - Supported across all cultural styles (Western ashlar chimney, Cedar Kin roof louvers, Sand Banner mudbrick chimney pot, Wind Host toono ring, and Tide Clans driftwood smoke cowl).
- Purely cosmetic visual update; never interferes with map clicks or interactions.

## 2026-09-30 — Closed gate lamp and warm slot (bakeoff/gemini-gate-lamp)

- Your hold's **Gate** now clearly signals whether your walls are secure:
  - **Closed Gate** (when your wall ring is complete): The gatehouse displays a lit wall lantern with a warm golden flame and ambient glow by the portal, along with a warm horizontal viewing slot in the closed double doors casting a cozy hearthlight spill onto the cobblestones.
  - **Open Gate** (when your wall ring is open or broken): The gateway is deep in shadow with the heavy portcullis raised high into the stone ceiling archway and no warm light, showing a clear entryway.
- Purely cosmetic visual update; never interferes with map clicks or interactions.

## 2026-09-30 — Finished quarry cut stone, crane and piles (bakeoff/gemini-quarry-yard)

- Finished **Quarries** now clearly showcase an active masonry workyard:
  - Deep granite quarry pit with stepped stone ledges and chiseled rock shelves.
  - Pallets of cut stone ashlar blocks neatly stacked with mortar seams.
  - A heavy wooden A-frame crane with a brass pulley and steel cable hoisting a cut granite block into the air.
  - Freshly quarried rubble piles on that tile, a wooden wheelbarrow full of stone, and a steel mason pickaxe.
  - Unfinished quarries under construction strictly show wooden timber scaffolding with staging decks and corner posts until finished.
- Purely visual update; never interferes with map clicks, camera, or tile interactions.

## 2026-09-30 — Watchtower beacon fire & gold glint (bakeoff/gemini-tower-beacon)

- Finished **Watchtowers** now clearly signal their presence and gold production across your hold:
  - An active, radiant **beacon fire** burns atop the tower brazier with leaping flames, a warm ambient glow, and rising embers.
  - A crisp **gold glint** star flashes on the beacon spire finial, catching the light and reinforcing its gold-yielding role.
  - Unfinished towers under construction strictly stay authentic wooden scaffolding with corner posts and hoists, with no fire or gold until completed.
- Purely visual update; never interferes with map clicks or interactions.

## 2026-09-30 — Where do I get stone and gold?

- Kingdom tab: if you can't afford Walls because of stone, a line tells you to build a Quarry and what it costs.
- Clicking an unscouted tile: if you're short on gold for a scout, a line tells you a Watchtower produces gold.

## 2026-09-30 — A robot played the opening (dev only)

- Nothing changed in the game. We added a bot that plays the first 20 minutes and writes what happened to `docs/PLAYTEST.md`.
- What it found: the rival raids your hold every ~50 seconds from the start. You start with no gold to scout and no stone for walls.

## 2026-09-30 — Seasonal board washes (bakeoff/gemini-season-wash)

- The overworld board now shifts with the cycle of seasons:
  - **Winter**: All provinces across the map are dusted with light frost and snow flecks, with delicate white frost rime along the ridges.
  - **Harvest**: Grain farms and open plains take on a rich, warm golden glow and golden wheat glints under the autumn sun, while rugged peaks and forests maintain their natural hues.
  - **Spring & Summer**: Preserves the clean, natural landscape look.
- Visuals are purely cosmetic and never block clicks or interactions on the map.

## 2026-09-30 — Lofi player stays put

- Pick a lofi track and it plays that track, and keeps playing it on repeat. It no longer jumps down the list.
- If a track can't be found, the music stops and says **Track not found. Pick another.**
- If your browser blocks sound until you click, it says **Autoplay blocked. Click to play.** Click anywhere and it starts.

## 2026-09-30 — Illustrated backdrops for keep rooms (bakeoff/gemini-rooms)

- The rooms inside your keep now each feature an illustrated 2D scene backdrop:
  - **Hall**: The grand **Throne Dais**, with elevated stone platform steps, a carved monarch throne with gold finials and crimson velvet cushion, warm torch sconces, and hanging royal tapestries.
  - **Wall**: The windy **Wall Walk**, showing stone rampart battlements with arrow slits, weathered timber sentry duckboards, burning iron braziers with rising embers, a sentry shield, and crossed spears overlooking a twilight horizon.
  - **Yard**: The bustling **Muddy Yard**, showing churned muddy earth with deep wagon wheel ruts, standing rainwater puddles with sky reflections, wooden bailey palisades, stacked barrels & crates, and a soldier training dummy.
- All backdrops sit cleanly behind your plots and buttons, without interfering with clicks or taps.

## 2026-09-30 — Rooms inside your keep

- Inside the keep there are now three tabs: **Hall**, **Wall** and **Yard**.
- **Hall** is the plot grid you already know: build, improve and cancel from here.
- **Wall** shows how tough your defences are: wall HP, how many walls sit on the edge, whether the ring is closed, and whether your gate is up.
- **Yard** lists the buildings touching your keep, the ones getting the keep-yard bonus.
- Switching tabs is just looking. It never changes your game.

## 2026-09-30 — Captains on the War tab

- Scouts, gather parties and enemy hosts coming at you now have a captain named on their card, like **Capt. Sigrun**.
- The same force keeps the same captain the whole time it's on the road, even after a reload. Just flavor: captains don't change any fight.

## 2026-09-30 — Cloud won't overwrite your newer game

- If you play on two browsers or tabs, an older one can no longer quietly wipe out newer progress in the cloud.
- When that happens, the Cloud panel says **Cloud has a newer hold.** Press **Load cloud** to switch to the newer game (the page reloads).
- Started a new game on purpose and want it in the cloud instead? Press **Keep this game**. It asks first, because the old cloud game will be gone.

## 2026-09-30 — Step inside your keep

- Click your home hold on the map, then **Enter the keep** on the card that opens. You get a close-up of your yard with every building on its plot.
- Tapping in there works just like tapping the map: an empty plot builds what you've picked, a building gets improved, and scaffolding gets cancelled. Pick what to build from the buttons at the bottom.
- Gold edges mean the building gets the keep-yard bonus. Grey plots on the edge are the rim, for walls and the gate.
- Leave with **Leave the keep**, Escape, or a click outside. The map is still there as before.

## 2026-09-29 — Safer cloud saves

- The cloud server now checks every save you push before keeping it. Normal play is not affected.
- If a push is refused, **Push save** tells you why. The most common one: "Cloud save is newer. Pull it before pushing." That means another device pushed more progress. Pull first so you don't overwrite it.
- If you push while the game is paused, the push can be refused. Unpause for a moment and push again.
- Your local save is never touched by a refused push.

## 2026-09-29 — Chill music option

- The top bar has a new **Music** picker: **Off**, **Lofi**, or **Realm** (the seasonal and holiday music).
- It starts on Off. Your pick is remembered on this browser.
- Lofi plays a playlist of 33 chill tracks (HoliznaCC0, CC0) one after another and starts over at the end. If a track can't load it jumps to the next one.
- With Lofi on, the top bar shows the song that's playing, ‹ and › buttons to skip back or forward, and a list of every song. Pick one to play it.

## 2026-09-29 — Primer rewritten

- The primer banner now points at the screens you actually see: the resource strip, work cards, People job cards, unit cards, the tile inspect card, War's force cards and Last battle, and the World log.
- Same nine steps, same order. Your saved primer progress carries over.

## 2026-09-30 — Clearer supply cart and haul silhouettes (bakeoff/gemini-supply)

- **Clearer Supply Cart**: Gather columns on the kingdom map now pull a distinct supply cart featuring a visible wooden draft yoke with brass hitch ring and reinforced timber draft shafts.
- **Supply Crates & Cargo**:
  - **Loaded Haul**: When returning with gathered resources or transporting goods, the cart appears fully loaded with sturdy timber crates, iron corner brackets, bulging burlap sacks, barrels, and strapped node materials (logs, quarry stone, gold, or wheat).
  - **Empty Return**: When heading back without cargo or recalled empty, the cart appears light and unburdened with bare floorboards, open timber side stakes, and an empty slate indicator.
- Warbands, scout cloaks, and garrison tents remain completely unchanged.

## 2026-09-30 — Seasonal weather particles (rain in autumn, snow in winter, clear otherwise)

- The world diorama and kingdom map now reflect dynamic seasonal precipitation based on your realm's current season and holiday:
  - **Autumn Rain**: During autumn and harvest/halloween seasons, gentle diagonal rain showers fall across the realm with subtle splash ripples on the ground.
  - **Winter Snow**: During winter and midwinter festivals, soft, crystalline snowflakes drift gently through the air with a soft cyan winter glow.
  - **Clear Skies**: In spring, summer, and clear seasons, the skies remain bright and clear with zero precipitation clutter.
  - **Non-Interfering & Click-Through**: All weather particles are purely visual and completely non-interactive (`pointer-events: none`), ensuring every tile, building, army, and button remains instantly clickable and responsive.

## 2026-09-29 — Tiles that are already a march destination get a faint ring

- Any map tile that is currently the destination of an active marching force now receives a faint, animated ring around the tile perimeter:
  - **Player Gold**: Tiles targeted by your own forces (scouting expeditions, supply gathers, garrison deployments, and attack marches) are encircled by a soft, luminous gold ring.
  - **Hostile Red**: Tiles targeted by enemy raiders or rival warbands are marked with a menacing, faint crimson hazard ring, giving you instant battlefield awareness of where enemy columns are headed.
  - **Fog of War Support**: If you send scouts into unexplored fog territory, the destination tile faintly gleams in gold beneath the cloud bank so you can easily track where your scouts were dispatched.
  - **Non-Interfering & Clickable**: The destination ring is soft and translucent, leaving the full terrain, buildings, camps, and units underneath crystal clear. Clicks on the tile pass cleanly through.
  - **Overworld Atlas Map**: The kingdom atlas map also reflects faint gold and crimson destination rings on provinces targeted by active marches.

## 2026-09-29 — Rival home keeps show small realm crest above keep

- Rival and foreign NPC home holds now display their distinctive realm crest floating proudly above their home keep:
  - **Heraldic Escutcheon Crests**: Each foreign realm capital displays a finely detailed miniature shield plaque floating over its keep, adorned with its faction colors and authentic heraldic charges:
    - **Iron March**: Crossed silver warblades on a crimson field with a gleaming brass boss.
    - **Silk Coast**: Golden nautical anchor and sea trident on coastal azure.
    - **Ash Nomads**: Steppe nomad broadhead arrowhead on warm terra cotta.
    - **Veil Theocracy**: Radiant eight-pointed dawn star on mystic purple.
    - **Glass Cities**: Faceted cyan prism diamond on turquoise.
    - **Frost Holds**: Six-pointed crystalline snowflake on glacial ice blue.
    - **Tide Princes**: Twin rolling ocean waves on seafoam teal.
    - **Ember Concord**: Rising fire comet on fiery orange.
    - **Bronze League**: Classical bronze arch and anvil on deep gold.
  - **Finial Crown & Breathing Glint**: Each crest features a miniature finial crown topper and a subtle breathing light glint, signaling sovereign capital status across the continent.
  - **Player Home Stays Unchanged**: Your own royal keep retains its iconic golden coronet crest and gilded royal frame, untouched and instantly recognizable as your home.
  - **World Atlas Map**: The overworld kingdom atlas also displays matching miniature realm crests above foreign capitals with non-blocking click behavior.

## 2026-09-29 — Light seasonal and holiday tint on world board tiles

- World map tiles now dynamically pick up a subtle seasonal tint that reflects the current season and active holidays:
  - **Spring Green**: A gentle, fresh pastel green wash brings the awakening of spring across all explored tiles.
  - **Summer Warmth**: A delicate warm sunbeam tone bathes summer territories.
  - **Autumn Gold**: A luminous amber and golden glow tints the harvest landscape.
  - **Winter Cool**: A crisp, cool cyan frost tint settles over winter provinces.
  - **Holiday Packs**: When holiday events or packs are active (All Hallows Eve, Midwinter Tide, Dawn Feast, Harvest Moon, Midsummer), tiles take on the distinctive holiday atmospheric glaze (e.g. mystical Halloween purple, Midwinter icy cyan).
  - **Terrain Detail Stays Clear**: The tints are light, translucent washes designed to enhance atmosphere without hiding any terrain features—plains, hills, forests, peaks, rivers, trees, and camps remain crisp, distinct, and fully visible.
  - **World Atlas**: The kingdom atlas map also reflects the seasonal glaze across seen lands while keeping clicks and interactions completely seamless.

## 2026-09-29 — Seconds countdown badge on marching board meeples

- March meeples in motion across the tabletop board now show a tiny seconds countdown badge above their heads:
  - **Live Seconds Remaining**: Whenever a column (scouts, gathers, garrisons, player warbands, or incoming hostile warbands) has an arrival time, a tiny badge counts down the remaining seconds until arrival (e.g. `4s`, `18s`, `0s`).
  - **Color-Coded Status & Mission Types**:
    - Player war columns feature a warm golden border and hourglass pip.
    - Scouts feature a bright cyan recon border.
    - Foraging gathers feature an emerald green harvest border.
    - Garrison detachments feature a royal blue shield border.
    - Hostile incoming warbands feature a crimson hazard border and tiny skull icon.
  - **Non-Blocking Clicks (`pointer-events: none`)**: The badges are strictly non-interactive and transparent to clicks, ensuring clicking on a province, march, or token underneath works smoothly without hindrance.
  - **Atlas Mini-Map**: The kingdom atlas map also reflects the march seconds countdown badge above meeples in transit.

## 2026-09-29 — Unseen tiles cloud veil & clear seen tiles

- Unseen, unscouted provinces are now shrouded in a rich, billowy cloud veil that is unmistakable from normal terrain:
  - **Easier to Tell Apart from Terrain**: The cloud veil floats high above the map table with soft aerial shadows, cool celestial sky-mist undertones, multi-tiered billowing cumulus cloud mounds, sunlit white crests, and curving wind wisps, making it impossible to confuse with rocky peaks, snowy mountains, or plain terrain.
  - **Uncharted Compass Rose**: An antique brass cartographer compass rose with a warm golden star glints subtly at the center of each cloud bank, marking uncharted lands.
  - **Seen Tiles Stay Clear**: Provinces you have scouted or settled stay completely clear with their full terrain textures, cliff faces, resource piles, camps, and keeps.
  - **Kingdom Atlas**: The world atlas map now also blankets unexplored provinces in the same handsome cloud veil while letting you click to inspect and scout them.

## 2026-09-28 — Keep-yard annexes and construction scaffolding on home tile

- Your home tile keep now displays your finished hold buildings as small architectural annexes nestled around the keep, rather than a flat vertical stack:
  - **Finished Annexes**: Buildings sharing an edge with your keep (granaries, sawmills, barracks, chapels) appear as miniature architectural wings around the keep with sunlit masonry facets, gabled roofs, warm candlelit doorways, and distinctive courtyard details (grain sacks, firewood cords, cut stone blocks).
  - **Unfinished Scaffolding**: Buildings currently under construction appear as timber scaffolding with corner posts, cross-beams, diagonal X-bracing, staging planks, and a builder's hoist suspending a stone block.
  - **Natural 3D Depth**: Rear buildings appear naturally behind the keep while front buildings appear in front of it, framing your royal seat with an evolving courtyard cluster as your kingdom grows.
  - **Atlas Map**: The kingdom atlas map also reflects finished annexes and construction scaffolding around your home keep.

## 2026-09-28 — Hold gatehouse open vs shut doors

- Your hold's gatehouse now dynamically shows whether your perimeter defenses are open or securely shut:
  - **Shut Doors When Ring is Closed**: Once your kingdom encloses the hold with a complete wall ring (8 or more rim walls plus a rim gate), the gatehouse double doors shut tight with heavy iron straps, rivets, a center drop bar, and a lowered protective portcullis.
  - **Open Doors When Ring is Open**: Before the ring is closed (or if walls are unbuilt), the gatehouse doors are swung wide open inward against the stone jambs, revealing an open cobblestone threshold and warm lantern glow pouring from the courtyard within, with the portcullis hoisted high overhead.
  - **All 5 Cultures Styled**: Customized door carpentry and ironwork across Western ashlar stone, Cedar split-timber, Sand desert brass, Steppe barred wood, and Islands driftwood styles.

## 2026-09-28 — Rim wall battle scars & missing merlons on low wall HP

- When your kingdom's rim walls suffer damage during sieges or when wall HP is low, the rim wall art now visually reflects that battle damage:
  - **Fissures & Cracked Stone**: Jagged structural impact cracks and stress fractures run down the curtain walls, with fallen stone chips scattered along the base.
  - **Missing & Chipped Merlons**: Battlements are dynamically scarred during attacks—sections of merlons are shattered away leaving crumbled mortar stumps and jagged gaps, while other merlons show chips and cracks.
  - **Corner Bastions & Gate Wings**: Corner watchtowers and connecting gatehouse wings also display knocked-out battlements and stress fractures when defenses are compromised.
  - **Full HP Walls Stay Intact**: Walls that are at full HP or in peaceful times stay completely pristine with smooth ashlar masonry, clean coping stones, and 100% full-height merlons.

## 2026-09-28 — Clearer tent and flag for player camps and outposts

- Player camps and territory outposts across the tabletop board now display an unmistakable, handsome pitched canvas tent and waving heraldic flag:
  - **Canvas Pavilion Tent**: A sturdy military pavilion tent with sunlit canvas roof panels, timber ridgepole, faction-colored valance trim, open arched entryway, and a warm amber lantern glowing invitingly inside.
  - **Nomadic Yurts for Steppe Clans**: When playing or occupying as the Steppe culture, outposts feature authentic circular nomadic felt yurts with conical roof domes and wooden crowns.
  - **Hardwood Flagpole & Fluttering Standard**: A tall hardwood flagpole crowned with a polished golden finial and an animated swallowtail banner waving in the wind, emblazoned with your realm's heraldic colors.
  - **Guy Ropes and Timber Pegs**: Angled tension ropes pegged into the turf firmly anchor each encampment to the terrain.
  - **Wild Camps**: Neutral camps on the board now look like authentic weathered field camps with red pennants instead of flat red polygons.
  - **Atlas Overworld Map**: The mini Overworld Atlas also features the new mini tent and flag on claimed outposts and camp nodes, with complete click transparency so clicking provinces remains effortless.

## 2026-09-28 — Resource node stock piles on the map diamond

- Resource provinces that have stores of lumber, grain, or stone now display an authentic small stock pile directly on the isometric diamond tile:
  - **Timber Stands (`woodcut`)**: Stacks of hewn pine logs resting on timber skid rails.
  - **Forage Fields (`field`)**: Burlap harvest grain sacks gathered on threshing mats with golden grain stalks.
  - **Quarry Outcrops (`quarry`)**: Piles of cut ashlar stone blocks with sunlit facets.
- **Empty Nodes Stay As They Are**: When a resource node is depleted or holds zero stock, no pile is drawn on the diamond tile, keeping depleted provinces clean and visually distinct without flashing warning indicators.
- Both the main 3D tabletop diorama and the Overworld Atlas display these matching stock piles.

## 2026-09-28 — Ledger cards with quill / ink pip

- Each line in the Ledger of Crowns now features a handsome 16–20px scribe's quill and inkpot pip:
  - **Scribe's Quill & Inkpot**: A detailed feather quill poised beside an inkpot with fresh liquid ink and a hanging droplet.
  - **Rubricated Ink Tints**: The ink color dynamically matches the event: red ink for battles and defeats, radiant gold ink for victories and truces, imperial sapphire ink for marshal appointments, and classic blue-black chronicler ink for kingdom records.
  - The pip art is completely click-transparent, so selecting cards or clicking ledger rows is never blocked.

## 2026-09-28 — Ledger cards

- The Ledger of Crowns on the Crown tab now shows each entry as its own small card: the tick on the left, what happened on the right. Newest is still on top.

## 2026-09-27 — Selected board province gold rim & ground ring

- The currently selected province on the board and overworld atlas now features a much clearer, vibrant golden visual highlight:
  - **Tabletop Ground Ring**: An illuminated golden ring with corner bracket studs encircles the base of the selected province directly on the tabletop, clearly identifying which tile is active even when inspecting elevated hills and mountains.
  - **Radiant Gold Top Rim**: A brilliant gold rim with sunlit facet glints crowns the elevated plateau of the tile.
  - **Vertical Cliff Struts**: For raised hills, forests, mountains, and holds, vertical golden struts hug the cliff corners, connecting the top plateau down to the ground ring.
- Selection remains illuminated even when you move your mouse to command marches or inspect reports.

## 2026-09-27 — Event cards & 24px omen pip

- World events on the Crown tab now appear as chronicle cards with authentic 24px omen pips:
  - **Comet Pip (24px)**: A blazing celestial star portent cutting across the night sky with streaking fiery tails and astral sparks (seen on tributes and cosmic wonders).
  - **Raven Pip (24px)**: An ominous perched raven with a keen, glinting eye and obsidian plumage, heralding levies of war and dark portents of spoilage.
  - **Harvest Pip (24px)**: An auspicious golden wheat sheaf tied with a crimson ribbon and radiating solar glints, heralding bountiful harvests and timber windfalls.
- The newest event is highlighted at the top, followed by Advisor Mira's counsel, with past events neatly organized in a card grid below.
- All omen pip art is completely click-transparent, ensuring instant, unobstructed button clicks.

## 2026-09-27 — Quest cards & 24px scroll pip

- Quests now appear as royal mandate cards:
  - **Scroll Pip (24px)**: An authentic medieval parchment scroll with roller rods, sepia script, and a signet wax seal. When your quest is fulfilled and ready to claim, the scroll **ignites with warm golden illumination** and shining star sparkles!
  - **Progress Tracking**: A clean progress bar shows completion status (0/1).
  - **Claim Button**: Collect your gold reward with a single, clear button click when the mandate is fulfilled.
- All scroll pip art is completely click-transparent, ensuring instant, unobstructed claiming.

## 2026-09-27 — Diplomacy realm cards & 28px realm crest pip

- The War tab's Odds and Varric diplomacy sections are now unified into dedicated diplomacy realm cards:
  - **Realm Crest Pip (28px)**: Displays each kingdom's authentic heraldic shield. When a realm is hostile or at war, its crest turns **colder** with an icy frost contour and chilly blue-steel sheen, contrasting with the warm emerald or amber glow of peaceful realms.
  - **Stance & Truce Timer**: Clear labels (Friendly, Truce, Wary, Hostile, At war) with a live countdown for active peace treaties.
  - **Diplomatic Opinions**: Displays both their opinion of you and your opinion of them.
  - **Power Balance Odds**: Direct side-by-side power comparison with percentage share, color-coded in green when favored and red when unfavored.
  - **Direct Actions**: Declare war or send gold gifts directly from each kingdom's card.
- All realm crest art is completely click-transparent, ensuring instant, unobstructed button clicks.

## 2026-09-27 — Royal decree cards & 24px wax-seal pip

- Each royal decree on the Crown tab is now presented as a royal proclamation card:
  - **Decree name & blurb**: Clear description of the temporary age-long bonus provided.
  - **Cost breakdown**: Displayed with 16px resource pips. Insufficient funds highlight in red.
  - **Issue command**: Swear the decree with a single click. The card tracks remaining time with a live countdown (`X seconds left`).
  - **24px Wax-Seal Pip**:
    - Stamped with the royal signet matrix and hanging silk ribbon tails.
    - When active, the seal is **lit** with molten amber-gold radiance, a four-pointed star glint on the crown peak, and living candle flicker!
    - When dormant, it displays as deep crimson pressed wax.
- All wax-seal art is completely click-transparent, so swearing decrees is instant and unobstructed.

## 2026-09-27 — Last battle card & 28px clash pip

- The War tab's Last battle section is now a dedicated battle card showing who fought, who triumphed, and an authentic 28px clash pip:
  - **Crossed Blades**: Two crossed forged steel arming swords with gold pommels and a bright clash spark, glowing with green victory light when you win.
  - **Broken Shield**: A shattered, iron-rimmed heater shield cleaved down the center with red embers when you suffer a defeat.
- Read the combat report line, Butcher's bill phase, and expand "Blow by blow" to inspect round-by-round combat events.
- All clash pip art is click-transparent so card inspection and expanding combat details is instantaneous.

## 2026-09-27 — Market offer cards

- Each Market trade on the Kingdom tab is now its own card: what you give, what you get, and a Trade button.
- The button greys out when you cannot pay (or have no Market). The amount you are short on turns red.
- Prices are the same as before.

## 2026-09-24 — War force cards & 24px war chips

- Military operations on the War tab now appear as dedicated tactical force cards:
  - **Incoming hostiles**: Red warband pip with horned barbarian crest and spiked flail, glowing with a menacing red shadow. Sally out your defenders directly from the card.
  - **Scouts in the field**: Twilight cloak pip with spyglass telescope, bordered in blue. Recalling scouts returns them to the hold.
  - **Gathering convoys**: Timber wagon cart pip with tied sacks and spoke wheels, bordered in golden amber. Recalling gathers packs up and hauls goods home.
  - **Garrisons**: Field pavilion tent pip with leaning spear, shield, and lantern, bordered in emerald green.
- Every force card displays destination province coordinates, countdown time to arrival ("posted" or `${seconds}s`), and clear Sally or Recall commands.
- All 24px military chips are completely click-transparent, ensuring instant, unobstructed button clicks and targeting.

## 2026-09-24 — People cards & walker role pips

- People on the Kingdom tab now sit in trade cards with walker role pips:
  - Farmers carry a field hoe and golden wheat sheaf.
  - Woodcutters carry a bearded broadaxe and pine log.
  - Miners carry a quarry pickaxe and stone/ore.
  - Merchants carry a minted royal gold coin with star glints.
- Idle villagers sit peacefully on hay bales, pine logs, or stone blocks, resting until assigned.
- Assigned workers walk with a 2-frame stride, swaying their tools as they walk to their posts.
- All walker pips pass clicks straight through, so posting workers and idling hands is fast and smooth.

## 2026-09-24 — Army cards & 28px culture-kit chips

- Levies and companies on the Army tab now sit in dedicated unit cards:
  - Each card shows the unit's culture-kit icon (militia, spearman, archer, skirmisher, cavalry, knight, champion, siege).
  - Cards show unit power, levy costs, and training duration at a glance.
- Locked units (like cavalry and knights needing Horse lore, or siege needing Siege craft) are greyed out with clear study requirements.
- The unit art is completely click-transparent, so tapping cards to drill companies is instant and reliable.

## 2026-09-24 — Kingdom works & isometric hall chips

- Finished kingdom buildings now sit in tidy work cards, showing their level, location, staffing status, and Demolish/Repair actions.
- Each work card features a 24px isometric hall chip illustrating the building (cottages, farms, lumber camps, quarries, barracks, chapels, etc.):
  - Staffed buildings glow brightly with warm lit windows and active hearth smoke.
  - Unstaffed buildings appear dim and quiet.
  - Scarred buildings show jagged stone crack fractures across the hall.
- All chips are click-transparent, so tapping Demolish or Repair always responds instantly.

## 2026-09-24 — Animated resource ledger & stacked stores

- Food, wood, stone, and gold sit in a carved timber ledger with lively animated icons:
  - Food shows a tied burlap grain sack.
  - Wood shows a felled timber log with tree rings.
  - Stone shows a dressed cubic ashlar block.
  - Gold shows a minted royal coin.
- When the food larder is empty or nearly bare, the grain sack slumps flat to the ground (matching your tired soldiers).
- When any store is completely full, its icon stacks high into towering piles—sacks piled high with wheat, cords of logs, fortress stone piers, and towering coin stacks.
- All icons pass mouse clicks straight through, so hovering cells for vault safety information works seamlessly.

## 2026-09-24 — Inhabited shell & stamped tabs

- The Crown lectern and realm cards glow with faint candle flicker and drifting dust motes, framed in gold.
- Kingdom tabs look like stamped metal plates, with an amber lantern marking whichever tab is active.
- The tutorial primer sits on parchment with a crimson wax seal; "Done with this step" and "Skip primer" remain bold and clear.
- All buttons and controls respond instantly—the atmosphere never gets in the way of clicks.

## 2026-09-24 — Host hunger

- Army tab shows how much food the host eats.
- If the larder is empty, soldiers on the hold look tired. Fill food and they stand up again.

## 2026-09-23 — Eyes on the rim

- Kingdom shows Vision, Watchtowers, and Scout cost.
- Finished rim towers are taller and carry a beacon. Towers still building are scaffolding.

## 2026-09-22 — Walls, scars, incoming

- Kingdom and your home tile show wall ring N/8, open/closed, wall HP, gate HP.
- Rim walls join into a ring. Gate sits in the ring.
- Scarred halls list on Kingdom with Repair (8 stone). Damaged halls look cracked, no chimney smoke.
- War lists incoming columns. Enemies on the board use a red warband, not your own march.
- Posted garrisons list with Recall. Flags with a garrison show a tent.
- Scouts and gathers list with time left. Board meeples differ: cloak, cart, war.
- Resource tiles show stock left (e.g. 12/40). Piles look smaller when empty.
- Treat wounded on Army: 4 food, back as militia in 5 seconds.
- Academy shortens *new* studies by 20%. Lectern buttons show real seconds.
- Market: gold↔stone, food→stone, wood→food, plus older stalls.

## How to play the loop

1. Kingdom — raise cottages, staff farms/camps, pair works, fill stores.
2. Crown — study when a hall and Keep allow it.
3. Army — queue companies, treat wounded, watch upkeep.
4. Board — march, gather, scout, garrison. Columns fight columns, not the whole home army.
5. War — incoming, last fight, decrees.

Live: http://129.153.17.72:8787/ — hard refresh after a deploy.
