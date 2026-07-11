#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_ASCII = String.raw`                  >@>%)}%*:@@@@+{%@@   :#]}                        
                 [  =#@@@@@@@@@@@@@  @@@@@@                        
                @@@@@@@@@@@@@@@@@@@  @@  @@                        
              @@@@@@@@@@@@@@@@@@@@    @@-                          
             @@%@@)@@@@@@@@@@]  {@@@@@@@@@@@@                      
           @@@@@@(@@@@@@@#*@ %@@%@@@@@@@@@@@@@@@                   
          @@@@@%#)@@@@@@@*#@@@@@@@@@@@@@@@@#@@@@@)                 
         @@@@@@#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@                
        )}@@@@@<%@@@(@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@               
       @ @%}@@@@@@} @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@              
      @ :@{@@<@@@@* @@@@@@@@@@@@@@@@@@@@@%@@@@@@#@@@@@@@           
     @  @@)@@@@@@@( @@@@@%@@@@@@@@@@@@@@%@@@@@@@@@@@@@@@@@@        
    @  @@{#@%}@@# *>@@@@@@@@@@@@@@@@@@@@@@@@@@@@%@@@#@@#@^@@       
   .@ =@@@@@@@@@@]@#@@@@@@@@@@@@%@@@@@@@@@@@@@@@@@@@@@@@@ @@       
   @  @@@@@@}@ @   @@@@@@%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@>       
  @   @@@@{@@@@@= @@@@@@@@@%@@@#@@@@@@@@@@@@@@#@%@@@@@@@@@@        
 @@  @]@@@ @#+@@@%@@@@@@@@@@@@@@%@@@@@@@@@@@@@@@@@@@@@@(@@         
 @   @%@#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@#@@@}@@          
@     @@@@@}@@}@@ ] @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@            
@     @@@@@@@@@@@  -=@@@#@@@@@@@@@@%@@@@@@@@@@@%@@@@               
      @@@@@@@{@@     @@@@@@@@@@@@@@@@@@@@@@@@@@#@@                 
    : @@@@@@{#@@     @@@@@@@@@@@@@@@%@@@@@@@@@@@@                  
    # @@@#@@@%@     @@@@@@@@@@@@@@@@@@@@@@@@@@@@@[                 
     %@@@@@@@@)     @@@@@@@@@@@@@@%@@@@@@@@@@@@@@@                 
    @@@@@@@@@@#   @@@%@@%@@%@@@@@@@@@@@@@@@@@@.                    
    @@@@%@@@ %#   @@%@@@@@@@@@@@@#@@@@@@@@@@@@                     
    @@@@@@@@  +  @@@@@@@@@#@@@@@@@@@@@@@%@@@@                      
    @@@@@@@   @  @@@@@@}@#@@@@@@@++ @@@@@@@                        
    <@ @@@@      @@@@#@%@@@@@@@   @    @@@@                        
   @@  %@@      @@@@@@@@@@@@@@@                                    
       {@@     @@@@@@@@@@@@@@@                                     
     : @@     @@%#@@@@@@@@@#)@                                     
       @@>  (@<<^({}}}}@@@@@@@@                                    
      %@@  [@@@@%@@@@@@{ .*)<=@@:                                  
     @@@  )@@@@@@@@@@@@@@* >(+++<@                                 
     @@+  @@@@@@@@@@@@@@@@} =@[{*:}@                `;

const THEMES = {
  'dark-red': {
    canvas: '#07070a00',
    panel: '#0e0e13',
    panelBorder: '#25252f',
    accent: '#ff4d5a',
    accentSoft: '#b93440',
    text: '#f4f4f5',
    muted: '#a1a1aa',
    shadow: '#000000',
    palette: ['#1b1b22', '#ff4d5a', '#f59e0b', '#22c55e', '#38bdf8', '#a78bfa', '#f472b6', '#f4f4f5'],
  },
  'dark-blue': {
    canvas: '#06080d',
    panel: '#0b111b',
    panelBorder: '#1f3046',
    accent: '#5aa9ff',
    accentSoft: '#2f6fae',
    text: '#edf6ff',
    muted: '#91a4ba',
    shadow: '#000000',
    palette: ['#101820', '#ef4444', '#f59e0b', '#22c55e', '#5aa9ff', '#a78bfa', '#22d3ee', '#edf6ff'],
  },
  light: {
    canvas: '#e8e8ed',
    panel: '#fafafa',
    panelBorder: '#d4d4d8',
    accent: '#c81e2b',
    accentSoft: '#ef6a73',
    text: '#18181b',
    muted: '#71717a',
    shadow: '#71717a',
    palette: ['#27272a', '#dc2626', '#d97706', '#16a34a', '#2563eb', '#7c3aed', '#db2777', '#fafafa'],
  },
};

const DEFAULT_CONFIG = {
  output: 'neofetch.svg',
  width: 1600,
  height: 800,
  padding: 58,
  theme: 'dark-red',
  terminalChrome: true,
  showPalette: true,
  username: 'ehko',
  hostname: 'github',
  fields: [
    ['OS', 'Windows 11 Pro'],
    ['Role', 'Game Tooling Development'],
    ['Job', 'Nowhere :('],
    ['Location', 'Florida'],
    ['Languages', 'Java, TypeScript, C++, C#, Go, Rust'],
    ['Editor', 'VSCode + Visual Studio'],
    ['Favorite Game', 'Destiny 2 (Probably 1k+ hours)'],
    ['Uptime', '8 Years'],
  ],
  layout: {
    infoWidth: 500,
    gap: 58,
    contentTop: 82,
    contentBottom: 54,
  },
  typography: {
    fontFamily: "'JetBrains Mono', 'Cascadia Mono', 'Fira Code', Consolas, monospace",
    headerSize: 24,
    infoSize: 18,
    infoLineHeight: 31,
    asciiSize: 16,
    asciiLineHeight: 1.08,
  },
  ascii: DEFAULT_ASCII,
};

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

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

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function normalizeAscii(ascii) {
  return String(ascii)
    .replaceAll('\r\n', '\n')
    .replaceAll('\r', '\n')
    .replace(/^\n+|\n+$/g, '');
}

function loadConfig(args) {
  let fileConfig = {};
  let configDir = process.cwd();

  if (args.config) {
    const resolved = path.resolve(args.config);
    configDir = path.dirname(resolved);
    fileConfig = readJson(resolved);
  }

  let config = deepMerge(DEFAULT_CONFIG, fileConfig);

  if (fileConfig.asciiFile) {
    config.ascii = fs.readFileSync(path.resolve(configDir, fileConfig.asciiFile), 'utf8');
  }

  if (args.theme) config.theme = args.theme;
  if (args.output) config.output = args.output;
  if (args.width) config.width = Number(args.width);
  if (args.height) config.height = Number(args.height);

  config.ascii = normalizeAscii(config.ascii || DEFAULT_ASCII);
  return config;
}

function resolveTheme(config) {
  const preset = THEMES[config.theme] || THEMES['dark-red'];
  return deepMerge(preset, config.colors || {});
}

function makeTextLines(lines, x, y, lineHeight, attrs = '') {
  return `<text x="${x}" y="${y}" ${attrs}>\n${lines
    .map((line, index) => `  <tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`)
    .join('\n')}\n</text>`;
}

function generateSvg(config) {
  const theme = resolveTheme(config);
  const { width, height, padding, layout, typography } = config;
  const chromeHeight = config.terminalChrome ? 40 : 0;
  const panelX = 24;
  const panelY = 24;
  const panelWidth = width - 48;
  const panelHeight = height - 48;
  const contentTop = panelY + chromeHeight + layout.contentTop;
  const contentBottom = panelY + panelHeight - layout.contentBottom;

  const infoX = panelX + padding;
  const asciiAreaX = infoX + layout.infoWidth + layout.gap;
  const asciiAreaWidth = panelX + panelWidth - padding - asciiAreaX;
  const asciiAreaHeight = contentBottom - contentTop;

  const asciiLines = config.ascii.split('\n');
  const maxChars = Math.max(...asciiLines.map((line) => line.length), 1);
  const charWidthRatio = 0.603;
  const lineHeightRatio = typography.asciiLineHeight;
  const fitByWidth = asciiAreaWidth / (maxChars * charWidthRatio);
  const fitByHeight = asciiAreaHeight / (asciiLines.length * lineHeightRatio);
  const asciiFontSize = Math.max(6, Math.min(typography.asciiSize, fitByWidth, fitByHeight));
  const asciiLineHeight = asciiFontSize * lineHeightRatio;
  const asciiBlockWidth = maxChars * asciiFontSize * charWidthRatio;
  const asciiBlockHeight = asciiLines.length * asciiLineHeight;
  const asciiX = asciiAreaX + Math.max(0, asciiAreaWidth - asciiBlockWidth);
  const asciiY = contentTop + Math.max(0, (asciiAreaHeight - asciiBlockHeight) / 2) + asciiFontSize;

  const infoBlockHeight = typography.headerSize + 18 + config.fields.length * typography.infoLineHeight + (config.showPalette ? 46 : 0);
  const infoY = contentTop + Math.max(0, (asciiAreaHeight - infoBlockHeight) / 2);
  const header = `${config.username}@${config.hostname}`;
  const underline = '─'.repeat(Math.max(12, header.length));

  const fieldSvg = config.fields.map(([label, value], index) => {
    const y = infoY + typography.headerSize + 50 + index * typography.infoLineHeight;
    return `<text x="${infoX}" y="${y}" font-family="${escapeXml(typography.fontFamily)}" font-size="${typography.infoSize}" dominant-baseline="middle">
  <tspan fill="${theme.accent}" font-weight="700">${escapeXml(label)}</tspan>
  <tspan fill="${theme.muted}">: </tspan>
  <tspan fill="${theme.text}">${escapeXml(value)}</tspan>
</text>`;
  }).join('\n');

  let paletteSvg = '';
  if (config.showPalette) {
    const paletteY = infoY + typography.headerSize + 65 + config.fields.length * typography.infoLineHeight;
    const block = 27;
    const gap = 7;
    paletteSvg = `<g aria-label="terminal color palette">
${theme.palette.map((color, i) => `  <rect x="${infoX + i * (block + gap)}" y="${paletteY}" width="${block}" height="${block}" rx="5" fill="${color}"/>`).join('\n')}
</g>`;
  }

  const chromeSvg = config.terminalChrome ? `<g aria-label="terminal window controls">
  <circle cx="${panelX + 24}" cy="${panelY + 20}" r="6" fill="#ff5f57"/>
  <circle cx="${panelX + 44}" cy="${panelY + 20}" r="6" fill="#febc2e"/>
  <circle cx="${panelX + 64}" cy="${panelY + 20}" r="6" fill="#28c840"/>
  <text x="${panelX + panelWidth / 2}" y="${panelY + 25}" text-anchor="middle" fill="${theme.muted}" font-family="${escapeXml(typography.fontFamily)}" font-size="13">neofetch</text>
  <line x1="${panelX}" y1="${panelY + chromeHeight}" x2="${panelX + panelWidth}" y2="${panelY + chromeHeight}" stroke="${theme.panelBorder}"/>
</g>` : '';

  const asciiSvg = makeTextLines(
    asciiLines,
    Number(asciiX.toFixed(2)),
    Number(asciiY.toFixed(2)),
    Number(asciiLineHeight.toFixed(2)),
    `fill="${theme.accent}" font-family="${escapeXml(typography.fontFamily)}" font-size="${asciiFontSize.toFixed(2)}" font-weight="700" xml:space="preserve"`
  );

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
  <title id="title">Neofetch profile for ${escapeXml(header)}</title>
  <desc id="desc">A customizable terminal-style neofetch card with system information on the left and ASCII art on the right.</desc>
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="14" stdDeviation="18" flood-color="${theme.shadow}" flood-opacity="0.42"/>
    </filter>
    <linearGradient id="asciiGlow" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${theme.accent}"/>
      <stop offset="1" stop-color="${theme.accentSoft}"/>
    </linearGradient>
  </defs>

  <rect width="${width}" height="${height}" fill="${theme.canvas}"/>
  <rect x="${panelX}" y="${panelY}" width="${panelWidth}" height="${panelHeight}" rx="18" fill="${theme.panel}" stroke="${theme.panelBorder}" filter="url(#shadow)"/>
  ${chromeSvg}

  <g aria-label="system information">
    <text x="${infoX}" y="${infoY + typography.headerSize}" fill="${theme.accent}" font-family="${escapeXml(typography.fontFamily)}" font-size="${typography.headerSize}" font-weight="800">${escapeXml(header)}</text>
    <text x="${infoX}" y="${infoY + typography.headerSize + 25}" fill="${theme.accentSoft}" font-family="${escapeXml(typography.fontFamily)}" font-size="${typography.infoSize}">${escapeXml(underline)}</text>
    ${fieldSvg}
    ${paletteSvg}
  </g>

  <g aria-label="ASCII art" opacity="0.98">
    ${asciiSvg.replace(`fill="${theme.accent}"`, 'fill="url(#asciiGlow)"')}
  </g>
</svg>`;
}

function printHelp() {
  console.log(`Usage: node neofetch-svg.js [options]\n\nOptions:\n  --config <file>   Load a JSON configuration file\n  --output <file>   Output SVG path\n  --theme <name>    dark-red, dark-blue, or light\n  --width <px>      Override SVG width\n  --height <px>     Override SVG height\n  --help            Show this help\n\nExamples:\n  node neofetch-svg.js\n  node neofetch-svg.js --theme dark-blue --output profile.svg\n  node neofetch-svg.js --config neofetch.config.json\n`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const config = loadConfig(args);
  const svg = generateSvg(config);
  const outputPath = path.resolve(config.output);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, svg, 'utf8');
  console.log(`Created ${outputPath}`);
}

try {
  main();
} catch (error) {
  console.error(`Failed to generate SVG: ${error.message}`);
  process.exitCode = 1;
}
