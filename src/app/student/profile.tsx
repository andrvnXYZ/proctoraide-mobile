import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/components/screen';
import { Avatar, InfoRow, Panel, PrimaryButton } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { colors, spacing } from '@/theme';

export default function StudentProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const signOut = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <AppScreen title="My Profile" role={user?.role ?? 'student'}>
      <Panel>
        <View style={styles.profileHeader}>
          <Avatar name={user?.name} size={58} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.name}>{user?.name ?? 'Student'}</Text>
            <Text style={styles.meta}>
              {user?.student_id_number ?? 'Student account'} · {user?.year_level ?? 'Year level not set'}
            </Text>
          </View>
          <View style={styles.rolePill}>
            <Text style={styles.rolePillText}>Student</Text>
          </View>
        </View>

        <View style={styles.rows}>
          <InfoRow icon="mail-outline" label="Email" value={user?.email} />
          <InfoRow icon="school-outline" label="College" value={user?.college} />
          <InfoRow icon="business-outline" label="Department" value={user?.department} />
          <InfoRow icon="layers-outline" label="Year level" value={user?.year_level} />
        </View>
      </Panel>

      <Panel title="Session" description="Signing out removes the saved access token from this device.">
        <View style={{ padding: spacing.lg, gap: 10 }}>
          <View style={styles.securityRote}>
            <Ionicons name="shield-checkmark-outline" size={17} color={colors.tealText} />
            <Text style={styles.securityText}>
              Your account stays signed in until you sign out on this phone.
            </Text>
          </View>
          <PrimaryButton label="Sign Out" icon="log-out-outline" variant="danger" onPress={signOut} />
        </View>
      </Panel>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  profileHeader: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  name: { fontSize: 17, fontWeight: '800', color: colors.ink },
  meta: { fontSize: 11, color: colors.muted, marginTop: 3 },
  rolePill: { backgroundColor: colors.tealSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  rolePillText: { fontSize: 10, fontWeight: '700', color: colors.tealText },
  rows: { paddingHorizontal: spacing.lg, paddingBottom: 4 },
  securityRote: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  securityText: { flex: 1, fontSize: 11, lineHeight: 17, color: colors.bodySoft },
});
