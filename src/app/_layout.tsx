import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, type ReactNode } from 'react';

import { AuthProvider, useAuth } from '@/lib/auth';
import { colors } from '@/theme';

/**
 * Keeps signed-out users on the login screen and signed-in users inside the
 * tab group that belongs to their role.
 */
function RouteGuard({ children }: { children: ReactNode }) {
  const { ready, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;

    const onLogin = segments[0] === 'login';

    if (!user && !onLogin) {
      router.replace('/login');
      return;
    }

    if (user && onLogin) {
      router.replace(user.role === 'proctor' ? '/proctor' : '/student');
    }
  }, [ready, user, segments, router]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RouteGuard>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.page },
          }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="student" />
          <Stack.Screen name="proctor" />
          <Stack.Screen name="exam/[id]" />
          <Stack.Screen name="examination/[id]" />
          <Stack.Screen name="create-examination" />
        </Stack>
      </RouteGuard>
      <StatusBar style="light" />
    </AuthProvider>
  );
}
