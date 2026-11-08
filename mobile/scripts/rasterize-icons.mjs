#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require('playwright-core'));
} catch {
  ({ chromium } = require('/Users/pratikrai/.pi/agent/skills/app-designer/node_modules/playwright-core'));
}
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
});
try {
  const page = await browser.newPage({ viewport: { width: 1024, height: 1024 }, deviceScaleFactor: 1 });
  const source = await readFile(resolve(root, 'assets/icon.svg'), 'utf8');
  const variants = [
    { name: 'icon.png', background: true, scale: 1 },
    { name: 'android-icon-foreground.png', scale: 0.70 },
    { name: 'android-icon-background.png', background: true, scale: 0 },
    { name: 'android-icon-monochrome.png', scale: 0.70, monochrome: true },
    { name: 'splash-icon.png', scale: 0.85 },
  ];
  for (const variant of variants) {
    await page.setContent(`<style>html,body{margin:0;width:1024px;height:1024px;background:transparent}svg{display:block;width:1024px;height:1024px}</style>${source}`);
    await page.evaluate(({ background, scale, monochrome }) => {
      const svg = document.querySelector('svg');
      svg.querySelector('#background').remove();
      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.setAttribute('transform', `translate(172 172) scale(${scale}) translate(-172 -172)`);
      for (const id of ['rear-band', 'foreground']) group.append(svg.querySelector(`#${id}`));
      svg.append(group);
      if (background) {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('width', '344');
        rect.setAttribute('height', '344');
        rect.setAttribute('fill', '#111315');
        svg.prepend(rect);
      }
      if (monochrome) for (const path of group.querySelectorAll('path')) {
        path.setAttribute('stroke', '#ffffff');
        path.removeAttribute('stroke-opacity');
      }
    }, variant);
    await page.screenshot({ path: resolve(root, 'assets', variant.name), omitBackground: true });
    console.log(`Generated assets/${variant.name}`);
  }
} finally {
  await browser.close();
}
