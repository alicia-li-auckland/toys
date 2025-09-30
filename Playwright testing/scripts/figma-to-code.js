#!/usr/bin/env node
// Minimal scaffold: takes a Figma URL and seeds src/index.html for iteration.
// Usage: node scripts/figma-to-code.js "https://www.figma.com/design/..."

const fs = require('fs');
const path = require('path');

const figmaUrl = process.argv[2] || '';
if (!figmaUrl) {
  console.log('Provide a Figma URL: node scripts/figma-to-code.js <url>');
  process.exit(1);
}

const target = path.join(process.cwd(), 'src', 'index.html');
const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>DroneDeploy Scaffold Design System</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600&display=swap" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css" rel="stylesheet">
  <link rel="stylesheet" href="./tokens.css">
  <style>
    body{font-family:'Hanken Grotesk',sans-serif;padding:24px}
    .note{color:#666;font-size:14px;margin-top:8px}
    .btn{display:inline-flex;align-items:center;gap:4px;padding:12px 16px;border-radius:2px;border:1px solid transparent;font-weight:600;font-size:13px;line-height:18px;cursor:pointer}
    .btn--primary{background:var(--blue-600);color:#fff}
    .btn__icon{width:18px;height:18px;display:inline-flex;align-items:center;justify-content:center}
  </style>
  </head>
  <body>
    <h1>DroneDeploy Scaffold Design System</h1>
    <div class="note">Seeded from: ${figmaUrl}</div>
    <div style="margin-top:12px;">
      <button class="btn btn--primary"><span class="btn__icon"><i class="ri-check-line"></i></span>Primary</button>
    </div>
  </body>
</html>`;

fs.writeFileSync(target, html);
console.log('Wrote', target);



