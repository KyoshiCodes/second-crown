# Audio drops

Put looping `.ogg` files here. The game looks for:

- `/audio/halloween.ogg`
- `/audio/midwinter.ogg`
- `/audio/easter.ogg`
- `/audio/harvest.ogg`
- `/audio/midsummer.ogg`
- `/audio/spring.ogg`
- `/audio/summer.ogg`
- `/audio/autumn.ogg`
- `/audio/winter.ogg`
- `/audio/battle.ogg`
- Music: Lofi plays every numbered HoliznaCC0 `.ogg`, then `lofi-a.ogg`, `lofi-b.ogg`, in filename order, then loops.
  New lofi files must also be added to `LOFI_FILES` in `packages/app/src/music.ts`.

Use **CC0 or CC-BY** tracks only (OpenGameArt, Freesound CC0, Incompetech if attributed).
If a file is missing, the synth bed still plays.

Suggested CC0 starters (download, rename, copy into this folder, rebuild):
- Halloween: https://opengameart.org/content/haunting-chiptune-loop-void-estate (`void_estate.ogg`)
- Horror bed: https://opengameart.org/content/lost-in-a-bad-place-horror-ambience-loop (`lost.ogg`)
