import { store } from '../storage';

/**
 * Volumknappen og -slideren. Volumet huskes mellom besøk. Dempet vises som volum 0, men det
 * forrige volumet beholdes til lyden slås på igjen.
 */
export function setupVolume(root: HTMLElement, audio: HTMLAudioElement) {
  const box = root.querySelector<HTMLElement>('[data-volume]')!;
  const muteBtn = root.querySelector<HTMLButtonElement>('[data-mute]')!;
  const range = root.querySelector<HTMLInputElement>('[data-volume-range]')!;

  function sync() {
    const silent = audio.muted || audio.volume === 0;
    box.classList.toggle('is-muted', silent);
    range.value = String(silent ? 0 : audio.volume);
    muteBtn.setAttribute('aria-label', silent ? 'Slå på lyden' : 'Slå av lyden');
  }

  range.addEventListener('input', () => {
    const volume = Number(range.value);
    audio.muted = volume === 0;
    if (volume > 0) audio.volume = volume;
    sync();
  });
  muteBtn.addEventListener('click', () => {
    if (audio.volume === 0) audio.volume = 1;
    audio.muted = !audio.muted;
  });
  audio.addEventListener('volumechange', () => {
    store.set('volume', audio.volume);
    store.set('muted', audio.muted);
    sync();
  });

  audio.volume = Math.min(1, Math.max(0, Number(store.get<number>('volume') ?? 1) || 0));
  audio.muted = store.get<boolean>('muted') ?? false;
  sync();
}
