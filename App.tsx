import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { registerAlarmListener } from './src/features/scheduledMessages/alarmHandler';
import { CreateScheduledMessageScreen } from './src/features/scheduledMessages/CreateScheduledMessageScreen';
import { initNotifications } from './src/shared/notifications/init';

export default function App() {
  useEffect(() => {
    void initNotifications();
    return registerAlarmListener();
  }, []);

  return (
    <>
      <CreateScheduledMessageScreen />
      <StatusBar style="auto" />
    </>
  );
}
