# HANDOFF

Last updated: 2026-09-06 | playtest-0.7 | Gemini tabletop board branch `bakeoff/gemini-board`.

Live: https://129.153.17.72.sslip.io/

Current branch: `bakeoff/gemini-board` (PR into main).
Features delivered:
- Tabletop board diorama with polished wooden table rim, brass corner brackets, and inner drop shadow.
- Zoom & pan controls (no rotate) via mouse wheel, pointer drag, and on-screen `[+]`, `[-]`, `[⟲]` buttons.
- Denser pixel buildings with multi-structure vignettes, animated props, and level progression.
- 2–3 frame walker animations with discrete step cadence and citizen roles.
- Original All Hallows backdrop with low rolling mist/fog and organic flickering lanterns (no Disney likenesses).
- War tab living pixel unit strip with marching player host, animated royal pennant, enemy cohorts, and power meter.
- Recorded audio playback for `/audio/halloween.ogg`, `/audio/easter.ogg`, and `/audio/midwinter.ogg` with smooth synth fallback.
- Kept ChromeDock sticky tools and holiday switcher intact.
- Zero changes to `packages/sim` or `server`.

Deploy: cd ~/second-crown && git pull && npm test && npm run build -w @second-crown/app && pm2 restart sc-cloud
