# USER-NOTES

Last updated: 2026-09-07 | Version: playtest-0.9 (Gemini Two-Band Camera & Board Diorama)

Play: `https://129.153.17.72.sslip.io/`

## Two-Band Camera: Hold vs. Board

The Kingdom view now supports two seamless zoom bands on the same Pixi tabletop diorama:

1. **Hold View (Close-up Isometric Band, Zoom > 0.70)**:
   - Your realm's 16×10 isometric diorama.
   - Click any empty tile to place your selected building, or click an existing building to upgrade it up to level 5.
   - Living pixel walkers, assigned workstation citizens, animated chimney smoke, tall stone keeps, and holiday dressings are visible in rich diorama detail.
   - Zoom with mouse wheel or on-screen `[+]` / `[-]` buttons; drag to pan.

2. **Board View (Tabletop Map Band, Zoom <= 0.70)**:
   - When zoomed out past `0.70` (or clicking the **Board / Hold** toggle), the camera transitions into the tabletop realm board: an 8×6 grid of tactile province tokens.
   - **6 Distinct Terrain Chips**: Meadow plains, spruce timber woods, highland rolling hills, cracked scorched wastes, coastal azure shores, and snowcapped alpine mountain peaks.
   - **Resource & Strategic Node Marks**: Holds, bandit camps, woodcutting stands, granite quarries, and ripe wheat fields.
   - **Player Seat & Iron March Foe**: Your Home Hold (`x=2, y=2`) is framed in gilded royal brass with a crown emblem and golden halo. The rival Iron March hold (`x=5, y=2`) is framed in spiked blackened steel with iron rivets.

3. **Marching Your Company on the Board**:
   - **Snap to Hold**: Clicking your Home Hold token instantly snaps the camera back to close-up Hold view.
   - **Order a March**: Clicking any foreign province token (bandit camps, timber stands, quarries, fields, or enemy holds) orders your army to march to that location.
   - **Active Marching Pawn**: When an expedition is underway, an animated tabletop marching meeple pawn travels along a glowing dotted route line from your hold to the destination. The pawn bobs with marching cadence and carries a waving royal standard with a live ETA counter.
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

