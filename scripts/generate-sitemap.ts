// Writes public/sitemap.xml, public/robots.txt and the page rewrites in vercel.json from src/routes.ts,
// so every page URL stays listed and unknown URLs fall through to a real 404.
import fs from 'fs';
import { ROUTES } from '../src/routes';
import { SITE } from '../src/siteConfig';

const today = new Date().toISOString().slice(0, 10);
const paths = ['/', ...Object.values(ROUTES).filter((r) => !r.hidden).map((r) => r.path)];

const urls = paths
  .map((p) => `  <url>\n    <loc>${SITE.url}${p === '/' ? '/' : p}</loc>\n    <lastmod>${today}</lastmod>\n    <priority>${p === '/' || p === '/overview' ? '1.0' : '0.7'}</priority>\n  </url>`)
  .join('\n');

fs.writeFileSync(
  'public/sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
);

fs.writeFileSync(
  'public/robots.txt',
  `User-agent: *\nAllow: /\n# API routes and one-time scan scripts are not pages\nDisallow: /api/\n\nSitemap: ${SITE.url}/sitemap.xml\n`
);

// Only known pages are rewritten to the app; anything else gets Vercel's 404 (dist/404.html, a copy of the app)
const pagePaths = Object.values(ROUTES).filter((r) => r.path !== '/404').map((r) => r.path);
const vercel = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
vercel.rewrites = [{ source: '/api/(.*)', destination: '/api' }, ...pagePaths.map((p) => ({ source: p, destination: '/index.html' }))];
fs.writeFileSync('vercel.json', `${JSON.stringify(vercel, null, 2)}\n`);

console.log(`sitemap: ${paths.length} URLs, ${pagePaths.length} page rewrites`);
