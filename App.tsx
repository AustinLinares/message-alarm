import { StatusBar } from 'expo-status-bar';
import { CreateScheduledMessageScreen } from './src/features/scheduledMessages/CreateScheduledMessageScreen';

export default function App() {
  return (
    <>
      <CreateScheduledMessageScreen />
      <StatusBar style="auto" />
    </>
  );
}
