import { getLocales } from 'expo-localization';
import type { Locale } from './i18n';

export interface Country {
  iso: string;
  code: string; // international dialling code, digits only
  es: string;
  en: string;
}

// Several countries can share a code (the +1 ones), so the choice is stored by ISO code.
export const COUNTRIES: Country[] = [
  { iso: 'AR', code: '54', es: 'Argentina', en: 'Argentina' },
  { iso: 'AU', code: '61', es: 'Australia', en: 'Australia' },
  { iso: 'AT', code: '43', es: 'Austria', en: 'Austria' },
  { iso: 'BE', code: '32', es: 'Bélgica', en: 'Belgium' },
  { iso: 'BO', code: '591', es: 'Bolivia', en: 'Bolivia' },
  { iso: 'BR', code: '55', es: 'Brasil', en: 'Brazil' },
  { iso: 'CA', code: '1', es: 'Canadá', en: 'Canada' },
  { iso: 'CL', code: '56', es: 'Chile', en: 'Chile' },
  { iso: 'CN', code: '86', es: 'China', en: 'China' },
  { iso: 'CO', code: '57', es: 'Colombia', en: 'Colombia' },
  { iso: 'KR', code: '82', es: 'Corea del Sur', en: 'South Korea' },
  { iso: 'CR', code: '506', es: 'Costa Rica', en: 'Costa Rica' },
  { iso: 'CU', code: '53', es: 'Cuba', en: 'Cuba' },
  { iso: 'DK', code: '45', es: 'Dinamarca', en: 'Denmark' },
  { iso: 'EC', code: '593', es: 'Ecuador', en: 'Ecuador' },
  { iso: 'EG', code: '20', es: 'Egipto', en: 'Egypt' },
  { iso: 'SV', code: '503', es: 'El Salvador', en: 'El Salvador' },
  { iso: 'AE', code: '971', es: 'Emiratos Árabes Unidos', en: 'United Arab Emirates' },
  { iso: 'ES', code: '34', es: 'España', en: 'Spain' },
  { iso: 'US', code: '1', es: 'Estados Unidos', en: 'United States' },
  { iso: 'PH', code: '63', es: 'Filipinas', en: 'Philippines' },
  { iso: 'FI', code: '358', es: 'Finlandia', en: 'Finland' },
  { iso: 'FR', code: '33', es: 'Francia', en: 'France' },
  { iso: 'GR', code: '30', es: 'Grecia', en: 'Greece' },
  { iso: 'GT', code: '502', es: 'Guatemala', en: 'Guatemala' },
  { iso: 'HN', code: '504', es: 'Honduras', en: 'Honduras' },
  { iso: 'IN', code: '91', es: 'India', en: 'India' },
  { iso: 'ID', code: '62', es: 'Indonesia', en: 'Indonesia' },
  { iso: 'IE', code: '353', es: 'Irlanda', en: 'Ireland' },
  { iso: 'IL', code: '972', es: 'Israel', en: 'Israel' },
  { iso: 'IT', code: '39', es: 'Italia', en: 'Italy' },
  { iso: 'JP', code: '81', es: 'Japón', en: 'Japan' },
  { iso: 'MA', code: '212', es: 'Marruecos', en: 'Morocco' },
  { iso: 'MX', code: '52', es: 'México', en: 'Mexico' },
  { iso: 'NI', code: '505', es: 'Nicaragua', en: 'Nicaragua' },
  { iso: 'NG', code: '234', es: 'Nigeria', en: 'Nigeria' },
  { iso: 'NO', code: '47', es: 'Noruega', en: 'Norway' },
  { iso: 'NZ', code: '64', es: 'Nueva Zelanda', en: 'New Zealand' },
  { iso: 'NL', code: '31', es: 'Países Bajos', en: 'Netherlands' },
  { iso: 'PA', code: '507', es: 'Panamá', en: 'Panama' },
  { iso: 'PY', code: '595', es: 'Paraguay', en: 'Paraguay' },
  { iso: 'PE', code: '51', es: 'Perú', en: 'Peru' },
  { iso: 'PL', code: '48', es: 'Polonia', en: 'Poland' },
  { iso: 'PT', code: '351', es: 'Portugal', en: 'Portugal' },
  { iso: 'PR', code: '1', es: 'Puerto Rico', en: 'Puerto Rico' },
  { iso: 'GB', code: '44', es: 'Reino Unido', en: 'United Kingdom' },
  { iso: 'DO', code: '1', es: 'República Dominicana', en: 'Dominican Republic' },
  { iso: 'RO', code: '40', es: 'Rumanía', en: 'Romania' },
  { iso: 'RU', code: '7', es: 'Rusia', en: 'Russia' },
  { iso: 'SA', code: '966', es: 'Arabia Saudita', en: 'Saudi Arabia' },
  { iso: 'ZA', code: '27', es: 'Sudáfrica', en: 'South Africa' },
  { iso: 'SE', code: '46', es: 'Suecia', en: 'Sweden' },
  { iso: 'CH', code: '41', es: 'Suiza', en: 'Switzerland' },
  { iso: 'TR', code: '90', es: 'Turquía', en: 'Turkey' },
  { iso: 'UA', code: '380', es: 'Ucrania', en: 'Ukraine' },
  { iso: 'UY', code: '598', es: 'Uruguay', en: 'Uruguay' },
  { iso: 'VE', code: '58', es: 'Venezuela', en: 'Venezuela' },
  { iso: 'DE', code: '49', es: 'Alemania', en: 'Germany' },
];

// Settings value: 'auto' follows the phone's region, 'none' adds nothing,
// anything else is a country's ISO code.
export const COUNTRY_AUTO = 'auto';
export const COUNTRY_NONE = 'none';

export function isCountrySetting(value: unknown): value is string {
  return value === COUNTRY_AUTO || value === COUNTRY_NONE || COUNTRIES.some((country) => country.iso === value);
}

export function countryName(country: Country, locale: Locale): string {
  return country[locale];
}

export function resolveCountry(setting: string): Country | null {
  if (setting === COUNTRY_NONE) return null;
  const iso = setting === COUNTRY_AUTO ? getLocales()[0]?.regionCode : setting;
  return COUNTRIES.find((country) => country.iso === iso) ?? null;
}

export function sortedCountries(locale: Locale): Country[] {
  return [...COUNTRIES].sort((a, b) => a[locale].localeCompare(b[locale], locale));
}
