import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme, type ColorSchemeName } from 'react-native';
import { DEFAULT_SETTINGS, loadSettings, saveSettings, type AppSettings } from '../settings/repository';
import { getTheme, type Theme, type ThemeId } from './themes';

interface ThemeContextValue {
  theme: Theme;
  settings: AppSettings;
  ready: boolean;
  updateSettings: (patch: Partial<AppSettings>) => void;
  reloadSettings: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// "Follow system": dark mode uses cristal, light mode uses the chosen theme.
function effectiveThemeId(settings: AppSettings, systemScheme: ColorSchemeName): ThemeId {
  return settings.followSystem && systemScheme === 'dark' ? 'cristal' : settings.theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);

  const reloadSettings = useCallback(async () => {
    setSettings(await loadSettings());
  }, []);

  useEffect(() => {
    reloadSettings()
      .catch(() => undefined) // fall back to defaults; the app is still usable
      .finally(() => setReady(true));
  }, [reloadSettings]);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      void saveSettings(next);
      return next;
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: getTheme(effectiveThemeId(settings, systemScheme)),
      settings,
      ready,
      updateSettings,
      reloadSettings,
    }),
    [settings, systemScheme, ready, updateSettings, reloadSettings]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

function useThemeContext(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('Theme hooks must be used inside <ThemeProvider>');
  return value;
}

export function useTheme(): Theme {
  return useThemeContext().theme;
}

export function useAppSettings() {
  const { settings, updateSettings, reloadSettings, ready } = useThemeContext();
  return { settings, updateSettings, reloadSettings, ready };
}

// Builds a StyleSheet-like object that is recomputed only when the theme changes.
export function useThemedStyles<T>(factory: (theme: Theme) => T): T {
  const theme = useTheme();
  return useMemo(() => factory(theme), [theme]);
}
