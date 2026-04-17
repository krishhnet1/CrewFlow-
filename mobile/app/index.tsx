import { Redirect } from 'expo-router';

export default function Index() {
  // Routing lives in root layout; this is just a stable starting segment.
  return <Redirect href="/(auth)/login" />;
}
