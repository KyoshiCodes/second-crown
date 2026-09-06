# HANDOFF

playtest-0.8 | 2026-09-06
Live: https://129.153.17.72.sslip.io/

Keep has distinct taller stone hold drawing in drawIsometricBuilding (flared base, bartizans, crenellations, portcullis, royal standard).
Citizens: one worker per finished building on complete + seed on load if roster empty.
Jobs: farm→farmer, lumber→woodcutter, quarry/mine→miner, market→merchant, keep/walls/tower/barracks→guard, chapel→scholar.
Walkers read state.citizens: player workers walk to their assigned building tile with matching role appearances (farmer=villager, woodcutter, miner, merchant, guard, scholar); fallback to random wander if no citizens.
