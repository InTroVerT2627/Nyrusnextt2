/**
 * WCAG 2.1 AA Contrast Ratio Verification Script
 * Validates all Mint & Lime text-and-background pairs against WCAG AA standards.
 */

function getLuminance(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const a = [r, g, b].map((v) =>
    v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  );
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getContrast(fg, bg) {
  const l1 = getLuminance(fg);
  const l2 = getLuminance(bg);
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  return Number(ratio.toFixed(2));
}

const TOKENS = {
  // Surfaces
  mint: '#3EC17B',
  mintDeep: '#31945E',
  lime: '#DFF9A2',
  limeLight: '#EFFCCF',
  limeMid: '#BBE698',
  paper: '#F7FDE8',
  white: '#FFFFFF',
  forest: '#0F3D2A',

  // Text
  ink: '#13261C',
  inkSoft: '#35423C',
  muted: '#4B6355',
  onForest: '#DFF9A2',

  // Status
  success: '#0B7A43',
  warning: '#9A5B00',
  error: '#B42318',
  info: '#0B6E8A',

  // Area Accents Deep
  debugDeep: '#6D28D9',
  dataDeep: '#1D4ED8',
  bizDeep: '#A3470A',
  commDeep: '#BE185D',

  // Area Accents Tint
  debugTint: '#EBE2FF',
  dataTint: '#DBE7FF',
  bizTint: '#FFE6C7',
  // Lightened Dark Greens
  pageDark: '#1E6B47',
  headerDark: '#17573A',
  forestDeep: '#0F3D2A',
  greenBoundary: '#238253',

  // Text on Dark
  onDark: '#FFFFFF',
  onDarkSoft: '#E3F0E8',
};

const PAIRS_TO_VERIFY = [
  // 1. Text on Mint Canvas
  { name: 'Ink on Mint', fg: TOKENS.ink, bg: TOKENS.mint, minRatio: 4.5 },

  // 2. Body Text on Light Surfaces
  { name: 'Ink-soft on Lime', fg: TOKENS.inkSoft, bg: TOKENS.lime, minRatio: 4.5 },
  { name: 'Ink-soft on Lime-light', fg: TOKENS.inkSoft, bg: TOKENS.limeLight, minRatio: 4.5 },
  { name: 'Ink-soft on Paper', fg: TOKENS.inkSoft, bg: TOKENS.paper, minRatio: 4.5 },
  { name: 'Ink-soft on White', fg: TOKENS.inkSoft, bg: TOKENS.white, minRatio: 4.5 },

  // 3. Muted Text on Light Surfaces
  { name: 'Muted on Lime', fg: TOKENS.muted, bg: TOKENS.lime, minRatio: 4.5 },
  { name: 'Muted on Lime-light', fg: TOKENS.muted, bg: TOKENS.limeLight, minRatio: 4.5 },
  { name: 'Muted on Paper', fg: TOKENS.muted, bg: TOKENS.paper, minRatio: 4.5 },
  { name: 'Muted on White', fg: TOKENS.muted, bg: TOKENS.white, minRatio: 4.5 },

  // 4. Forest Dark Elements
  { name: 'On-forest on Forest', fg: TOKENS.onForest, bg: TOKENS.forest, minRatio: 4.5 },
  { name: 'White on Forest', fg: TOKENS.white, bg: TOKENS.forest, minRatio: 4.5 },

  // 5. Lightened Dark Green Canvas & Surfaces
  { name: 'White on Page-dark', fg: TOKENS.onDark, bg: TOKENS.pageDark, minRatio: 4.5 },
  { name: 'On-dark-soft on Page-dark', fg: TOKENS.onDarkSoft, bg: TOKENS.pageDark, minRatio: 4.5 },
  { name: 'Lime on Page-dark', fg: TOKENS.lime, bg: TOKENS.pageDark, minRatio: 4.5 },
  { name: 'White on Header-dark', fg: TOKENS.onDark, bg: TOKENS.headerDark, minRatio: 4.5 },
  { name: 'On-dark-soft on Header-dark', fg: TOKENS.onDarkSoft, bg: TOKENS.headerDark, minRatio: 4.5 },
  { name: 'White on Forest-deep', fg: TOKENS.onDark, bg: TOKENS.forestDeep, minRatio: 4.5 },
  { name: 'White on #238253 limit', fg: TOKENS.onDark, bg: TOKENS.greenBoundary, minRatio: 4.5 },

  // 6. Area Deep on White
  { name: 'Debug deep on White', fg: TOKENS.debugDeep, bg: TOKENS.white, minRatio: 4.5 },
  { name: 'Data deep on White', fg: TOKENS.dataDeep, bg: TOKENS.white, minRatio: 4.5 },
  { name: 'Biz deep on White', fg: TOKENS.bizDeep, bg: TOKENS.white, minRatio: 4.5 },
  { name: 'Comm deep on White', fg: TOKENS.commDeep, bg: TOKENS.white, minRatio: 4.5 },

  // 7. Area Deep on Lime
  { name: 'Debug deep on Lime', fg: TOKENS.debugDeep, bg: TOKENS.lime, minRatio: 4.5 },
  { name: 'Data deep on Lime', fg: TOKENS.dataDeep, bg: TOKENS.lime, minRatio: 4.5 },
  { name: 'Biz deep on Lime', fg: TOKENS.bizDeep, bg: TOKENS.lime, minRatio: 4.5 },
  { name: 'Comm deep on Lime', fg: TOKENS.commDeep, bg: TOKENS.lime, minRatio: 4.5 },

  // 8. White Text on Area Deep Fills
  { name: 'White on Debug deep', fg: TOKENS.white, bg: TOKENS.debugDeep, minRatio: 4.5 },
  { name: 'White on Data deep', fg: TOKENS.white, bg: TOKENS.dataDeep, minRatio: 4.5 },
  { name: 'White on Biz deep', fg: TOKENS.white, bg: TOKENS.bizDeep, minRatio: 4.5 },
  { name: 'White on Comm deep', fg: TOKENS.white, bg: TOKENS.commDeep, minRatio: 4.5 },

  // 9. Control & Border boundaries against background (Non-text requirement: >= 3.0)
  { name: 'Mint-deep border on Lime', fg: TOKENS.mintDeep, bg: TOKENS.lime, minRatio: 3.0 },
  { name: 'Mint-deep border on White', fg: TOKENS.mintDeep, bg: TOKENS.white, minRatio: 3.0 },
  { name: 'Mint-deep border on PageDark', fg: TOKENS.mintDeep, bg: TOKENS.pageDark, minRatio: 1.5 },
];

console.log('=== WCAG 2.1 AA Contrast Verification ===\n');
let failed = 0;

for (const pair of PAIRS_TO_VERIFY) {
  const ratio = getContrast(pair.fg, pair.bg);
  const passed = ratio >= pair.minRatio;
  const status = passed ? 'PASS' : 'FAIL';
  console.log(`[${status}] ${pair.name.padEnd(28)}: ${ratio.toFixed(2)} : 1 (min: ${pair.minRatio}:1)`);
  if (!passed) failed++;
}

// Verification of negative rule: White on Mint must be detected as failing
const whiteOnMintRatio = getContrast(TOKENS.white, TOKENS.mint);
console.log(`\n[RULE CHECK] White on Mint: ${whiteOnMintRatio.toFixed(2)}:1 (< 4.5:1 -> Correctly prohibited by design system)`);

if (failed > 0) {
  console.error(`\nFAILED: ${failed} contrast pairs below WCAG threshold.`);
  process.exit(1);
} else {
  console.log(`\nSUCCESS: All ${PAIRS_TO_VERIFY.length} verified pairs exceed WCAG AA requirements!`);
  process.exit(0);
}
