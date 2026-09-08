import type { ThemePack } from "./types";
import {
  setMusicHoliday,
  setMusicSeason,
  setMusicBattle,
  setMusicCulture,
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

  public init(): void {
    if (typeof window === "undefined") return;
    try {
      if (!this.musicEl) {
        this.musicEl = new Audio();
        this.musicEl.loop = true;
        this.musicEl.volume = 0.42;

        this.musicEl.addEventListener("playing", () => {
          this.recordedMusicPlaying = true;
          setSynthMelodySuppressed(true);
        });

        this.musicEl.addEventListener("pause", () => {
          if (!isMusicMuted()) {
            this.recordedMusicPlaying = false;
          }
        });

        this.musicEl.addEventListener("error", () => {
          this.recordedMusicPlaying = false;
          setSynthMelodySuppressed(false);
        });
      }

      if (!this.battleEl) {
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
      }
    } catch {
      /* ignore */
    }
  }

  public sync(pack: ThemePack, season: SeasonName, battleActive: boolean, culture = "western"): void {
    if (!this.musicEl) this.init();

    this.isBattleActive = battleActive;
    const muted = isMusicMuted();

    // Update procedural synth fallbacks
    setMusicSeason(season);
    setMusicHoliday(pack.isHoliday ? pack.id : null);
    setMusicCulture(culture);

    if (battleActive) {
      if (pack.battleSrc && pack.battleSrc !== this.currentBattleSrc) {
        this.currentBattleSrc = pack.battleSrc;
        if (this.battleEl) {
          this.battleEl.src = pack.battleSrc;
        }
      }

      if (!muted && this.battleEl && pack.battleSrc) {
        this.battleEl.play().then(() => {
          this.recordedBattlePlaying = true;
        }).catch(() => {
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

    // Handle ambient track (plays /audio/halloween.ogg, /audio/easter.ogg, /audio/midwinter.ogg, or /audio/<kit>.ogg when present)
    const desiredMusicSrc = (pack.isHoliday && pack.musicSrc)
      ? pack.musicSrc
      : (culture !== "western" ? `/audio/${culture}.ogg` : pack.musicSrc);

    if (pack.id !== this.currentPackId || desiredMusicSrc !== this.currentMusicSrc) {
      this.currentPackId = pack.id;
      this.currentMusicSrc = desiredMusicSrc;

      if (this.musicEl) {
        this.musicEl.src = desiredMusicSrc;
        if (!muted) {
          this.musicEl.play().then(() => {
            this.recordedMusicPlaying = true;
            setSynthMelodySuppressed(true);
          }).catch(() => {
            // Recorded track failed or blocked by autoplay -> smooth fallback to procedural synth bed
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
        this.musicEl.play().then(() => {
          this.recordedMusicPlaying = true;
          setSynthMelodySuppressed(true);
        }).catch(() => {
          setSynthMelodySuppressed(false);
        });
      }
      if (this.isBattleActive && this.battleEl && this.currentBattleSrc) {
        this.battleEl.play().then(() => {
          this.recordedBattlePlaying = true;
        }).catch(() => {
          setMusicBattle(true);
        });
      }
    }
  }

  public start(): void {
    startMusicBed();
    if (!isMusicMuted() && this.musicEl && this.currentMusicSrc) {
      this.musicEl.play().then(() => {
        this.recordedMusicPlaying = true;
        setSynthMelodySuppressed(true);
      }).catch(() => {
        setSynthMelodySuppressed(false);
      });
    }
  }
}

export const audioManager = new AudioManager();
