import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
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
