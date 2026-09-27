# User notes / patch notes

Newest first. Plain language for playtesters.

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
