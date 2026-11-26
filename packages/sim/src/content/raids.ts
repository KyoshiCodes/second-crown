/**
 * Ordinary home-raid pressure (2026-11-25). Content only: how big a rival column
 * on the hold may be and how often one may come, by the player's milestone.
 * The reader is systems/raidPressure.ts. Combat formulas are untouched; the only
 * knobs are the column cap per unit type (the old flat cap was 6) and the gap.
 *
 * Measured with the battle resolver (raidPressure.test.ts):
 *   - walled   6+6: 20 militia behind one rim wall hold most raids (today's numbers).
 *   - keep II  7+7: 24 militia + 2 rim walls hold; 20 militia + 6 spearmen hold.
 *   - keep III 8+8: 28 militia + 2 rim walls hold; 20 militia + 4 knights hold.
 */
export type RaidStageId = "unwalled" | "walled" | "keep2" | "keep3";

export interface RaidStage {
  id: RaidStageId;
  /** Short label for docs and the harness. */
  label: string;
  /** Most of any one unit type a rival sends at the hold. */
  perType: number;
  /** Ticks between home raids (across all rivals) at this stage. */
  gap: number;
}

/** Picked in order: Keep III, Keep II, any finished wall, else unwalled. */
export const RAID_STAGES: Record<RaidStageId, RaidStage> = {
  unwalled: { id: "unwalled", label: "No walls yet", perType: 4, gap: 1_500 },
  walled: { id: "walled", label: "First walls", perType: 6, gap: 1_500 },
  keep2: { id: "keep2", label: "Keep II", perType: 7, gap: 2_400 },
  keep3: { id: "keep3", label: "Keep III+", perType: 8, gap: 3_600 },
};

/**
 * Recovery room after the hold is breached. Indexed by how many raids in a row
 * have breached it (0 = last raid held or none yet; the last row repeats).
 * Extra ticks added to the stage gap before the next home raid:
 * 1 breach +5m, 2 in a row +15m, 3+ in a row +1h.
 */
export const BREACH_RESPITE_TICKS: readonly number[] = [0, 3_000, 9_000, 36_000];

/** Each breach in a row trims the next column by this many per unit type... */
export const BREACH_SHRINK_PER_TYPE = 2;
/** ...down to this floor. */
export const RAID_MIN_PER_TYPE = 2;
