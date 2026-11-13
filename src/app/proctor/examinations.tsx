import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, Share, StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/components/screen';
import {
  EmptyState,
  ErrorBlock,
  LoadingBlock,
  Panel,
  PrimaryButton,
  StatusBadge,
} from '@/components/ui';
import { ApiError, apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { confirmAction } from '@/lib/confirm';
import { useApi } from '@/lib/use-api';
import { colors, radius, shadow, spacing } from '@/theme';
import type { Examination } from '@/types';

type ExaminationsPayload = { examinations: Examination[] };

export default function ProctorExaminationsScreen() {
  const router = useRouter();
  const { token, user } = useAuth();
  const { data, error, loading, reload } = useApi<ExaminationsPayload>('/proctor/examinations');
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const refresh = async () => {
    setRefreshing(true);
    await reload(true);
    setRefreshing(false);
  };

  const shareCode = async (examination: Examination) => {
    try {
      await Share.share({
        message: `ProctorAide examination: ${examination.title} (${examination.subject} · ${examination.section}). Access code: ${examination.access_code}. Schedule: ${examination.schedule}.`,
      });
    } catch {
      // Sharing can be dismissed by the user; nothing to handle.
    }
  };

  const changeStatus = async (examination: Examination, action: 'start' | 'end') => {
    const starting = action === 'start';

    const confirmed = await confirmAction(
      starting ? 'Start examination?' : 'End examination?',
      starting
        ? `Students will be able to join "${examination.title}" with code ${examination.access_code}.`
        : `"${examination.title}" will be closed. Students can no longer join or continue.`,
      starting ? 'Start' : 'End',
    );

    if (!confirmed || !token) return;

    setBusyId(examination.id);
    setActionError(null);

    try {
      await apiRequest(`/proctor/examinations/${examination.id}/${action}`, {
        method: 'PATCH',
        token,
      });
      await reload(true);
    } catch (requestError) {
      setActionError(
        requestError instanceof ApiError ? requestError.message : 'Unable to update the examination.',
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AppScreen
      title="Examinations"
      role={user?.role ?? 'proctor'}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.teal} />
      }
      headerRight={
        <Pressable
          onPress={() => router.push('/create-examination')}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Create examination"
          style={({ pressed }) => [styles.addButton, pressed && { opacity: 0.7 }]}>
          <Ionicons name="add" size={22} color="#ffffff" />
        </Pressable>
      }>
      <View style={{ gap: 4 }}>
        <Text style={styles.heading}>Your examination sessions</Text>
        <Text style={styles.subheading}>
          Generate access codes, monitor joined students, and start or end sessions.
        </Text>
      </View>

      {loading && !data ? <LoadingBlock /> : null}
      {error ? <ErrorBlock message={error} onRetry={() => reload()} /> : null}
      {actionError ? <ErrorBlock message={actionError} /> : null}

      {data ? (
        data.examinations.length === 0 ? (
          <Panel>
            <EmptyState
              icon="clipboard-outline"
              title="No examinations yet."
              description="Create your first examination session to generate an access code for your students."
              action={
                <PrimaryButton
                  label="Create Examination"
                  icon="add"
                  onPress={() => router.push('/create-examination')}
                />
              }
            />
          </Panel>
        ) : (
          data.examinations.map((examination) => (
            <View key={examination.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.title}>{examination.title}</Text>
                  <Text style={styles.meta}>
                    {examination.subject} · {examination.section}
                  </Text>
                </View>
                <StatusBadge status={examination.status} compact />
              </View>

              <View style={styles.scheduleRow}>
                <Ionicons name="calendar-outline" size={13} color={colors.muted} />
                <Text style={styles.schedule}>{examination.schedule}</Text>
              </View>

              <Pressable
                onPress={() => shareCode(examination)}
                style={({ pressed }) => [styles.codeChip, pressed && { opacity: 0.7 }]}>
                <Ionicons name="key-outline" size={13} color={colors.tealText} />
                <Text style={styles.codeText}>{examination.access_code}</Text>
                <Ionicons name="share-outline" size={13} color={colors.tealText} />
              </Pressable>

              <View style={styles.statsRow}>
                <Text style={styles.stat}>
                  Joined <Text style={styles.statValue}>{examination.joined_students ?? 0}</Text>
                </Text>
                <Text style={styles.stat}>
                  In exam <Text style={styles.statValue}>{examination.in_progress_students ?? 0}</Text>
                </Text>
                <Text style={styles.stat}>
                  Finished <Text style={styles.statValue}>{examination.finished_students ?? 0}</Text>
                </Text>
                <Text style={styles.stat}>
                  Enrolled <Text style={styles.statValue}>{examination.enrolled_students ?? 0}</Text>
                </Text>
              </View>

              <View style={styles.actions}>
                {examination.status === 'scheduled' ? (
                  <PrimaryButton
                    label={busyId === examination.id ? 'Starting…' : 'Start Examination'}
                    icon="play-outline"
                    onPress={() => void changeStatus(examination, 'start')}
                    loading={busyId === examination.id}
                    style={{ flex: 1 }}
                  />
                ) : null}
                {examination.status === 'ongoing' ? (
                  <PrimaryButton
                    label={busyId === examination.id ? 'Ending…' : 'End Examination'}
                    icon="stop-outline"
                    variant="danger"
                    onPress={() => void changeStatus(examination, 'end')}
                    loading={busyId === examination.id}
                    style={{ flex: 1 }}
                  />
                ) : null}
                <PrimaryButton
                  label="Monitor"
                  icon="people-outline"
                  variant="outline"
                  onPress={() => router.push(`/examination/${examination.id}`)}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          ))
        )
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 21, fontWeight: '800', color: colors.ink, letterSpacing: -0.5 },
  subheading: { fontSize: 12, lineHeight: 18, color: colors.body },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },

  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: 9,
    ...shadow.card,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  title: { fontSize: 15, fontWeight: '800', color: colors.ink, letterSpacing: -0.2 },
  meta: { fontSize: 11.5, color: colors.bodySoft, marginTop: 3 },
  scheduleRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  schedule: { fontSize: 11, color: colors.muted },

  codeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: colors.tealSoft,
    borderWidth: 1,
    borderColor: '#d3e8e2',
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  codeText: { fontSize: 12, fontWeight: '800', letterSpacing: 1.6, color: colors.tealText },

  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    backgroundColor: colors.tableHead,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  stat: { fontSize: 10, color: colors.bodySoft },
  statValue: { fontWeight: '800', color: colors.ink },

  actions: { flexDirection: 'row', gap: 8, marginTop: 2 },
});
