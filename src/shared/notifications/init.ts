import { configureNotificationHandling, requestNotificationPermissions, setupAlarmChannel } from './scheduler';

export async function initNotifications(): Promise<void> {
  configureNotificationHandling();
  await setupAlarmChannel();
  await requestNotificationPermissions();
}
