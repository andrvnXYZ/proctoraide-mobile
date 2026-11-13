import { Redirect } from 'expo-router';

import { Splash } from '@/components/screen';
import { useAuth } from '@/lib/auth';

export default function Index() {
  const { ready, user } = useAuth();

  if (!ready) {
    return <Splash />;
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  return <Redirect href={user.role === 'proctor' ? '/proctor' : '/student'} />;
}
