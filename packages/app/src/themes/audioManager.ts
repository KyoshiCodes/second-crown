import type { ThemePack } from "./types";
import {
  setMusicHoliday,
  setMusicSeason,
  setMusicBattle,
  isMusicMuted,
  setMusicMuted,
  MUSIC_CHANGE_EVENT,
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
        // Off / Lofi silence the themed recordings; Bed brings them back.
        window.addEventListener(MUSIC_CHANGE_EVENT, () => this.applyMuted(isMusicMuted()));

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

  public sync(pack: ThemePack, season: SeasonName, battleActive: boolean): void {
    if (!this.musicEl) this.init();

    this.isBattleActive = battleActive;
    const muted = isMusicMuted();

    // Recorded holiday beds must kill the beep before setMusicHoliday restarts it.
    if (pack.musicSrc) setSynthMelodySuppressed(true);

    setMusicSeason(season);
    setMusicHoliday(pack.isHoliday ? pack.id : null);

    if (battleActive) {
      if (pack.battleSrc && pack.battleSrc !== this.currentBattleSrc) {
        this.currentBattleSrc = pack.battleSrc;
        if (this.battleEl) this.battleEl.src = pack.battleSrc;
      }
      if (!muted && this.battleEl && pack.battleSrc) {
        this.battleEl.play().then(() => {
          this.recordedBattlePlaying = true;
        }).catch(() => {
          this.recordedBattlePlaying = false;
          setMusicBattle(true);
        });
      } else if (battleActive && !pack.battleSrc) {
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

    if (pack.id !== this.currentPackId || pack.musicSrc !== this.currentMusicSrc) {
      this.currentPackId = pack.id;
      this.currentMusicSrc = pack.musicSrc;

      if (this.musicEl && pack.musicSrc) {
        this.musicEl.src = pack.musicSrc;
        if (!muted) {
          this.musicEl.play().then(() => {
            this.recordedMusicPlaying = true;
            setSynthMelodySuppressed(true);
          }).catch(() => {
            this.recordedMusicPlaying = false;
            setSynthMelodySuppressed(false);
          });
        }
      } else if (!pack.musicSrc) {
        if (this.musicEl) {
          this.musicEl.removeAttribute("src");
          this.musicEl.load();
        }
        this.recordedMusicPlaying = false;
        if (!muted) setSynthMelodySuppressed(false);
      }
    } else if (!muted && this.musicEl && pack.musicSrc && this.musicEl.paused && !this.musicEl.error) {
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
  }

  private applyMuted(muted: boolean): void {
    if (muted) {
      this.musicEl?.pause();
      this.battleEl?.pause();
    } else {
      startMusicBed();
      if (this.musicEl && this.currentMusicSrc) {
        setSynthMelodySuppressed(true);
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
      setSynthMelodySuppressed(true);
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
