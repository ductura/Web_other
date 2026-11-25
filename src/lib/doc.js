// Pomoćne funkcije editora. Rade i u pregledniku i u Node testovima.
import { hr } from '../i18n/hr.js';

export function debounce(fn, ms) {
  let t;
  const wrapped = (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  wrapped.flush = (...args) => { clearTimeout(t); return fn(...args); };
  return wrapped;
}

/** Stara poveznica '#/doc/abc' -> { view: 'doc', id: 'abc' }; sve ostalo -> popis */
export function parseRoute(hash = '') {
  const m = String(hash).match(/^#\/doc\/([\w-]+)$/);
  return m ? { view: 'doc', id: m[1] } : { view: 'list' };
}

/** Putanja dokumenta u aplikaciji (Next dodaje basePath). */
export function docHref(id) {
  return `/doc/${encodeURIComponent(id)}`;
}

export function wordCount(text = '') {
  const words = String(text).trim().split(/\s+/).filter(Boolean);
  return words.length;
}

export function saveStatusLabel(state) {
  const labels = hr.dokument.spremanje;
  return Object.hasOwn(labels, state) ? labels[state] : '';
}

/** Zaslonska tipkovnica je vjerojatno otvorena kad vidljivi dio padne ispod 75 % visine prozora. */
export function isKeyboardOpen(visualHeight, layoutHeight) {
  if (!visualHeight || !layoutHeight) return false;
  return visualHeight / layoutHeight < 0.75;
}
