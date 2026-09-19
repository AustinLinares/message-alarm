import type { Recurrence } from '../types';

// Earliest valid fire time strictly after `after`, never before `startAt`.
// Unifies the initial schedule (after = startAt) and rescheduling after a
// firing (after = firedAt) into the same search.
export function computeNextOccurrence(recurrence: Recurrence, startAt: Date, after: Date): Date | null {
  if (recurrence.type === 'none') {
    return startAt > after ? startAt : null;
  }

  const candidate = new Date(Math.max(startAt.getTime(), after.getTime()));
  candidate.setHours(startAt.getHours(), startAt.getMinutes(), 0, 0);
  if (candidate <= after) candidate.setDate(candidate.getDate() + 1);

  if (recurrence.type === 'daily') {
    return candidate;
  }

  const days = recurrence.daysOfWeek ?? [];
  for (let i = 0; i < 7; i++) {
    if (days.includes(candidate.getDay())) return candidate;
    candidate.setDate(candidate.getDate() + 1);
  }
  return null;
}
