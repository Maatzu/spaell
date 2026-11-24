import type { Chapter } from '../feed';
import { formatTimestamp } from '../format';
import type { Track } from '../play';

// Kapitlene i avspilleren: navnet under tittelen, lista bak kapittelknappen, markørene på
// tidslinja og boblen som viser kapittelet under musepekeren.

/** Indeksen til kapittelet som spilles på tidspunktet, eller -1 før det første. */
function chapterAt(chapters: Chapter[], time: number): number {
  let index = -1;
  for (let i = 0; i < chapters.length; i++) if (chapters[i].start <= time) index = i;
  return index;
}

export function setupChapters(root: HTMLElement, audio: HTMLAudioElement) {
  const label = root.querySelector<HTMLElement>('[data-chapter]')!;
  const markers = root.querySelector<HTMLElement>('[data-markers]')!;
  const toggle = root.querySelector<HTMLButtonElement>('[data-chapters-toggle]')!;
  const list = root.querySelector<HTMLOListElement>('[data-chapter-list]')!;
  const trackEl = root.querySelector<HTMLElement>('.track')!;
  const hoverTip = root.querySelector<HTMLElement>('[data-hover-tip]')!;
  let track: Track | null = null;
  let active = -1;

  const chapters = () => track?.chapters ?? [];

  /** Varigheten fra lydfila når den er lastet, ellers fra feeden. */
  function knownDuration(): number {
    return audio.duration || track?.duration || 0;
  }

  function setOpen(open: boolean) {
    list.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
  }

  function renderMarkers() {
    const duration = knownDuration();
    markers.replaceChildren(
      ...(duration > 0 ? chapters().slice(1) : []).map((c) => {
        const tick = document.createElement('span');
        tick.style.left = `${(c.start / duration) * 100}%`;
        return tick;
      }),
    );
  }

  // Viser kapittelet (og tidspunktet) under musepekeren når man holder over tidslinja.
  function showHoverTip(e: PointerEvent) {
    const duration = knownDuration();
    if (e.pointerType === 'touch' || chapters().length === 0 || duration <= 0) return hideHoverTip();
    // Samme innrykk som markørene, så posisjonen stemmer med tommelen på slideren.
    const box = markers.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - box.left) / box.width));
    const time = ratio * duration;
    const index = Math.max(0, chapterAt(chapters(), time));
    hoverTip.textContent = `${formatTimestamp(time)} · ${chapters()[index].title}`;
    hoverTip.hidden = false;
    // Hold boblen innenfor tidslinja i begge ender.
    const half = hoverTip.offsetWidth / 2;
    const trackBox = trackEl.getBoundingClientRect();
    const x = Math.min(trackBox.width - half, Math.max(half, e.clientX - trackBox.left));
    hoverTip.style.left = `${x}px`;
  }

  function hideHoverTip() {
    hoverTip.hidden = true;
  }

  /** Markerer kapittelet som spilles på tidspunktet. */
  function update(time = audio.currentTime) {
    const index = chapterAt(chapters(), time);
    if (index === active) return;
    active = index;
    // Første kapittel heter ofte det samme som episoden; da viser vi det ikke to ganger.
    const title = index >= 0 ? chapters()[index].title : '';
    label.textContent = title === track?.title ? '' : title;
    list.querySelectorAll('button').forEach((b, i) => b.classList.toggle('is-active', i === index));
  }

  /** Lukker lista og skjuler boblen, f.eks. når avspilleren minimeres. */
  function close() {
    setOpen(false);
    hideHoverTip();
  }

  /** Bytter til kapitlene til en ny episode. */
  function show(next: Track | null) {
    track = next;
    toggle.hidden = chapters().length === 0;
    close();
    list.replaceChildren(
      ...chapters().map((c, i) => {
        const li = document.createElement('li');
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.dataset.index = String(i);
        const ts = document.createElement('span');
        ts.className = 'ts';
        ts.textContent = formatTimestamp(c.start);
        btn.append(ts, c.title);
        li.append(btn);
        return li;
      }),
    );
    renderMarkers();
    active = -1;
    update();
  }

  trackEl.addEventListener('pointermove', showHoverTip);
  trackEl.addEventListener('pointerleave', hideHoverTip);
  toggle.addEventListener('click', () => setOpen(list.hidden));
  list.addEventListener('click', (e) => {
    const btn = (e.target as Element).closest<HTMLButtonElement>('button[data-index]');
    if (!btn) return;
    audio.currentTime = chapters()[Number(btn.dataset.index)].start;
    audio.play();
    setOpen(false);
  });
  document.addEventListener('click', (e) => {
    if (!list.hidden && !(e.target as Element).closest('.chapters-menu')) setOpen(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !list.hidden) {
      setOpen(false);
      toggle.focus();
    }
  });
  // Markørene trenger den ekte varigheten, som først er kjent når lydfila er lastet.
  audio.addEventListener('loadedmetadata', renderMarkers);

  return { show, update, close };
}
