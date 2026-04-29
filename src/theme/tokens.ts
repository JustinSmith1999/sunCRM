// sunCRM design tokens — sampled directly from the SUNation Energy logo
// (April 2026) so the app and the brand share one identity.
//
//   Logo bright cyan-blue: #08B8F0 / #00AEEF  (the dominant brand mark, the "S")
//   Logo sun yellow:       #F8C808            (the sun above the wordmark)
//   Logo deep navy:        #005088            (the wordmark / dark surfaces)
//
// THE SCRIPT (rules of usage — applies to both web and mobile):
//   • SKY blue   (the brand). Primary CTAs, links, focus rings, active tabs.
//   • SUN yellow (the accent). Highlights, energy moments, "won" celebrations.
//   • NAVY       (the gravity). Sidebar, dark surfaces, modals, headers.
//   • INK        (the text). Body / muted / subtle scale on light surfaces.
//   • WHITE / CREAM (the stage). Surfaces. Never a cool grey for a surface.
//   • COURT      (very rare). "Online", "delivered", "saved" only.

export const palette = {
  // Ink — text only.
  ink:        '#0B0F14',
  ink800:     '#11161D',
  ink700:     '#1A2129',
  ink600:     '#2A323C',
  ink500:     '#3A4754',
  ink400:     '#647280',
  ink300:     '#8C99A4',
  ink200:     '#C0C8D0',
  ink100:     '#E5E7EB',
  ink50:      '#F4F6F8',

  // Sky — the SUNation brand action color.
  sky:        '#00AEEF',  // brand cyan-blue (cleaned hex from #08B8F0 logo sample)
  skyDeep:    '#0090C8',  // pressed
  skyDark:    '#005088',  // navy variant — the wordmark blue
  skySoft:    '#7FD7F7',
  skyPale:    '#E6F6FD',  // tints, focus rings
  skyGlow:    '#B5E7FA',

  // Sun — the brand accent (the literal sun in the logo).
  sun:        '#F8C808',
  sunDeep:    '#D9AB00',  // pressed
  sunSoft:    '#FBE068',
  sunPale:    '#FEF6CC',
  sunGlow:    '#FFEFA1',

  // Navy — deep gravity. Sidebar, modals, marketing surfaces.
  navy:       '#005088',
  navyDeep:   '#003B66',
  navyLight:  '#3A7AAD',
  navyPale:   '#E6F0F7',

  // Cream / sand — neutral warm surfaces, used sparingly.
  cream:      '#FAF6EE',
  sandPale:   '#F7F4ED',
  sand:       '#EDE7D7',
  sandMid:    '#D6CBAF',

  // Court / online green — RARE.
  court:      '#2E6E3E',
  courtSoft:  '#DCE8DA',
  courtPale:  '#F2F8F1',

  white:      '#FFFFFF',
  black:      '#000000',

  // Functional
  success:    '#34C77B',
  warning:    '#F2A93B',
  danger:     '#E5484D',
};

export type ColorScheme = 'light' | 'dark';

export const colors = {
  light: {
    bg:           palette.white,
    bgElevated:   palette.white,
    bgMuted:      palette.ink50,         // cool, neutral muted (not warm sand) — fits sky brand
    bgWarm:       palette.cream,         // when warmth is needed
    bgNavy:       palette.navy,          // dark surfaces (sidebar)
    fg:           palette.ink,
    fgMuted:      palette.ink500,
    fgSubtle:     palette.ink400,
    line:         palette.ink100,
    lineStrong:   palette.ink200,
    accent:       palette.sky,           // brand action
    accentFg:     palette.white,
    accentSoft:   palette.skyPale,
    accentSoftFg: palette.skyDark,
    sun:          palette.sun,
    sunFg:        palette.ink,
    sunSoft:      palette.sunPale,
    navy:         palette.navy,
    navyFg:       palette.white,
    court:        palette.court,
    courtSoft:    palette.courtPale,
    success:      palette.success,
    danger:       palette.danger,
    warning:      palette.warning,
    overlay:      'rgba(0,80,136,0.45)', // navy-tinted modal overlay
    cardShadow:   'rgba(0,80,136,0.08)', // navy-tinted card shadow
  },
  dark: {
    bg:           palette.navy,
    bgElevated:   palette.navyDeep,
    bgMuted:      palette.ink800,
    bgWarm:       palette.navyDeep,
    bgNavy:       palette.navyDeep,
    fg:           palette.white,
    fgMuted:      palette.ink200,
    fgSubtle:     palette.ink300,
    line:         'rgba(255,255,255,0.10)',
    lineStrong:   'rgba(255,255,255,0.20)',
    accent:       palette.sky,
    accentFg:     palette.white,
    accentSoft:   palette.navyDeep,
    accentSoftFg: palette.skyPale,
    sun:          palette.sun,
    sunFg:        palette.ink,
    sunSoft:      palette.navyDeep,
    navy:         palette.navy,
    navyFg:       palette.white,
    court:        palette.court,
    courtSoft:    palette.navyDeep,
    success:      palette.success,
    danger:       palette.danger,
    warning:      palette.warning,
    overlay:      'rgba(0,0,0,0.65)',
    cardShadow:   'rgba(0,0,0,0.40)',
  },
};

// 4-pt spacing grid.
export const space = (n: number) => n * 4;
export const spacing = {
  xs: space(1),
  sm: space(2),
  md: space(3),
  lg: space(4),
  xl: space(6),
  '2xl': space(8),
  '3xl': space(12),
  '4xl': space(16),
};

export const radii = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 22,
  '2xl': 28,
  pill: 999,
};

export const shadows = {
  sm: '0 2px 8px rgba(0,80,136,0.06)',
  md: '0 6px 16px rgba(0,80,136,0.10)',
  lg: '0 12px 28px rgba(0,80,136,0.14)',
};

// Typography — Fraunces (display serif) + Inter (body).
export const fontFamily = {
  display: '"Fraunces", "Iowan Old Style", "Apple Garamond", Georgia, serif',
  body:    '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  mono:    '"SF Mono", Menlo, Consolas, monospace',
};

export const type = {
  display1:    { fontFamily: fontFamily.display, fontWeight: 700, fontSize: 44, lineHeight: '48px', letterSpacing: '-0.6px' },
  display2:    { fontFamily: fontFamily.display, fontWeight: 700, fontSize: 34, lineHeight: '38px', letterSpacing: '-0.4px' },
  display3:    { fontFamily: fontFamily.display, fontWeight: 600, fontSize: 26, lineHeight: '32px', letterSpacing: '-0.2px' },
  h1:          { fontFamily: fontFamily.body,    fontWeight: 700, fontSize: 24, lineHeight: '30px', letterSpacing: '-0.2px' },
  h2:          { fontFamily: fontFamily.body,    fontWeight: 600, fontSize: 20, lineHeight: '26px', letterSpacing: '-0.1px' },
  h3:          { fontFamily: fontFamily.body,    fontWeight: 600, fontSize: 17, lineHeight: '24px' },
  body:        { fontFamily: fontFamily.body,    fontWeight: 400, fontSize: 16, lineHeight: '24px' },
  bodyStrong:  { fontFamily: fontFamily.body,    fontWeight: 600, fontSize: 16, lineHeight: '24px' },
  small:       { fontFamily: fontFamily.body,    fontWeight: 400, fontSize: 14, lineHeight: '20px' },
  smallStrong: { fontFamily: fontFamily.body,    fontWeight: 600, fontSize: 14, lineHeight: '20px' },
  caption:     { fontFamily: fontFamily.body,    fontWeight: 500, fontSize: 12, lineHeight: '16px', letterSpacing: '0.2px' },
  overline:    { fontFamily: fontFamily.body,    fontWeight: 700, fontSize: 11, lineHeight: '14px', letterSpacing: '1.6px', textTransform: 'uppercase' as const },
  numeric:     { fontFamily: fontFamily.body,    fontWeight: 500, fontSize: 16, lineHeight: '22px', fontVariantNumeric: 'tabular-nums' },
};

export const motion = {
  fast: 160,
  base: 240,
  slow: 380,
  ease: 'cubic-bezier(0.22, 1, 0.36, 1)',
};
