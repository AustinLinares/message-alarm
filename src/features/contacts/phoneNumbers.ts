export interface PhoneEntry {
  number: string;
  label?: string;
}

// Shorter than this, a shared ending proves nothing (e.g. extensions, short codes).
const MIN_SUFFIX_DIGITS = 7;

export function digitsOf(number: string): string {
  return number.replace(/\D/g, '').replace(/^00/, '');
}

// Address books often hold one number several times: "+51 987 654 321",
// "987654321", "(51) 987-654-321", "0987654321". Treat two entries as the same number when
// their digits match, or one is the other without a country code / trunk "0".
export function isSameNumber(a: string, b: string): boolean {
  const da = digitsOf(a);
  const db = digitsOf(b);
  if (!da || !db) return false;
  if (da === db) return true;
  const [short, long] = da.length <= db.length ? [da, db] : [db, da];
  const core = short.replace(/^0+/, '');
  return core.length >= MIN_SUFFIX_DIGITS && long.endsWith(core);
}

export function isMobileLabel(label?: string): boolean {
  return !!label && /mobile|m[oó]vil|cell|celular|iphone/i.test(label);
}

function hasInternationalPrefix(number: string): boolean {
  const trimmed = number.trim();
  return trimmed.startsWith('+') || trimmed.startsWith('00');
}

// WhatsApp links need the full international number, so prefer the entry that has it.
function isPreferred(candidate: PhoneEntry, current: PhoneEntry): boolean {
  const candidatePlus = hasInternationalPrefix(candidate.number);
  const currentPlus = hasInternationalPrefix(current.number);
  if (candidatePlus !== currentPlus) return candidatePlus;
  const candidateLength = digitsOf(candidate.number).length;
  const currentLength = digitsOf(current.number).length;
  if (candidateLength !== currentLength) return candidateLength > currentLength;
  return isMobileLabel(candidate.label) && !isMobileLabel(current.label);
}

// One entry per real number (best-formatted variant kept), mobile numbers first.
export function mergePhoneNumbers(entries: PhoneEntry[]): PhoneEntry[] {
  const merged: PhoneEntry[] = [];
  for (const entry of entries) {
    if (!digitsOf(entry.number)) continue;
    const index = merged.findIndex((existing) => isSameNumber(existing.number, entry.number));
    if (index === -1) merged.push(entry);
    else if (isPreferred(entry, merged[index])) merged[index] = { ...entry, label: entry.label ?? merged[index].label };
  }
  return merged
    .map((entry, order) => ({ entry, order }))
    .sort((a, b) => Number(isMobileLabel(b.entry.label)) - Number(isMobileLabel(a.entry.label)) || a.order - b.order)
    .map(({ entry }) => entry);
}
