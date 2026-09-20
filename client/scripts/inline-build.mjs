/**
 * Collapses a production build into a single portable index.html so the demo
 * can be hosted anywhere (static host, file share, review link) without a
 * server or asset pipeline.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const dist = new URL('../dist/', import.meta.url).pathname;
let html = readFileSync(join(dist, 'index.html'), 'utf8');

const assets = readdirSync(join(dist, 'assets'));
for (const file of assets) {
  const content = readFileSync(join(dist, 'assets', file), 'utf8');
  if (file.endsWith('.css')) {
    html = html.replace(
      new RegExp(`<link[^>]*href="[^"]*${file}"[^>]*>`),
      `<style>${content}</style>`
    );
  }
}

// Scripts are inlined in dependency order: shared chunks before the entry.
const scripts = [...html.matchAll(/<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/g)];
const modulePreloads = [...html.matchAll(/<link rel="modulepreload"[^>]*href="([^"]+)"[^>]*>/g)];
html = html.replace(/<link rel="modulepreload"[^>]*>/g, '');

const ordered = [...modulePreloads.map((m) => m[1]), ...scripts.map((m) => m[1])];
const seen = new Set();
let bundle = '';
for (const src of ordered) {
  const file = src.split('/').pop();
  if (seen.has(file)) continue;
  seen.add(file);
  bundle += readFileSync(join(dist, 'assets', file), 'utf8') + '\n';
}

html = html.replace(/<script type="module"[^>]*><\/script>/g, '');
html = html.replace('</body>', `<script type="module">${bundle}</script></body>`);

writeFileSync(join(dist, 'nexora-demo.html'), html);
console.log(`[demo] single-file build written (${(html.length / 1024).toFixed(0)} KB)`);
