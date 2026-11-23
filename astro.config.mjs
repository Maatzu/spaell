// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// GitHub Pages serverer siden under /spaell, men lokalt kjører dev-serveren på roten.
const dev = process.argv.includes('dev');

export default defineConfig({
  site: 'https://maatzu.github.io',
  base: dev ? '/' : '/spaell',
  integrations: [sitemap()],
  // Coverbildene ligger hos Omny; <Image> henter dem ved bygg og lager små WebP-filer.
  image: { domains: ['www.omnycontent.com'] },
});
