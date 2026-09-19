export interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  text: string;
}

export type RecurrenceType = 'none' | 'daily' | 'weekly';

export interface Recurrence {
  type: RecurrenceType;
  daysOfWeek?: number[]; // 0-6, only used when type === 'weekly'
}

export interface ScheduledMessage {
  id: string;
  text: string;
  templateId?: string;
  recipientIds: string[];
  startAt: string; // ISO datetime
  recurrence: Recurrence;
  isActive: boolean;
}

export type RecipientStatus = 'pending' | 'confirmed';

export interface RecipientDelivery {
  contactId: string;
  status: RecipientStatus;
}

// Created each time a scheduled message's alarm fires, so recurring messages
// don't carry over the checklist state from a previous occurrence.
export interface MessageOccurrence {
  id: string;
  scheduledMessageId: string;
  firedAt: string; // ISO datetime
  recipients: RecipientDelivery[];
}
