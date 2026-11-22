import tokens from './tokens.json';
import { fontFamily } from './fonts';

export type ThemeId = 'indigo' | 'suizo' | 'cristal' | 'bloqueo';
export type GradientId = 'atardecer' | 'aurora' | 'fuego' | 'plata';

export const DEFAULT_THEME: ThemeId = 'indigo';
export const DEFAULT_GRADIENT: GradientId = 'atardecer';

// Semantic roles every screen styles against. Raw token keys differ per theme
// (suizo has no "surfaceMuted", cristal has "glass"...), so each theme maps its
// own keys onto this shape.
export interface Theme {
  id: ThemeId;
  mode: 'light' | 'dark';
  color: {
    background: string;
    surface: string;
    surfaceMuted: string;
    inverse: string; // hero card / alarm screen background
    inverseRaised: string;
    inverseChip: string;
    inverseBorder: string;
    text: string;
    textMuted: string;
    textSecondary: string;
    textOnInverse: string;
    textOnInverseMuted: string;
    border: string;
    borderDashed: string;
    divider: string;
    chevron: string;
    primary: string;
    primaryPressed: string;
    onPrimary: string;
    primarySoft: string;
    highlight: string;
    onHighlight: string;
    success: string;
    warningSoft: string;
    onWarningSoft: string;
    danger: string;
  };
  font: { display: (weight: number) => string; body: (weight: number) => string };
  clock: { sizeHero: number; sizeAlarm: number; sizeList: number; letterSpacing: number; weight: number };
  radius: { chip: number; control: number; input: number; card: number; cardLarge: number; hero: number };
}

export const GRADIENTS = tokens.themes.bloqueo.gradients as unknown as Record<GradientId, { name: string; stops: string[] }>;
export const THEME_IDS: ThemeId[] = ['indigo', 'suizo', 'cristal', 'bloqueo'];
export const GRADIENT_IDS: GradientId[] = ['atardecer', 'aurora', 'fuego', 'plata'];

const shared = tokens.shared;
export const spacing = shared.spacing;
export const SCREEN_PADDING_X = shared.screenPaddingX;
export const MIN_TOUCH_TARGET = shared.minTouchTarget;
export const MESSAGE_MAX_LENGTH = shared.message.maxLength;
export const fontSize = shared.fontSize;

const ix = tokens.themes.indigo;

const indigo: Theme = {
  id: 'indigo',
  mode: 'light',
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
  },
  font: {
    display: (weight) => fontFamily(ix.font.display.family, weight),
    body: (weight) => fontFamily(ix.font.body.family, weight),
  },
  clock: {
    sizeHero: ix.clock.sizeHero,
    sizeAlarm: ix.clock.sizeAlarm,
    sizeList: ix.clock.sizeList,
    letterSpacing: ix.clock.letterSpacing,
    weight: ix.clock.weight,
  },
  radius: ix.radius,
};

// suizo, cristal and bloqueo are added in stage 4; until then they resolve to indigo.
const THEMES: Partial<Record<ThemeId, Theme>> = { indigo };

export function getTheme(id: ThemeId): Theme {
  return THEMES[id] ?? indigo;
}
