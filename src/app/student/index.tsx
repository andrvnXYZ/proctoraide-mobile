import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/components/screen';
import {
  EmptyState,
  ErrorBlock,
  LoadingBlock,
  Meta,
  Panel,
  PrimaryButton,
  StatCard,
  StatusBadge,
} from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { firstName, greeting, todayLabel } from '@/lib/format';
import { useApi } from '@/lib/use-api';
import { colors, radius, shadow, spacing } from '@/theme';
import type { Examination, StudentDashboard } from '@/types';

export default function StudentDashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { data, error, loading, reload } = useApi<StudentDashboard>('/student/dashboard');
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    await reload(true);
    setRefreshing(false);
  };

  const active = data?.active_examination ?? null;
  const activeLabel = !active
    ? null
    : !active.joined
      ? 'Join Examination'
      : active.session?.status === 'in_progress'
        ? 'Open Exam Mode'
        : active.session?.status === 'completed'
          ? 'View Summary'
          : 'Enter Exam Mode';

  const openActive = () => {
    if (!active) return;

    if (active.joined) {
      router.push(`/exam/${active.id}`);
    } else {
      router.push('/student/join');
    }
  };

  return (
    <AppScreen
      title="Dashboard"
      role={user?.role ?? 'student'}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.teal} />
      }>
      <View style={{ gap: 6 }}>
        <Text style={styles.dateLabel}>{todayLabel()}</Text>
        <Text style={styles.heading}>
          {greeting()}, {firstName(data?.user ?? user)}!
        </Text>
        <Text style={styles.subheading}>
          Please check your upcoming examinations and make sure your device is ready before every
          session.
        </Text>
      </View>

      {loading && !data ? <LoadingBlock label="Loading your examinations…" /> : null}
      {error ? <ErrorBlock message={error} onRetry={() => reload()} /> : null}

      {data ? (
        <>
          <View style={styles.actionRow}>
            <PrimaryButton
              label="Join Examination"
              icon="play-circle-outline"
              onPress={() => router.push('/student/join')}
            />
            <PrimaryButton
              label="View Examination History"
              icon="time-outline"
              variant="outline"
              onPress={() => router.push('/student/history')}
            />
          </View>

          <View style={styles.statRow}>
            <StatCard
              icon="calendar-outline"
              value={String(data.stats.upcoming)}
              label="Upcoming exams"
            />
            <StatCard
              icon="hourglass-outline"
              value={data.stats.active > 0 ? '1' : 'None'}
              label="Active now"
            />
            <StatCard
              icon="checkmark-circle-outline"
              value={String(data.stats.completed)}
              label="Completed"
            />
          </View>

          <View style={styles.activeCard}>
            <View style={styles.activeStripe} />
            <View style={styles.activeBody}>
              <View style={styles.activeTopRow}>
                <Text style={styles.activeEyebrow}>ACTIVE EXAMINATION</Text>
                {active ? (
                  <StatusBadge status={active.status} compact />
                ) : (
                  <View style={styles.nonePill}>
                    <Text style={styles.nonePillText}>None in progress</Text>
                  </View>
                )}
              </View>

              <Text style={styles.activeTitle}>
                {active?.title ?? 'No examination in progress'}
              </Text>
              <Text style={styles.activeText}>
                {active
                  ? [active.subject, active.section, active.schedule].filter(Boolean).join(' · ')
                  : 'When your proctor opens an examination, it will appear here with a join button.'}
              </Text>

              {active?.joined ? (
                <Meta
                  icon="checkmark-circle-outline"
                  text={
                    active.session?.status === 'in_progress'
                      ? 'You are inside exam mode.'
                      : active.session?.status === 'completed'
                        ? 'You have finished this examination.'
                        : 'Access confirmed — enter exam mode when ready.'
                  }
                />
              ) : active ? (
                <Meta icon="key-outline" text="Enter the access code from your proctor to join." />
              ) : null}

              <View style={{ marginTop: 12 }}>
                {active ? (
                  <PrimaryButton label={activeLabel ?? 'Open'} icon="arrow-forward" onPress={openActive} />
                ) : (
                  <View style={styles.waitingPill}>
                    <Ionicons name="time-outline" size={15} color="#7b8f8a" />
                    <Text style={styles.waitingText}>Waiting for the next session</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          <Panel
            title="Upcoming Examinations"
            description="Your scheduled examination sessions."
            action={
              <View style={styles.countPill}>
                <Text style={styles.countPillText}>{data.upcoming.length} scheduled</Text>
              </View>
            }>
            {data.upcoming.length === 0 ? (
              <EmptyState
                icon="clipboard-outline"
                title="No examinations scheduled yet."
                description="Records will appear here when your proctor assigns an examination to your section."
              />
            ) : (
              data.upcoming.map((examination, index) => (
                <ExamRow
                  key={examination.id}
                  examination={examination}
                  last={index === data.upcoming.length - 1}
                  onPress={() => router.push(`/exam/${examination.id}`)}
                />
              ))
            )}
          </Panel>

          <Panel
            title="Examination History"
            description="Completed and joined examination sessions."
            action={
              <View style={styles.countPill}>
                <Text style={styles.countPillText}>{data.history.length} records</Text>
              </View>
            }>
            {data.history.length === 0 ? (
              <EmptyState
                icon="time-outline"
                title="No examination records yet."
                description="Once you join an examination, it will be listed here for review."
              />
            ) : (
              data.history.slice(0, 5).map((examination, index) => (
                <ExamRow
                  key={examination.id}
                  examination={examination}
                  last={index === Math.min(data.history.length, 5) - 1}
                  onPress={() => router.push(`/exam/${examination.id}`)}
                  showSession
                />
              ))
            )}
          </Panel>
        </>
      ) : null}
    </AppScreen>
  );
}

function ExamRow({
  examination,
  last,
  onPress,
  showSession,
}: {
  examination: Examination;
  last: boolean;
  onPress: () => void;
  showSession?: boolean;
}) {
  const sessionLabel =
    examination.session?.status === 'completed'
      ? 'Finished'
      : examination.session?.status === 'in_progress'
        ? 'In exam mode'
        : examination.joined
          ? 'Joined'
          : null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.examRow,
        !last && styles.examRowBorder,
        pressed && { backgroundColor: '#fafcfb' },
      ]}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.examTitle} numberOfLines={2}>
          {examination.title}
        </Text>
        <Text style={styles.examMeta} numberOfLines={1}>
          {[examination.subject, examination.section].filter(Boolean).join(' · ')}
        </Text>
        <Text style={styles.examSchedule} numberOfLines={1}>
          {examination.schedule}
        </Text>
        {showSession && sessionLabel ? (
          <Text style={styles.sessionNote}>{sessionLabel}</Text>
        ) : null}
      </View>
      <View style={styles.examRight}>
        <StatusBadge status={examination.status} compact />
        <Ionicons name="chevron-forward" size={16} color="#c3cfcb" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  dateLabel: { fontSize: 9.5, fontWeight: '700', letterSpacing: 2.2, color: '#2a7b6d' },
  heading: { fontSize: 27, fontWeight: '800', letterSpacing: -1, color: colors.ink, lineHeight: 32 },
  subheading: { fontSize: 12.5, lineHeight: 19, color: colors.body, marginTop: 2 },

  actionRow: { gap: 10 },
  statRow: { flexDirection: 'row', gap: 9 },

  activeCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#d8e7e2',
    overflow: 'hidden',
    ...shadow.card,
  },
  activeStripe: { width: 4, backgroundColor: colors.accent },
  activeBody: { flex: 1, padding: spacing.lg, gap: 4 },
  activeTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  activeEyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 1.8, color: '#2a7b6d' },
  nonePill: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#e4ece9',
    backgroundColor: '#f7faf9',
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  nonePillText: { fontSize: 9.5, fontWeight: '700', color: '#8a9b97' },
  activeTitle: { fontSize: 17, fontWeight: '800', color: colors.ink, marginTop: 3, letterSpacing: -0.3 },
  activeText: { fontSize: 11.5, lineHeight: 17, color: colors.body, marginBottom: 4 },
  waitingPill: {
    minHeight: 42,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#dbe7e3',
    backgroundColor: '#f7faf9',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  waitingText: { fontSize: 12, fontWeight: '600', color: '#7b8f8a' },

  countPill: { backgroundColor: '#f1f6f4', borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 4 },
  countPillText: { fontSize: 10, fontWeight: '700', color: '#5f7b75' },

  examRow: { flexDirection: 'row', gap: 10, paddingHorizontal: spacing.lg, paddingVertical: 14 },
  examRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
  examTitle: { fontSize: 13.5, fontWeight: '700', color: colors.rowTitle },
  examMeta: { fontSize: 11, color: colors.bodySoft, marginTop: 3 },
  examSchedule: { fontSize: 11, color: colors.muted, marginTop: 2 },
  sessionNote: { fontSize: 10.5, fontWeight: '700', color: colors.tealText, marginTop: 4 },
  examRight: { alignItems: 'flex-end', gap: 8, justifyContent: 'space-between' },
});
