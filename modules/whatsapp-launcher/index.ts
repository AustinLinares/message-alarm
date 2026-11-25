import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';

interface WhatsAppLauncherNative {
  openInPackage(packageName: string, url: string): Promise<boolean>;
}

const native = Platform.OS === 'android' ? requireOptionalNativeModule<WhatsAppLauncherNative>('WhatsAppLauncher') : null;

// Resolves true if `packageName` opened the link, false if it is not installed
// (or the native module is unavailable, e.g. Expo Go).
export async function openInPackage(packageName: string, url: string): Promise<boolean> {
  if (!native) return false;
  return native.openInPackage(packageName, url);
}
