/**
 * Holder --player-h og --player-space på <html> oppdatert. --player-h er høyden på hele
 * avspilleren. --player-space er luften sidene får nederst, med litt margin, så innholdet ikke
 * havner rett under kanten. Minimert gir den plass til coverbildet i hjørnet.
 */
export function trackPlayerSpace(bar: HTMLElement, mini: HTMLElement) {
  function update() {
    const style = document.documentElement.style;
    style.setProperty('--player-h', `${bar.offsetHeight}px`);
    const space = bar.offsetHeight ? bar.offsetHeight + 24 : mini.offsetHeight ? mini.offsetHeight + 32 : 0;
    style.setProperty('--player-space', `${space}px`);
  }
  const sizes = new ResizeObserver(update);
  sizes.observe(bar);
  sizes.observe(mini);
  // ClientRouter fjerner alle attributter på <html> ved sidebytte, også style med variablene over.
  document.addEventListener('astro:after-swap', update);
}
