/** Plays /audio/{id}.ogg when present. Silent 404 falls back to synth. */
let el: HTMLAudioElement | null = null;

export function playRecordedLoop(id: string | null, muted: boolean) {
  if (!id || muted) {
    el?.pause();
    return;
  }
  try {
    el ??= new Audio();
    el.loop = true;
    el.volume = 0.38;
    const url = `/audio/${id}.ogg`;
    if (!el.src.includes(url)) {
      el.src = url;
    }
    void el.play().catch(() => {
      /* missing file is expected until drops exist */
    });
  } catch {
    /* ignore */
  }
}
