import { getAppIconName, setAlternateAppIcon, supportsAlternateIcons } from 'expo-alternate-app-icons';
import type { AppSettings } from './settings/repository';
import type { ThemeId } from './theme/themes';

// Indigo is the app's default icon, so it needs no alias. The others are the
// PascalCase names the config plugin derives from app.json.
const ICON_BY_THEME: Record<ThemeId, string | null> = {
  indigo: null,
  suizo: 'Suizo',
  cristal: 'Cristal',
  bloqueo: 'Bloqueo',
};

export const canChangeAppIcon = supportsAlternateIcons;

// Follows the *chosen* theme, not the effective one: "Follow system" flipping
// to dark at night must not swap the launcher icon (which can close the app).
export async function applyAppIcon(settings: Pick<AppSettings, 'theme' | 'changeIcon'>): Promise<void> {
  if (!supportsAlternateIcons) return;
  const target = settings.changeIcon ? ICON_BY_THEME[settings.theme] : null;
  if ((getAppIconName() ?? null) === target) return;
  try {
    await setAlternateAppIcon(target);
  } catch {
    // Some launchers refuse the change; the app keeps working with its current icon.
  }
}
