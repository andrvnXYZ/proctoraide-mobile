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
  StatPill,
  StatusBadge,
} from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { firstName, formatDateTime, greeting } from '@/lib/format';
import { useApi } from '@/lib/use-api';
import { colors, radius, shadow, spacing } from '@/theme';
import type { ActivityEvent, Examination, ProctorDashboard } from '@/types';

export default function ProctorDashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { data, error, loading, reload } = useApi<ProctorDashboard>('/proctor/dashboard');
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    await reload(true);
    setRefreshing(false);
  };

  return (
    <AppScreen
      title="Dashboard"
      role={user?.role ?? 'proctor'}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.teal} />
      }>
      <View style={{ gap: 4 }}>
        <Text style={styles.heading}>
          {greeting()}, {firstName(data?.user ?? user)}!
        </Text>
        <Text style={styles.subheading}>Here&apos;s what&apos;s happening with your examinations.</Text>
      </View>

      {loading && !data ? <LoadingBlock label="Loading your dashboard…" /> : null}
      {error ? <ErrorBlock message={error} onRetry={() => reload()} /> : null}

      {data ? (
        <>
          <View style={styles.pillRow}>
            <StatPill label="Active exams" value={data.stats.active_examinations} tone="teal" />
            <StatPill label="Incidents" value={data.stats.reported_incidents} tone="red" />
            <StatPill label="Students" value={data.stats.active_students} tone="green" />
          </View>

          <View style={styles.pendingRow}>
            <View style={styles.pendingText}>
              <View style={[styles.pendingDot, { backgroundColor: data.stats.pending_incidents > 0 ? colors.amberDot : colors.greenDot }]} />
              <Text style={styles.pendingLabel}>
                {data.stats.pending_incidents > 0
                  ? `${data.stats.pending_incidents} incident ${
                      data.stats.pending_incidents === 1 ? 'report is' : 'reports are'
                    } awaiting review.`
                  : 'No incident reports are awaiting review.'}
              </Text>
            </View>
          </View>

          <PrimaryButton
            label="Create Examination"
            icon="add"
            onPress={() => router.push('/create-examination')}
          />

          <Panel
            title="Upcoming Examinations"
            description="Sessions that are scheduled or currently running."
            action={
              <Pressable onPress={() => router.push('/proctor/examinations')} hitSlop={8}>
                <Text style={styles.link}>View all</Text>
              </Pressable>
            }>
            {data.upcoming_examinations.length === 0 ? (
              <EmptyState
                icon="clipboard-outline"
                title={data.total_examinations === 0 ? 'No examinations yet.' : 'Nothing scheduled right now.'}
                description="Create an examination session to generate an access code and start monitoring participants."
                action={
                  <PrimaryButton
                    label="Create Examination"
                    icon="add"
                    onPress={() => router.push('/create-examination')}
                  />
                }
              />
            ) : (
              data.upcoming_examinations.map((examination, index) => (
                <Pressable
                  key={examination.id}
                  onPress={() => router.push(`/examination/${examination.id}`)}
                  style={({ pressed }) => [
                    styles.examRow,
                    index !== data.upcoming_examinations.length - 1 && styles.examRowBorder,
                    pressed && { backgroundColor: '#fafcfb' },
                  ]}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.examTitle}>{examination.title}</Text>
                    <Text style={styles.examMeta}>
                      {examination.subject} · {examination.section}
                    </Text>
                    <Meta icon="calendar-outline" text={examination.schedule} />
                    <View style={styles.codeRow}>
                      <Ionicons name="key-outline" size={11} color={colors.tealText} />
                      <Text style={styles.code}>{examination.access_code}</Text>
                    </View>
                  </View>
                  <View style={styles.examRight}>
                    <StatusBadge status={examination.status} compact />
                    <Ionicons name="chevron-forward" size={16} color="#c3cfcb" />
                  </View>
                </Pressable>
              ))
            )}
          </Panel>

          {data.recent_activity.length > 0 ? (
            <Panel
              title="Recent Student Activity"
              description="The latest supported events from exam mode."
              action={
                <Pressable onPress={() => router.push('/proctor/alerts')} hitSlop={8}>
                  <Text style={styles.link}>All alerts</Text>
                </Pressable>
              }>
              {data.recent_activity.slice(0, 5).map((activity, index) => (
                <ActivityRow
                  key={activity.id}
                  activity={activity}
                  last={index === Math.min(data.recent_activity.length, 5) - 1}
                />
              ))}
            </Panel>
          ) : null}
        </>
      ) : null}
    </AppScreen>
  );
}

function ActivityRow({ activity, last }: { activity: ActivityEvent; last: boolean }) {
  return (
    <View style={[styles.activityRow, !last && styles.examRowBorder]}>
      <View style={styles.activityDot} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.activityTitle}>
          {activity.student_name ?? 'Student'} · {activity.type_label}
        </Text>
        <Text style={styles.activityMeta} numberOfLines={1}>
          {[activity.examination_title, formatDateTime(activity.occurred_at)].filter(Boolean).join(' · ')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 23, fontWeight: '800', letterSpacing: -0.7, color: colors.ink },
  subheading: { fontSize: 12.5, color: colors.body },
  pillRow: { flexDirection: 'row', gap: 8 },
  pendingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: -4 },
  pendingText: { flexDirection: 'row', alignItems: 'center', gap: 7, flex: 1 },
  pendingDot: { width: 6, height: 6, borderRadius: 3 },
  pendingLabel: { fontSize: 11, color: colors.muted, flex: 1 },

  link: { fontSize: 11, fontWeight: '700', color: colors.tealText },

  examRow: { flexDirection: 'row', gap: 10, paddingHorizontal: spacing.lg, paddingVertical: 14 },
  examRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
  examTitle: { fontSize: 13.5, fontWeight: '700', color: colors.rowTitle },
  examMeta: { fontSize: 11, color: colors.bodySoft, marginTop: 3, marginBottom: 4 },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  code: { fontSize: 10.5, fontWeight: '800', letterSpacing: 1.2, color: colors.tealText },
  examRight: { alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 },

  activityRow: { flexDirection: 'row', gap: 9, paddingHorizontal: spacing.lg, paddingVertical: 12 },
  activityDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.accent,
    marginTop: 5,
  },
  activityTitle: { fontSize: 11.5, fontWeight: '600', color: colors.inkSoft },
  activityMeta: { fontSize: 10, color: colors.muted, marginTop: 2 },
});
