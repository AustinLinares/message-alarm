import { getDb } from '../db/client';
import { DEFAULT_GRADIENT, DEFAULT_THEME, GRADIENT_IDS, THEME_IDS, type GradientId, type ThemeId } from '../theme/themes';

export interface AppSettings {
  theme: ThemeId;
  gradient: GradientId;
  followSystem: boolean;
  changeIcon: boolean;
  // Android: ring on the alarm audio channel (alarm volume, works on silent).
  alarmMode: boolean;
  alarmBannerDismissed: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: DEFAULT_THEME,
  gradient: DEFAULT_GRADIENT,
  followSystem: false,
  changeIcon: false,
  alarmMode: false,
  alarmBannerDismissed: false,
};

// Keeps whatever is valid and falls back to defaults for the rest, so a
// backup from an older or newer app can never leave the settings broken.
export function sanitizeSettings(raw: unknown, base: AppSettings = DEFAULT_SETTINGS): AppSettings {
  const value = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    theme: THEME_IDS.includes(value.theme as ThemeId) ? (value.theme as ThemeId) : base.theme,
    gradient: GRADIENT_IDS.includes(value.gradient as GradientId) ? (value.gradient as GradientId) : base.gradient,
    followSystem: typeof value.followSystem === 'boolean' ? value.followSystem : base.followSystem,
    changeIcon: typeof value.changeIcon === 'boolean' ? value.changeIcon : base.changeIcon,
    alarmMode: typeof value.alarmMode === 'boolean' ? value.alarmMode : base.alarmMode,
    alarmBannerDismissed:
      typeof value.alarmBannerDismissed === 'boolean' ? value.alarmBannerDismissed : base.alarmBannerDismissed,
  };
}

interface SettingRow {
  key: string;
  value: string;
}

export async function loadSettings(): Promise<AppSettings> {
  const db = await getDb();
  const rows = await db.getAllAsync<SettingRow>('SELECT key, value FROM app_settings;');
  const stored: Record<string, unknown> = {};
  for (const row of rows) {
    try {
      stored[row.key] = JSON.parse(row.value);
    } catch {
      // Ignore an unreadable row; the default for that key applies.
    }
  }
  return sanitizeSettings(stored);
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const db = await getDb();
  for (const [key, value] of Object.entries(settings)) {
    await db.runAsync('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?);', key, JSON.stringify(value));
  }
}
