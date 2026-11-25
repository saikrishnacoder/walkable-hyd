import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const ssrDir = path.join(rootDir, 'dist-ssr');
const indexHtmlPath = path.join(distDir, 'index.html');
const ssrEntryPath = path.join(ssrDir, 'entry-server.js');

async function prerender() {
  const template = fs.readFileSync(indexHtmlPath, 'utf-8');
  const { render } = await import(pathToFileURL(ssrEntryPath).href);
  const appHtml = render();

  const placeholder = '<div id="root"></div>';
  if (!template.includes(placeholder)) {
    throw new Error('Could not find <div id="root"></div> placeholder in dist/index.html');
  }

  const finalHtml = template.replace(placeholder, `<div id="root">${appHtml}</div>`);
  fs.writeFileSync(indexHtmlPath, finalHtml, 'utf-8');
  fs.rmSync(ssrDir, { recursive: true, force: true });

  console.log(`Prerendered ${appHtml.length} bytes of static HTML into dist/index.html`);
}

prerender().catch((err) => {
  console.error('Prerender failed:', err);
  process.exit(1);
});
