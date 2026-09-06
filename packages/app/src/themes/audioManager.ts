import type { ThemePack } from "./types";
import {
  setMusicHoliday,
  setMusicSeason,
  setMusicBattle,
  isMusicMuted,
  setMusicMuted,
  setSynthMelodySuppressed,
  startMusicBed,
  type SeasonName,
} from "../music";

class AudioManager {
  private musicEl: HTMLAudioElement | null = null;
  private battleEl: HTMLAudioElement | null = null;
  private currentPackId: string | null = null;
  private currentMusicSrc: string | null = null;
  private currentBattleSrc: string | null = null;
  private isBattleActive = false;
  private recordedMusicPlaying = false;
  private recordedBattlePlaying = false;

  constructor() {
    // Initial sync
  }

  public init(): void {
    if (typeof window === "undefined") return;
    try {
      this.musicEl = new Audio();
      this.musicEl.loop = true;
      this.musicEl.volume = 0.42;

      this.musicEl.addEventListener("playing", () => {
        this.recordedMusicPlaying = true;
        setSynthMelodySuppressed(true);
      });

      this.musicEl.addEventListener("error", () => {
        this.recordedMusicPlaying = false;
        setSynthMelodySuppressed(false);
      });

      this.battleEl = new Audio();
      this.battleEl.loop = true;
      this.battleEl.volume = 0.48;

      this.battleEl.addEventListener("playing", () => {
        this.recordedBattlePlaying = true;
      });

      this.battleEl.addEventListener("error", () => {
        this.recordedBattlePlaying = false;
        if (this.isBattleActive) {
          setMusicBattle(true);
        }
      });
    } catch {
      /* ignore */
    }
  }

  public sync(pack: ThemePack, season: SeasonName, battleActive: boolean): void {
    if (!this.musicEl) this.init();

    this.isBattleActive = battleActive;
    const muted = isMusicMuted();

    // Update synth fallbacks
    setMusicSeason(season);
    setMusicHoliday(pack.isHoliday ? pack.id : null);

    if (battleActive) {
      // Handle battle track
      if (pack.battleSrc && pack.battleSrc !== this.currentBattleSrc) {
        this.currentBattleSrc = pack.battleSrc;
        if (this.battleEl) {
          this.battleEl.src = pack.battleSrc;
        }
      }

      if (!muted && this.battleEl && pack.battleSrc) {
        this.battleEl.play().catch(() => {
          this.recordedBattlePlaying = false;
          setMusicBattle(true);
        });
      } else {
        setMusicBattle(true);
      }
    } else {
      if (this.battleEl) {
        this.battleEl.pause();
        this.battleEl.currentTime = 0;
      }
      this.recordedBattlePlaying = false;
      setMusicBattle(false);
    }

    // Handle ambient track
    if (pack.id !== this.currentPackId || pack.musicSrc !== this.currentMusicSrc) {
      this.currentPackId = pack.id;
      this.currentMusicSrc = pack.musicSrc;

      if (this.musicEl) {
        this.musicEl.src = pack.musicSrc;
        if (!muted) {
          this.musicEl.play().then(() => {
            this.recordedMusicPlaying = true;
            setSynthMelodySuppressed(true);
          }).catch(() => {
            // Recorded track failed or not found (e.g. 404) -> smoothly fall back to procedural synth!
            this.recordedMusicPlaying = false;
            setSynthMelodySuppressed(false);
          });
        }
      }
    } else if (!muted && this.musicEl && this.musicEl.paused && !this.musicEl.error) {
      this.musicEl.play().then(() => {
        this.recordedMusicPlaying = true;
        setSynthMelodySuppressed(true);
      }).catch(() => {
        this.recordedMusicPlaying = false;
        setSynthMelodySuppressed(false);
      });
    }

    if (muted) {
      this.musicEl?.pause();
      this.battleEl?.pause();
    }
  }

  public setMuted(muted: boolean): void {
    setMusicMuted(muted);
    if (muted) {
      this.musicEl?.pause();
      this.battleEl?.pause();
    } else {
      startMusicBed();
      if (this.musicEl && this.currentMusicSrc) {
        this.musicEl.play().catch(() => {
          setSynthMelodySuppressed(false);
        });
      }
      if (this.isBattleActive && this.battleEl && this.currentBattleSrc) {
        this.battleEl.play().catch(() => {
          setMusicBattle(true);
        });
      }
    }
  }

  public start(): void {
    startMusicBed();
    if (!isMusicMuted() && this.musicEl && this.currentMusicSrc) {
      this.musicEl.play().catch(() => {
        setSynthMelodySuppressed(false);
      });
    }
  }
}

export const audioManager = new AudioManager();
