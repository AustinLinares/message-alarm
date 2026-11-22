import tokens from './tokens.json';
import { fontFamily } from './fonts';

export type ThemeId = 'indigo' | 'suizo' | 'cristal' | 'bloqueo';
export type GradientId = 'atardecer' | 'aurora' | 'fuego' | 'plata';

export const DEFAULT_THEME: ThemeId = 'indigo';
export const DEFAULT_GRADIENT: GradientId = 'atardecer';

export const THEME_IDS: ThemeId[] = ['indigo', 'suizo', 'cristal', 'bloqueo'];
export const GRADIENT_IDS: GradientId[] = ['atardecer', 'aurora', 'fuego', 'plata'];
export const GRADIENTS = tokens.themes.bloqueo.gradients as unknown as Record<GradientId, { name: string; stops: string[] }>;

// Semantic roles every screen styles against. Raw token keys differ per theme
// (suizo has no "surfaceMuted", cristal has "glass"...), so each theme maps its
// own keys onto this shape.
export interface Theme {
  id: ThemeId;
  mode: 'light' | 'dark';
  color: {
    background: string;
    surface: string; // cards: white / transparent hairline / glass / frost
    surfaceMuted: string;
    // Palette of the alarm screen. Indigo flips to a dark screen; the dark
    // themes simply keep their own look.
    inverse: string;
    inverseRaised: string;
    inverseChip: string;
    inverseBorder: string;
    text: string;
    textMuted: string;
    textSecondary: string;
    textOnInverse: string;
    textOnInverseMuted: string;
    border: string; // card / input outline
    borderStrong: string;
    borderDashed: string;
    divider: string;
    chevron: string;
    primary: string;
    primaryPressed: string;
    onPrimary: string;
    primarySoft: string;
    highlight: string; // call-to-action on the alarm screen
    onHighlight: string;
    success: string;
    warningSoft: string;
    onWarningSoft: string;
    danger: string;
    accent: string; // "urgent" indicator dot / small accents
    selected: string; // selected filter chip
    onSelected: string;
    segmentSelected: string;
    onSegmentSelected: string;
  };
  hero: {
    background: string;
    border: string;
    text: string;
    muted: string;
    chip: string;
    chipText: string;
    action: string;
    onAction: string;
  };
  ui: {
    background: 'solid' | 'cristal' | 'bloqueo';
    uppercase: boolean; // labels in capitals (suizo)
    ruled: boolean; // sections separated by black rules instead of cards (suizo)
    underlineFields: boolean;
    gradientClock: boolean; // big clock filled with the chosen gradient (bloqueo)
    cardBorder: number;
    buttonRadius: number;
  };
  font: {
    display: (weight: number) => string;
    heading: (weight: number) => string;
    body: (weight: number) => string;
  };
  clock: { sizeHero: number; sizeAlarm: number; sizeList: number; letterSpacing: number; weight: number };
  radius: { chip: number; control: number; input: number; card: number; cardLarge: number; hero: number };
  gradient: GradientId;
}

const shared = tokens.shared;
export const spacing = shared.spacing;
export const SCREEN_PADDING_X = shared.screenPaddingX;
export const MIN_TOUCH_TARGET = shared.minTouchTarget;
export const MESSAGE_MAX_LENGTH = shared.message.maxLength;
export const fontSize = shared.fontSize;

type FontSpec = { family: string; weights: number[] };

// Only some weights are bundled per family, so ask for the nearest one.
function weightFn(spec: FontSpec) {
  return (weight: number) => {
    const nearest = spec.weights.reduce((best, w) => (Math.abs(w - weight) < Math.abs(best - weight) ? w : best), spec.weights[0]);
    return fontFamily(spec.family, nearest);
  };
}

function clockOf(t: { clock: { sizeHero: number; sizeAlarm: number; sizeList: number; letterSpacing: number; weight: number } }) {
  const { sizeHero, sizeAlarm, sizeList, letterSpacing, weight } = t.clock;
  return { sizeHero, sizeAlarm, sizeList, letterSpacing, weight };
}

const ix = tokens.themes.indigo;
const sz = tokens.themes.suizo;
const cr = tokens.themes.cristal;
const bq = tokens.themes.bloqueo;

const indigo: Theme = {
  id: 'indigo',
  mode: 'light',
  gradient: DEFAULT_GRADIENT,
  color: {
    background: ix.color.background,
    surface: ix.color.surface,
    surfaceMuted: ix.color.surfaceMuted,
    inverse: ix.color.surfaceInverse,
    inverseRaised: ix.color.surfaceInverseRaised,
    // Not in tokens.json: read off the Indigo mockups (.dc.html).
    inverseChip: '#2A2D4A',
    inverseBorder: '#3A3D5C',
    text: ix.color.text,
    textMuted: ix.color.textMuted,
    textSecondary: ix.color.textSecondary,
    textOnInverse: ix.color.textOnInverse,
    textOnInverseMuted: ix.color.textOnInverseMuted,
    border: ix.color.border,
    borderStrong: ix.color.border,
    borderDashed: '#B9BCD0',
    divider: ix.color.divider,
    chevron: '#9A9DB3',
    primary: ix.color.primary,
    primaryPressed: ix.color.primaryPressed,
    onPrimary: ix.color.onPrimary,
    primarySoft: ix.color.primarySoft,
    highlight: ix.color.highlight,
    onHighlight: ix.color.onHighlight,
    success: ix.color.success,
    warningSoft: ix.color.warningSoft,
    onWarningSoft: ix.color.onWarningSoft,
    // Not in tokens.json (no destructive color in the design): contrast 5.6:1 on white.
    danger: '#C62828',
    accent: ix.color.highlight,
    selected: ix.color.surfaceInverse,
    onSelected: '#FFFFFF',
    segmentSelected: '#FFFFFF',
    onSegmentSelected: ix.color.text,
  },
  hero: {
    background: ix.color.surfaceInverse,
    border: 'transparent',
    text: '#FFFFFF',
    muted: ix.color.textOnInverseMuted,
    chip: '#2A2D4A',
    chipText: '#E4E5F1',
    action: ix.color.highlight,
    onAction: ix.color.onHighlight,
  },
  ui: {
    background: 'solid',
    uppercase: false,
    ruled: false,
    underlineFields: false,
    gradientClock: false,
    cardBorder: 0,
    buttonRadius: ix.radius.card,
  },
  font: {
    display: weightFn(ix.font.display),
    heading: weightFn(ix.font.display),
    body: weightFn(ix.font.body),
  },
  clock: clockOf(ix),
  radius: ix.radius,
};

const suizo: Theme = {
  id: 'suizo',
  mode: 'light',
  gradient: DEFAULT_GRADIENT,
  color: {
    background: sz.color.background,
    surface: sz.color.surface,
    surfaceMuted: '#F2F2F2',
    inverse: sz.color.background,
    inverseRaised: sz.color.surface,
    inverseChip: '#F2F2F2',
    inverseBorder: sz.color.rule,
    text: sz.color.text,
    textMuted: sz.color.textMuted,
    textSecondary: '#333333',
    textOnInverse: sz.color.text,
    textOnInverseMuted: sz.color.textMuted,
    border: sz.color.hairline,
    borderStrong: sz.color.rule,
    borderDashed: sz.color.rule,
    divider: sz.color.hairline,
    chevron: sz.color.text,
    primary: sz.color.primary,
    primaryPressed: '#333333',
    onPrimary: sz.color.onPrimary,
    primarySoft: sz.color.surface,
    highlight: sz.color.primary,
    onHighlight: sz.color.onPrimary,
    success: sz.color.textMuted,
    warningSoft: sz.color.surface,
    onWarningSoft: sz.color.text,
    danger: '#B00020',
    accent: sz.color.accent,
    selected: sz.color.primary,
    onSelected: sz.color.onPrimary,
    segmentSelected: sz.color.primary,
    onSegmentSelected: sz.color.onPrimary,
  },
  hero: {
    background: 'transparent',
    border: 'transparent',
    text: sz.color.text,
    muted: sz.color.textMuted,
    chip: 'transparent',
    chipText: sz.color.text,
    action: sz.color.primary,
    onAction: sz.color.onPrimary,
  },
  ui: {
    background: 'solid',
    uppercase: true,
    ruled: true,
    underlineFields: true,
    gradientClock: false,
    cardBorder: 1,
    buttonRadius: 0,
  },
  font: {
    display: weightFn(sz.font.display),
    heading: weightFn(sz.font.display),
    body: weightFn(sz.font.body),
  },
  clock: clockOf(sz),
  radius: sz.radius,
};

const cristal: Theme = {
  id: 'cristal',
  mode: 'dark',
  gradient: DEFAULT_GRADIENT,
  color: {
    background: cr.color.background,
    surface: cr.color.glass,
    surfaceMuted: 'rgba(255,255,255,0.06)',
    inverse: cr.color.background,
    inverseRaised: cr.color.glass,
    inverseChip: cr.color.glassStrong,
    inverseBorder: cr.color.glassBorder,
    text: cr.color.text,
    textMuted: cr.color.textMuted,
    textSecondary: cr.color.textMuted,
    textOnInverse: cr.color.text,
    textOnInverseMuted: cr.color.textMuted,
    border: cr.color.glassBorder,
    borderStrong: cr.color.glassBorder,
    borderDashed: 'rgba(255,255,255,0.3)',
    divider: 'rgba(255,255,255,0.12)',
    chevron: cr.color.textMuted,
    primary: cr.color.primary,
    primaryPressed: '#3FD0DB',
    onPrimary: cr.color.onPrimary,
    primarySoft: cr.color.glass,
    highlight: cr.color.primary,
    onHighlight: cr.color.onPrimary,
    success: cr.color.primary,
    warningSoft: 'rgba(255,255,255,0.12)',
    onWarningSoft: cr.color.primary,
    danger: '#FF8A8A',
    accent: cr.color.primary,
    selected: cr.color.glassStrong,
    onSelected: cr.color.text,
    segmentSelected: cr.color.glassStrong,
    onSegmentSelected: cr.color.text,
  },
  hero: {
    background: cr.color.glass,
    border: cr.color.glassBorder,
    text: cr.color.text,
    muted: cr.color.textMuted,
    chip: 'rgba(255,255,255,0.12)',
    chipText: cr.color.text,
    action: cr.color.primary,
    onAction: cr.color.onPrimary,
  },
  ui: {
    background: 'cristal',
    uppercase: false,
    ruled: false,
    underlineFields: false,
    gradientClock: false,
    cardBorder: 1,
    buttonRadius: cr.radius.input,
  },
  font: {
    display: weightFn(cr.font.display),
    heading: weightFn({ family: 'Outfit', weights: [500] }),
    body: weightFn(cr.font.body),
  },
  clock: clockOf(cr),
  radius: cr.radius,
};

const bloqueo: Theme = {
  id: 'bloqueo',
  mode: 'dark',
  gradient: DEFAULT_GRADIENT,
  color: {
    background: bq.color.background,
    surface: bq.color.frost,
    surfaceMuted: bq.color.frost,
    inverse: bq.color.background,
    inverseRaised: bq.color.frost,
    inverseChip: 'rgba(255,255,255,0.14)',
    inverseBorder: bq.color.frostBorder,
    text: bq.color.text,
    textMuted: bq.color.textMuted,
    textSecondary: '#E6E1EE',
    textOnInverse: bq.color.text,
    textOnInverseMuted: bq.color.textMuted,
    border: bq.color.frostBorder,
    borderStrong: bq.color.frostBorder,
    borderDashed: 'rgba(255,255,255,0.28)',
    divider: 'rgba(255,255,255,0.10)',
    chevron: bq.color.textMuted,
    primary: bq.color.primary,
    primaryPressed: '#D9D5E0',
    onPrimary: bq.color.onPrimary,
    primarySoft: bq.color.frost,
    highlight: bq.color.primary,
    onHighlight: bq.color.onPrimary,
    success: '#9EE6C0',
    warningSoft: 'rgba(255,255,255,0.12)',
    onWarningSoft: '#FFC36B',
    danger: '#FF8A8A',
    accent: '#FF6B8B',
    selected: bq.color.primary,
    onSelected: bq.color.onPrimary,
    segmentSelected: bq.color.primary,
    onSegmentSelected: bq.color.onPrimary,
  },
  hero: {
    background: 'rgba(255,255,255,0.14)',
    border: 'rgba(255,255,255,0.16)',
    text: bq.color.text,
    muted: bq.color.textMuted,
    chip: bq.color.frost,
    chipText: bq.color.text,
    action: bq.color.primary,
    onAction: bq.color.onPrimary,
  },
  ui: {
    background: 'bloqueo',
    uppercase: false,
    ruled: false,
    underlineFields: false,
    gradientClock: true,
    cardBorder: 1,
    buttonRadius: 999,
  },
  font: {
    display: weightFn(bq.font.display),
    heading: weightFn(bq.font.display),
    body: weightFn(bq.font.body),
  },
  clock: clockOf(bq),
  radius: bq.radius,
};

const THEMES: Record<ThemeId, Theme> = { indigo, suizo, cristal, bloqueo };

// The gradient only matters to the lock-screen theme but rides on the theme object
// so that screens never have to read settings separately.
export function getTheme(id: ThemeId, gradient: GradientId = DEFAULT_GRADIENT): Theme {
  const theme = THEMES[id];
  return theme.gradient === gradient ? theme : { ...theme, gradient };
}
