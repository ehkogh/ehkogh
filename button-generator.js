#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const THEMES = {
  'dark-red': {
    panel: '#0e0e13',
    panelBorder: '#25252f',
    accent: '#ff4d5a',
    accentSoft: '#b93440',
    text: '#f4f4f5',
    muted: '#a1a1aa',
    shadow: '#000000',
  },
  purple: {
    panel: '#100d14',
    panelBorder: '#2d1a42',
    accent: '#ffa4fa',
    accentSoft: '#5d427d',
    text: '#f7e7ec',
    muted: '#a887bc',
    shadow: '#000000',
  },
  'dark-blue': {
    panel: '#0b111b',
    panelBorder: '#1f3046',
    accent: '#5aa9ff',
    accentSoft: '#2f6fae',
    text: '#edf6ff',
    muted: '#91a4ba',
    shadow: '#000000',
  },
  light: {
    panel: '#fafafa',
    panelBorder: '#d4d4d8',
    accent: '#c81e2b',
    accentSoft: '#ef6a73',
    text: '#18181b',
    muted: '#71717a',
    shadow: '#71717a',
  },
};

const DEFAULT_CONFIG = {
  outputDir: 'buttons',
  readme: 'README.md',
  theme: 'purple',
  width: 240,
  height: 64,
  typography: {
    fontFamily: "'JetBrains Mono', 'Cascadia Mono', 'Fira Code', Consolas, monospace",
    labelSize: 15,
    descriptionSize: 11,
  },
  buttons: [],
};

const BUILT_IN_ICONS = {
  // Twitter bird mark. The button may still link to the current x.com URL.
  twitter: ({ color }) => `<path fill="${color}" transform="translate(22 18) scale(1.17)" d="M23.953 4.57a10 10 0 0 1-2.825.775 4.958 4.958 0 0 0 2.163-2.723 10.1 10.1 0 0 1-3.127 1.195 4.92 4.92 0 0 0-8.384 4.482A13.98 13.98 0 0 1 1.64 3.162a4.82 4.82 0 0 0-.666 2.475 4.92 4.92 0 0 0 2.188 4.096 4.9 4.9 0 0 1-2.228-.616v.06a4.93 4.93 0 0 0 3.946 4.827 4.9 4.9 0 0 1-2.212.085 4.94 4.94 0 0 0 4.604 3.417 9.87 9.87 0 0 1-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.95 13.95 0 0 0 7.548 2.209c9.057 0 14.01-7.503 14.01-14.01 0-.21 0-.42-.015-.63A10.03 10.03 0 0 0 24 4.59z"/>`,
  // Same mark as Projects/site/public/favicon.svg.
  blog: ({ color }) => `<path fill="${color}" transform="translate(22 18) scale(1.17)" d="M23.15 2.587 18.21.21a1.494 1.494 0 0 0-1.705.29l-9.46 8.63-4.12-3.128a.999.999 0 0 0-1.276.057L.327 7.261A1 1 0 0 0 .326 8.74L3.899 12 .326 15.26a1 1 0 0 0 .001 1.479L1.65 17.94a.999.999 0 0 0 1.276.057l4.12-3.129 9.46 8.63a1.492 1.492 0 0 0 1.704.291l4.942-2.377A1.5 1.5 0 0 0 24 20.06V3.939a1.5 1.5 0 0 0-.85-1.352zM18.005 17.448 10.83 12l7.175-5.448v10.896z"/>`,
  // Same mark as Projects/Photon/public/OpenPhoton/assets/openphoton.svg.
  openphoton: ({ color }) => `<g transform="translate(15 3) scale(.68)" fill="${color}" stroke="${color}" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 41A20 20 0 0 1 52 41" fill="none" stroke-width="2.5"/>
    <path d="M12 41Q22 30 32 41T52 41" fill="none" stroke-width="4"/>
    <circle cx="12" cy="41" r="4.5" stroke="none"/>
    <circle cx="52" cy="41" r="4.5" stroke="none"/>
    <circle cx="32" cy="21" r="4.5" stroke="none"/>
  </g>`,
  project: ({ color }) => `<path d="m29 24-7 7 7 7m13-14 7 7-7 7m-4-18-6 22" fill="none" stroke="${color}" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>`,
};

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
    } else {
      args[key] = next;
      i += 1;
    }
  }
  return args;
}

function deepMerge(base, override) {
  if (!override || typeof override !== 'object' || Array.isArray(override)) return override ?? base;
  const out = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (
      value && typeof value === 'object' && !Array.isArray(value) &&
      base[key] && typeof base[key] === 'object' && !Array.isArray(base[key])
    ) {
      out[key] = deepMerge(base[key], value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function safeId(value) {
  const id = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (!id) throw new Error('Every button needs a non-empty id');
  return id;
}

function recolorSvg(source, color) {
  if (!color) return source;
  return source
    .replace(/:root\s*\{\s*--mark:\s*[^;}]+;?\s*\}/g, `:root { --mark: ${color}; }`)
    .replace(/@media\s*\(prefers-color-scheme:\s*dark\)\s*\{\s*:root\s*\{\s*--mark:\s*[^;}]+;?\s*\}\s*\}/g, '')
    .replace(/fill="#[0-9a-fA-F]{6}"/g, `fill="${color}"`);
}

function externalIcon(button, configDir) {
  if (!button.iconFile) return null;
  const iconPath = path.resolve(configDir, button.iconFile);
  if (!fs.existsSync(iconPath)) {
    console.warn(`Icon not found at ${iconPath}; using the ${button.fallbackIcon || 'project'} icon`);
    return null;
  }

  const source = recolorSvg(fs.readFileSync(iconPath, 'utf8'), button.iconColor);
  const encoded = Buffer.from(source).toString('base64');
  return `<image x="18" y="14" width="36" height="36" href="data:image/svg+xml;base64,${encoded}" preserveAspectRatio="xMidYMid meet"/>`;
}

function renderIcon(button, theme, configDir) {
  const fromFile = externalIcon(button, configDir);
  if (fromFile) return fromFile;
  const iconName = button.icon || button.fallbackIcon || 'project';
  const render = BUILT_IN_ICONS[iconName] || BUILT_IN_ICONS.project;
  return render({ color: button.iconColor || theme.accent });
}

function generateButtonSvg(button, config, theme, configDir) {
  const { width, height, typography } = config;
  const label = button.label || button.id;
  const description = button.description || '';
  const icon = renderIcon(button, theme, configDir);
  const textX = 67;
  const labelY = description ? 28 : 37;
  const arrowX = width - 18;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
  <title id="title">${escapeXml(label)}</title>
  <desc id="desc">${escapeXml(description || `Open ${label}`)}</desc>
  <rect x=".75" y=".75" width="${width - 1.5}" height="${height - 1.5}" rx="11" fill="${theme.panel}" stroke="${theme.panelBorder}" stroke-width="1.5"/>
  <path d="M12 .75h${width - 24}" stroke="${button.accent || theme.accent}" stroke-opacity=".22" stroke-linecap="round"/>
  <rect x="15" y="11" width="42" height="42" rx="9" fill="${theme.accentSoft}" opacity=".14"/>
  <rect x="15" y="11" width="42" height="42" rx="9" fill="none" stroke="${theme.panelBorder}"/>
  ${icon}
  <text x="${textX}" y="${labelY}" fill="${theme.text}" font-family="${escapeXml(typography.fontFamily)}" font-size="${typography.labelSize}" font-weight="700">${escapeXml(label)}</text>
  ${description ? `<text x="${textX}" y="45" fill="${theme.muted}" font-family="${escapeXml(typography.fontFamily)}" font-size="${typography.descriptionSize}">${escapeXml(description)}</text>` : ''}
  <path d="m${arrowX - 5} 27 5 5-5 5" fill="none" stroke="${theme.muted}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;
}

function readmeBlock(buttons, config, outputPaths, readmePath) {
  const readmeDir = path.dirname(readmePath);
  const links = buttons.map((button, index) => {
    let imagePath = path.relative(readmeDir, outputPaths[index]).replaceAll('\\', '/');
    if (!imagePath.startsWith('.')) imagePath = `./${imagePath}`;
    const alt = button.description
      ? `${button.label || button.id} — ${button.description}`
      : button.label || button.id;
    return `  <a href="${escapeXml(button.href)}"><img src="${escapeXml(imagePath)}" alt="${escapeXml(alt)}" width="${config.width}" /></a>`;
  }).join('\n');

  return `<!-- profile-buttons:start -->
<p align="center">
${links}
</p>
<!-- profile-buttons:end -->`;
}

function updateReadme(config, configDir, outputPaths) {
  if (!config.readme) return;
  const readmePath = path.resolve(configDir, config.readme);
  const block = readmeBlock(config.buttons, config, outputPaths, readmePath);
  const start = '<!-- profile-buttons:start -->';
  const end = '<!-- profile-buttons:end -->';
  const current = fs.existsSync(readmePath) ? fs.readFileSync(readmePath, 'utf8').trimEnd() : '';
  const markerPattern = new RegExp(`${start}[\\s\\S]*?${end}`);
  const next = markerPattern.test(current)
    ? current.replace(markerPattern, block)
    : `${current}${current ? '\n\n' : ''}${block}`;
  fs.writeFileSync(readmePath, `${next}\n`, 'utf8');
  console.log(`Updated ${readmePath}`);
}

function loadConfig(args) {
  const configPath = path.resolve(args.config || 'buttons.config.json');
  const configDir = path.dirname(configPath);
  const fileConfig = fs.existsSync(configPath)
    ? JSON.parse(fs.readFileSync(configPath, 'utf8'))
    : {};
  const config = deepMerge(DEFAULT_CONFIG, fileConfig);

  if (args.theme) config.theme = args.theme;
  if (args['output-dir']) config.outputDir = args['output-dir'];
  return { config, configDir, configPath };
}

function printHelp() {
  console.log(`Usage: node button-generator.js [options]

Options:
  --config <file>       Load a JSON configuration file (default: buttons.config.json)
  --theme <name>        purple, dark-red, dark-blue, or light
  --output-dir <path>   Override the generated button directory
  --help                Show this help

Add an item to buttons.config.json, then run this script to generate its SVG and
refresh the marked button block in README.md. Set iconFile to use any local SVG;
the generated button embeds it and does not depend on the original asset.
`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const { config, configDir } = loadConfig(args);
  const theme = deepMerge(THEMES[config.theme] || THEMES.purple, config.colors || {});
  const outputDir = path.resolve(configDir, config.outputDir);
  fs.mkdirSync(outputDir, { recursive: true });

  const outputPaths = config.buttons.map((button) => {
    if (!button.href) throw new Error(`Button ${button.id || '(missing id)'} needs an href`);
    const outputPath = path.join(outputDir, `${safeId(button.id)}.svg`);
    fs.writeFileSync(outputPath, generateButtonSvg(button, config, theme, configDir), 'utf8');
    console.log(`Created ${outputPath}`);
    return outputPath;
  });

  updateReadme(config, configDir, outputPaths);
}

try {
  main();
} catch (error) {
  console.error(`Failed to generate buttons: ${error.message}`);
  process.exitCode = 1;
}
