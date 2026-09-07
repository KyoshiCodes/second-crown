# USER-NOTES

Last updated: 2026-09-07 | Version: playtest-0.13 (Gemini Academy: Scriptorium Lectern, Distinct Academy & Siege Workshop, Board Outpost Flags)

Play: `https://129.153.17.72.sslip.io/`

## Scriptorium Lectern · Realm Lore & Research

The research interface has evolved from plain buttons into an illuminated medieval study card:

1. **Illuminated Study Cards**:
   - Both **Horse lore** and **Siege craft** are presented on illuminated parchment study cards complete with thematic icons, historical lore blurbs, and estimated research duration.
   - Dynamic resource chips clearly display costs and reflect your realm's current stockpile in real-time (green when affordable, red when missing).
   - Building prerequisites (Barracks or Academy for Horse lore; Siege Workshop for Siege craft) clearly state their status.

2. **Military Unit Previews**:
   - Each study card displays the exact units it unlocks with miniature animated pixel silhouettes:
     - **Horse lore**: Unlocks the mounted **Cavalry** lancer and fully armored plate **Knight**.
     - **Siege craft**: Unlocks the heavy wheeled **Siege Engine** trebuchet.

3. **Active Scholar Progress & Mastered Seals**:
   - When scribes are at work on a treatise, an animated golden progress bar tracks completion percentage alongside a live countdown timer.
   - Once researched, cards receive a permanent gilded royal seal: `✓ Mastered · Ready to train`.

## Distinct Academy & Heavy Siege Workshop Architecture

1. **Collegiate Academy (Seat of Lore & Astronomy)**:
   - When constructed, the Academy stands out as an architectural centerpiece on the isometric hold:
     - **Ashlar Facade & Cloister Colonnade**: Flared foundation plinth, limestone walls with buttresses, and an arched marble entrance colonnade.
     - **Gothic Library Windows**: Arched casement windows glowing with warm honey candlelight and diamond-pane leaded mullions.
     - **Sapphire Slate Roof & Observatory Spire**: Regal sapphire slate roof topped by an elevated stone observatory cupola with an aged verdigris copper dome and fluttering scholar gonfalon.
     - **Armillary Astrolabe**: A gleaming brass astrolabe rotates above the dome with celestial coordinate rings.
     - **Courtyard Vignette**: A stone reading lectern with an open illuminated leather-bound folio, a brass celestial globe on a tripod stand, and manuscript scroll bins.

2. **Polished Siege Engineering Yard & Forge**:
   - The Siege Workshop is no longer a generic box—it is a bustling military ordnance yard:
     - Heavy timber-framed pavilion sheltering the Master Engineer's drafting table with blue vellum blueprint drafts and brass calipers.
     - Timber A-frame gantry crane derrick with iron pulley and hoist ropes.
     - Fully assembled heavy trebuchet on four spoked wooden wheels with iron rims, cross-bracing, solid oak throwing arm, and iron counterweight box.
     - Chained pyramid of carved granite siege boulders and a smoldering ordnance forge hearth with glowing coals and anvil.

## Board Outpost Flags on Captured Field Tiles

1. **Clear Strategic Distinction**:
   - Your Home Hold (`x=2, y=2`) strictly retains its grand gilded royal frame, golden corner studs, imperial crown, and pulsing golden aura.
   - Captured resource nodes and camps (turned into field outposts) now fly dedicated **Outpost / Flag Tokens**:
     - Crisp royal blue & brass outer border trim with 4 brass corner pins.
     - Field stone cairn anchoring a tall wooden flagstaff with a brass ball finial.
     - Waving royal player swallowtail standard fluttering in the wind with golden heraldic insignia.
     - Canvas bivouac supply tent and a bottom "OUTPOST" plaque.
   - Players can now survey their territorial holdings at a glance at 0.58 regional zoom!

2. **Gather Expedition Compatibility**:
   - The regional board renderer includes seamless support for gather expeditions, automatically rendering foraging paths and pack-cart pawns when gather columns are dispatched.

## Living Pixel Army Roster & Board Marching Columns

Your military forces now share the authentic pixel art language of hold walkers, keeps, and fortifications:

1. **Pixel Silhouettes Across the Army Tab**:
   - The flat chip portraits have been replaced with animated integer-pixel silhouettes in the exact style of your hold's citizens and stone keeps:
     - **Militia**: Spear-less peasant levy in homespun wool and cloth coif, with humble posture and wooden cudgel.
     - **Spearman**: Disciplined line infantry in polished steel kettle hat, royal blue tabard, tall ash spear with steel point, and round wooden shield with brass boss.
     - **Skirmisher**: Agile forward scout in leather coif, hunter green coat, throwing javelins, and arm buckler.
     - **Archer**: Deep forest green coat, feathered archer cap, recurve yew bow with taut string and nocked arrow, and quiver of arrows over the shoulder.
     - **Cavalry**: Galloping warhorse with animated trotting hooves and leather saddle, carrying a mounted armored lancer in royal blue tunic with fluttering pennant.
     - **Knight**: Full steel plate armor, great helm with narrow visor eye-slit, heraldic crimson heater shield with golden cross, and steel broadsword.
     - **Siege Engine**: Sturdy timber carriage on spoked wooden wheels, with an upright A-frame and counterweight throwing arm loaded with a carved stone boulder.
     - **Champion**: Radiant gilded plate armor, winged royal crown, imperial purple tabard, glowing runic broadsword, and royal crimson cape.
   - Every unit features discrete 2–3 frame marching and idle stride animation, directional facing, and faction tabard colors.

2. **Upgraded Army Tab Roster**:
   - The Army training section now presents rich medieval unit cards displaying the animated pixel figure, name, combat power rating, training resource cost, and role blurb.
   - Dedicated Champion recruitment card featuring the gilded champion silhouette, custom naming input, and recruitment actions.
   - Raised companies in "Your Host" display their company commander portrait alongside an animated squad formation marching in formation.
   - March column composition in province inspect cards shows mini pixel icons next to each unit type.

3. **Board Meeple Reuse**:
   - Player marching columns traveling across the regional tabletop board (`zoom <= 0.70`) no longer appear as generic blue pawns!
   - Sent columns automatically adopt the sprite, equipment, and colors of the unit type on the march:
     - An archer column appears as an archer with recurve bow and forest coat.
     - A knight column marches with great helm and crimson heater shield.
     - A cavalry column charges forward atop a warhorse mount.
     - A siege column rolls across the provinces as a wheeled timber siege engine.
   - Marches animate with 2–3 frame stride cadence, facing their travel direction along the amber dotted route trail with live ETA counter.
   - Hostile marches preserve their imposing red/blackened iron war meeple with horned helm and glowing crimson visor.

## Connected Rim Wall Run on the Hold

Building fortifications along the outer rim of your 16×10 hold (`x=0`, `y=0`, `x=15`, `y=9`) now creates a majestic, unbroken fortress wall:

1. **Continuous Stone Curtain**:
   - Adjacent finished Walls and Gates connect seamlessly with solid ashlar stone curtain walls, foundation plinths, and horizontal mortar scoring.
   - Walkways with timber decking run along the top of the wall-walk.
   - Crisp crenellated stone merlons line the outer battlements with stone coping highlights.
   - Each wall tile features a central bastion tower with arrow loops and animated torch sconces.
   - Corner bastion towers anchor the four perimeter corners of your hold.
2. **Gatehouse Sitting in the Gap**:
   - When a Gatehouse sits on the rim, its twin flanking bastion towers connect flush into neighboring curtain walls.
   - Heavy reinforced double oak doors, iron strap hinges, and lowered portcullis teeth seal the passage between curtain spans.
3. **Interior Walls Unchanged**:
   - Walls built inside the courtyard (away from the outer rim) remain isolated defensive bastion blocks, keeping your internal fortress layout crisp and readable.
   - Tile clicks for placing, inspecting, and upgrading buildings are 100% preserved.

## Stronger 8×6 Terrain Chips on the Regional Board

When zooming out to regional board view (`zoom <= 0.70`, default `0.58`), all 6 tabletop province chips read at a glance:

- **Peak is a Real Ridge**: A continuous grand alpine massif spanning the chip with sunlit western granite faces, shadowed eastern basalt cliffs, a sharp central arête, pure white snowcaps across three summits, a glacial cirque, and rocky scree foothills.
- **Shore has Water & Foam**: Deep azure ocean waters meeting turquoise shallows, a golden sand beach with a wet sand tideline, rolling wave crests, and a crashing white surf line with frothing sea foam lace.
- **Wood is a Stand of Trees**: A dense forest grove of 6-7 layered evergreen pines with timber trunks, dark spruce background trees, vibrant emerald mid-tier pines, and towering foreground monarch pines with highlighted bough needles.
- **Waste Glows**: Scorched volcanic basalt crust cut by radiating magma fissures with a deep crimson outer glow, blazing incandescent orange lava channels, an animated pulsing golden-yellow heat core, and floating ember motes.
- **Hill has Contours**: Rolling highland topographic knolls with shaded elevation terraces, rounded hill domes, three bold highlighted contour ridges, and exposed granite bluffs.
- **Plain Stays Meadow**: A lush pastoral meadow with rolling grass knoll bands, clustered 3-blade tall grass tufts, and sprinkled chamomile daisy, yellow buttercup, and blue cornflower blossoms.

## Distinct Residential Cottages & Fortified Rim Gatehouses

1. **Cottage (+2 Citizen Beds)**:
   - Cozy half-timbered plaster home with steep gabled reed thatch, stone chimney puffing hearth smoke, leaded-glass window glowing with warm honey candlelight, stone doorstep with brass knob, stone-lined flowerbed with blossoms, and stacked cord of split firewood.
2. **Gatehouse (+30 Wall HP on Rim Tiles)**:
   - Imposing ashlar granite fortification with twin bastion towers, crenellated battlements, arrow slits, and arched gate portal.
   - **Rim Placement**: When placed along the outer rim of the hold (`x=0`, `y=0`, `x=15`, `y=9`), heavy iron-reinforced oak double-doors shut and bolt the perimeter with lowered portcullis teeth and a defensive faction pennant, closing your stronghold ring and granting +30 wall HP.

## Two-Band Camera: Hold vs. Board

The Kingdom view supports two seamless zoom bands on the same Pixi tabletop diorama:

1. **Hold View (Close-up Isometric Band, Zoom > 0.70)**:
   - Your realm's 16×10 isometric diorama.
   - Click any empty tile to place your selected building, or click an existing building to upgrade it up to level 5.
   - Living pixel walkers, assigned workstation citizens, animated chimney smoke, cottages, tall stone keeps, rim gates, and holiday dressings are visible in rich diorama detail.
   - Zoom with mouse wheel or on-screen `[+]` / `[-]` buttons; drag to pan.

2. **Board View (Tabletop Map Band, Zoom <= 0.70)**:
   - When zoomed out past `0.70` (or clicking the **Board / Hold** toggle), the camera transitions into the tabletop realm board: an 8×6 grid of tactile province tokens.
   - **Tactile Blank Parchment / Fog Chips**: Unseen provinces beyond your vision range appear as blank parchment chips shrouded in drifting fog mists. Terrain, nodes, and occupant heraldry remain concealed until scouted!
   - **6 Distinct Terrain Chips**: Meadow plains, spruce timber woods, highland rolling hills, cracked scorched wastes, coastal azure shores, and snowcapped alpine mountain peaks.
   - **Resource & Strategic Node Marks**: Holds, bandit camps, woodcutting stands, granite quarries, and ripe wheat fields.
   - **Player Seat & Iron March Foe**: Your Home Hold (`x=2, y=2`) is framed in gilded royal brass with a crown emblem and golden halo. The rival Iron March hold (`x=5, y=2`) is framed in spiked blackened steel with iron rivets.

3. **Marching Your Company & Hostile Army Columns**:
   - **Snap to Hold**: Clicking your Home Hold token instantly snaps the camera back to close-up Hold view.
   - **Order a March**: Clicking any foreign province token orders your army to march to that location.
   - **Active Player March**: Your marching company travels as an animated tabletop marching meeple pawn along a glowing amber dotted trail with a waving royal standard and live ETA counter.
   - **Hostile Red/Iron War Meeple**: Enemy and rival marches appear as menacing red/iron meeples on the board, equipped with blackened iron pedestals with rivets, horned helmets with glowing crimson eye-slits, blood-red tabards with crossed iron straps, and jagged halberds marching along blood-red trails.
   - Only one march can be active at a time; on arrival, camps yield bounties, resource nodes bring back lumber/stone/food, and hostile holds trigger battle resolutions!

4. **Board / Hold Toggle Buttons**:
   - For testers using trackpads or without mouse wheels, a dedicated `[🏰 Hold / 🗺️ Board]` button sits at the top in ChromeDock and directly on the bottom-right of the map canvas for instant band switching.

## Tabletop Board Diorama & Holiday Dressing

The diorama is framed as a tabletop board game:
- **Polished Hardwood Rim**: Recessed diorama framed in walnut with antique brass corner brackets and rivets.
- **Halloween-Class Board Dressing Across All Holidays & Seasons**:
  - **Midwinter**: Contoured snow blankets with hanging icicles, pine wreaths with red bows, warm candlelit windows with golden halos, doorstep brass lanterns, snowdrifts, holly sprigs, and drifting icy blizzard vapor.
  - **Easter**: Blooming flower vines climbing building facades, fluttering pastel ribbons, dawn lamps with golden-lilac halos, painted easter eggs nestled in grass, spring crocuses, and soft dawn dew mist.
  - **Harvest**: Bound golden wheat sheaves tied with twine, field pumpkins, apple bushels, amber oil lamps with deep amber flicker and cast halos, cider casks, and warm golden autumn twilight haze.
  - **Midsummer**: Solstice standing iron bonfire brazier with lively dancing flames and expansive firelight halo, long light sunset highlights, marigold garlands, golden sunflowers, and shimmering golden heat haze.
  - **All Hallows**: Retained with carved jack-o'-lanterns, witchfire glow, pumpkins, and deep creeping mist banks.
  - **Standard Seasons**: Subtle, lighter variants of ground scatter, window lighting, and ambient weather mists when holiday is set to "Off".
- **Denser Pixel Architecture & Walkers**: Every building features dense multi-structure vignettes, animated chimneys, and discrete 2-3 frame pixel citizen walkers.
- **Living Citizen Workers**: Citizens hired for your buildings visibly populate the diorama and report to their workstation tiles. Farmers carry bread baskets in the fields, woodcutters carry axes near the woods, miners carry pickaxes around quarries and mines, merchants tend market stalls, guards patrol military structures with steel helmets and spears, and scholars study at the chapel with scrolls and cowls.
- **Taller Stone Keep**: The realm's Keep stands as a commanding ashlar fortress with a flared base plinth, twin corner watch bartizans, crenellated battlements, an iron portcullis, heraldic shield, candlelit high quarters, and an animated royal standard.

## War Tab: Living Pixel Unit Strip

The War tab features an overhauled living unit strip:
- **Two Clear Sides**: Your army lined up on the left with the Royal Standard Bearer; opposing realm's forces on the right with the Host Standard Bearer.
- **Real Unit Types & Counts**: Only real unit names (Militia, Spearman, Archer, Champion, etc.) and true company counts are displayed, with clean vertical hierarchy ensuring zero label or portrait overlap.
- **Battlefield Demarcation**: Displays real-time clash status and tactical advantage during active wars, or peaceful border watch status during peacetime.
- **Power Odds Meter**: Dynamic percentage bar showing realm power balance at a glance. Fully readable at 1280px wide.

## War Tab: Briefing Card

Below the unit strip, a single "Briefing" card is meant to be read in about 20 seconds:
- **Incoming**: one line per hostile column marching on your hold, showing who it is and how many seconds until it arrives. The name only shows once you've built a Watchtower — until then it just says "Unknown host". Right below the list: your current Wall HP and whether the Gate is up or down.
- **Wounded**: how many wounded you have against your infirmary bed capacity, with a one-click "Treat (4 food)" button (grayed out when nobody's hurt).
- **People**: your population against your housing cap, so you can see at a glance whether you need another Cottage.

Scarred/damaged buildings still list their own "Repair (8 stone)" buttons underneath, unchanged.

## Recorded Holiday Audio & ChromeDock

- **Recorded Tracks First**: Plays official recorded loops (`/audio/halloween.ogg`, `/audio/easter.ogg`, `/audio/midwinter.ogg`) when present; smoothly falls back to procedural synth for standard seasons.
- **ChromeDock**: Pinned at the top of the screen — use "Show tools" and the Holiday selector to preview All Hallows, Dawn Feast (Easter), Midwinter, or normal seasons at any time.

## Practice exchange

World tab. Discord only. Practice gold is not kingdom gold.

