import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { InterTight_400Regular, InterTight_500Medium, InterTight_600SemiBold, InterTight_800ExtraBold } from '@expo-google-fonts/inter-tight';
import { Nunito_800ExtraBold, Nunito_900Black } from '@expo-google-fonts/nunito';
import {
  Outfit_200ExtraLight,
  Outfit_300Light,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
} from '@expo-google-fonts/outfit';
import {
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';

// Each weight is its own font family on Android, so weights are requested by
// name (e.g. "Inter_600SemiBold") rather than through fontWeight.
export const FONT_ASSETS = {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
  InterTight_400Regular,
  InterTight_500Medium,
  InterTight_600SemiBold,
  InterTight_800ExtraBold,
  Outfit_200ExtraLight,
  Outfit_300Light,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Nunito_800ExtraBold,
  Nunito_900Black,
};

const WEIGHT_SUFFIX: Record<number, string> = {
  200: 'ExtraLight',
  300: 'Light',
  400: 'Regular',
  500: 'Medium',
  600: 'SemiBold',
  700: 'Bold',
  800: 'ExtraBold',
  900: 'Black',
};

export function fontFamily(family: string, weight: number): string {
  return `${family.replace(/ /g, '')}_${weight}${WEIGHT_SUFFIX[weight]}`;
}
