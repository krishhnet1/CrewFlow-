import * as React from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '../constants/theme';
import { useAuth } from '../lib/hooks/useAuth';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <AuthGate />
      <Slot />
    </>
  );
}

function AuthGate() {
  const { session, profile, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Safety timeout: if loading takes more than 3 seconds, force it through
  const [forceReady, setForceReady] = React.useState(false);
  React.useEffect(() => {
    const timer = setTimeout(() => {
      console.log('AuthGate: forcing ready after timeout');
      setForceReady(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const isLoading = loading && !forceReady;

  const firstSegmentRef = React.useRef<string | undefined>(undefined);
  firstSegmentRef.current = segments[0];

  React.useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = firstSegmentRef.current === '(auth)';

    if (!session && !inAuthGroup) {
      console.log('AuthGate: no session, redirecting to login');
      router.replace('/(auth)/login');
      return;
    }

    if (session && inAuthGroup && profile) {
      const dest =
        profile.role === 'owner' || profile.role === 'manager'
          ? '/(manager)'
          : '/(employee)';
      console.log('AuthGate: session found, redirecting to', dest);
      router.replace(dest);
    }
  }, [isLoading, session, profile, router]);

  if (isLoading) {
    return (
      <View style={styles.splash} pointerEvents="auto">
        <Text style={styles.loadingLogo}>CrewFlow</Text>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  splash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    gap: 20,
  },
  loadingLogo: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.accent,
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 12,
  },
});