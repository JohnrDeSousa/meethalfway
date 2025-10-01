// @ts-ignore - color-contrast-checker doesn't have types
import ColorContrastChecker from 'color-contrast-checker';

const ccc = new ColorContrastChecker();

// Convert HSL to hex for the contrast checker
function hslToHex(hsl: string): string {
  // Extract HSL values from string like "hsl(214 100% 40%)"
  const match = hsl.match(/hsl\((\d+)\s+(\d+)%\s+(\d+)%\)/);
  if (!match) return '#000000';
  
  const [, h, s, l] = match;
  const hue = parseInt(h);
  const saturation = parseInt(s) / 100;
  const lightness = parseInt(l) / 100;
  
  const c = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = lightness - c / 2;
  
  let r = 0, g = 0, b = 0;
  
  if (0 <= hue && hue < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= hue && hue < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= hue && hue < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= hue && hue < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= hue && hue < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= hue && hue < 360) {
    r = c; g = 0; b = x;
  }
  
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Color scheme from CSS
const lightTheme = {
  background: 'hsl(0 0% 100%)', // white
  foreground: 'hsl(222 84% 5%)', // very dark blue
  primary: 'hsl(214 100% 40%)', // blue
  primaryForeground: 'hsl(210 40% 98%)', // near white
  secondary: 'hsl(210 40% 96%)', // very light blue
  secondaryForeground: 'hsl(222 84% 5%)', // very dark blue
  muted: 'hsl(210 40% 96%)', // very light blue
  mutedForeground: 'hsl(215 13% 37%)', // medium gray
  accent: 'hsl(142 71% 45%)', // green
  accentForeground: 'hsl(210 40% 98%)', // near white
  destructive: 'hsl(0 84% 60%)', // red
  destructiveForeground: 'hsl(210 40% 98%)', // near white
  border: 'hsl(214 32% 91%)', // light gray
  input: 'hsl(214 32% 91%)', // light gray
};

const darkTheme = {
  background: 'hsl(0 0% 0%)', // black
  foreground: 'hsl(200 7% 91%)', // light gray
  primary: 'hsl(204 88% 53%)', // lighter blue
  primaryForeground: 'hsl(0 0% 100%)', // white
  secondary: 'hsl(195 15% 95%)', // light gray
  secondaryForeground: 'hsl(222 84% 5%)', // very dark
  muted: 'hsl(0 0% 9%)', // very dark gray
  mutedForeground: 'hsl(210 3% 46%)', // medium gray
  accent: 'hsl(206 70% 8%)', // very dark blue
  accentForeground: 'hsl(204 88% 53%)', // blue
  destructive: 'hsl(0 84% 60%)', // red
  destructiveForeground: 'hsl(0 0% 100%)', // white
  border: 'hsl(210 5% 15%)', // dark gray
  input: 'hsl(208 28% 18%)', // dark gray
};

interface ContrastResult {
  combination: string;
  ratio: number;
  wcagAA: boolean;
  wcagAAA: boolean;
  isLargeText?: boolean;
  isUIComponent?: boolean;
}

export function checkContrastRatios(theme: 'light' | 'dark' = 'light'): ContrastResult[] {
  const colors = theme === 'light' ? lightTheme : darkTheme;
  const results: ContrastResult[] = [];
  
  // Convert HSL to hex
  const hexColors = Object.entries(colors).reduce((acc, [key, value]) => {
    acc[key] = hslToHex(value);
    return acc;
  }, {} as Record<string, string>);
  
  // Common color combinations to check
  const combinations = [
    { name: 'foreground on background', fg: 'foreground', bg: 'background', isText: true },
    { name: 'primary foreground on primary', fg: 'primaryForeground', bg: 'primary', isText: true },
    { name: 'secondary foreground on secondary', fg: 'secondaryForeground', bg: 'secondary', isText: true },
    { name: 'muted foreground on background', fg: 'mutedForeground', bg: 'background', isText: true },
    { name: 'muted foreground on muted', fg: 'mutedForeground', bg: 'muted', isText: true },
    { name: 'accent foreground on accent', fg: 'accentForeground', bg: 'accent', isText: true },
    { name: 'destructive foreground on destructive', fg: 'destructiveForeground', bg: 'destructive', isText: true },
    { name: 'foreground on card', fg: 'foreground', bg: 'background', isText: true }, // card uses background
    { name: 'border on background', fg: 'border', bg: 'background', isUIComponent: true },
    { name: 'input border', fg: 'input', bg: 'background', isUIComponent: true },
  ];
  
  combinations.forEach(({ name, fg, bg, isText, isUIComponent }) => {
    const foregroundHex = hexColors[fg];
    const backgroundHex = hexColors[bg];
    
    if (!foregroundHex || !backgroundHex) return;
    
    const ratio = ccc.getContrastRatio(foregroundHex, backgroundHex);
    const wcagAA = isText ? ccc.isLevelAA(foregroundHex, backgroundHex, 14) : ratio >= 3;
    const wcagAAA = isText ? ccc.isLevelAAA(foregroundHex, backgroundHex, 14) : ratio >= 4.5;
    
    results.push({
      combination: `${name} (${foregroundHex} on ${backgroundHex})`,
      ratio: parseFloat(ratio.toFixed(2)),
      wcagAA,
      wcagAAA,
      isUIComponent: !!isUIComponent,
    });
  });
  
  return results;
}

export function logContrastResults(theme: 'light' | 'dark' = 'light') {
  const results = checkContrastRatios(theme);
  console.log(`\n=== WCAG Contrast Analysis - ${theme.toUpperCase()} Theme ===`);
  
  results.forEach(result => {
    const status = result.wcagAA ? '✅ PASS' : '❌ FAIL';
    const aaa = result.wcagAAA ? ' (AAA ✅)' : ' (AAA ❌)';
    const type = result.isUIComponent ? ' [UI Component]' : ' [Text]';
    
    console.log(`${status} ${result.combination}${type}`);
    console.log(`     Ratio: ${result.ratio}:1${aaa}`);
    
    if (!result.wcagAA) {
      const required = result.isUIComponent ? 3.0 : 4.5;
      console.log(`     ⚠️  Needs ${required}:1 minimum for WCAG AA`);
    }
  });
  
  const failing = results.filter(r => !r.wcagAA);
  console.log(`\nSummary: ${failing.length} of ${results.length} combinations fail WCAG AA`);
  
  return results;
}

// Runtime contrast checker for development
export function setupRuntimeContrastCheck() {
  if (process.env.NODE_ENV === 'development') {
    // Check both themes
    setTimeout(() => {
      logContrastResults('light');
      logContrastResults('dark');
    }, 1000);
  }
}