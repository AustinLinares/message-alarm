import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { I18nProvider } from './src/shared/i18n';
import { initNotifications } from './src/shared/notifications/init';
import { FONT_ASSETS } from './src/shared/theme/fonts';
import { ThemeProvider, useAppSettings, useTheme } from './src/shared/theme/ThemeProvider';

void SplashScreen.preventAutoHideAsync();

function Root() {
  const theme = useTheme();
  const { ready } = useAppSettings();
  const [fontsLoaded, fontError] = useFonts(FONT_ASSETS);
  const fontsSettled = fontsLoaded || !!fontError;

  useEffect(() => {
    void initNotifications();
  }, []);

  // Keeps the window behind the app (keyboard, overscroll) in the theme's colour.
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(theme.color.background);
  }, [theme.color.background]);

  useEffect(() => {
    if (fontsSettled && ready) void SplashScreen.hideAsync();
  }, [fontsSettled, ready]);

  if (!fontsSettled || !ready) return null;

  return (
    <>
      <RootNavigator />
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <I18nProvider>
        <ThemeProvider>
          <Root />
        </ThemeProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}
