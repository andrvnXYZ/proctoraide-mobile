import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/components/screen';
import { EmptyState, ErrorBlock, LoadingBlock, Panel, StatusBadge } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { formatDateTime } from '@/lib/format';
import { useApi } from '@/lib/use-api';
import { colors, spacing } from '@/theme';
import type { Examination } from '@/types';

export default function StudentHistoryScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { data, error, loading, reload } = useApi<{ history: Examination[] }>('/student/examinations');
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    await reload(true);
    setRefreshing(false);
  };

  return (
    <AppScreen
      title="Examination History"
      role={user?.role ?? 'student'}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.teal} />
      }>
      <View style={{ gap: 4 }}>
        <Text style={styles.heading}>Your examination records</Text>
        <Text style={styles.subheading}>
          Sessions you have joined, started, or finished on this account.
        </Text>
      </View>

      {loading && !data ? <LoadingBlock /> : null}
      {error ? <ErrorBlock message={error} onRetry={() => reload()} /> : null}

      {data ? (
        <Panel>
          {data.history.length === 0 ? (
            <EmptyState
              icon="time-outline"
              title="No examination records yet."
              description="Once you join an examination, it will be listed here for review."
            />
          ) : (
            data.history.map((examination, index) => (
              <Pressable
                key={examination.id}
                onPress={() => router.push(`/exam/${examination.id}`)}
                style={({ pressed }) => [
                  styles.row,
                  index !== data.history.length - 1 && styles.rowBorder,
                  pressed && { backgroundColor: '#fafcfb' },
                ]}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.rowTitle}>{examination.title}</Text>
                  <Text style={styles.rowMeta}>
                    {[examination.subject, examination.section].filter(Boolean).join(' · ')}
                  </Text>
                  <Text style={styles.rowDate}>{examination.schedule}</Text>
                  {examination.session?.finished_at ? (
                    <Text style={styles.sessionNote}>
                      Finished {formatDateTime(examination.session.finished_at)}
                    </Text>
                  ) : examination.session?.status === 'in_progress' ? (
                    <Text style={styles.sessionNote}>In exam mode</Text>
                  ) : null}
                </View>
                <View style={styles.right}>
                  <StatusBadge status={examination.status} compact />
                  <Ionicons name="chevron-forward" size={16} color="#c3cfcb" />
                </View>
              </Pressable>
            ))
          )}
        </Panel>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 21, fontWeight: '800', color: colors.ink, letterSpacing: -0.5 },
  subheading: { fontSize: 12, lineHeight: 18, color: colors.body },
  row: { flexDirection: 'row', gap: 10, padding: spacing.lg, paddingVertical: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
  rowTitle: { fontSize: 13.5, fontWeight: '700', color: colors.rowTitle },
  rowMeta: { fontSize: 11, color: colors.bodySoft, marginTop: 3 },
  rowDate: { fontSize: 11, color: colors.muted, marginTop: 2 },
  sessionNote: { fontSize: 10.5, fontWeight: '700', color: colors.tealText, marginTop: 4 },
  right: { alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 },
});
