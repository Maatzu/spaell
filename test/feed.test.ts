// Sjekker tolkingen av feeden mot en lagret, nedkortet RSS-fil (test/feed.rss), uten nett.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { parseFeed } from '../src/lib/parse-feed.ts';

const xml = readFileSync(new URL('feed.rss', import.meta.url), 'utf8');
const podcast = parseFeed(xml);

function episode(fullTitle: string) {
  const ep = podcast.episodes.find((e) => e.fullTitle === fullTitle);
  assert.ok(ep, `Fant ikke «${fullTitle}» i feeden`);
  return ep;
}

test('vanlig episode får nummer, type og slug fra tittelen', () => {
  const ep = episode('Grand Theft Auto 1 #152');
  assert.equal(ep.number, 152);
  assert.equal(ep.type, 'episode');
  assert.equal(ep.title, 'Grand Theft Auto 1');
  assert.equal(ep.slug, '152-grand-theft-auto-1');
});

test('SpællBreak har ikke nummer', () => {
  const ep = episode('SpællBreak - Bilspill');
  assert.equal(ep.number, null);
  assert.equal(ep.type, 'spaellbreak');
  assert.equal(ep.slug, 'spaellbreak-bilspill');
});

test('tittel uten nummer blir spesial', () => {
  const ep = episode('Sommerspesial');
  assert.equal(ep.number, null);
  assert.equal(ep.type, 'spesial');
  assert.equal(ep.slug, 'sommerspesial');
});

test('den faste lenkeblokken fjernes fra beskrivelsen', () => {
  assert.match(xml, /patreon/i, 'Fixturen skal inneholde lenkeblokken');
  for (const ep of podcast.episodes) {
    assert.ok(ep.descriptionHtml.length > 0, `${ep.slug} mistet hele beskrivelsen`);
    assert.doesNotMatch(ep.descriptionHtml, /patreon|discord\.gg|instagram\.com|gjerne sjekk oss ut/i, ep.slug);
  }
});

test('kapitler leses med starttid i sekunder', () => {
  assert.deepEqual(episode('Grand Theft Auto 1 #152').chapters, [
    { start: 0, title: 'Grand Theft Auto 1 #152' },
    { start: 385, title: 'Bakgrunnshistorien' },
    { start: 3675, title: 'Rating av Grand Theft Auto' },
    { start: 4695, title: 'Lytterspalten' },
  ]);
});
