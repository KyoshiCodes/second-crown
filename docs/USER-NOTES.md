# User notes / patch notes

Newest first. Plain language for playtesters.

## 2026-11-11 — Season line with a Claim button on the Kingdom tab (wave/season-claim, not merged yet)

- **Season line.** The Kingdom tab now has a line under your hold's name that shows the current season, how long is left in it, and the season court reward. Example: **Season · Spring · 0.6 days left (200s) · season court ready: +40 food**.
- **Claim button.** When the reward is waiting, the line turns green and shows a **Claim** button. Press it to collect. After that the button disappears until the next season and the line says which season comes next.
- **Same reward as before.** This is the same once-per-season reward as the Season court card on the Crown tab. You can claim it in either place, not both.
- **Why the days are small.** A season is shorter than one game day (about 200 real seconds), so the line counts in tenths of a day. The number in brackets is real seconds.

## 2026-11-11 — Tribute line is back on diplomacy cards

- **Tribute status line restored:** realm cards on the War tab and crown cards on the World tab again show a one-line tribute status above the buttons (cost, opinion gain, and "ready", how much gold you are short, or that standing is already as high as it goes).
- **Gift button is gated again:** the Gift button greys out when you cannot send a gift, and its label shows the real opinion gain (for example +17 with the Court doctrine).
- The glowing tribute coffer pip from the last update is unchanged.

## 2026-11-11 — Living gift and tribute pips on diplomacy realm cards (bakeoff/gemini-diplomacy-gifts)

- **Living tribute coffers on realm cards:** Diplomacy cards in both the War Room (War tab) and Known Crowns (World tab) now feature animated living tribute pips:
  - **Ready to send tribute:** When your treasury holds at least 15 gold to send a diplomatic tribute or gift, a glowing golden tribute coffer appears in the top corner of the realm card and beside the gift button, pulsing with a warm amber breathing aura and shimmering coin sparkles.
  - **Tribute dispatched celebration:** When you send tribute to a realm, the coffer bursts with a luminous celebratory gold glow, an expanding celebration ripple ring, and rising golden dust motes to confirm your diplomatic envoy was received with thanks.
- **Clear treasury reading:** If you lack the 15 gold required to dispatch tribute, the badge rests quietly and the button pip dims to a calm bronze silhouette.
- **Non-intrusive:** All gift pips, glow effects, and celebration rings are strictly visual (`pointer-events: none`) and will never block button clicks, war declarations, or text reading. No game mechanics or sim math were changed.

## 2026-11-11 — Living unit chips for unique culture units (bakeoff/gemini-culture-units)

- **Living heraldic chips for unique culture troops:** The five cultures that muster unique martial units now feature distinct, animated 28px living chips:
  - **Mist Reach Rangers:** Hooded bowman with a drawn hunting bow, veiled in a breathing mist-blue aura and drifting morning fog wisps.
  - **Glen Holds Banners:** Highland battle standard bearer with a fluttering emerald pennant and wind-blown glen pollen.
  - **Salt Reaches Outriders:** Coastal desert cavalryman with a curved sabre, silver charge aura, and trailing salt-dust motes.
  - **Fen Steads Wardens:** Marshland sentinel with a reed-wrapped spear, mossy vitality glow, and swaying wetland rushes.
  - **Peak Holds Lancers:** Heavy plate knight with a couched frost lance, glacial blue aura, and drifting mountain frost crystals.
- **Where to see them:** In the Culture Picker when reviewing your realm's heritage, beside the unique unit name in each culture card, and in the Balance Notes culture breakdown table.
- **Subtle & non-blocking:** All chips and animations are strictly decorative (`pointer-events: none`), honoring reduced-motion preferences and never obstructing clicks, culture selection, or text readability.

## 2026-11-11 — Living heal glow and bandages on wounded units (bakeoff/gemini-infirmary)

- **Field bandages on wounded troops:** When you have wounded soldiers in your host, a small crossed-linen bandage pip appears in the corner of your militia unit chip and beside the Wounded card on the Army tab.
- **Living restorative heal glow:** When your Infirmary is actively tending to wounded troops (either through the automatic worker heal or a manual treat order), the bandages glow with a gentle emerald pulse, spinning herbal aura ring, and rising restorative motes.
- **Infirmary cots lit with care:** In the Keep Yard room, infirmary cots now display an emerald medical cross and green soothing halo when healing is underway.
- **Non-intrusive:** All bandage pips and glow layers are purely visual (`pointer-events: none`) and will never block training, clicks, or text reading. No sim rules or balance numbers were changed.

## 2026-11-11 — The Infirmary heals by itself (wave/infirmary-heal, not merged yet)

- **Auto-heal.** If you have a finished Infirmary with at least one worker in it, your wounded now get better without you clicking. Every 10 seconds, one wounded in ten (rounded up, so always at least one) comes back as militia. It costs no food.
- **It needs a worker.** An Infirmary with nobody working in it does not heal. Neither does one that is still being built or was knocked down in a siege. Post a worker on it from the Kingdom tab.
- **Where to see it.** Army tab, Wounded card. A green line reads **Healing · N wounded · next M in Xs**. If you have an Infirmary but no worker in it, an amber line reads **Not healing · no worker at the Infirmary**.
- **Treat still works.** The Treat button is the same as before: 4 food, one wounded back as militia in 5 seconds (4 with a Barracks). Use it when you want troops back faster than the Infirmary manages alone.
- The pace is a first guess. Tell us if it feels too slow or too generous.

## 2026-11-11 — Living glyphs and visual flair on deeper research studies (bakeoff/gemini-research-tree)

- **Bespoke emblems for deeper studies:** Under the Name, Progress, and Bonus lines on each tier II study card in the Keep Lectern, subtle living emblems and corner watermarks now depict the study's unique scholarly craft instead of reusing first-tier artwork:
  - **Crop rotation:** Four-field crop cycle with seasonal clover, golden barley, fallow furrows, and turning plowshare.
  - **Timber framing:** Heavy pegged timber truss with carpenter's plumb line and framing dowels.
  - **Fortification:** Crenellated curtain-wall fortress with defensive machicolations and crosslet arrow slits.
  - **Supply trains:** Covered draught wagon with spoked wheels, harness hitch, and swinging road lantern.
  - **Cartography:** Unfolded realm atlas chart with island coasts, rhumb lines, and mariner's compass rose.
  - **Quartermastery:** Balanced beam scale weighing provisions and talers, stamped with the quartermaster's chevron.
- **Prerequisite link flair:** When a required first-tier study is mastered, the "Builds on" connecting branch glows with a warm, steady golden pulse.
- **Clean reading & play:** All glyphs and watermarks are non-interactive (`pointer-events: none`) with gentle opacities that never obscure text, timers, or the Study / Cancel buttons. No game numbers changed.

## 2026-11-10 — Six deeper studies on the lectern (wave/research-tree, not merged yet)

The lectern in the Keep now has a second row of studies. Each one builds on a study you already know, so the lectern is split into **I First studies** (the ten you had) and **II Deeper studies** (six new ones).

- **Crop rotation** (after Husbandry, Keep II): another +10% food. Costs 60 food, 30 wood, 20 gold.
- **Timber framing** (after Forestry, Keep II): another +10% wood. Costs 60 wood, 30 food, 20 gold.
- **Fortification** (after Masonry, Keep III): another +10% stone, and walls hold another +24 HP. Costs 70 stone, 40 wood, 30 gold.
- **Supply trains** (after Logistics, Keep III): +100 warehouse space and one more column on the board, up to what your Keep allows. Costs 60 gold, 50 wood, 40 food.
- **Cartography** (after Surveying, Keep III): you see one tile farther and scouting costs 4 gold less. Costs 50 gold, 30 wood.
- **Quartermastery** (after Drill, Keep II): training troops costs 8% less. Costs 50 food, 45 gold, 30 wood.

How it works:

- A deeper study card says "Builds on Husbandry" (or whichever study it needs). Until you know that study the card is sealed and its Study button is greyed out.
- The Study and Cancel buttons work exactly as before. Still one study at a time, and cancelling still refunds the unused part.
- An Academy still counts as the hall for every study and still makes new studies 20% shorter.
- Your existing studies and saves are untouched.

These numbers are a first pass and have not been playtested. If a study feels too cheap, too dear or pointless, write it down here.

## 2026-11-10 — Richer lighting and atmosphere on the board (bakeoff/gemini-board-light)

- **Living atmosphere & time-of-day:** The isometric diamond board now breathes with a richer, softer lighting pass that tracks the passing hours:
  - **Sky horizon & beams:** Soft horizon glow and subtle sun/moonbeams in the backdrop that shift gently across warm dawn, clear daylight, amber dusk, and starry night.
  - **Terrain relief & shading:** Seen tiles now carry delicate sunward rim gleams and leeward bevel shadows, giving hills, meadows, and woods tangible isometric depth.
  - **Keep lanterns & ground shadows:** Keeps and resource nodes cast soft foundation contact shadows onto the earth. At dusk and nightfall, warm lantern sparks gleam in keep windows and campfire embers glow softly under field camps.
- **Clean reading & play:** All lighting effects are pure decorative underlays with strict non-interactive layers (`pointer-events: none`) and gentle opacities, ensuring unit tokens, march paths, roads, and territory clicks stay 100% crisp and responsive. No game numbers changed.

## 2026-11-10 — Living scroll glyphs on quest cards (bakeoff/gemini-quest-living)

- **Living scroll emblems:** Under the Name, Progress, and Reward rows on each quest card in the Quests panel, a subtle living emblem now portrays the quest's royal mandate and seal status:
  - **Open mandate:** Unfurled parchment mandate with a poised quill and subtle seal charge while the quest is underway.
  - **Ready to claim:** Illuminated parchment halo and lit royal wax seal with a crowning star when complete and ready for collection.
  - **Claimed chronicle:** Ribbon-bound archival chronicle scroll calmly resting in the archives once collected.
  - **Motif charges:** Unique charges for holy sanctums (cross), scout patrols (compass), martial valor (crossed blades), trade caravans (wheel), and royal edicts (sovereign disc).
- **Clean reading & rewards:** Soft corner watermarks stay tucked away in the bottom-right pocket of each quest card, keeping hints, progress meters, and the Claim reward button completely clear and responsive. No game numbers changed.

## 2026-11-10 — Quest cards are easier to read (wave/quest-living)

- Each quest card now shows its scroll in a small round coloured badge next to short lines: the **name** (with what to do, and whether the seal is unsealed, lit or sealed), **Progress** (0/1 or 1/1 and a bar) and **Reward** (the gold, or what you already took).
- The Claim button works exactly as before. No game numbers changed.

## 2026-11-10 — Living omen glyphs on event cards (bakeoff/gemini-event-living)

- **Living omen emblems:** Under the Name, Omen, and Duration rows on each event card in the events chronicle, a subtle living emblem now portrays the event's portent and resolution state:
  - **Comet:** Streaking cosmic tail and drifting stardust motes with a pulsing star nucleus for signs in the sky and merchant tributes.
  - **Raven:** Prophetic midnight halo and perched watcher with a pulsing seer eye for levy summons and store spoilage portents.
  - **Harvest:** Radiant golden sun-halo and swaying wheat sheaf with pulsing tie-knot motes for bountiful harvests and timber windfalls.
- **Clean reading & choices:** Soft corner watermarks stay tucked away in the bottom-right pocket of each event card, keeping event text, tick timestamps, duration meters, and Accept/Refuse choice buttons completely clear and responsive. No game numbers changed.

## 2026-11-10 — Event cards are easier to read (wave/event-living)

- Each event card now shows its omen (comet, raven or harvest) in a small round coloured badge next to short lines: the **name** (with its omen and whether it is the latest, waiting on you, a loss, or settled), **Omen** (what the event did, like "+10 gold") and **Duration** (waiting for your choice, or resolved, and when it fired).
- Event choice buttons work exactly as before. No game numbers changed.

## 2026-11-09 — Living crest glyphs on realm cards (bakeoff/gemini-diplo-living)

- **Living realm emblems:** Under the Name, Stance, Pact, and Power rows on each realm card on the War tab and World tab, a subtle living emblem now portrays the realm's heraldic crest and diplomatic stance:
  - **Player Crown:** Radiant imperial solar crown with warm golden beacon rays.
  - **Rival Hold:** Crossed iron arming swords and fortified stone keep in alert crimson.
  - **Frostpeak:** Twin bearded northern waraxes with frost runic horns.
  - **Silk Coast:** Gilded merchant caravel with billowing mainsail and scales of trade.
  - **Veiled Realm:** Eye of providence and eightfold star in mystical lavender.
  - **Tidehold:** Abyssal trident and surging ocean breaker waves.
  - **Embercrag:** Fire-phoenix and rising arcane flame plumes.
- **Clean reading & controls:** Soft corner watermarks stay tucked away in the bottom-right pocket of each realm card, keeping opinion stats, truce countdowns, pact affiliations, power comparisons, and Declare War / Gift buttons crisp and unobstructed. No game numbers changed.

## 2026-11-09 — Realm cards in Diplomacy are easier to read (wave/diplo-living)

- On the **War** tab Diplomacy grid and the **World** tab Known Crowns, each realm card now shows its crest in a small round coloured badge next to short lines: the **name** (with its stance, like friendly or at war), **Stance** (truce time and opinion), **Pact** (which pact that realm belongs to, whether it leads it, and whether you are in it too) and **Power** as before.
- All buttons (Declare war, Gift, Scout, Tribute, Trade) work exactly as before. No game numbers changed.

## 2026-11-09 — Living decree glyphs on decree cards (bakeoff/gemini-decree-living)

- **Living decree emblems:** Under the Name, Duration, and Effect rows on each royal decree card on the Crown tab, a subtle living emblem now portrays the decree's royal office and proclamation state:
  - **Muster the Host:** Crossed arming swords with war coronet and spiked battlements drifting in martial amber when ready, with active fiery gleam while the host is assembled.
  - **Harvest Rite:** Golden wheat ear with crescent sickle and radiant solar grain pip pulsing warmly while harvest abundance is in force.
  - **Send Envoys:** Courier messenger wings with royal parchment scroll and envoy star glowing in diplomatic azure while emissaries ride.
- **Clean reading & controls:** Soft corner watermarks stay tucked away in the bottom-right pocket of each decree card, keeping countdown meters, resource costs, and Issue buttons crisp and unobstructed. No game numbers changed.

## 2026-11-09 — Decree cards are easier to read (wave/decree-living)

- In **Royal decrees**, each card now shows its wax seal in a small round coloured badge next to three short lines: the **name** (with its seal, like muster or envoys, and whether it is ready, short, or in force), **Duration** (how long it lasts, or how long is left with a bar) and **Effect** (what the decree does).
- The cost line and the Issue button work exactly as before. No game numbers changed.

## 2026-11-09 — Living research glyphs on research cards (bakeoff/gemini-research-living)

- **Living research emblems:** Under the Name, Progress, and Bonus rows on each research card on the Academy / lectern, a subtle living emblem now portrays the discipline's scholarly field and study status:
  - **Agronomy (Husbandry, Forestry):** Folio leaf and furrow sheaf drifting in amber ink while study is underway.
  - **Masonry (Masonry):** Ashlar plumb-line and dressed stone keystone reflecting quarry and architectural treatises.
  - **Cartography (Logistics, Surveying):** Astrolabe compass and star dial glowing softly under academy guidance.
  - **Tactics (Fieldcraft, Drill, Screening):** Commander standard and marching banner drifting in martial steel.
  - **Horsemanship (Horse):** Steed crest charger profile symbolizing mounted reconnaissance and cavalry arts.
  - **Siegecraft (Siege):** Trebuchet engine arm and stone shot framed in poliorcetics blueprints.
- **Clean reading & controls:** Soft corner watermarks stay tucked away in the bottom-right pocket of each card, keeping progress meters, hall requirements, Study buttons, and Cancel actions crisp and unobstructed. No game numbers changed.

## 2026-11-09 — Research cards are easier to read (wave/research-living)

- On the Academy / lectern, each study card now shows its scroll mark in a small coloured badge next to three short lines: the **name** (with its field, like agronomy or siegecraft, and whether it is open, studying, known or sealed), **Progress** (with a bar while studying) and **Bonus** (what the study gives you, marked "active" once learned).
- The Study and Cancel buttons work exactly as before. No game numbers changed.

## 2026-11-09 — Living building glyphs on building cards (bakeoff/gemini-building-living)

- **Living building emblems:** Under the Name, Level, Staffed, and Bonuses rows on each building card in Kingdom Standing works, a subtle living emblem now portrays the structure's domain and operational activity:
  - **Hearth (Farms, Granaries, Cottages):** Gable rafters with amber hearth flame lit when staffed, warm when resting, and uncrewed pulse when hands are lacking.
  - **Craft (Lumber Camps, Sawmills, Quarries, Masons):** Keystone arch and spinning mill wheel drifting in emerald while yards are busy.
  - **Mint (Gold Mines, Markets, Mints):** Guildhall pediment and balance beam in gleaming gold while commerce flows briskly.
  - **Martial (Barracks, Stables, Ranges, Siege, Towers, Walls, Gate, Keep):** Stone battlements with watchtower beacon shining in steel azure.
  - **Sanctum (Academies, Chapels, Infirmaries):** Vaulted lancet arch and scholar star glowing in lavender calmness.
- **Clean reading & controls:** Soft corner watermarks stay tucked away in the bottom-right pocket above the footer buttons, keeping level meters, staffing lifts, Demolish, and Repair actions crisp and unobstructed. No game numbers changed.

## 2026-11-09 — Building cards are easier to read (wave/building-living)

- On the Kingdom tab, each standing building card now lists three short lines next to its picture: the **name** (with its kind: hearth, craft, mint, martial or sanctum), **Level** (current and max level, with a small bar) and **Staffed** (how much the workers lift it, with a small bar; it gently pulses when crewed and blinks amber when nobody is working there).
- The Bonuses line underneath and the Demolish / Repair buttons work exactly as before. No game numbers changed.

## 2026-11-09 — Living unit glyphs on unit cards (bakeoff/gemini-unit-living)

- **Living unit emblems:** Under the Name, Power, Cost, and Ready rows on each unit card in the Army tab, a subtle living emblem now portrays the regiment's operational readiness and branch of service:
  - **Infantry:** Crossed broadswords with green drift when levy is ready, amber pulse when stores are short, blue pulse during training drill, and calm silver when lore is sealed.
  - **Ranged:** Recurve longbow with notched flight arrow reflecting archer company readiness.
  - **Cavalry:** Armored destrier charger helm with chamfron and flowing crest for knightly and mounted units.
  - **Command:** Winged imperial coronet with command scepter keystone for elite leadership cadres.
- **Clean reading & controls:** Soft corner watermarks stay tucked away in the bottom-right pocket of each unit card, keeping power bars, per-unit costs, drill timers, batch counters, and train buttons crisp and unobstructed. No game numbers changed.

## 2026-11-09 — Unit cards are easier to read (wave/unit-living)

- On the Army tab, each unit card now lists three short lines next to its picture: the **name** (with its kind: infantry, ranged, cavalry or command), **Power** (with a small bar comparing it to your strongest unit, and how many you have home or away) and **Cost** (price per unit, batch size and drill time).
- The ready line underneath, the train click and the x1/x5/x10 buttons work exactly as before. No game numbers changed.

## 2026-11-08 — Living resource glyphs on resource cards (bakeoff/gemini-resource-living)

- **Living resource emblems:** Under the Name, Stock, and Income rows on each resource card at the top (Food, Wood, Stone, Gold), a subtle living emblem now portrays the store's operational flow:
  - **Harvest Sheaf (Food):** Bound golden wheat with green drift when harvest intake flows, amber alert pulse when granaries are full, and red pulse when the larder is bare.
  - **Timber Cord (Wood):** Stacked cordwood logs with woodland drift when timber hauling is active, amber pulse when yards are capped, and red pulse when dry.
  - **Ashlar Cairn (Stone):** Dressed granite cairn with slate drift when quarry hewing is active, amber pulse when crypts are full, and red pulse when unworked.
  - **Crown Mint (Gold):** Stamped imperial coronet coin with warm gold drift when tribute is minted, amber pulse when coffers overflow, and red pulse on empty coffers.
- **Clean reading & controls:** Soft corner watermarks stay tucked away in the bottom-right pocket of each resource cell, keeping numbers, caps, progress meters, and income rates crisp and unobstructed. No game numbers changed.

## 2026-11-08 — Resource cards are easier to read (wave/resource-living)

- The four resource cards at the top (Food, Wood, Stone, Gold) now show three short lines: the name, **Stock** (how much you have, out of your storage limit, with a small bar) and **Income** (how much you gain per second, or *idle* if nothing is coming in).
- Full and bare stores still glow the same way. No game numbers changed.

## 2026-11-08 — Living flag and camp glyphs on flag cards (bakeoff/gemini-flag-living)

- **Living flags & camps:** Under the Name, Camp, Flag, and Stock rows on each Flags card in the Kingdom tab, a subtle living emblem now portrays the territory's operational status:
  - **Guarded Flags:** Tall hoisted realm banner fluttering in emerald green over a garrisoned command post with soldier count and remaining resource reserve.
  - **Threatened Redoubts:** Alert pulsing beacon in crimson warning whenever a rival march approaches the held outpost, displaying inbound realm and ETA seconds.
  - **Frontier Claims:** Lone outpost flag in warning amber marking unpatrolled territorial claims and untouched resource seams.
- **Clean reading & controls:** Soft corner watermarks stay tucked away in the bottom-right pocket of each card, keeping row text, stock meters, and Abandon buttons crisp. No game numbers changed.

## 2026-11-08 — Flag cards show what's left on the tile (wave/flag-living)

- On the **Kingdom** tab, under **Flags**, each flag card now has a fourth row, **Stock**: how much food, wood or stone is left on that tile, with a small bar. Amber when it runs low, red when *Dry*, *No pile* if the tile has nothing to gather.
- The rows are a little easier to scan (striped, with the tile name on top).
- The **Abandon** button works exactly as before. No game numbers changed.

## 2026-11-08 — Living camp and flag glyphs on garrison cards (bakeoff/gemini-camp-living)

- **Living garrison camps:** Under the Name, Flag, and Stock rows on each garrison camp card in the War Room (Garrisons section), a subtle living emblem now portrays the camp's readiness:
  - **Flying Camp Banner:** Fortified command pavilion and realm banner fluttering in emerald green with resource stockpile status.
  - **Threatened Camp Redoubt:** Alert pulsing beacon in crimson warning whenever a rival column marches on the held outpost, displaying ETA and the attacking realm.
  - **Struck Flag:** Leaning banner in caution amber indicating a contested outpost where the flag was struck.
- **Clean reading & controls:** Soft corner watermarks stay tucked away in the bottom-right pocket of each camp section, keeping node names, stock counts, power bars, and Recall buttons crisp. No game numbers changed.

## 2026-11-08 — Garrison camps show Name, Flag and Stock (wave/camp-living)

- In the **War Room**, under **Garrisons**, each camp card now shows three rows:
  - **Name** — what the tile is (Forage field, Timber stand…) and where it is.
  - **Flag** — *Flying* when quiet, *Under threat* in red with who is coming and how many seconds away.
  - **Stock** — how much wood, food or stone is left on the tile. Amber when it runs low or is dry.
- The **Recall** button and the power bar work exactly as before. No game numbers changed.

## 2026-11-08 — Living camp and flag glyphs on outpost cards (bakeoff/gemini-outpost-living)

- **Living outposts & camps:** Under the Name, Camp, and Flag rows on each outpost card in the Kingdom tab (Flags section), a subtle living emblem now portrays the camp's readiness:
  - **Guarded Camp:** Fortified command pavilion and banner fluttering in calm emerald green when soldiers are garrisoned.
  - **Frontier Flag:** Lone outpost banner flying in amber caution over an unattended territorial claim.
  - **Threatened Redoubt:** Alert pulsing beacon in crimson warning whenever a rival host marches toward the outpost, displaying ETA and the marching realm.
- **Clean reading & controls:** Soft corner watermarks stay tucked away in the bottom-right pocket of each card, keeping garrison power, threat warnings, and Abandon buttons crisp. No game numbers changed.

## 2026-11-08 — Flags show Name, Camp and Flag (wave/outpost-living)

- Open the Kingdom tab and scroll to **Flags**. Each of your outposts is now a small card with three rows.
- **Name** is what the tile is (for example "Forage field") and where it is on the map.
- **Camp** shows your garrison's power and how many soldiers are posted. It says "Unguarded" in amber when nobody is there.
- **Flag** says "Flying" when all is quiet. It turns red with "Under threat" and who is coming and how many seconds away when a rival column is marching on it.
- The Abandon button works the same. No game numbers changed.

## 2026-11-08 — Living node pile glyphs on gather node cards (bakeoff/gemini-node-living)

- **Living resource piles:** Under the Name, Stock, and Pile rows on each gather node card in ProvinceInspect (Tile group), a subtle living pile emblem now displays the nature of the resource reserve:
  - **Timber Stand (Wood):** Stacked cordwood logs with bark ends and wood ring details.
  - **Stone Outcrop (Stone):** Hewn ashlar stone cairn with dressed limestone blocks and keystone facets.
  - **Forage Field (Food):** Burlap grain bushels and forage sacks tied with twine.
- **Harvest-aware motion:** Full or untouched piles glow in calm emerald green with a gentle drift; draining piles pulse in warning amber with remaining counts; depleted dry piles pulse in alert crimson while waiting on regrowth.
- **Clean reading & controls:** Soft corner watermarks stay tucked away in the bottom-right pocket of each card, keeping stock and pile numbers crisp. No game numbers changed.

## 2026-11-08 — Resource nodes show Name, Stock and Pile (wave/node-living)

- Click a scouted Timber stand, Stone outcrop or Forage field on the board. In the side card, the stock line is now a small card with three rows.
- **Name** is the node and what it gives (for example "Timber stand · Wood").
- **Stock** shows how much is left out of the max. It says "full" when full, shows how fast it refills when it is being used, and turns red with "dry" when empty.
- **Pile** says "Untouched" if nobody has gathered there yet, otherwise how much is left. It also shows the same count as the board badge.
- A thin bar under the rows empties as the node is drained.
- The Gather here button works the same. No game numbers changed.

## 2026-11-08 — Living quill glyphs on Ledger of Crowns cards (bakeoff/gemini-ledger-living)

- **Living chronicler quills:** Under the Time and Entry rows on each Chronicle card in the Ledger of Crowns on the Crown tab, a subtle living quill and scribe rubrication label now marks the nature of the entry:
  - **Martial Records:** Crossed quill & blade with a pulsing crimson rubric for battle, war, and defeat.
  - **Triumphs & Peace:** Illuminated swan quill with a radiant gold drift for victories and truces.
  - **Royal Decrees:** Regal court quill with imperial sapphire ink for oaths, marshals, and mandates.
  - **Chronicle & Archives:** Traditional iron-gall goose quill dipping into a faceted stone inkpot.
- **Living quill pip accents:** The quill and inkpot pip at the head of each card now features a gently swaying feather and living wet ink droplet.
- **Clean reading & controls:** Soft corner watermarks stay tucked away in the bottom-right pocket of each card, keeping time stamps and chronicle text crisp. No game numbers changed.

## 2026-11-08 — Ledger of Crowns lines show Time and Entry (wave/ledger-living)

- On the Crown tab, each line in the **Ledger of Crowns** is now a small card with two rows.
- **Time** shows when it happened (the tick, like `t100`) and a small coloured tag saying what kind of entry it is (for example "crown", "war", or "save written").
- **Entry** shows what happened, same words as before.
- Nothing else changed: newest lines are still on top, and no game numbers changed.

## 2026-11-08 — Living vault seal glyphs on Kingdom vault cards (bakeoff/gemini-vault-living)

- **Living security seals:** Under the Name, Stock, and Safety rows on each vault card on the Kingdom tab, a subtle living seal now displays the protection status and vault craft of the store:
  - **Granary Cellar (Food):** Arched cellar door with iron padlock, seed rivets, and harvest fronds.
  - **Timber Storehouse (Wood):** Heavy mortised timber crossbrace with bronze deadbolt.
  - **Masonry Crypt (Stone):** Ashlar keystone arch with dual interlocking deadbolts.
  - **Royal Treasury (Gold):** Octagonal coin vault strongbox with radial dial rivets and solar star tumbler.
- **Safety-aware motion:** When all stores are below the vault floor, the seal glows a peaceful emerald green with a gentle drift; when stores sit exposed above the floor, a warning amber pulse marks the exposed amount; and when storage caps are reached, a rapid alert pulse signals the brim.
- **Clean reading & controls:** Soft corner watermarks stay tucked away in the bottom-right pocket of each card, keeping numbers and safety floors crisp. No game numbers changed.

## 2026-11-08 — Vault cards show Name, Stock, Safety (wave/vault-living)

- On the Kingdom tab, under the "Vault keeps" line, there are now four small cards, one each for Food, Wood, Stone and Gold.
- Each card shows the **Name** of the vault, your **Stock** (how much you have out of how much you can store; it turns red and says "full" when the store is full), and **Safety**: "All hidden" in green means a raid can take none of it, while "N exposed" in amber means that much sits above the vault floor and could be stolen.
- The old vault line is still there. No game numbers changed.

## 2026-11-08 — Living terrain glyphs on atlas province cards (bakeoff/gemini-atlas-living)

- **Living biome emblems:** Under the Name, Terrain, and Owner rows on each province card under the Kingdom Atlas, a subtle living terrain badge now reflects the biome and landmarks of the tile:
  - **Plains & Woods:** Swaying pasture blades, wildflower sparks, and woodland pine canopies with gentle drift motion.
  - **Hills & Wastes:** Highland knolls, granite quarry outcrops, and smoldering volcanic crags with steady pulse rhythms.
  - **Shores & Peaks:** Undulating tidal waves and glacial alpine summits with icy glimmers.
  - **Uncharted Fog:** Swirling mist clouds obscure unrevealed territories.
- **Clean reading & controls:** Soft corner watermarks stay tucked away in the bottom-right pocket of each card, keeping coordinates and province names crisp. No game numbers changed.

## 2026-11-08 — Atlas province cards show Name, Terrain, Owner (wave/atlas-living)

- Under the Kingdom Atlas on the World tab there is now a small card for the province you clicked: its **Name** (like "Timber stand" or "Your hold", with its map coordinates), its **Terrain**, and its **Owner**.
- Hover over another tile and a second dashed card shows that tile too. With nothing clicked, the card shows your home hold.
- Tiles still in fog say "Uncharted" and "Unknown". Dragging, clicking, and Recenter work as before. No game numbers changed.

## 2026-11-08 — Softer background glyphs keep card text crisp (bakeoff/gemini-readability-polish)

- **Softer corner watermarks:** The background commodity, tool, force, crest, seal, and study icons tucked into the bottom-right corners of cards are much softer and fainter now, ensuring numbers, labels, costs, and progress bars always stand out clearly in the foreground.
- **Calmer glow effects:** Bright glowing halos and pulses around living icons have been softened into gentle ambient accents that won't distract or wash out nearby text.
- **Atmospheric board polish:** Selection rings, keep lanterns, and drifting fog on the map are dialed back to soft whispers so province names, marching troops, and roads remain easy to track.
- **Controls & rules:** Buttons look and work identically to before. No game numbers changed.

## 2026-11-08 — Easier-to-read status cards (wave/readability-polish)

- The stacked status rows on decree, realm, pact, event, quest, study, and army cards have a bit more space between them. Each row also has a soft colored backing, so it's easier to tell where one row ends and the next begins.
- Small labels, sub-lines, and the captions next to the little living icons are brighter and slightly larger.
- Progress bars are a little thicker.
- Buttons look and work the same. No game numbers changed.

## 2026-11-08 — Living crest glyphs on realm and pact cards (bakeoff/gemini-diplo-living)

- **Living realm crest emblems:** Under the Realm, Stance, and Power rows on each realm card, a subtle living crest badge reflects the realm's heraldic posture:
  - **Hostile & War:** Iron keep and greatsword banners pulse with a martial alert glow (*Hostile banner · war match-up N vs N*).
  - **Truce:** Banners breathe with a quiet blue aura showing the remaining peace countdown (*Truce in force · Ns of peace remain*).
  - **Allies & Wary:** Verdant glows on warm allies (*Warm ally · opinion +N*) and steady sentry watch on guarded borders.
- **Living pact seals:** Faction cards display illuminated signets for holy orders, salt compacts, and artisan guilds, showing whether your crown leads or belongs to the pact (*Crown sovereign · leading N sworn members*).
- **Clean reading & controls:** Soft corner watermarks stay tucked away in the bottom-right pocket of each card, and all action buttons (Declare war, Gift, Scout, Join, Leave) work identically to before. No game numbers changed.

## 2026-11-08 — Diplomacy cards show Realm/Pact, Stance, Power (wave/diplo-living)

- Every realm card in the War tab Diplomacy grid and the World tab Known Crowns list now opens with three rows: **Realm** (crest and name), **Stance** (war, truce, friendly, wary, or hostile, plus their opinion of you), and **Power** (on the War tab, your power against theirs with a bar showing your share; on the World tab, their power once scouted).
- Faction cards show **Pact** (seal, name, kind), **Stance** (whether you are a member, can join, or are too cold to join), and **Power** (how many realms are sworn).
- All buttons (Declare war, Gift, Scout, Tribute, Trade, Join, Leave) work exactly as before. No game numbers changed.

## 2026-11-08 — Living decree seal glyphs on royal decree cards (bakeoff/gemini-decrees-living)

- **Living decree seal emblems:** Under the Decree, Time left, and Effect rows on each royal decree card, a subtle living seal emblem now mirrors the crown's mandate:
  - **Muster the Host:** Crossed arming blades and war coronet with a fiery martial gleam (*Host mustered · 10% cheaper training · Ns left*).
  - **Harvest Rite:** Crowned wheat ears and crescent sickle with a golden sunburst spark (*Rite in force · +3 production yield · Ns left*).
  - **Send Envoys:** Messenger courier wings and parchment treaty with a diplomatic star (*Envoys riding · +6 gift opinion · Ns left*).
- **Clean reading & controls:** Soft corner watermarks stay tucked away in the bottom-right pocket of each card, and the cost row plus **Issue** button work identically to before. No game numbers changed.

## 2026-11-08 — Royal decrees show Decree, Time left, Effect (wave/decrees-living)

- Each royal decree card on the Crown tab now opens with three rows: **Decree** (name, and whether it is in force, ready, or short of stores), **Time left** (a bar drains while the decree is sworn), and **Effect** (what it does).
- Cost and the **Issue** button work exactly as before. No game numbers changed.

## 2026-11-07 — Living research glyphs on Academy and Study cards (bakeoff/gemini-academy-living)

- **Living lectern & topic emblems:** The Academy lectern header and every study card now carry subtle living scholarly badges beneath their rows:
  - **Academy lectern:** Glows with a lit scholar's lamp while a study is underway, highlights the `-20%` Academy pace bonus once an Academy stands, and shines with a completion star once all 10 topics are codified.
  - **All 10 research topics:** Each study card displays its own craft or martial treatise emblem — grain & sickle (*Husbandry*), oak bough (*Forestry*), ashlar & dividers (*Masonry*), route wheel (*Logistics*), astrolabe (*Surveying*), recurve bow (*Fieldcraft*), marshal banner (*Drill*), ward shield (*Screening*), horseshoe (*Horse lore*), and torsion engine (*Siege craft*).
- **Clean reading & controls:** Soft corner watermarks stay tucked away from card text, and the **Study** and **Cancel** buttons work identically to before. No game numbers changed.

## 2026-11-07 — Academy studies show Name, Progress, Bonus (wave/academy-living)

- Each study in the Academy / lectern is now its own card with three rows: **Name**, **Progress**, **Bonus**.
- Locked studies say what is missing (hall or Keep level) in red under the name.
- A study underway shows seconds left and a filling bar, with **Cancel** right beside it.
- Known studies show their bonus as active.
- The **Study** buttons are the same buttons as before. No game numbers changed.

## 2026-11-07 — Living omen and scroll glyphs on Event and Quest cards (bakeoff/gemini-events-living)

- **Living event omens:** Under the Name, Progress, and Reward rows on each world event card, a subtle living omen emblem now echoes the portent:
  - **Comet omens:** A streaking star and drifting embers glow softly on tributes and celestial signs (*Comet omen · blazing sky*).
  - **Raven omens:** A perched raven's eye pulses on levies and turns crimson on food spoilage (*Raven portent · stores blighted*).
  - **Harvest omens:** A tied wheat sheaf sways gently on harvest and timber windfalls (*Harvest omen · golden sheaf*, *Timber omen · windfall*).
- **Living quest scrolls:** Quest cards now show an unfurled mandate scroll and feather quill while in progress (*Mandate scroll · unsealed*), pulse with a lit royal wax seal when ready to claim (*Royal scroll · seal lit*), and roll shut once claimed (*Archived scroll · sealed*).
- **Clean reading & controls:** Soft corner watermarks stay tucked away from card text, and event choice buttons plus the **Claim** button work identically to before. No game numbers changed.

## 2026-11-07 — Living warbands, cloaks, carts, and tents on War Room force cards (bakeoff/gemini-war-living)

- **Living force glyphs:** Under the ledger and Power/Risk rows on each War Room force card, a subtle living emblem now matches the party in the field:
  - **Incoming warbands:** A horned iron helm and morningstar pulse faster when danger is high (*Warband march · high risk*) and drift as the column advances.
  - **Scouts:** A hooded stealth cloak and spyglass drift softly while an outrider ranges (*Cloak outrider · ranging*).
  - **Gather parties:** A supply cart shows stacked grain sacks and crates on laden return hauls (*Cart laden · hauling*) or an open bed on empty outbound runs (*Cart empty · outbound*).
  - **Garrisons:** A ridgepole pavilion tent and camp lantern glow steadily on watch (*Pavilion tent · standing watch*) and pulse if threatened (*Tent under threat*).
- **Clean reading & controls:** Corner watermarks stay tucked softly in the bottom-right corner away from card numbers, and the **Recall** and **Sally** buttons work identically to before. No game numbers changed.

## 2026-11-07 — Events and Quests cards show Name, Progress, Reward (wave/events-living)

- Each event card and quest card now lists three rows top to bottom: **Name**, **Progress**, **Reward**.
- Events show "Resolved" and the tick they fired; the Reward row shows what you got (red when food spoiled).
- Quests show 0/1 or 1/1 and their gold. The **Claim** button is the same button, now in the Reward row.
- No game numbers changed.

## 2026-11-07 — War Room force cards read like a ledger (wave/war-living)

- Each force card in the War Room (Scouts, Gathers, Garrisons, Incoming) now lists four rows top to bottom: **Name**, **Destination**, **ETA**, **Action**.
- The **Recall** and **Sally** buttons are the same buttons, now in the Action row. If a card has nothing to do, it says "None".
- Power and Risk rows are still underneath. The ETA bar fills as a party travels; the ETA edge pulses while a force is on the road.
- No game numbers changed.

## 2026-11-07 — Living walker and resting glyphs on People cards (bakeoff/gemini-people-living)

- **Living walkers & idle poses:** Under the Job, Post, and Idle rows on each People card in the Kingdom tab, a subtle living glyph now reflects how those hands spend their day:
  - **Posted workers:** Striding walkers carry their trade tool with a soft footpath glow — Farmers (*Furrows · striding*), Woodcutters (*Timber · striding*), Miners (*Delving · striding*), Merchants (*Stalls · striding*), Guards (*Walls · patrolling*), and Scholars (*Sanctum · studying*).
  - **Idle hands:** A resting villager sits on a timber bench beside a warm ember, pulsing gently in amber when open posts are waiting (*Resting · posts open*) or breathing calmly before a staffed hall is built (*Resting · no hall yet*).
- **Clean reading & controls:** Corner watermarks stay soft and out of the way of text, and the **Post at…** picker and **Idle** button work identically to before. No game numbers changed.

## 2026-11-07 — People cards show a status stack (wave/people-living)

- Open the Kingdom tab and look at People. Each card now has three short rows: Job, Post and Idle.
- Job shows the trade and how many hands work it. The Idle card says they have no trade yet.
- Post shows where those hands walk to work. On the Idle card it says how many posts you can send them to.
- Idle turns orange when someone is waiting for work, so you can spot spare hands from any card. It turns green when every hand is posted.
- The "Post at…" picker and the Idle button work the same as before. No numbers in the game have changed.

## 2026-11-07 — Living hold glyphs on the joined hold panel (bakeoff/gemini-hold-living)

- **Living hold emblems:** When you join a shared hold on the Cloud tab, subtle living badges now sit beneath the status rows alongside quiet corner watermarks on the hold cards:
  - **Works:** Pulses while militia are drilling (*Drilling +N*) and glows gently while buildings or militia stand (*Yards active*).
  - **Stores:** Glows softly as food, wood, stone, and gold vaults fill (*N/4 stocked*).
  - **Stamps:** Warms with a wax signet glow once friends stamp the hold (*N stamped*).
  - **Key:** Pulses in amber when a new one-time key needs copying (*Copy key*), settles to gold once copied (*Key copied*), and never repeats the secret key.
- **Clean reading & controls:** Watermarks stay tucked into a soft bottom-right corner away from text and buttons, and **Train**, **Build**, **Stamp**, **Copy key**, and **Leave** work identically to before. No game numbers changed.

## 2026-11-07 — Hold panel shows a status stack (wave/hold-living)

- Join a shared hold on the Cloud tab. Under the Realm and Tick card you now see five short rows: Works, Stores, Stamps, Key and Leave.
- Works lists your militia, farms, cottages and lumber camps, and says how many militia are training.
- Stores lists food, wood, stone and gold in whole numbers.
- Stamps shows how many stamps there are and who stamped last.
- Key reminds you to copy a new key (it is shown only once) and turns gold once you copy it. It never shows the key a second time.
- Leave says your solo crown is untouched, and turns orange while the leave confirmation is open.
- All the buttons work the same as before. No numbers in the game have changed.

## 2026-11-07 — Living terrain and camp/resource glyphs on the board (bakeoff/gemini-board-living)

- **Living terrain:** Scouted tiles on the isometric board now show gentle, readable ambient motion:
  - **Peaks:** Subtle snowcap ridge shimmer and drifting high-altitude mist.
  - **Woods:** Softly swaying canopy boughs and drifting forest motes.
  - **Shores:** Gentle coastal surf ripples and water glints.
- **Living camps & resource piles:** Camps and outposts show a quiet watchfire pulse and rising smoke wisp, while stocked woodcut, field, and quarry piles softly gleam until harvested dry.
- **Clean map & controls:** Unexplored fog hides distant tiles as before, and clicking, hovering, zooming, and panning the map work identically. No game rules or numbers changed.

## 2026-11-07 — Province card shows a status stack (wave/board-living)

- Click a province on the map. The card now starts with five short rows: Terrain, Owner, Stock, Outpost and Garrison.
- Stock shows how much is left on a gather tile with a small bar, and says "dry" when it is empty.
- Outpost tells you if the tile is your hold, your flag, a rival's flag or hold, or a hostile camp.
- Garrison shows how many men are posted and their power.
- Tiles you have not scouted say Unknown or Unseen.
- The map, clicking and buttons work the same as before. No numbers in the game have changed.

## 2026-11-07 — Living hall glyphs on Standing works cards (bakeoff/gemini-works-living)

- **Living hall emblems:** Each Standing works card on the Kingdom tab now carries a subtle, living architectural glyph matching its kind of hall:
  - **Farms, Granaries & Cottages:** Timbered hall gables and warm hearth flames (*Hearth lit* / *Hearth warm*).
  - **Lumber Camps, Sawmills, Quarries & Masons:** Keystone arches and mill wheels (*Yards busy*).
  - **Gold Mines, Markets & Mints:** Guildhall pediments and balance scales (*Coffers brisk*).
  - **Barracks, Towers, Walls, Gates & Keeps:** Crenellated stone parapets and watch beacons (*Beacon lit* / *Ward standing*).
  - **Academies, Chapels & Infirmaries:** Vaulted lancet arches and scholar stars (*Sanctum lit* / *Sanctum calm*).
- **At-a-glance state:** Crewed and bonus-lifted halls glow and pulse gently; empty workyards rest in soft amber (*Hall uncrewed*); siege-damaged buildings pulse in red (*Siege scarred*) until repaired.
- **Clean reading & controls:** Watermarks stay tucked into a quiet corner pocket away from numbers and tags, and **Demolish** / **Repair** work identically to before.

## 2026-11-07 — Standing works show level, staffed and bonuses (wave/works-living)

- In Standing works on the Kingdom tab, each building card now has three short rows: Level, Staffed and Bonuses.
- Level shows the building's level and how high it can go right now (for example "lv 1 / 2"), with a small bar.
- Staffed shows how much your workers lift it ("+20%"), or "Empty" if nobody works there. Buildings that never need workers say "No crew".
- Bonuses shows small tags for cluster, pair and keep lifts, or "none".
- Scarred buildings say so in red until you repair them.
- The Demolish and Repair buttons work the same as before. No numbers in the game have changed.

## 2026-11-07 — Living goods glyphs on Market stall cards (bakeoff/gemini-market-living)

- **Living stall signs:** Each Market stall card on the Kingdom tab now carries a subtle, living commodity emblem matching the goods it pays out:
  - **Grain stalls (food):** Tied wheat sheaves with a warm harvest glint (*Grain lot*).
  - **Timber stalls (wood):** Stacked seasoned cordwood logs with an oak gleam (*Timber lot*).
  - **Stone stalls (stone):** Dressed quarry ashlar blocks with a mason spark (*Ashlar lot*).
  - **Gold stalls (gold):** Stamped crown coinage with a bullion star glint (*Bullion lot*).
- **At-a-glance status:** Open stalls gently glow and drift; stalls down to a single batch pulse warmly (*Last lot*); short stalls rest in soft amber (*Stores short*); shuttered stalls stay still until you build a Market.
- **Clean reading & controls:** Watermarks stay tucked softly in the bottom-right corner away from numbers and prices, and the **Trade** button works identically to before.

## 2026-11-07 — Market stalls show give, get and stock (wave/market-living)

- In the Market on the Kingdom tab, each stall card now has three short rows: Give, Get and Stock.
- Give shows the price and how much of it you hold, with a small bar. It turns red when you are short.
- Get shows what you receive and how much of it you already have.
- Stock tells you how many times you can make this trade right now (for example "x7 in hand"), or "Short of stores", or "Build a Market".
- The Trade button works the same as before. Trade rates have not changed.

## 2026-11-07 — Softer unit card glyphs for clear reading (bakeoff/gemini-army-glyph-contrast)

- **Clearer Army unit cards:** The living martial watermark on each Army unit card is now much softer and tucked neatly into the bottom-right corner, so unit names, power numbers, training costs, and readiness notes stay crisp and effortless to read.
- **Unchanged controls:** Clicking any unit card to train levies works exactly the same as before.

## 2026-11-07 — Living unit glyphs under Army unit cards (bakeoff/gemini-army-living)

- **Living unit heraldry:** Army unit cards now feature subtle, living martial glyphs resting under each unit card:
  - **Infantry**: Crossed spears and shield bosses that breathe quietly on the front line.
  - **Archers & Rangers**: Recurve bows and fletched arrows with gentle target focus.
  - **Cavalry & Outriders**: Warhorse horseshoes and charging stars that surge with training momentum.
  - **Banners & Champions**: Billowing rallying pennants and solar crowns.
- **State awareness:** Units actively drilling in the barracks pulse with warm gold training sparks, ready levies breathe with confident emerald auras, and locked units rest quietly in slate silhouettes.
- **Readability & clicks:** All numbers, costs, and readiness notes stay crisp and easy to read. Clicking any card to train levies remains instantaneous and unobstructed.

## 2026-11-07 — Unit cards show power, cost and readiness (wave/army-living)

- On the Army tab, each unit card now has three short rows: Power, Cost and Ready.
- Power has a small bar so you can compare units at a glance, plus how many you have at home and away.
- Cost shows the price per unit (before discounts), your batch size and how long the drill takes.
- Ready tells you why you can or cannot train: Ready to drill, Short of stores (red), Queue full, Drilling N (with a moving progress bar), or what research unlocks it.
- Click a card to train, same as before. Costs and timings have not changed.

## 2026-11-07 — Living war glyphs under War Room status cards (bakeoff/gemini-war-living)

- **Living martial heraldry:** War Room force cards now come alive with subtle, animated war glyphs resting under each status card:
  - **Hostile cards**: Dual crossed blades with a glowing clash spark and warning pulse that beats faster when danger looms.
  - **Scout cards**: Outrider compass rose with horizon beacon rays gently drifting as the vanguard rides ahead.
  - **Gather cards**: Golden harvest sheaf and supply wheel that shimmers with prosperity when laden with resources.
  - **Garrison cards**: Fortified castle bulwark shield and stone battlements that watch steadfastly over your holdings.
- **Readability & control:** The glyphs are delicate, subtle watermarks and badges designed to keep power numbers, countdowns, and risk notes completely legible. All buttons (Recall, Sally) remain instant and easy to click.

## 2026-11-07 — Force cards show power, ETA and risk (wave/war-living)

- On the War tab, each scout, gather party, garrison and incoming host card now has three short rows: Power, ETA and Risk.
- Power has a small bar so you can compare forces at a glance. Gather parties also show how far along their trip is.
- Risk tells you what to watch: a host that outmatches your defence reads High in red, a garrison with a column coming reads Column inbound, a scout you can no longer recall reads Committed.
- Without a watchtower warning, enemy power shows "?" and risk shows Unknown.
- Recall and Sally buttons work the same as before. The fight itself still rolls.

## 2026-11-06 — Living board animations under the status overlay (bakeoff/gemini-board-living)

- **Living isometric board:** The tabletop board now features ambient living animations that breathe life into the terrain, holds, and fog beneath the status chips.
- **Dynamic visual life:**
  - Selecting any province summons a pulsing biome-tinted terrain contour and expanding resonance ring that illuminates the land.
  - Player and rival keeps radiate warm hearth light and beacon beams into the surrounding territory.
  - Soft, ethereal mist clouds gently drift across unexplored fog regions of the board.
  - A subtle luminous tether anchors the selected tile to the status chips resting at the canvas rim.
- **Accessibility:** Reduced-motion preferences calm all terrain pulses, beacon shimmers, and drifting mist into dignified static accents.

## 2026-11-06 — Status chips on the board (wave/board-status)

- Pick a province while zoomed out to the board. A short stack of chips appears at the edge of the map, level with that tile.
- The chips show who owns it, how much stock is left (wood, food or stone tiles), who is garrisoned there, and the next column due to arrive with a countdown.
- Unscouted tiles show "Unknown" and "Unseen" instead of guessing.
- The chips do not block clicks. Zoom back in to the hold and they hide.

## 2026-11-06 — Living research pace glyph next to research pace line (bakeoff/gemini-research-pace)

- **Living scholar astrolabe:** When viewing the research pace line on the Kingdom tab, an expressive celestial astrolabe rests beside the speed and study status.
- **Dynamic visual state:**
  - When the Academy accelerates research, an illuminated golden armillary sphere with an inclined cyan knowledge ring and warm breathing aura marks the line.
  - When researching at standard speed, a calm brass and pewter astrolabe keeps steady watch.
  - While a study is underway on the lectern, a radiant star beacon illuminates the central study hub.
  - Once every unit study is completed, a golden laurel triumph compass crowns the pace line.
- **Accessibility:** Reduced-motion system preferences automatically quiet all celestial orbits and pulses into dignified static emblems.

## 2026-11-06 — Living market pace glyph next to market pace line (bakeoff/gemini-market-pace)

- **Living trade canopy:** When viewing the market pace line on the Kingdom tab, an expressive market glyph rests beside the text.
- **Dynamic visual state:**
  - When gold can afford your next market level or expansion, a bright striped awning opens with glowing trade scales and an ambient amber pulse.
  - When commerce is active but funds are accumulating, balanced merchant scales remain poised and steady.
  - When the market is closed or unbuilt, a locked wooden shutter marks the stall.
- **Accessibility:** Reduced-motion system preferences automatically calm all gentle floats and breathing effects into steady, dignified emblems.

## 2026-11-06 — Market pace on the Kingdom tab (wave/market-pace)

- **Market line.** The Kingdom tab now shows one line under the next-trade hint, for example "Market pace · 3 of 9 trades open · next change in 8s: another Market finishes".
- **Rate.** Trade prices are fixed. The line counts how many trades you can afford right now. Without a Market it says "market closed".
- **Next change.** Names the next Market being built. The first one opens trading. With nothing queued it says "no change queued".
- **Read only.** Market rules are the same.

## 2026-11-06 — Living wall pace glyph next to the wall pace line (bakeoff/gemini-wall-pace)

- **Living wall glyph.** A miniature living fortification glyph now sits right beside the Kingdom tab's wall pace line:
  - **Rising wall:** a fortified golden stone rampart with crenellations (or an arched gatehouse with iron portcullis when a gate is building), a twinkling apex diamond star, and a breathing amber aura whenever a defensive upgrade is underway.
  - **Steady wall:** a quiet slate stone curtain wall with steady merlons when no wall construction is queued.
- **Subtle and aligned.** The glyph aligns cleanly with the text row without shifting surrounding lines or cluttering the layout.
- **Never blocks clicks.** The glyph is strictly decorative (`pointer-events: none`) and respects reduced-motion preferences.
- **Play is unchanged.** Visual enhancement only; wall hit points, construction durations, gate defense mechanics, and building rules are untouched.

## 2026-11-06 — Wall pace on the Kingdom tab (wave/wall-pace)

- **Wall line.** The Kingdom tab now shows one line under the vision line, for example "Wall pace · wall HP 48 · next change in 9s: a wall section finishes".
- **Next change.** Names the next wall section or gate being built that will change your wall HP. With nothing queued it says "no change queued".
- **Read only.** Wall rules are the same.

## 2026-11-06 — Living vision pace glyph next to the vision pace line (bakeoff/gemini-vision-pace)

- **Living vision glyph.** A miniature living scout aperture glyph now sits right beside the Kingdom tab's vision pace line:
  - **Rising vision:** a radiant sky-blue horizon eye with a glowing pupil iris, charge detail for the incoming expansion (watchtower battlement crown, surveying meridian cross, or keep coronet), a twinkling apex beacon star, and a breathing cyan aura whenever a vision upgrade is underway.
  - **Steady vision:** a quiet slate horizon eye with a steady iris and alignment pips when no vision expansion is queued.
- **Subtle and aligned.** The glyph aligns cleanly with the text row without shifting surrounding lines or cluttering the layout.
- **Never blocks clicks.** The glyph is strictly decorative (`pointer-events: none`) and respects reduced-motion preferences.
- **Play is unchanged.** Visual enhancement only; vision ranges, fog-clearing distances, building queues, and study durations are untouched.

## 2026-11-06 — Vision pace on the Kingdom tab (wave/vision-pace)

- **Vision line.** The Kingdom tab now shows one line under the academy line, for example "Vision pace · range 3 · next change in 12s: a watchtower finishes".
- **Next change.** Names the next thing that will widen how far your hold sees: a watchtower being built, the Surveying study, or (for Peak culture) your first keep. With nothing queued it says "no change queued".
- **Read only.** Vision rules are the same.

## 2026-11-05 — Living upkeep pace glyph next to the upkeep pace line (bakeoff/gemini-upkeep-pace)

- **Living upkeep glyph.** A miniature living sustenance grain glyph now sits right beside the Army tab's upkeep pace line:
  - **Rising upkeep:** a radiant golden harvest sheaf with gilded ears, tied ribbon (martial amber for barracks levies, soothing emerald for infirmary wounded), a twinkling apex harvest diamond star, and a breathing amber-gold aura whenever new mouths are queued.
  - **Steady upkeep:** a quiet slate granary sickle and steady grain ear with a cool bronze handle when no change is queued.
- **Subtle and aligned.** The glyph aligns cleanly with the text row without shifting surrounding lines or cluttering the layout.
- **Never blocks clicks.** The glyph is strictly decorative (`pointer-events: none`) and respects reduced-motion preferences.
- **Play is unchanged.** Visual enhancement only; food consumption rates, army mouth counts, training queues, and healing schedules are untouched.

## 2026-11-05 — Upkeep pace on the Army tab (wave/upkeep-pace)

- **Upkeep line.** The Army tab now shows one line under the training line, for example "Upkeep · 0.40 food/tick (4.0/s, 20 mouths) · next change in 12s: +10 militia from the barracks".
- **Next change.** Names the next troops that will join and add to what the army eats: a finished levy from the barracks, or a healed soldier from the infirmary. With nothing queued it says "no change queued".
- **Read only.** Food costs and rules are the same.

## 2026-11-05 — Living training pace glyph next to the training pace line (bakeoff/gemini-training-pace)

- **Living training glyph.** A miniature living martial blade glyph now sits right beside the Army tab's training pace line:
  - **Fast training:** crossed steel drill blades with golden crossguards, speed ticks, an apex clash star, and a breathing emerald-gold martial aura.
  - **Base rate:** quiet slate drill ring with crossed practice foils and bronze pommels.
  - **All units unlocked:** master martial laurel wreath with gilded victory blades and a triumphant emerald star.
- **Subtle and aligned.** The glyph aligns cleanly with the text row without shifting surrounding lines or cluttering the layout.
- **Never blocks clicks.** The glyph is strictly decorative (`pointer-events: none`) and respects reduced-motion preferences.
- **Play is unchanged.** Visual enhancement only; drill durations, barracks speed bonuses, and recruitment rules are untouched.

## 2026-11-05 — Training pace on the Army tab (wave/training-pace)

- **Training line.** The Army tab now shows one line above the unit cards, for example "Training · 10 militia in 15s (base rate) · next unit Banner · Study Drill on Crown (Barracks or Academy)".
- **Training rate.** With Barracks (or a bigger keep) the time drops and the base time is shown next to it.
- **Next unit.** Names the next unit you cannot train yet and the study that opens it. When every unit is open, it says so.
- **Read only.** Train from the unit cards as before. Times and rules are the same.

## 2026-11-04 — Living academy pace glyph next to the academy pace line (bakeoff/gemini-academy-pace)

- **Living academy glyph.** A miniature living academy colonnade now sits right beside the Kingdom tab's academy pace line:
  - **Academy active:** a radiant amethyst colonnade and classical pediment with an illuminated sanctuary arch, wisdom spire, twinkling apex beacon star, and breathing lavender-violet aura.
  - **No Academy built:** a quiet slate foundation and unbuilt framework waiting for an Academy to be raised.
  - **All academy studies known:** a master scholastic laurel wreath with a triumphant amethyst star.
- **Subtle and aligned.** The glyph aligns cleanly with the text row without shifting surrounding lines or cluttering the layout.
- **Never blocks clicks.** The glyph is strictly decorative (`pointer-events: none`) and respects reduced-motion preferences.
- **Play is unchanged.** Visual enhancement only; study times, academy bonuses, and research requirements are untouched.

## 2026-11-04 — Academy pace on the Kingdom tab (wave/academy-pace)

- **Academy line.** The Kingdom tab now shows one line about your Academy, for example "Academy · no Academy, base rate · next academy study Husbandry (18s)".
- **Academy rate.** With a finished Academy the line says "new studies 20% shorter" and the time shown is the shorter Academy time.
- **Next academy study.** Names the next study an Academy can open that you do not know yet. If it needs a bigger keep, the line says so (for example "needs Keep II"). When you know them all, it says so.
- **Read only.** Start studies from the lectern as before. Times and rules are the same.

## 2026-11-04 — Living research pace glyph next to the research pace line (bakeoff/gemini-research-pace)

- **Living scholar glyph.** A miniature living astrolabe now sits right beside the Kingdom tab's research pace line:
  - **Academy pace:** a radiant celestial armillary sphere with cyan knowledge rings, gold speed ticks, a breathing amber aura, and a twinkling center scholar star.
  - **Base pace:** a calm, dignified brass-and-pewter astrolabe reflecting steady study without an Academy.
  - **Active study:** a bright beacon star glowing at the heart of the astrolabe whenever your lectern is actively researching.
  - **All units unlocked:** a laurel wreath and triumphant 8-point compass star when every unit study is complete.
- **Subtle and aligned.** The glyph aligns cleanly with the text row without shifting surrounding lines or cluttering the layout.
- **Never blocks clicks.** The glyph is strictly decorative (`pointer-events: none`) and respects reduced-motion preferences.
- **Play is unchanged.** Visual enhancement only; study times, academy bonuses, and research requirements are untouched.

## 2026-11-04 — Research pace on the Kingdom tab (wave/research-pace)

- **Research pace.** The Kingdom tab now shows one line with your research speed, for example "Research pace · base pace · lectern idle · next unlock Fieldcraft → Ranger (18s)".
- **Academy pace.** With a finished Academy the line says "Academy pace" and the times shown are the shorter Academy times.
- **Next unlock.** Names the next study that opens new units and which units. When every unit is open, it says so.
- **Read only.** Start studies from the lectern as before. Times and rules are the same.

## 2026-11-04 — Living market glyph on the market hint line (bakeoff/gemini-market-hint)

- **Living trade glyph.** A miniature living merchant glyph now sits right beside the Kingdom tab's market hint line:
  - **Ready to Trade:** a lively merchant stall with a vibrant striped canopy, swaying golden balance scales with commodity trade pans, a gentle breathing prosperity aura, and a twinkling coin glint.
  - **Awaiting stores:** a quiet terracotta stall with steady brass scales patiently waiting for grain or ore to arrive.
  - **Market needed:** a shuttered timber stall with a small padlock indicating a Market must be built first.
- **Subtle and aligned.** The glyph aligns cleanly with the text row without shifting surrounding lines or cluttering the layout.
- **Never blocks clicks.** The glyph is strictly decorative (`pointer-events: none`) and respects reduced-motion preferences.
- **Play is unchanged.** Visual enhancement only; trade ratios, market offers, and resource exchange rules are untouched.

## 2026-11-04 — Market hint on the Kingdom tab (wave/market-hint)

- **Next trade.** The Kingdom tab now shows one line with the next Market trade you can make and what it costs, for example "Next trade · 8 gold → 25 food · costs 8 gold".
- **Short on stores.** If you cannot pay for any trade yet, the line says "not enough in stores". With no Market built, it tells you to build one.
- **Read only.** Trade with the Market cards further down the tab as before. Prices and rules are the same.

## 2026-11-04 — Living decree seal on the decree hint line (bakeoff/gemini-decree-hint)

- **Living royal seal.** A miniature living heraldic wax seal now rests beside the Kingdom tab's decree hint line:
  - **Ready to Swear:** a glowing molten wax seal with warm golden ribbon tails, shining breathing aura, tailored decree signet (swords for Muster, wheat for Harvest Rite, treaty scroll for Envoys), and a twinkling wax glint.
  - **Saving stores:** a deep carmine stamped wax seal quietly waiting until your granary or treasury has enough resources.
  - **All decrees sworn:** an imperial crown seal celebrating full realm enactment.
- **Subtle and aligned.** The seal fits neatly into the text row without shifting surrounding lines or cluttering the interface.
- **Never blocks clicks.** The seal is strictly decorative (`pointer-events: none`) and respects reduced-motion preferences.
- **Play is unchanged.** Visual enhancement only; decree costs, durations, and effects are untouched.

## 2026-11-04 — Decree hint on the Kingdom tab (wave/decree-hint)

- **Next decree.** The Kingdom tab now shows one line with the next decree you can swear and what it costs, for example "Next decree · Muster the Host · 40 gold".
- **Short on stores.** If you cannot pay for any open decree yet, the line says "not enough in stores".
- **Read only.** Swear decrees on the Crown tab as before. Costs and rules are the same.

## 2026-11-04 — Living age glyph on the age line (bakeoff/gemini-age)

- **Living age glyph.** A miniature living heraldic sunburst glyph now marks your realm's epoch right beside the Kingdom tab's age line:
  - **Ready to Ascend:** a blazing golden sunrise rising over the mountain horizon, illuminated with a breathing golden aura, dynamic radiant sunbeams, and a twinkling apex dawn star.
  - **Gathering resources:** a calm morning dawn with warm amber rising sun disc, reflecting steady progress toward the next Dawn.
  - **Shared hold:** an enduring stone monolith with celestial sapphire disc and silver epoch star, reflecting the collective era without ascension.
- **Subtle and aligned.** The glyph sits comfortably in line with the text without vertical jumping or clutter.
- **Never blocks clicks.** The glyph is strictly decorative (`pointer-events: none`) and respects reduced-motion preferences.
- **Play is unchanged.** Visual enhancement only; ascension thresholds, prestige bonuses, and Second Dawn mechanics are untouched.

## 2026-11-04 — Age line on the Kingdom tab (wave/age-line)

- **Your age at a glance.** The Kingdom tab now shows one line with your current age and what the next one needs, for example "Age · Dawn 0 · next age at 30K total resources."
- **Ready hint.** When you have enough, the line says so. You still ascend from the Second Dawn card on the Crown tab.
- **Nothing changed in the rules.** The line only shows numbers the game already had.

## 2026-11-04 — Culture line on the Kingdom tab (wave/culture-picker)

- **Your culture at a glance.** The Kingdom tab now shows one line with your current culture, for example "Culture · Crown Marches · next Cedar Kin".
- **One-click switch.** The button on that line switches you to the next culture in the list. Click again to keep stepping through.
- **Same as before.** It is the same switch as the full picker on the Crown tab. New Game still keeps your pick on this browser. Culture rules are unchanged.

## 2026-11-04 — Living research glyph (bakeoff/gemini-research-hint)

- **Living research codex.** A miniature living heraldic codex glyph now rests beside the Kingdom tab's research hint line, illustrating your realm's next academic endeavor:
  - **Ready to study:** an illuminated open vellum manuscript on a carved scholar's lectern, shining with a gentle golden breathing aura and twinkling apex star.
  - **Prerequisites needed:** an antique study codex waiting in quiet study until your Keep or guild halls are ready.
  - **All studies mastered:** a golden laurel wreath arc crowned with a master codex celebrating total realm knowledge.
- **Subtle and readable.** The glyph aligns cleanly with the text line without causing vertical jumps, keeping costs and requirements completely clear.
- **Never blocks clicks.** The glyph is strictly decorative (`pointer-events: none`) and respects reduced-motion preferences.
- **Play is unchanged.** Visual enhancement only; study costs, durations, and research mechanics are untouched.

## 2026-11-04 — Research hint on the Kingdom tab (wave/research-hint)

- **What to study next.** The Kingdom tab now shows one line with your next study and what it costs, for example "Next study · Husbandry · 20 food, 12 wood".
- **What is missing.** If you cannot start it yet, the line says what you still need, like a farm or Keep 2.
- **Read only.** Start studies from the lectern as before. Costs and rules are the same.

## 2026-11-04 — Living action sound glyph and acoustic pulse (bakeoff/gemini-sound)

- **See the sound.** When you place a building, train troops, or trade, a living acoustic sound glyph now appears right beside the confirmation text, pulsing with radiating sound waves:
  - **Built:** a glowing forge chime emitter sending warm golden resonance waves into the air.
  - **Trained:** a heraldic clarion war-horn sounding with sharp ruby and steel acoustic wavefronts.
  - **Traded:** a coin chime bell ringing with sapphire and gold harmonic waves.
- **Acoustic ripple.** A soft colored sound pulse ring ripples outward as the chime plays, visually echoing the audio stinger.
- **Never blocks clicks.** The sound glyph and acoustic pulse are strictly visual overlays and never block clicks.
- **Play is unchanged.** Visual audio feedback only; costs and rules remain the same.

## 2026-11-04 — Action confirmation sound (wave/action-sound)

- **Hear when it worked.** Placing a building, queuing troops, or making a trade now plays a short chime along with the **Built / Trained / Traded** badge.
- **Only on success.** A refused action stays silent.
- **Play is unchanged.** Sound only. Costs and rules are the same.

## 2026-11-04 — Living action confirmation flash and spark treatment (bakeoff/gemini-flash)

- **Living action spark.** When you build, train, or trade, your confirmation badge now sparkles with an authentic living starburst tailored to the action:
  - **Built:** a glowing golden forge diamond with radiating ember sparks.
  - **Trained:** a sharp martial blade glint with crossed steel clash rays.
  - **Traded:** a radiant 8-point gold coin spark with sapphire shimmer.
- **Atmospheric glow.** A subtle colored halo pulses softly behind the badge and a delicate light sweep glides across the pill, giving clear and satisfying visual feedback without distracting from the game.
- **Never blocks clicks.** The badge and all its sparks are purely decorative overlays and will never block or intercept your clicks.
- **Play is unchanged.** Visual feedback only; building placement, recruitment, and trading mechanics are untouched.

## 2026-11-04 — Action confirmation flash (wave/action-flash)

- **See when it worked.** When you place a building, queue troops, or make a trade, a small badge pops up near the top of the screen: **Built**, **Trained**, or **Traded**. It fades away in under a second.
- **Only on success.** If you cannot afford it or the plot is taken, no badge appears — read the status line as before.
- **Never in the way.** The badge does not block clicks.
- **Play is unchanged.** Look only. Costs and rules are the same.

## 2026-11-04 — Living culture emblems on balance notes (bakeoff/gemini-balance)

- **Living culture emblems at a glance.** The Kingdom tab's **Balance notes** panel now displays each culture's miniature living heraldic emblem alongside its name.
- **Your active culture stands out.** Your current realm culture is subtly highlighted with an illuminated crest featuring a warm golden aura and gleaming apex star.
- **Clean and readable.** The miniature crests fit neatly inside the table rows without shifting the text, crowding numbers, or catching mouse clicks.
- **Play is unchanged.** Visual enhancement only; unit costs, stats, and culture mechanics remain identical.

## 2026-11-04 — Balance notes on the Kingdom tab (wave/balance-notes)

- **Compare cultures at a glance.** The Kingdom tab has a new **Balance notes** box (tap to open). It lists every culture, its one difference, its own unit, and what that unit costs.
- **Costs are base costs.** Barracks, research, doctrine, decrees, stables and archery ranges can make training cheaper than the number shown.
- **Play is unchanged.** It only shows numbers the game already uses.

## 2026-11-03 — Living hover treatment on the diamond board (bakeoff/gemini-hover)

- **Subtle living hover breath.** Moving your pointer over any province on the diamond board now illuminates the tile with a soft, silver-pearl living breathing perimeter and faint translucent ground wash, giving immediate tactile focus under your cursor.
- **No more fighting the selected province.** Previously, hovering any tile drew a duplicate gold selection ring that competed with your selected province. Now, unselected tiles show the distinct silver-pearl hover breath, while hovering your currently selected province gently highlights its gold rim with a warm glint.
- **Ethereal fog hover.** Unscouted provinces shrouded in fog respond with an ethereal mist outline that respects the frontier's mystery without giving away hidden features.
- **Clear view of what matters.** The living hover rim sits right on the terrain, drawing beneath keeps, armies, node stock piles, outpost flags, and the top hover card so your realm remains crisp and readable.
- **Play is unchanged.** Visual treatment only; all game rules and mechanics are untouched.

## 2026-11-03 — Clearer province hover tooltip on the diamond board (wave/board-hover)

- **Hover a tile to read it.** On the board, pointing at a province now shows a small card above it with three lines: **Stock** (how much wood, stone or grain is left), **Owner** (you, nobody, or the rival's name) and **Status** (for example Clash, Incoming, Marching, Home, Garrison, Gathering, Rival held, Dry or Open).
- **The edge colour is the status.** Red for a clash, orange for incoming, green for open, and so on.
- **Nothing covers it.** Rain, snow, fog, roads, marching columns, keeps, unit labels, effects and the selected-tile ring all draw under the card. Tiles at the top edge show the card below instead.
- **Fog stays fog.** Tiles you have not scouted show only "Unscouted".
- **Play is unchanged.** Only the look changed. The game rules are the same.

## 2026-11-03 — Living culture crests on the culture picker (bakeoff/gemini-culture)

- **Living heraldic crests.** Every culture in the Crown tab picker now features its own miniature heraldic crest:
  - Crown Marches: royal coronet and cruciform steel sword.
  - Cedar Kin: sacred evergreen pine and antler glint.
  - Sand Banner: blazing desert sun and crescent.
  - Wind Host: recurve steppe bow and crimson horsehair plume.
  - Tide Clans: cresting sea breaker and triton fork.
  - Mist Reach: shroud of swirling mist and ranger arrow.
  - Glen Holds: stone highland crag hold and chivalric standard.
  - Salt Reaches: faceted salt diamond and outrider couched lance.
  - Fen Steads: water-reed marsh sheaf and warden spearhead.
  - Peak Holds: snow pinnacle and mountain watchtower beacon.
- **Radiant living crown aura.** When you select a culture, its crest glows with a breathing aura washed in the culture's tabard colors and gleams with a sparkling apex star, celebrating your chosen style.
- **Crisp and unhindered.** Crests sit neatly alongside the culture title without crowding the cards, and clicks remain perfectly responsive.
- **Play is unchanged.** Visual treatment only; all game mechanics and culture bonuses are untouched.

## 2026-11-03 — Clearer culture picker (wave/culture-picker)

- **See what each culture gives you.** On the Crown tab, each crown style card now shows its unit (for example, Mist Reach → Ranger) and its one difference (for example, Farm +1 food).
- **The first five styles change looks only.** Crown Marches, Cedar Kin, Sand Banner, Wind Host, and Tide Clans say "base roster" and "looks only".
- **Picking works the same.** Click a card to pick it. New Game still keeps your pick on this browser.

## 2026-11-03 — Living weather treatment on the diamond board (bakeoff/gemini-weather)

- **Living rain, snow, and autumn wind.** Rain now falls with delicate streaks that splash into ripples on the ground tiles; winter brings fluttering crystalline snowflakes that softly settle on the land; and autumn brings tumbling golden-amber leaves dancing across the kingdom on the breeze.
- **Storms with lightning.** Summer and autumn storms bring heavy driving rain, impact splash rings, and localized lightning bolts flashing across the horizon.
- **Clear view of what matters.** All rain, snow, and falling leaves draw underneath your keeps, marching armies, outposts, supply piles, and the golden selected province ring, so your units and kingdom borders are never hidden.
- **Play is unchanged.** Purely visual; weather movement modifiers and game rules are unaffected.

## 2026-11-03 — Clearer weather and season markers on the diamond board (wave/board-weather)

- **Weather and season at a glance.** The top-left corner of the board now has a small dark plaque. The top half shows the weather: rain, storm, or snow, or a sun by day and a moon at night when the sky is clear. The bottom half shows the season.
- **The ring tells the season too.** The plaque's edge is green in spring, gold in summer, orange in autumn, and pale blue in winter.
- **Nothing covers it.** Fog, rain, snow, roads, marching columns, keeps, camps, effects and the selected-tile ring all draw underneath it.
- **Play is unchanged.** Only the look changed. The game rules are the same.

## 2026-11-03 — Living effect and status treatment on the diamond board (bakeoff/gemini-effects)

- **Living battle clashes and threat beacons.** Provinces with active clashes now spark with fiery martial embers, while incoming hostile columns trigger an unmistakable pulsing threat beacon on the target tile.
- **Weather-tied frontier effects.** Frontier fog-edge markers react to realm weather, glistening with diamond frost crystals during winter snow and shimmering with electric mist droplets during storms and rain.
- **Pulse and path highlights.** Scouts, garrisons, gatherers, and player column trails feature subtle, living breathing halos that reinforce their status across the realm.
- **Unobscured clarity.** All living sparks and status effects stay readable beneath keeps, node piles, camps, weather storms, and selection outlines, while unit count and ETA tags remain clearly visible above them.
- **Play is unchanged.** Purely visual; combat resolution, arrival times, and game rules are unaffected.

## 2026-11-03 — Clearer effect and status markers on the diamond board (wave/board-effects)

- **Status marks are easier to read.** The small marks on board tiles now sit on a dark disc with a coloured ring. That covers fights (red burst), enemy columns on the way (orange), your trails, the season, garrisons, scouts, gatherers, rival owners, your holds, finished buildings, staffed buildings, and the fog edge.
- **Nothing hides them now.** Rain, snow, storms, night, fog, roads, marching columns, keeps, camps, piles and the gold ring around the selected tile all draw underneath the marks. Only the troop count and arrival time tags float above them.
- **Same marks, same places.** Each mark keeps its old picture and spot on the tile. The dark disc does not pulse.
- **Play is unchanged.** Only the look changed. The game rules are the same.

## 2026-11-03 — Living units and marches on the diamond board (bakeoff/gemini-units)

- **Living marching columns.** As armies, scouts, foragers, and garrisons advance across the diamond board, each column meeple is grounded by a breathing status aura matching its role colour: golden amber for your armies, menacing crimson for enemy warbands, stealth cyan for scouts, pastoral green for gatherers, and royal sapphire for garrisons.
- **Trailing wake motes.** Moving columns leave a subtle trail of luminous wake sparks along their path, conveying lively forward momentum as they march across the realm.
- **Defensive sentry aura.** Stationed garrisons guarding outposts feature a rhythmic sentry ward pulse beneath their encampment, signaling vigilant readiness.
- **Unobscured clarity under weather and fog.** The glowing status rings and wake motes remain readable beneath keeps, node piles, camps, weather storms, fog banks, and selected province rims.
- **Play is unchanged.** Visual treatment only; march arrival times, combat math, and movement mechanics are untouched.

## 2026-11-03 — Clearer unit and march labels on the diamond board (wave/board-units)

- **Every marching column has a clear label.** A small dark tag floats above each marching piece. It shows how many troops are in the column and how many seconds until it arrives (hourglass).
- **Colour tells you who it is.** The tag's edge matches the march: amber for your armies, red with a skull for enemies, cyan for scouts, green for gatherers, blue for garrisons.
- **Garrisons show their strength.** A posted garrison on a province you can see has a blue tag with a shield and its power.
- **Always on top.** Tags draw above rain, snow, storms, night, fog, roads, keeps, march lines and the selected outline, so they stay readable. They hold still instead of bobbing with the walk.
- **No pile-ups.** When two columns stand on the same spot, one tag moves up and a thin line points back to its piece.
- **Play is unchanged.** The tags only show what was already true.

## 2026-11-03 — Living roads and paths on the diamond board (bakeoff/gemini-roads)

- **Living roads between provinces.** Neighbouring provinces you have explored are linked by packed-earth roads with dark ink edges, traversed by travelling merchant carts and soft puffs of road dust.
- **Mountain paths.** Across rugged peaks, roads transition into dashed trails walked by solitary travelers.
- **Trails into the fog.** Along the frontier, trails lead up to unexplored lands with subtle drifting frontier dust, stopping cleanly at the fog edge.
- **Unobscured clarity.** Roads and travelers pass beneath your keeps, marching columns, meeples, resource piles, camps, weather storms, and selection rims, keeping the board legible.
- **Play is unchanged.** Roads are purely visual and do not change march speeds or province adjacencies.

## 2026-11-03 — Living selected province on the diamond board (bakeoff/gemini-select)

- **Selected provinces are unmistakable and alive.** The gold rim stays crisp and steady, backed by dark ink and a soft pale halo so it remains readable under heavy snow, fog, night, and storms.
- **Living corner brackets.** Four gold brackets frame the diamond tile corners with a gentle shimmer, distinguishing the selected province from your golden player keeps.
- **Unobscured clarity.** Rain, snow, fog veil, march routes, army meeples, miniature keeps, resource piles, and outpost camps all sit beneath the selection rim, keeping your focus clear.
- **Play is unchanged.**

## 2026-11-02 — Living keeps on the diamond board (bakeoff/gemini-keeps)

- **Keeps are alive and easy to spot.** Every hold on the board stands on a dark ink base rimmed in its owner's colour: gold for yours, red for the Iron March, and each other realm's border colour.
- **Living heraldic banners and hearth light.** Each keep features a fluttering heraldic pennant, warm doorway hearth light, and a watchfire beacon pulsing atop your home keep spire.
- **Rain, snow, storms and the fog line no longer cover keeps.** Keeps draw over march route lines, so columns march directly to the gates, and marching pieces, resource piles, outpost flags, and camps remain in front.
- **Strictly decorative and accessible.** All overlays ignore mouse clicks and respect prefers-reduced-motion preferences.
- **Play is unchanged.** Holds, sieges and marches work exactly as before.

## 2026-11-02 — Living marches on the diamond board (bakeoff/gemini-marches)

- **Marching columns are alive and easy to follow.** Each march now has an ink-backed route with direction arrows, an animated marching trail, trailing dust puffs, and a fluttering standard-bearer war banner.
- **Colour tells you who is marching.** Amber for your armies, red for enemies, green for gatherers, blue for garrisons, and cyan for scouts.
- **Meeples stand out.** Each marching column meeple stands on an ink ring in its march role colour with active step cadence, making it easy to spot against snow, rain, or night tiles.
- **Rain, snow and the fog line no longer cover marches.** Resource piles, outpost flags, rival camps, and your selected-province outline still draw on top.
- **Strictly decorative and accessible.** All overlays ignore mouse clicks and respect prefers-reduced-motion preferences.
- **Play is unchanged.** March speed and arrival times work exactly as before.

## 2026-11-02 — Living fog treatment on the diamond board (bakeoff/gemini-fog)

- **You can now see exactly where your map knowledge ends.** Where a province you have seen meets one still under cloud, the board draws a clear mist line with dark ink underlay and a soft slate band on the fog side.
- **Living cloud drift on the atlas.** Unseen territory on the Kingdom Atlas features living drifting cloud lobes, gentle volumetric pulsing, wispy vapor tendrils, and a misty perimeter contour.
- **It never covers what matters.** Weather, resource piles, outpost flags, rival camps, and the gold outline on your selected province all draw on top of it.
- **Strictly decorative and accessible.** All overlays ignore mouse/pointer clicks and respect prefers-reduced-motion preferences.
- **Play is unchanged.** Scouting, fog of war, and vision rules work exactly as before.

## 2026-11-02 — Clearer weather on the diamond board (bakeoff/gemini-weather)

- **Rain, snow, storms and lightning are clearer across every tile.** Each falling drop, snowflake and lightning bolt has a faint dark ink underlay so precipitation is easy to see on white snow, gray fog and dark night tiles alike, while sitting neatly underneath node piles, outpost flags, and the golden selection rim.
- **Corner weather plaque.** A small plaque in the top-left corner of the board displays an animated weather glyph (cloud, rain, storm with lightning, or snow) so you can tell current weather conditions at a glance.
- **Kingdom Atlas weather.** The overworld atlas now features an animated weather corner glyph and subtle falling rain/snow particles on seen provinces.
- **Play is unchanged.** March weather slows and storm effects work exactly as before.

## 2026-11-02 — Clearer outpost flags and rival camp marks on the diamond board (bakeoff/gemini-camps)

- **Outpost flags and rival camp marks are easier to spot in all weather.** Each mark sits on a small dark ink base with an emerald rim (for player outposts) or rose rim (for rival camps). The marks draw on top of rain, snow, storm clouds, fog, and day/night lighting so weather never washes them out.
- **Kingdom Atlas outposts and camps feature living motion.** On the overworld atlas, outpost and camp markers now feature contrast bases, animated fluttering flags, and flickering hearth lantern glows.
- **Play is unchanged.** Outposts, camps, territory, and marches work exactly as before.

## 2026-11-02 — Clearer resource piles on the diamond board (bakeoff/gemini-node-piles)

- **The log, stone and grain piles on woodcut, quarry and field tiles are easier to see in all weather.** Each stocked pile sits on a small dark ink base with a faint warm edge, and the piles and their stock numbers are drawn on top of rain, snow, storms, fog and the sun or moon glow so weather never dims them.
- **Kingdom Atlas resource piles have been polished.** On the overworld atlas, resource piles now feature steady dark bases and gentle ambient idle breathing.
- **Play is unchanged.** Stock, gathering and everything else work exactly as before. Empty nodes still show no pile.

## 2026-11-02 — Living selected-province rim treatment on the diamond board (bakeoff/gemini-select-rim)

- **The gold outline on your selected province now features a living, layered rim that stays sharp and readable in all weather.** Snow, rain, clouds, day, and night no longer dim or wash out the selection ring. A steady dark ink outline beneath the gold keeps the province edge crisp against pale snow and fog, accompanied by a gentle radiant amber-gold glow and corner reticle gems.
- All new decorative overlay styling is pointer-events: none so panning, zooming, selecting provinces, and clicking buttons work exactly as before.
- **Play is unchanged.** Selection, marches, scouting, battles, and kingdom management work exactly as before.

## 2026-11-02 — Living log pips inside hold log cards (bakeoff/gemini-hold-log-pips)

- **The hold log cards now feature living 16px log pips. Play is unchanged.** When you view a joined shared hold in the Cloud panel with recorded actions, each log card displays an authentic living chronicle parchment pip (an illuminated folio with calligraphic ink lines and heraldic emblems reflecting the logged action, such as crossed swords for training, a reaping sickle for farms, an axe for lumber camps, a cottage for cottages, or a stamped royal wax seal for stamps).
- All new art is pointer-events: none on every pip and all children so clicking buttons and interacting with the hold works exactly as before.
- **Play is unchanged.** Your game, Push save, Pull save, offline catch-up, Second Dawn, Repair, hold keys, sign-in, guest ids, hold saves, reloads, and the server limits work exactly as before.

## 2026-11-02 — Living work pips inside hold work cards (bakeoff/gemini-hold-work-pips)

- **The hold work cards now feature living 16px work pips. Play is unchanged.** When you view a joined shared hold in the Cloud panel, each of the four work cards (Militia, Farms, Cottages, and Lumber camps) displays an authentic living work pip (a conical helm with nasal guard and brow band for militia, a reaping sickle with golden wheat ear for farms, a thatched cottage with glowing hearth and smoke plume for cottages, and a felling axe in a timber stump for lumber camps).
- All new art is pointer-events: none on every pip and all children so clicking buttons and interacting with the hold works exactly as before.
- **Play is unchanged.** Your game, Push save, Pull save, offline catch-up, Second Dawn, Repair, hold keys, sign-in, guest ids, hold saves, reloads, and the server limits work exactly as before.

## 2026-11-02 — Living key pip inside the hold key card (bakeoff/gemini-hold-key-pip)

- **The hold key card now features a living 16px key pip. Play is unchanged.** When you make a new shared hold in the Cloud panel, the new key card displays an authentic living key pip (depicting an antique golden royal skeleton key with trefoil bow and bit teeth).
- All new art is pointer-events: none on every pip and all children so clicking Copy key and every button works exactly as before.
- **Play is unchanged.** Your game, Push save, Pull save, offline catch-up, Second Dawn, Repair, hold keys, sign-in, guest ids, hold saves, reloads, and the server limits work exactly as before.

## 2026-11-02 — Living leave pip inside the hold leave card (bakeoff/gemini-hold-leave-pip)

- **The hold leave card now features a living 16px leave pip. Play is unchanged.** When you press Leave in a joined shared hold in the Cloud panel, the leave card displays an authentic living leave pip (depicting an arched postern doorway looking out onto a sunlit morning path).
- All new art is pointer-events: none on every pip and all children so clicking Confirm leave, Cancel, and every button works exactly as before.
- **Play is unchanged.** Your game, Push save, Pull save, offline catch-up, Second Dawn, Repair, hold keys, sign-in, guest ids, hold saves, reloads, and the server limits work exactly as before.

## 2026-11-02 — Leave card in a joined hold (wave/hud-hold-leave)

- **Leaving a hold now asks with a small card.** In a joined shared hold (Cloud panel), pressing **Leave** opens a card that names the hold and warns you: the hold keeps running, and to join again you need the realm id and its key. Press **Confirm leave** to go, or **Cancel** to stay.
- **Play is unchanged.** Leaving still returns you to your solo crown, which is not touched.

## 2026-11-02 — Living stamp pip inside each hold stamp card (bakeoff/gemini-hold-stamp-pip)

- **Each hold stamp card now features a living 16px stamp pip. Play is unchanged.** When you view a joined shared hold in the Cloud panel, each stamp card displays an authentic living crimson wax-seal stamp pip with a stamped royal signet emblem.
- All new art is pointer-events: none on every pip and all children so clicking buttons and interacting with the hold works exactly as before.
- **Play is unchanged.** Your game, Push save, Pull save, offline catch-up, Second Dawn, Repair, hold keys, sign-in, guest ids, hold saves, reloads, and the server limits work exactly as before.

## 2026-11-02 — Living status pip inside hold status card (bakeoff/gemini-hold-status-pip)

- **The hold status card now features a living 16px status pip. Play is unchanged.** When you view a joined shared hold in the Cloud panel, the status card displays an authentic living crown status pip (with an emerald heartbeat jewel that warms to amber whenever intents are in flight).
- All new art is pointer-events: none on the pip and all children so clicking buttons and interacting with the hold works exactly as before.
- **Play is unchanged.** Your game, Push save, Pull save, offline catch-up, Second Dawn, Repair, hold keys, sign-in, guest ids, hold saves, reloads, and the server limits work exactly as before.

## 2026-11-02 — Living action pips inside hold action cards (bakeoff/gemini-hold-action-pips)

- **The four hold-action cards now feature living 16px action pips. Play is unchanged.** When you view a joined shared hold in the Cloud panel, the Train, Build, Stamp, and Leave cards each display an authentic living action pip (steel broadsword & spear for Train, craftsman mallet & trowel for Build, royal brass signet stamp for Stamp, and sunlit postern archway for Leave).
- All new art is pointer-events: none on every pip and all children so clicking buttons and interacting with the hold works exactly as before.
- **Play is unchanged.** Your game, Push save, Pull save, offline catch-up, Second Dawn, Repair, hold keys, sign-in, guest ids, hold saves, reloads, and the server limits work exactly as before.

## 2026-10-30 — Living resource pips inside hold store cards (bakeoff/gemini-hold-pips)

- **The four hold-store cards now feature living 16px resource pips. Play is unchanged.** When you view a joined shared hold in the Cloud panel, the Food, Wood, Stone, and Gold cards each display an authentic living resource pip (golden wheat sheaf, timber logs, dressed ashlar stone, and stamped gold coin).
- All new art is pointer-events: none on every pip and all children so clicking buttons and interacting with the hold works exactly as before.
- **Play is unchanged.** Your game, Push save, Pull save, offline catch-up, Second Dawn, Repair, hold keys, sign-in, guest ids, hold saves, reloads, and the server limits work exactly as before.

## 2026-10-30 — Small wax seal marks the Leave confirmation (bakeoff/gemini-leave-seal)

- **A small wax seal now marks the Leave button while the leave confirmation is open. Play is unchanged.** When you click Leave on a shared hold in the Cloud panel, a 16px crimson wax-seal pip appears next to the Leave button and pulses once while the confirmation is open, then hides when you stay or leave.
- All new art is pointer-events: none on the seal and all its children so clicking Leave and Stay works the same as before.
- **Play is unchanged.** Your game, Push save, Pull save, offline catch-up, Second Dawn, Repair, hold keys, sign-in, guest ids, hold saves, reloads, and the server limits work exactly as before.

## 2026-10-30 — Small flash confirms a copied key (bakeoff/gemini-copy-flash)

- **A small flash now confirms a copied key. Play is unchanged.** When you copy a new shared hold's key in the Cloud panel, a 16px golden check flash appears briefly to the left of the Copy button and then hides; when no hold is joined, no flash is shown.
- All new art is pointer-events: none so clicking Copy key and every other button works the same as before.
- **Play is unchanged.** Your game, Push save, Pull save, offline catch-up, Second Dawn, Repair, hold keys, sign-in, guest ids, hold saves, reloads, and the server limits work exactly as before.

## 2026-10-30 — Hold card explains Leave (wave/hold-leave-hint)

- **The hold card now reminds you that leaving returns to your solo crown.** When you are in a shared hold, a short line under the Leave button says: "Leaving returns you to your solo crown. The hold keeps running."
- The small wax seal promised last update now really shows next to a brand-new hold key.
- **Play is otherwise unchanged.** Joining, leaving, stamping, and the hold itself work exactly as before.

## 2026-10-30 — Small seal marks the hold key (bakeoff/gemini-key-seal)

- **A small seal now marks the hold key. Play is unchanged.** When you create a new shared hold in the Cloud panel and its one-time hold key is shown, a 16px wax-seal pip appears to the left of the key and pulses once when first shown; when no hold key is visible, no seal is shown.
- All new art is pointer-events: none so copying the key and clicking buttons work the same as before.
- **Play is unchanged.** Your game, Push save, Pull save, offline catch-up, Second Dawn, Repair, hold keys, sign-in, guest ids, hold saves, reloads, and the server limits work exactly as before.

## 2026-10-29 — Small pip marks the intent log (bakeoff/gemini-intent-pip)

- **A small pip now marks the intent log. Play is unchanged.** On the shared hold card in the Cloud panel, a 16px wax-seal pip sits to the left of the intent log lines and pulses once when a new intent is added; when there are no intent log lines, no pip is shown.
- All new art is pointer-events: none so buttons and inputs work the same as before.
- **Play is unchanged.** Your game, Push save, Pull save, offline catch-up, Second Dawn, Repair, hold keys, sign-in, guest ids, hold saves, reloads, and the server limits work exactly as before.

## 2026-10-29 — Saves and loads noted in the ledger (bakeoff/gemini-save-audit)

- **Saves and loads are now noted in the ledger. Play is unchanged.** When a save is written or a save is loaded, a short `"Save written · tick N"` or `"Save loaded · tick N"` line appears in the Ledger of Crowns on the Crown tab.
- **Save files are unchanged.** The audit lines live only in the browser session and never alter your save file format or cloud save.
- **Play is unchanged.** Your game, Push save, Pull save, offline catch-up, Second Dawn, Repair, hold keys, sign-in, guest ids, hold saves, reloads, and the server limits work exactly as before.

## 2026-10-29 — Static board art cached so the board redraws less (bakeoff/gemini-board-cache)

- **The board redraws less and play is unchanged.** Static board tile art (terrain, cliff height faces, and unseen fog veils) is now cached on its own layer and only repainted when you switch to the board view or uncover new provinces, while moving marks, piles, ruins, camps, keeps, marches, weather, and the sun and moon continue updating smoothly every frame.
- **Unseen tiles stay fog.** Existing marks, piles, ruins, camps, and keeps stay as they are.
- All board layers and overlays remain pointer-events: none so clicking, panning, and zooming tiles work the same as before.
- **Play is unchanged.** Your game, Push save, Pull save, offline catch-up, Second Dawn, Repair, hold keys, sign-in, guest ids, hold saves, reloads, and the server limits work exactly as before.

## 2026-10-29 — Board shows moving sun and moon and weather on tiles (bakeoff/gemini-sun-moon)

- **The board now shows a moving sun and moon and weather that lands on the tiles. Play is unchanged.** Full-canvas color washes are gone: a small sun arcs across the top of the board by day with a soft warm glow beneath it, and at night a moon crosses the top of the board with soft moonlight right around the moon and a small cool glow below. Rain streaks and snow dots fall from above the board onto the tiles sparsely enough to keep every tile readable, and keeps, cottages, farms, halls, and marching columns light small night lanterns when night falls.
- **Unseen tiles stay fog.** Existing marks, piles, ruins, camps, and keeps stay as they are.
- All new art is pointer-events: none so a click still hits the tile.
- **Play is unchanged.** Your game, Push save, Pull save, offline catch-up, Second Dawn, Repair, hold keys, sign-in, guest ids, hold saves, reloads, and the server limits work exactly as before.

## 2026-10-29 — Board shows day/night cycle and weather atmosphere (bakeoff/gemini-day-night)

- **The board now shows a day/night cycle and weather atmosphere, and play is unchanged.** Warm gold rises at dawn, day stays clear and warm, dusk settles in amber, and night brings cool nocturnal blue with lower brightness alongside rain streaks, storm flashes, and drifting snow dots. Soft ground shadows under keeps and walls darken in night and storm, trees and banners sway gently in the wind, and fog edge marks thicken visually in storm and snow.
- **Unseen tiles stay fog.** Existing marks, piles, ruins, camps, and keeps stay as they are.
- All new art is pointer-events: none so a click still hits the tile.
- **Play is unchanged.** Your game, Push save, Pull save, offline catch-up, Second Dawn, Repair, hold keys, sign-in, guest ids, hold saves, reloads, and the server limits work exactly as before.

## 2026-10-29 — Board shows weather atmosphere (bakeoff/gemini-atmosphere)

- **The board now shows weather atmosphere and play is unchanged.** A soft day/night ambient tint and living weather overlay (warm gold sunlight for Clear, cool blue tint and drifting rain streaks for Rain, darker blue wash with heavier driving streaks and occasional lightning flashes for Storm, and pale grey tint with drifting snow dots for Snow) drift across the isometric board. Keeps and walls cast deeper ground shadows during storms, and evergreen boughs sway gently in the wind.
- **Unseen tiles stay fog.** Existing marks, piles, ruins, camps, and keeps stay as they are.
- All new art is pointer-events: none so a click still hits the tile.
- **Play is unchanged.** Your game, Push save, Pull save, offline catch-up, Second Dawn, Repair, hold keys, sign-in, guest ids, hold saves, reloads, and the server limits work exactly as before.

## 2026-10-29 — Tile at edge of vision shows a fog edge mark on the diamond (bakeoff/gemini-fog-edge-mark)

- **A tile at the edge of your vision now shows a fog edge mark on the diamond and play is unchanged.** A seen tile on the isometric diamond that has at least one unseen adjacent province gets a small slate mist pip mark. Fully surrounded seen tiles get no mark.
- **Unseen tiles stay fog.** Terrain, stock badges, clash marks, incoming marks, trail marks, outpost marks, season marks, garrison marks, scout marks, gather marks, owner marks, hold marks, building marks, staffed marks, piles, ruins, camps, and keeps stay as they are.
- All new art is pointer-events: none so a click still hits the tile.
- **Play is unchanged.** Your game, Push save, Pull save, offline catch-up, Second Dawn, Repair, hold keys, sign-in, guest ids, hold saves, reloads, and the server limits work exactly as before.

## 2026-10-29 — Tile with a staffed building shows a staffed mark on the diamond (bakeoff/gemini-staffed-mark)

- **A tile with a staffed building now shows a staffed mark on the diamond and play is unchanged.** A seen tile on the isometric diamond that has a finished player building with at least one worker posted to it gets a small green worker pip mark. Empty buildings get no mark.
- **Unseen tiles stay fog.** Terrain, stock badges, clash marks, incoming marks, trail marks, outpost marks, season marks, garrison marks, scout marks, gather marks, owner marks, hold marks, building marks, piles, ruins, camps, and keeps stay as they are.
- All new art is pointer-events: none so a click still hits the tile.
- **Play is unchanged.** Your game, Push save, Pull save, offline catch-up, Second Dawn, Repair, hold keys, sign-in, guest ids, hold saves, reloads, and the server limits work exactly as before.

## 2026-10-25 — Tile with a finished building shows a building mark on the diamond (bakeoff/gemini-building-mark)

- **A tile with a finished building now shows a building mark on the diamond and play is unchanged.** A seen tile on the isometric diamond that has a finished player building on it gets a small cream building pip mark. Under-construction buildings get no mark.
- **Unseen tiles stay fog.** Terrain, stock badges, clash marks, incoming marks, trail marks, outpost marks, season marks, garrison marks, scout marks, gather marks, owner marks, hold marks, piles, ruins, camps, and keeps stay as they are.
- All new art is pointer-events: none so a click still hits the tile.
- **Play is unchanged.** Your game, Push save, Pull save, offline catch-up, Second Dawn, Repair, hold keys, sign-in, guest ids, hold saves, reloads, and the server limits work exactly as before.

## 2026-10-24 — Tile that is part of your hold shows a hold mark on the diamond (bakeoff/gemini-hold-mark)

- **A tile that is part of your hold now shows a hold mark on the diamond and play is unchanged.** A seen tile on the isometric diamond that is the player's home or has a player building on it gets a small gold crown pip mark.
- **Unseen tiles stay fog.** Terrain, stock badges, clash marks, incoming marks, trail marks, outpost marks, season marks, garrison marks, scout marks, gather marks, owner marks, piles, ruins, camps, and keeps stay as they are.
- All new art is pointer-events: none so a click still hits the tile.
- **Play is unchanged.** Your game, Push save, Pull save, offline catch-up, Second Dawn, Repair, hold keys, sign-in, guest ids, hold saves, reloads, and the server limits work exactly as before.

## 2026-10-24 — Tile held by rival shows owner mark on the diamond (bakeoff/gemini-owner-mark)

- **A tile held by a rival now shows an owner mark on the diamond and play is unchanged.** A seen tile on the isometric diamond owned by a rival realm gets a small realm crest or banner pip mark. Player-owned tiles get no mark.
- **Unseen tiles stay fog.** Terrain, stock badges, clash marks, incoming marks, trail marks, outpost marks, season marks, garrison marks, scout marks, gather marks, piles, ruins, camps, and keeps stay as they are.
- All new art is pointer-events: none so a click still hits the tile.
- **Play is unchanged.** Your game, Push save, Pull save, offline catch-up, Second Dawn, Repair, hold keys, sign-in, guest ids, hold saves, reloads, and the server limits work exactly as before.

## 2026-10-24 — Tile with a gather shows a gather mark on the diamond (bakeoff/gemini-gather-mark)

- **A tile with a gather now shows a gather mark on the diamond and play is unchanged.** A seen tile on the isometric diamond that has a player gather on or heading to it gets a small amber cart and sack pip mark.
- **Unseen tiles stay fog.** Terrain, stock badges, clash marks, incoming marks, trail marks, outpost marks, season marks, garrison marks, scout marks, piles, ruins, camps, and keeps stay as they are.
- All new art is pointer-events: none so a click still hits the tile.
- **Play is unchanged.** Your game, Push save, Pull save, offline catch-up, Second Dawn, Repair, hold keys, sign-in, guest ids, hold saves, reloads, and the server limits work exactly as before.

## 2026-10-24 — Tile with a scout shows a scout mark on the diamond (bakeoff/gemini-scout-mark)

- **A tile with a scout now shows a scout mark on the diamond and play is unchanged.** A seen tile on the isometric diamond that has a player scout on or heading to it gets a small sky cloak and spyglass pip mark.
- **Unseen tiles stay fog.** Terrain, stock badges, clash marks, incoming marks, trail marks, outpost marks, season marks, garrison marks, piles, ruins, camps, and keeps stay as they are.
- All new art is pointer-events: none so a click still hits the tile.
- **Play is unchanged.** Your game, Push save, Pull save, offline catch-up, Second Dawn, Repair, hold keys, sign-in, guest ids, hold saves, reloads, and the server limits work exactly as before.

## 2026-10-24 — Tile with a posted garrison shows a garrison mark on the diamond (bakeoff/gemini-garrison-mark)

- **A tile with a posted garrison now shows a garrison mark on the diamond and play is unchanged.** A seen tile on the isometric diamond that has a posted player garrison gets a small emerald shield and tent pip mark.
- **Unseen tiles stay fog.** Terrain, stock badges, clash marks, incoming marks, trail marks, outpost marks, season marks, piles, ruins, camps, and keeps stay as they are.
- All new art is pointer-events: none so a click still hits the tile.
- **Play is unchanged.** Your game, Push save, Pull save, offline catch-up, Second Dawn, Repair, hold keys, sign-in, guest ids, hold saves, reloads, and the server limits work exactly as before.

## 2026-10-23 — Diamond shows a season mark (bakeoff/gemini-season)

- **The diamond now shows a season mark and play is unchanged.** The home tile on the isometric diamond gets a small season pip that changes with the current season: a soft green leaf for spring, a gold sun for summer, an amber leaf for autumn, and a pale blue flake for winter.
- **Unseen tiles stay fog.** Terrain, stock badges, clash marks, incoming marks, trail marks, outpost marks, piles, ruins, camps, and keeps stay as they are.
- All new art is pointer-events: none so a click still hits the tile.
- **Play is unchanged.** Your game, Push save, Pull save, offline catch-up, Second Dawn, Repair, hold keys, sign-in, guest ids, hold saves, reloads, and the server limits work exactly as before.

## 2026-10-23 — Player outpost shows a flag mark and rival camp shows a camp mark on the diamond (bakeoff/gemini-outpost-mark)

- **A player outpost now shows a flag mark and a rival camp shows a camp mark on the diamond and play is unchanged.** A seen player outpost on the isometric diamond gets a small emerald flag pip, and a seen rival camp gets a small deep-red camp pip.
- **Unseen tiles stay fog.** Terrain, stock badges, clash marks, incoming marks, trail marks, piles, ruins, and keeps stay as they are.
- All new art is pointer-events: none so a click still hits the tile.
- **Play is unchanged.** Your game, Push save, Pull save, offline catch-up, Second Dawn, Repair, hold keys, sign-in, guest ids, hold saves, reloads, and the server limits work exactly as before.

## 2026-10-19 — Tile with your column on or heading to it shows a trail mark on the diamond (bakeoff/gemini-trail)

- **A tile with your column on or heading to it now shows a trail mark on the diamond and play is unchanged.** A seen tile on the isometric diamond that has a player march on or heading to it gets a small soft-gold footprint and trail pip mark.
- **Unseen tiles stay fog.** Terrain, stock badges, clash marks, incoming marks, piles, ruins, camps, outposts, and keeps stay as they are.
- All new art is pointer-events: none so a click still hits the tile.
- **Play is unchanged.** Your game, Push save, Pull save, offline catch-up, Second Dawn, Repair, hold keys, sign-in, guest ids, hold saves, reloads, and the server limits work exactly as before.

## 2026-10-19 — Tile with a hostile column inbound shows an incoming mark on the diamond (bakeoff/gemini-incoming-mark)

- **A tile with a hostile column inbound now shows an incoming mark on the diamond and play is unchanged.** A seen tile on the isometric diamond that has a non-player march heading to it gets a small amber arrow and threat pip incoming mark.
- **Unseen tiles stay fog.** Terrain, stock badges, clash marks, piles, ruins, camps, outposts, and keeps stay as they are.
- All new art is pointer-events: none so a click still hits the tile.
- **Play is unchanged.** Your game, Push save, Pull save, offline catch-up, Second Dawn, Repair, hold keys, sign-in, guest ids, hold saves, reloads, and the server limits work exactly as before.

## 2026-10-19 — Fighting tile shows a clash mark on the diamond (bakeoff/gemini-clash)

- **A fighting tile now shows a clash mark on the diamond and play is unchanged.** A seen tile with an active fight (a column clash where columns of two or more realms meet, or an active engagement on a held tile or outpost) gets a small crossed-swords and impact burst clash mark on the isometric diamond.
- **Unseen tiles stay fog.** Terrain, stock badges, piles, ruins, camps, outposts, and keeps stay as they are.
- All new art is pointer-events: none so a click still hits the tile.
- **Play is unchanged.** Your game, Push save, Pull save, offline catch-up, Second Dawn, Repair, hold keys, sign-in, guest ids, hold saves, reloads, and the server limits work exactly as before.

## 2026-10-19 — Seen gather tile shows a stock number on the diamond (bakeoff/gemini-stock-badge)

- **A seen gather tile now shows a stock number on the diamond and play is unchanged.** A seen gather tile (woodcut, quarry, field) on the isometric diamond gets a small stock number badge next to the existing pile: a small dark pill with the ratio (e.g. `12/40`) in light text, tucked beside the pile. A dry tile shows `0/N` in muted grey. No badge is shown when `stockMax` is `0`.
- **Unseen tiles stay fog.** Peaks, hills, wastes, woods, plains, shores, ruins, camps, outposts, and keeps stay as they are.
- All new art is pointer-events: none so a click still hits the tile.
- **Play is unchanged.** Your game, Push save, Pull save, offline catch-up, Second Dawn, Repair, hold keys, sign-in, guest ids, hold saves, reloads, and the server limits work exactly as before.

## 2026-10-19 — Plain tile shows a meadow (bakeoff/gemini-plain)

- **A seen plain tile now shows a meadow and play is unchanged.** A seen plain tile on the isometric diamond gets a low pastoral meadow: a low green meadow in soft grass, a few low tufts, a gentle shadow, no keep, no flag, and no tent.
- **Unseen tiles stay fog.** Peaks, hills, wastes, woods, shores, ruins, camps, outposts, resource piles, and keeps stay as they are.
- All new art is pointer-events: none so a click still hits the tile.
- **Play is unchanged.** Your game, Push save, Pull save, offline catch-up, Second Dawn, Repair, hold keys, sign-in, guest ids, hold saves, reloads, and the server limits work exactly as before.

## 2026-10-19 — Waste tile shows a scorched crag (bakeoff/gemini-waste)

- **A seen waste tile now shows a scorched crag and play is unchanged.** A seen waste tile on the isometric diamond gets a scorched basalt crag: a low scorched rise in dark basalt, cracked ash, a faint heat glow, no keep, no flag, and no tent.
- **Unseen tiles stay fog.** Peaks, hills, woods, shores, ruins, camps, outposts, resource piles, and keeps stay as they are.
- All new art is pointer-events: none so a click still hits the tile.
- **Play is unchanged.** Your game, Push save, Pull save, offline catch-up, Second Dawn, Repair, hold keys, sign-in, guest ids, hold saves, reloads, and the server limits work exactly as before.

## 2026-10-19 — Hill tile shows a stepped rise (bakeoff/gemini-hill)

- **A seen hill tile now shows a stepped rise and play is unchanged.** A seen hill tile on the isometric diamond gets a small stepped rise: a low stepped plateau in warm ochre and stone, three tiers, a soft shadow, no keep, no flag, and no tent.
- **Unseen tiles stay fog.** Peaks, woods, shores, ruins, camps, outposts, resource piles, and keeps stay as they are.
- All new art is pointer-events: none so a click still hits the tile.
- **Play is unchanged.** Your game, Push save, Pull save, offline catch-up, Second Dawn, Repair, hold keys, sign-in, guest ids, hold saves, reloads, and the server limits work exactly as before.

## 2026-10-14 — Music plays on the live site again (wave/audio-mime)

- **Lofi and realm tracks play on the live site again.** The server now tells the browser the music files are audio, the same way the local build always did.
- **Play is unchanged.** Your game, saves, scouting, marches, and every other rule work exactly as before.

## 2026-10-14 — Peak says so (wave/hud-peak)

- **A peak tile now says it is peak with a mountain.** Click a peak tile you have seen, and the tile card shows "Peak · mountain".
- A peak tile you have not scouted still sits under fog and shows nothing new.
- **Play is unchanged.** Scouting, gathering, garrisons, marches, abandoning a flag, and every other tile line work exactly as before.

## 2026-10-14 — Wood says so (wave/hud-wood)

- **A wood tile now says it is wood with trees.** Click a wood tile you have seen, and the tile card shows "Wood · trees".
- A wood tile you have not scouted still sits under fog and shows nothing new.
- **Play is unchanged.** Scouting, gathering, garrisons, marches, abandoning a flag, and every other tile line work exactly as before.

## 2026-10-14 — Shore says so (wave/hud-shore)

- **A shore tile now says it is shore with water.** Click a shore tile you have seen, and the tile card shows "Shore · water".
- A shore tile you have not scouted still sits under fog and shows nothing new.
- **Play is unchanged.** Scouting, gathering, garrisons, marches, abandoning a flag, and every other tile line work exactly as before.

## 2026-10-14 — Ruins tile shows a broken keep (bakeoff/gemini-ruins)

- **A ruins tile now shows a broken keep, and play is unchanged.** A seen province whose node is ruins gets a small ruined keep on the diamond: broken wall, fallen stone, no flag, and no tent.
- **Unseen tiles stay fog.** Camps, outposts, resource piles, and keeps stay as they are.
- Clicking or interacting with the tile works exactly as before.
- **Play is unchanged.** Your game, Push save, Pull save, offline catch-up, Second Dawn, Repair, hold keys, sign-in, guest ids, hold saves, reloads, and the server limits work exactly as before.

## 2026-10-14 — The server only serves the game (wave/static-gate)

- **The server only serves the built app.** A web address can only open the game's own built files. An address that tries to climb out of that folder (to source code, docs, server files, or anything else) is refused, and nothing outside the folder is read.
- Opening the game works as before: the main page, its files, and any page link inside the game still load the app.
- **Solo play is otherwise unchanged.** Your game, Push save, Pull save, offline catch-up, Second Dawn, Repair, hold keys, sign-in, guest ids, hold saves, reloads, and the server limits work exactly as before. A solo save never joins a hold.

## 2026-10-14 — The server keeps the crown (wave/save-gate)

- **A full client state cannot replace the crown on the server.** A shared hold only takes a single order (stamp, train, build farm, build cottage, build lumber camp). If a browser sends a whole game state instead, the server refuses it and the hold stays exactly as it was. Joining a hold works the same way: it only takes the realm id.
- **Solo play is otherwise unchanged.** Your game, Push save, Pull save, offline catch-up, Second Dawn, Repair, hold keys, sign-in, guest ids, hold saves, reloads, and the server limits work exactly as before. A solo save never joins a hold.

## 2026-10-14 — Same play, same times (wave/sim-clock)

- **The same play now records the same times.** The game rules no longer look at your computer's clock on their own. The game hands them the time, so the same moves on the same tick give the same result, and the same recorded times, on any machine.
- **Solo play is otherwise unchanged.** Your game, offline catch-up, the daily court, Second Dawn, Repair, Pull save, hold keys, sign-in, guest ids, hold saves, reloads, and the server limits work exactly as before. A solo save never joins a hold.

## 2026-10-09 — Shared hold can load again (wave/sim-load)

- **A shared hold can load again.** The server loads the game rules for a shared hold in a way that also works on older setups, so a shared hold can still train and build. No realm is shared on the live server yet, so you will not see a difference today.
- **Solo play is unchanged.** Your game, offline catch-up, Second Dawn, Repair, Pull save, hold keys, sign-in, guest ids, hold saves, reloads, and the server limits work exactly as before. A solo save never joins a hold.

## 2026-10-09 — Server checks in the usual test (wave/server-check)

- **The usual test now includes the server checks.** `npm test` also runs the server's own tests (sign-in, guest ids, hold keys, hold saves, server limits, and the rest) and lists them by name. If any of them fails, `npm test` fails, so a broken server is not deployed.
- **Play is unchanged.** Your game, offline catch-up, Second Dawn, Repair, Pull save, hold keys, sign-in, guest ids, hold saves, reloads, and the server limits work exactly as before.

## 2026-10-09 — Guest ids never repeat (wave/guest-id)

- **A new guest cannot land on someone else's cloud save.** Each new guest gets a long random id, and the server refuses any id it has already handed out. Before, two guests could rarely get the same short id, and the newer one would open the older one's cloud save.
- If you already play as a guest, nothing changes: your token still opens your own save, and only yours.
- Discord login is unchanged.
- **The solo crown is unchanged.** Your game, offline catch-up, Second Dawn, Repair, Pull save, hold keys, sign-in, hold saves, reloads, and the server limits work exactly as before.

## 2026-10-09 — Pull save waits for reload (wave/pull-hold)

- **Pull save no longer replaces the crown until you reload.** Pressing Pull save downloads your cloud copy and keeps it aside. The game on screen keeps going, untouched. When you reload the page (or choose Load cloud), the cloud copy becomes your crown.
- After a pull you still see "Pulled cloud save. Reload the page to play it."
- If the pull fails (no cloud save, or the server is down), nothing on this browser changes.
- **The solo crown is otherwise unchanged.** Your game, offline catch-up, Second Dawn, Repair, hold keys, sign-in, hold saves, reloads, and the server limits work exactly as before.

## 2026-10-09 — Second Dawn clears unfinished jobs (wave/dawn-clear)

- **Second Dawn clears unfinished jobs.** When you ascend, troops still in training, wounded still being treated, building upgrades still going, and armies, gatherers and garrisons still out in the field all end with the old crown. Nothing you queued before the dawn turns up after it. They are not refunded.
- You keep what the dawn always kept: culture, guild, achievements, your dawn count and its production bonus. The first-dawn gift (1 militia, +20 food, +10 wood) still comes once per crown and does not stack.
- A shared hold has no Second Dawn button.
- **The solo crown is otherwise unchanged.** Your game, offline catch-up, Repair, hold keys, sign-in, hold saves, reloads, and the server limits work exactly as before.

## 2026-10-09 — A reload keeps what you dismissed (wave/reload-empty)

- **A reload no longer adds troops or workers you dismissed.** If your army or your worker list is empty when you save, it is still empty when you load. Rival and neighbour armies you wiped out stay wiped out too.
- **A new shared hold no longer gains a farm worker on a server restart.** Workers come when buildings finish, as they should.
- A very old save from before armies and workers were saved still loads and gets its starting troops and workers, as before.
- **The solo crown is otherwise unchanged.** Your game, offline catch-up, Repair, hold keys, sign-in, hold saves, and the server limits work exactly as before.

## 2026-10-09 — A failed hold save does not spend (wave/hold-write)

- **A failed save does not spend.** On a shared hold, if the server cannot save your action (say its disk is full), you see "The hold could not be saved. Nothing was spent; try again." Your militia, farms, cottages, lumber camps, and stores stay exactly as they were, so pressing the button again spends only once.
- When a save works, your friends see the new stores the next time they join with the key, and the hold comes back the same after a server restart.
- A refusal (not enough stores, no free plot) still spends nothing, as before.
- **The solo crown is unchanged.** Your game, its saves, offline catch-up, Repair, hold keys, sign-in, and the server limits work exactly as before.

## 2026-10-09 — Repair only fixes a damaged building (wave/repair-scar)

- **Repair only fixes a damaged building.** A building a siege knocked down shows as **Scarred** with a **Repair (8 stone)** button, the same as before.
- **A building still going up is unchanged.** It is no longer shown as scarred, and there is no Repair button on it, so you cannot pay 8 stone to skip its build time. That includes the lumber camp you start with: it finishes when its own timer runs out.
- A repaired building keeps its level and its worker. Nothing else about it changes.
- If a building was damaged before this update, it now shows as under construction and fixes itself when its timer runs out.
- The shared hold has no Repair button. **The solo crown is otherwise unchanged.** Saves, offline catch-up, hold keys, sign-in, and the server limits work as before.

## 2026-10-08 — A long catch-up now matches playing it (wave/settle-match)

- **A long catch-up now matches playing those ticks.** When you come back after time away, your realm ends up the same as if you had left the game open the whole time.
- Before, two things came out wrong after a long break. If your army was starving, only one militia left for the whole break instead of one per hungry moment. And if a store was full, the catch-up could spend food (or wood, stone, gold) that a full store would really have kept topped up, so you could come back short, or even starving, with a full granary's worth of farms.
- A shared hold catches up the same way.
- **The solo crown is otherwise unchanged.** Your saves, the 30-day limit on offline time, hold keys, sign-in, and the server limits work exactly as before. A very long catch-up may take a few seconds longer to load.

## 2026-10-08 — A bad address no longer stops the server (wave/realtime-guard)

- **A bad address no longer stops the server.** Before, opening a broken link (for example a profile link with a stray `%` in it) could shut the whole game server down for everyone until it was restarted. Now that link just gets "That address is not readable." and everyone else keeps playing.
- If something else goes wrong while the server answers you, you get "The server hit a snag. Try again." instead of the server going down.
- **The solo crown is unchanged.** Your game, its saves, and offline catch-up work exactly as before. Hold keys, sign-in, and the daily limits work as before.

## 2026-10-08 — A full server pauses new holds (wave/realtime-cap)

- **A full server pauses new holds. It does not wipe one you already have.** If the server has too many holds open, making a brand-new hold says "The server is full. New holds are paused; a hold you already have still opens." Your hold is kept: type its id and key and it opens as before, with time caught up.
- A hold nobody has used for a while may be set aside to make room. Nothing in it is lost. The next time you join it with its key, it comes back where it was, and it kept counting time while it was set aside.
- One network address can make only a few new guest accounts and a few new holds per day. If you hit that, the **Cloud** panel says so. Use the guest token or hold key you already have, or try tomorrow. Joining a hold you already have the key for is never limited this way.
- **The solo crown is unchanged.** Your game, its saves, and offline catch-up work exactly as before. Hold keys and sign-in work as before.

## 2026-10-05 — Sign-in links from someone else are ignored (wave/realtime-nonce)

- **A sign-in link from someone else is ignored.** If someone sends you a game link with a sign-in in it, opening it does not sign you in as them, does not sign you out, and does not upload your save to their account. The **Cloud** panel says "Ignored a sign-in link this browser did not start."
- **Log in with Discord** and **Guest session** work as before when you click them yourself. A Discord login only finishes in the same browser tab that started it. If one is refused, just click **Log in with Discord** again.
- A sign-in only works once. Reopening an old sign-in link does nothing.
- **Restore code** is unchanged: pasting your own recovery code still signs you back in.
- **The solo crown is unchanged.** Your game, its saves, and offline catch-up work exactly as before. Hold keys work as before.

## 2026-10-04 — A shared hold now has a key (wave/realtime-key)

- **A friend needs the key, not just the id.** The first time anyone joins a new id, the **Cloud** panel shows a **hold key** once, with a **Copy key** button. Copy it and send it to your friends along with the id. Without the key, typing the id is not enough to get in.
- To join a friend's hold, type the id **and** paste the key into the **Hold key** box next to it, then **Join hold**. Leave the key box blank only when you are making a brand-new hold.
- Keep the key somewhere safe. It is only shown that one time, and the hold needs it after a server restart too. A different id has a different key.
- A wrong key gets "Wrong or missing hold key" and does nothing: nothing is spent and no second hold is made. After a few wrong tries in a row you are refused for a while.
- A hold made before this change gets a key the next time someone joins it, and that person sees the key.
- **The solo crown is unchanged.** It needs no key, is not part of any hold, and **Leave** still takes you back to it exactly as it was. The hold and its key are never written into your solo save.

## 2026-10-04 — Build a lumber camp in a shared hold (wave/realtime-lumber)

- After you **Join hold** in the **Cloud** panel there is a **Build lumber camp** button next to **Build farm**, and a **Lumber camps** count beside the other numbers. A new hold already shows 1 (the starter camp). A camp either friend builds shows up for both of you on the same id. A different id does not see it.
- A lumber camp costs the same as in your solo crown (wood and food) and follows the same rules. Like a farm it needs a free work plot, so build a cottage first and wait for it to finish. If the hold cannot pay or has no room, the button says why and nothing is spent.
- **A lumber camp survives a server restart.** Join the same id again and it is still there, with everything else in the hold.
- **The joined hold is still not your old crown.** It is a separate kingdom. Nothing from your solo crown comes with you, and nothing you do in the hold goes back to it.
- **Leave** takes you back to your solo crown exactly as it was.

## 2026-10-04 — A joined hold survives a server restart (wave/realtime-keep)

- **A joined hold now survives a server restart.** When you and a friend join the same id again after the server comes back, you see the same farms, cottages, and militia you left.
- Time keeps passing while the server is down: the hold catches up when someone joins again, up to 30 days, the same limit as your solo crown's offline catch-up.
- **The solo crown does not.** It is not kept with the hold and the server does not run it. Your solo crown still saves in your browser (and to the cloud if you use cloud saves) exactly as before.
- A different id is still a different hold and starts from a new kingdom.
- No new button. **Leave** still takes you back to your solo crown, and nothing from the hold is written into it.

## 2026-10-04 — Build a cottage in a shared hold (wave/realtime-cottage)

- After you **Join hold** in the **Cloud** panel there is a **Build cottage** button next to **Build farm**, and a **Cottages** count beside the other numbers. A cottage either friend builds shows up for both of you on the same id. A different id does not see it.
- A cottage costs the same as in your solo crown (wood and food) and follows the same rules. If the hold cannot pay, the button says why and nothing is spent.
- Once the cottage is **finished** (a few seconds), the hold has room for more work buildings, so **Build farm** can work. While the cottage is still being built, Build farm still says there is no free tile.
- **The joined hold is still a fresh kingdom, not your old crown.** Nothing from your solo crown comes with you, and nothing you do in the hold goes back to it.
- **A server restart clears the hold.** It starts over from a new kingdom, with no cottages.
- **Leave** takes you back to your solo crown exactly as it was.

## 2026-10-04 — Build a farm in a shared hold (wave/realtime-build)

- After you **Join hold** in the **Cloud** panel there is a **Build farm** button next to **Train militia**, and a **Farms** count beside Food, Wood, Stone, Gold, and Militia. A farm either friend builds shows up for both of you on the same id. A different id does not see it.
- A farm costs the same as in your solo crown and follows the same rules. If the hold cannot pay, or has no free spot for a farm, the button says why and nothing is spent.
- Heads-up: a brand-new hold already uses both of its work plots (the starter farm and lumber camp), just like a new solo game. Until the hold can build a cottage, **Build farm** will say there is no free tile. That is expected for now.
- **The joined hold is still a fresh kingdom, not your old crown.** Nothing from your solo crown comes with you, and nothing you do in the hold goes back to it.
- **A server restart clears the hold.** It starts over from a new kingdom.
- **Leave** takes you back to your solo crown exactly as it was.

## 2026-10-04 — Play in a shared hold (wave/realtime-play)

- After you **Join hold** in the **Cloud** panel you now see the hold's **Food, Wood, Stone, Gold, and Militia**, and a **Train militia** button. A friend on the same id sees the same numbers, and a militia either of you trains shows up for both.
- **The joined hold is a fresh kingdom, not your old crown.** It starts like a new game. Nothing from your solo crown comes with you, and nothing you do in the hold goes back to it.
- If the hold cannot pay for a militia yet, the button says so and nothing is spent. Wait for the farm and lumber camp to fill the stores, then try again.
- **A server restart clears the hold.** Holds live only in the server's memory, so after a restart the same id starts over from a new kingdom.
- **Leave** takes you back to your solo crown exactly as it was.

## 2026-10-04 — Join a shared hold (wave/realtime-join)

- New, **opt-in**, and only a test: open the **Cloud** panel, sign in (a guest session is fine), type a short realm id like `oak-hill`, and press **Join hold**.
- A friend who types the same id joins the same hold. You both see the same tick count, and when one of you presses **Stamp**, the other sees it a moment later. A different id is a different hold.
- **Your old crown is unchanged until you join, and joining does not change it either.** It still saves in your browser and catches up offline time as before. Press **Leave** to go back to it.
- A blank id does nothing. Holds live only in the server's memory, so a server restart clears them.

## 2026-10-04 — Shared hold groundwork (wave/realtime-hold)

- The live game is unchanged because no realm is shared yet. Nothing new to try.
- Behind the scenes, the server can now run one shared hold that two players look at together: both see the same game second, and when one of them stamps the hold, the other sees the stamp a moment later. Your realm is solo, so it never joins a hold, still saves in your browser, and offline catch-up works as before.

## 2026-10-04 — Server saves for shared realms (wave/realtime-save)

- The live game is unchanged because no realm is shared yet. Nothing new to try.
- Behind the scenes, a shared realm will keep its true save on the server. Reloading will load the server copy, and editing your browser's save or a downloaded save file cannot change it. Your realm is solo, so it still saves in your browser and offline catch-up works as before.

## 2026-10-04 — Real-time clock hooked up (wave/realtime-wire)

- The live game is unchanged because no realm is shared yet. Nothing new to try.
- Behind the scenes, the server can now keep a running clock for a shared realm, and the game knows how to ask for it. Your realm is solo, so it still keeps its own time and offline catch-up works as before.

## 2026-10-04 — Real-time clock groundwork (wave/realtime-clock)

- The live game is unchanged. Nothing new to try.
- Behind the scenes, the server now has a clock that can count game seconds. Nothing uses it yet; your game still keeps its own time and offline catch-up works as before.

## 2026-10-04 — Real-time plan (wave/realtime-spec)

- This is a written plan only. We wrote down how a shared, always-running realm might work later (a server clock, saves kept on the server, two people on one hold).
- The live game is unchanged. Nothing new to try yet.

## 2026-10-04 — Notes cleanup (wave/docs-current)

- Older notes said Rangers, Banners, Outriders, Wardens, and Lancers used a plain placeholder icon. That is out of date: all five have their own Army-tab chip and march figure. Those lines are corrected below.

## 2026-10-04 — Culture Unit March Silhouettes (bakeoff/gemini-culture-marches)

- On the isometric board, your marching armies now display distinct meeple silhouettes when mostly composed of the culture units:
  - **Ranger**: A hooded runner carrying a compact hunting recurve short bow, back quiver, and nocked bodkin arrow, with a keen scout cyan glint.
  - **Banner**: An armored marcher with granite kettle helm, glen-green cloak, and a tall spear waving a swallowtail pennant.
  - **Outrider**: A swift galloping scout horse bearing a rider with a billowing salt-grey cloak and couched short lance.
  - **Warden**: A stalwart guard with a fen-reed cloak, kettle helm, sturdy marsh spear, and prominent round wicker-reed boss shield.
  - **Lancer**: A heavy armored mountain warhorse with steel forehead chanfron armor bearing a knight in visored greathelm, billowing peak-white cloak, and an exceptionally long couched shock lance with circular vamplate guard.
- Marches mostly composed of militia, spearmen, archers, cavalry, or siege engines continue to use their familiar standard meeples.
- Cultural keep silhouettes (Mist, Glen, Salt, Fen, Peak) and older culture styles remain untouched.

## 2026-10-03 — Player Culture Keeps (bakeoff/gemini-culture-keeps)

- On the isometric board and world view, your home keep now reflects the culture you chose:
  - **Mist Reach**: A low reed thatch roof and an ethereal pale mist veil drifting around the low wet-stone walls.
  - **Glen Holds**: A heavy stone quarry keep flanked by a lush green turf slope and a timber quarry crane.
  - **Salt Reaches**: A timber yard keep of squared notched logs, stacked lumber flanking the door, and a steep grey salt-crusted shingle roof.
  - **Fen Steads**: A stilt cottage keep rising on sturdy wooden pilings over dark water with animated ripples, wetland reeds, and an amber lantern glowing over the water.
  - **Peak Holds**: A soaring white limestone keep crowned with a sculptured alpine snow cap and hanging crystalline icicles.
- The Crown Marches (Western) and older cultures (Cedar, Sand, Steppe, Islands) remain unchanged.

## 2026-10-03 — First-dawn stores (wave/dawn-stores)

- Your **first** Second Dawn now starts the new crown with a small gift: **1 militia, +20 food and +10 wood** (45 food / 45 wood instead of 25 / 35).
- It only happens once. Ascending again later starts you with the normal stores and no militia.

## 2026-10-03 — 28px Lancer Chip on Lancer Card (bakeoff/gemini-lancer)

- On the Army tab, the **Lancer** card now displays a dedicated 28px heavy shock cavalry chip:
  - **Horse & Long Lance**: A powerful mountain warhorse bearing an armored knight with a heavy couched long lance and vamplate guard.
  - **Peak-White Cloak**: A flowing snow-white mantle with alpine frost highlights, pinned with a silver mountain peak brooch.
  - **States**: Glows with a radiant peak-frost silver aura when unlocked; rests in muted dusk tones while Horse lore remains to be studied.
  - Strictly non-interactive overlay (`pointer-events: none`); clicking to train or viewing tooltips remains completely smooth.

## 2026-10-03 — 28px Warden Chip on Warden Card (bakeoff/gemini-warden)

- On the Army tab, the **Warden** card now displays a dedicated 28px hold guard chip:
  - **Short Spear & Round Shield**: A sturdy marsh-wood short spear and wicker-reed round boss shield ready for hold defense.
  - **Fen-Reed Cloak**: A layered marsh-reed mantle with rush frills and golden dried reed tips, pinned with a carved bone toggle.
  - **States**: Glows with a radiant fen-reed green aura when unlocked; rests in muted cold marsh dusk tones while Screening remains to be studied.
  - Strictly non-interactive overlay (`pointer-events: none`); clicking to train or viewing tooltips remains completely smooth.

## 2026-10-03 — Peak Holds culture and lancers (wave/culture-unit-5)

- A new culture, **Peak Holds**, can be picked for a new game. It builds like the Crown Marches, but once your keep is finished your hold sees one tile farther. Existing saves keep their culture.
- A new unit, the **Lancer**, costs the same as a knight, has power 6, and drills in 6 seconds. It unlocks with **Horse lore** on the Crown tab, the same study as knights. Knights are still there.
- Lancers now have their own chip on the Army tab and their own march figure on the board (see the 2026-10-03 and 2026-10-04 notes above).

## 2026-10-02 — Fen Steads culture and wardens (wave/culture-unit-4)

- A new culture, **Fen Steads**, can be picked for a new game. It builds like the Crown Marches, but every cottage houses one more citizen. Existing saves keep their culture.
- A new unit, the **Warden**, costs the same as a skirmisher, has power 3, and drills in 3 seconds. It unlocks with a new **Screening** study on the Crown tab. Skirmishers are still there and need no study.
- Wardens now have their own chip on the Army tab and their own march figure on the board (see the notes above).

## 2026-10-02 — 28px Outrider Chip on Outrider Card (bakeoff/gemini-outrider)

- On the Army tab, the **Outrider** card now displays a dedicated 28px scout cavalry chip:
  - **Horse & Short Lance**: An agile scout steed in charging gallop with salt-frosted mane and flowing tail, bearing a rider with couched short lance.
  - **Salt-Grey Cloak**: A billowing salt-grey mantle with sea-mist highlights pinned by a salt-silver brooch clasp.
  - **States**: Glows with a radiant salt-silver aura when unlocked; rests in muted dusk tones while Horse lore remains to be studied.
  - Strictly non-interactive overlay (`pointer-events: none`); clicking to train or viewing tooltips remains completely smooth.

## 2026-10-02 — Salt Reaches culture and outriders (wave/culture-unit-3)

- A new culture, **Salt Reaches**, can be picked for a new game. It builds like the Crown Marches, but every lumber camp fells +1 more wood. Existing saves keep their culture.
- A new unit, the **Outrider**, costs the same as cavalry, hits a little softer (power 5), and drills in 5 seconds. It unlocks with **Horse lore** on the Crown tab, at the same time as cavalry. Cavalry is still there.
- Outriders now have their own chip on the Army tab and their own march figure on the board (see the notes above).

## 2026-10-02 — 28px Banner Chip on Banner Card (bakeoff/gemini-banner)

- On the Army tab, the **Banner** card now displays a dedicated 28px heraldic banner chip:
  - **Spear & Pennant**: A tall ash wood spear tipped with a leaf-shaped steel point and a fluttering swallowtail pennant with scarlet stripe.
  - **Glen-Green Cloak**: A rich highland glen-green mantle pinned with an ancient stone/bronze ring clasp.
  - **States**: Glows with a vibrant glen-green aura when unlocked; rests in muted stony-glen dusk tones while Drill remains to be studied.
  - Strictly non-interactive overlay (`pointer-events: none`); clicking to train or viewing tooltips remains completely smooth.

## 2026-10-02 — Glen Holds culture and banners (wave/culture-unit-2)

- A new culture, **Glen Holds**, can be picked for a new game. It builds like the Crown Marches, but every quarry cuts +1 more stone. Existing saves keep their culture.
- A new unit, the **Banner**, costs the same as a spearman, hits as hard, and drills in 3 seconds. To unlock it, study **Drill** on the Crown tab (you need a Barracks or an Academy). Spearmen are still open from the start.
- Banners now have their own chip on the Army tab and their own march figure on the board (see the notes above).

## 2026-10-02 — 28px Ranger Chip on Ranger Card (bakeoff/gemini-ranger)

- On the Army tab, the **Ranger** card now displays a dedicated 28px heraldic ranger chip:
  - **Hood & Bow**: A deep ranger cowl hood with keen gleaming eyes and a strung recurve woodland longbow with nocked bodkin arrow.
  - **Mist-Blue Cloak**: A flowing, billowing mist-blue mantle pinned by a golden leaf brooch clasp with wisps of morning fog.
  - **States**: Glows with a vibrant mist-blue aura when unlocked; rests in shrouded cold fog tones while Fieldcraft remains to be studied.
  - Strictly non-interactive overlay (`pointer-events: none`); clicking to train or viewing tooltips remains completely smooth.

## 2026-10-02 — Rangers on the Army tab (wave/culture-unit-ui)

- **Mist Reach** sits beside the other crown styles on the Crown tab. Pick it, then start a New Game.
- The **Ranger** card on the Army tab stays greyed out with "Study Fieldcraft on Crown" until that study is done. After that, it trains like the Archer.
- Rangers carry a bow now instead of the militia placeholder.

## 2026-10-02 — Mist Reach culture and rangers (wave/culture-unit)

- A new culture, **Mist Reach**, can be picked for a new game. It builds like the Crown Marches, but every farm feeds +1 more food. Existing saves keep their culture.
- A new unit, the **Ranger**, costs the same as an archer and hits as hard, and drills in 4 seconds. To unlock it, study **Fieldcraft** on the Crown tab (you need an Archery Range or an Academy). Archers are still open from the start.
- Rangers now have their own chip on the Army tab and their own march figure on the board (see the notes above).

## 2026-10-02 — 28px Dawn Seal Pip on Second Dawn Card (bakeoff/gemini-dawn-seal)

- On the Crown tab, the **Second Dawn** card now bears an ornate 28px royal solar wax seal:
  - **Dormant State**: Before ascension, the seal rests in deep antique slate/bronze, displaying the sleeping horizon and morning sun awaiting dawn.
  - **Risen State**: Once you ascend and the Second Dawn rises, the seal ignites into luminous molten gold with bright morning sunburst rays, the Second Crown crest, silk ceremonial ribbons, and a radiant solar halo.
  - Strictly non-interactive overlay (`pointer-events: none`); reading facts and using surrounding Crown controls remains completely unobstructed.

## 2026-10-02 — Small living pips on Keep Hall, Wall, and Yard cards (bakeoff/gemini-keep-rooms)

- Inside the Keep, each room and its fact cards now display small living heraldic pips:
  - **Hall (Bed)**: A small medieval timber cot with carved oak posts and bolster pillow. A warm bedside candle illuminates when your hold's housing is full, and a red medical cross marks infirmary cots when wounded troops are resting.
  - **Wall (Wall)**: A crenellated stone bastion with battlements and central portcullis gate. An emerald gemstone glows when your outer wall ring is closed, and warm amber warns if there is an open breach.
  - **Yard (Anvil)**: A forged steel blacksmith anvil resting on an iron-banded oak stump. Glowing red-hot iron and flying hammer sparks ignite when works or forge improvements are active.
  - Strictly non-interactive overlays (`pointer-events: none`); tapping plots, room tabs, and building cards remains completely uninterrupted.

## 2026-10-01 — Keep room cards (wave/keep-rooms)

- Inside the keep, each room now shows cards. Hall: your Keep level, people, and free plots. Wall: wall HP, whether the ring is closed, and whether the gate is up. Yard: wounded vs. beds, how long a treat takes, and who is healing now.
- Walls, gate, and keep-edge works show as cards too. Green is good, gold needs a look, red is a problem.

## 2026-10-01 — 24px Faction Seal Pips and Spoils Craft Wax Seals (bakeoff/gemini-faction-seals)

- The three faction cards and Crown Spoils crafts now display ornate heraldic wax seals:
  - **Amber Compact (Order)**: A warm amber signet seal stamped with the chivalric sunburst and knightly cross-sword.
  - **Salt Road Pact (Pact)**: A crimson blood-wax seal stamped with crossed treaty stilettos and the faceted salt diamond covenant.
  - **Artisan Guild (Guild)**: A verdigris emerald wax seal stamped with the master builder's hammer, drafting calipers, and bullion gold coin.
  - **Sworn Member Ring**: When you swear allegiance to a faction, your seal gains a glowing green laurel ring and emerald crest jewel.
  - **Spoils Craft Seals**: Each special craft card in the Crown Tab's Spoils section now features a small wax seal that burns bright once crafted.
  - Strictly non-interactive overlays (`pointer-events: none`); joining factions, leaving factions, and crafting spoils items remains completely uninterrupted.

## 2026-10-01 — 16px pips on build, study, and holiday buttons (bakeoff/gemini-button-pips)

- Buttons that perform actions with existing icons now display a crisp 16px visual pip:
  - **Building Picker & Scaffolding**: Buttons in the Kingdom tab building list, the Cottage hint button, and active construction rows for Raising and Improving now feature a 16px isometric architectural chip representing the building being raised.
  - **Scriptorium Study Buttons**: Study research buttons at the lectern now show a 16px parchment scroll with script lines and wax seal, illuminating while research is underway.
  - **Holiday Selector**: The Holiday controls in the top tools bar and playtester bar now show the 16px emblem of the active or selected holiday (🎃 All Hallows, 🎄 Midwinter, 🪺 Dawn Feast, 🌕 Harvest Moon, ☀️ Midsummer, ⚔️ Common Days).
  - Strictly non-interactive overlays (`pointer-events: none`); clicking and tapping buttons remains completely uninterrupted.

## 2026-10-01 — Small heraldic pips on the Kingdom map strip (bakeoff/gemini-map-pips)

- The strip under the kingdom board now gathers your hold status, walls, and vision into a clean work-card row with small heraldic indicator pips:
  - **Your Crown Crest**: Your personal 20px heraldic shield sits proudly beside your hold's name.
  - **Wall & Gate Pip**: A 20px crenellated stone bastion pip marks your defensive walls. An emerald green gemstone glows when your wall ring is fully closed; warm amber indicates an open breach or missing segments.
  - **Vision & Watchtower Pip**: A 20px watchtower beacon pip marks your scouting reach, glowing with radiant vision rays and beacon fire as your vision range expands with watchtowers and surveying.
  - **Shared Hint Drawer**: Important kingdom alerts (walls ready, idle workers, cottage bed warnings) are tucked neatly beneath the strip.
  - Strictly non-interactive overlays (`pointer-events: none`); clicking plots, buildings, and hint buttons remains completely uninterrupted.

## 2026-10-01 — 28px Realm Crest Pips across the World tab (bakeoff/gemini-world-crests)

- Heraldic crests are now displayed consistently across the entire World view:
  - **Player Banner**: Your crown displays your personal heraldic crest shield at 28px.
  - **Known Crowns**: Every rival and foreign kingdom card displays its official 28px crest pip with its current diplomatic stance (glowing cyan frost aura when hostile or at war; warm gold when friendly or peaceful).
  - **Factions**: Faction leaders and member realms now display their 28px heraldic shields alongside their faction titles.
  - **Watchtower Warnings**: When an incoming enemy host is spotted marching on your gates, their 28px war crest appears directly beside the warning countdown.
  - **Foreign Wars**: When two foreign crowns clash in a world war, both kingdoms display their 28px crest pips in the battle header and directly inside the levy dispatch buttons (`Send levy to ...`).
  - **Holds on the Board**: Every captured or occupied hold across the board displays the governing realm's 28px heraldic crest pip, making board ownership instantly recognizable.
  - Strictly non-interactive overlays (`pointer-events: none`); buttons, cards, and tabs remain fully responsive.

## 2026-10-01 — Distinct chips for Granary, Mint, Sawmill, and Mason Yard (bakeoff/gemini-stores)

- The four resource store buildings (the cap buildings) now have distinct, detailed architectural chips instead of generic boxes:
  - **Granary (Food Cap)**: An elevated staddle-stone timber granary raised on mushroom-capped stone stilts to keep grain dry and safe from mice, featuring horizontal timber louvers, a steep thatched gable roof with a dormer and golden wheat ear finial, an overhanging attic hoist with a suspended flour sack swinging in the breeze, and grain barrels and flour bags stacked on the loading dock. While under construction, you see staddle stone piers, exposed floor joists, partial floor decking, scaffold poles, and an A-frame hoist.
  - **Mint (Gold Cap)**: A fortified stone treasury with rusticated granite walls, heavy iron-banded vault doors with a brass padlock, a gilded royal crown medallion set into the stone pediment, a sloped slate roof, a turning flywheel coin-stamping screw press with a glowing smelting crucible, and stacks of gold bullion ingots and open coin chests. Under construction, it reveals excavated foundation trenches, low stone plinth courses, wooden vault centering formers, scaffolding ladders, and a mortar mixing trough.
  - **Sawmill (Wood Cap)**: A river timber mill with mossy wood shakes, a running water flume channel driving a turning waterwheel with splashing foam, a timber carriage carrying a raw fir log into a spinning circular steel saw blade, fresh golden sawdust piles, and neatly stacked lumber cords. Under construction, you see the excavated millrace channel, wheel bearing posts with a bare axle, open King-post roof trusses open to the sky, and carpenter sawhorses with a crosscut saw.
  - **Mason Yard (Stone Cap)**: A stonecutter's atelier with a slate shed roof, a heavy stone banker workbench with partially dressed ashlar blocks, chisels, and mallets, a tall wooden tripod derrick crane lifting a dressed stone block on a hoist line, ashlar block pallets, a classical carved marble column on display, and a chiseled urn. Under construction, you see a chalked ground layout grid with red boundary pegs, shear-legs derrick crane with rough boulder tackle, and raw stone boulders with steel splitting wedges.
- Supported across all cultural styles (Western kingdoms, Cedar Kin, Sand Banner, Wind Host, and Tide Clans).
- Existing kits for Farm, Cottage, Quarry, and Watchtower were left untouched.
- Purely cosmetic visual update; strictly `pointer-events: none` and never interferes with clicking buildings, map panning, or game interactions.

## 2026-10-01 — Hall rooms give a small bonus (wave/hall-bonus)

- Each finished room in your keep's Hall now gives one small bonus. The Hall shows it at the top of the room.
  - **Yard** (needs a finished Barracks): a treated wounded soldier is back as militia in 4s instead of 5s.
  - **Lectern** (needs a finished Academy): new studies take 20% less time. This was already true; the Hall now says so.
  - **Gate** (needs a finished Gate on the rim): the gate adds its HP to your walls when a raid hits. This was already true; the Hall now says so.
- No room, no bonus. Raids and training costs are unchanged.
- Note: the Army tab's Treat button still says "5s". The Hall shows the real time.

## 2026-10-01 — Cottages show bunks and packed bedrolls (bakeoff/gemini-cottage-bunk)

- Cottages now visually show your settlement's housing capacity and occupancy directly on the hold map:
  - **Free Bed (Open Capacity)**: When your hold has room for more settlers (`pop < beds`), cottages display **one neat, empty bunk** with clean white linen, a plump pillow, and a gentle green bed pip, showing room for new citizens.
  - **Full Hold (Packed Bedrolls)**: When your hold reaches full capacity (`pop === beds` or `pop >= beds`), cottages appear bustling and **packed with extra bedrolls**: an occupied crimson quilt on the bed, stacked rolled wool bedrolls (emerald, rust terracotta, and navy) tied with leather straps and cords, a canvas travel sack, and a red bed pip showing every bed is taken.
  - Supported across all cultural styles (Western wood-and-thatch cottages, Cedar Kin cedar-shake cabins, Sand Banner adobe flat-roof dwellings, Wind Host nomad yurts, and Tide Clans pile stilt cottages).
  - Unfinished cottages undergoing construction show clean scaffolding without bunks until completed.
- Purely visual update; strictly non-blocking (`pointer-events: none`) and never interferes with building clicks or kingdom actions.

## 2026-09-30 — War shows column slots as stall/post pips (bakeoff/gemini-slot-pips)

- Your active military and gathering columns are now clearly tracked with **Column Slot Pips**:
  - **Stall & Post Pips**: Each available column slot is represented as a medieval muster post / stable stall.
  - **Empty Slot**: When a column is at home, the stall post stands quiet and dormant with a cold iron ring and empty rail, showing that you have an open slot to march, scout, or gather.
  - **Filled Slot (Column Out)**: When a column is dispatched on the road, its slot pip flies a bright crimson-and-gold swallowtail war standard with a gleaming spearhead finial, warm beacon torch spark, and active tether.
  - **Visible from Anywhere**: The **War** tab button in the top navigation bar displays your `N/max` column slots and pips directly, so you always know at a glance whether you have troops out marching even while building in Kingdom or recruiting in Army.
  - **In the War Room**: The `Columns` card header also shows your current slots and pips alongside your active forces.
- Purely informational visual update; strictly `pointer-events: none` and never interferes with clicking tabs or taking actions.

## 2026-09-30 — The Hall in your keep (wave/keep-hall)

- Click your own hold on the board. Under the hold facts there is now a **Hall** with three rooms:
  - **Yard**: train troops and treat wounded, same as the Army tab. Needs a Barracks.
  - **Lectern**: start or cancel studies, same as the study bar. Needs an Academy.
  - **Gate**: your wall line and the Sally button, same as the War tab. Needs a Gate.
- A room you have not built yet says "Not built". The tabs still work as before.

## 2026-09-30 — Rival raids ease off (wave/raid-mercy)

- Rivals no longer march on your hold in the first ~5 minutes. After that, at most one raid on your hold every ~2.5 minutes (it was every ~50 seconds).
- A raid now fights only the soldiers who actually marched, not the rival's entire army. A small raid can be beaten by a stocked hold.
- Finished walls absorb part of the attack before it reaches your troops. One wall on the rim can be the difference between holding and being breached.

## 2026-09-30 — Player keep shows proud banner and warm hearth when standing, cracked stone and dark windows when breached (bakeoff/gemini-keep-breach)

- The condition of your **Keep** now immediately reflects whether your hold stands or has been breached:
  - **When the Hold Stands**: Your keep rises proud and defiant: dressed ashlar stone walls, warm golden candlelight flickering in the royal arched window, a roaring courtyard brazier fire, warm hearth smoke billowing from the chimney flue, and your proud royal standard waving high in the wind on a tall flagpole with a golden finial ball.
  - **When the Hold is Breached**: If hostile sieges breach your hold, the keep visibly bears the scars of defeat: deep structural fracture fissures tearing across the stone tower, cracked bartizan turrets, broken crenels, dark shattered windows with no candlelight, a cold dead hearth flue, extinguished brazier coals with no flame, a charred heraldic shield, and a snapped, splintered flagpole stump with no proud banner flying.
  - Supported across all cultural styles (Western stone keep, Cedar Kin monumental timber longhouse, Sand Banner courtyard mirador keep, Wind Host nomad felt ger, and Tide Clans pile-house keep).
  - Also visible on the regional map: miniature keeps show full pennants and golden coronet crests when standing, and fracture cracks, dark windows, and broken mast stumps when breached.
- Purely cosmetic visual update; strictly `pointer-events: none` and never interferes with map clicks, camera movement, or building interactions.

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
