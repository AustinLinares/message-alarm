import { Linking } from 'react-native';
import { openInPackage } from '../../modules/whatsapp-launcher';
import type { WhatsAppApp } from './types';

export const WHATSAPP_APPS: WhatsAppApp[] = ['auto', 'whatsapp', 'business'];

const PACKAGES: Record<Exclude<WhatsAppApp, 'auto'>, string> = {
  whatsapp: 'com.whatsapp',
  business: 'com.whatsapp.w4b',
};

export function sanitizeWhatsAppApp(value: unknown): WhatsAppApp {
  return value === 'whatsapp' || value === 'business' ? value : 'auto';
}

export function buildWhatsAppUrl(phoneNumber: string, text: string): string {
  const digits = phoneNumber.replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

// 'opened': the chosen app handled it. 'fallback': it isn't installed, so the
// system default handled it instead and the caller should say so.
export async function openWhatsAppChat(
  app: WhatsAppApp,
  phoneNumber: string,
  text: string
): Promise<'opened' | 'fallback'> {
  const url = buildWhatsAppUrl(phoneNumber, text);
  if (app === 'auto') {
    await Linking.openURL(url);
    return 'opened';
  }
  if (await openInPackage(PACKAGES[app], url)) return 'opened';
  await Linking.openURL(url);
  return 'fallback';
}
