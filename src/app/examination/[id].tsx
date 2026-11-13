import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/components/screen';
import {
  Avatar,
  EmptyState,
  ErrorBlock,
  IncidentBadge,
  LoadingBlock,
  Meta,
  Panel,
  PrimaryButton,
  StatusBadge,
} from '@/components/ui';
import { ApiError, apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { confirmAction } from '@/lib/confirm';
import { formatDateTime } from '@/lib/format';
import { useApi } from '@/lib/use-api';
import { colors, radius, shadow, spacing } from '@/theme';
import type { ActivityEvent, Examination, Incident, Participant } from '@/types';

type Payload = {
  examination: Examination;
  students: Participant[];
  activity: ActivityEvent[];
  incidents: Incident[];
};

export default function ExaminationDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token, user } = useAuth();
  const path = id ? `/proctor/examinations/${id}` : null;
  const { data, error, loading, reload } = useApi<Payload>(path);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const status = data?.examination.status;
  const examination = data?.examination;

  // Keep participant monitoring live while the session is running.
  useEffect(() => {
    if (status !== 'ongoing') return;

    const interval = setInterval(() => {
      void reload(true);
    }, 15_000);

    return () => clearInterval(interval);
  }, [status, reload]);

  const shareCode = async () => {
    if (!examination) return;

    try {
      await Share.share({
        message: `ProctorAide examination: ${examination.title} (${examination.subject} · ${examination.section}). Access code: ${examination.access_code}. Schedule: ${examination.schedule}.`,
      });
    } catch {
      // Share sheet dismissed.
    }
  };

  const changeStatus = async (action: 'start' | 'end') => {
    if (!examination || !token) return;

    const starting = action === 'start';

    const confirmed = await confirmAction(
      starting ? 'Start examination?' : 'End examination?',
      starting
        ? `Students can join "${examination.title}" with code ${examination.access_code}.`
        : `"${examination.title}" will be closed for joining and exam mode.`,
      starting ? 'Start' : 'End',
    );

    if (!confirmed) return;

    setBusy(true);
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
      setBusy(false);
    }
  };

  return (
    <AppScreen
      title="Examination"
      role={user?.role ?? 'proctor'}
      onBack={() => router.back()}
      headerRight={
        <Pressable
          onPress={shareCode}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Share access code"
          style={({ pressed }) => [styles.headerButton, pressed && { opacity: 0.7 }]}>
          <Ionicons name="share-outline" size={19} color="#ffffff" />
        </Pressable>
      }>
      {loading && !data ? <LoadingBlock label="Loading examination…" /> : null}
      {error ? <ErrorBlock message={error} onRetry={() => reload()} /> : null}
      {actionError ? <ErrorBlock message={actionError} /> : null}

      {data && examination ? (
        <>
          <View style={styles.hero}>
            <View style={styles.heroTop}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.heroTitle}>{examination.title}</Text>
                <Text style={styles.heroMeta}>
                  {examination.subject} · {examination.section}
                </Text>
              </View>
              <StatusBadge status={examination.status} compact />
            </View>

            <View style={styles.heroMetaRow}>
              <Meta icon="calendar-outline" text={examination.schedule} />
            </View>

            <Pressable
              onPress={shareCode}
              style={({ pressed }) => [styles.codePanel, pressed && { opacity: 0.75 }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.codeLabel}>ACCESS CODE</Text>
                <Text style={styles.codeValue}>{examination.access_code}</Text>
              </View>
              <Ionicons name="share-outline" size={18} color="#8fd6c7" />
            </Pressable>

            <View style={styles.heroStats}>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>{examination.joined_students ?? 0}</Text>
                <Text style={styles.heroStatLabel}>Joined</Text>
              </View>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>{examination.in_progress_students ?? 0}</Text>
                <Text style={styles.heroStatLabel}>In exam</Text>
              </View>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>{examination.finished_students ?? 0}</Text>
                <Text style={styles.heroStatLabel}>Finished</Text>
              </View>
            </View>

            {examination.status !== 'completed' ? (
              <PrimaryButton
                label={
                  busy
                    ? 'Updating…'
                    : examination.status === 'scheduled'
                      ? 'Start Examination'
                      : 'End Examination'
                }
                icon={examination.status === 'scheduled' ? 'play-outline' : 'stop-outline'}
                variant={examination.status === 'scheduled' ? 'primary' : 'danger'}
                onPress={() => void changeStatus(examination.status === 'scheduled' ? 'start' : 'end')}
                loading={busy}
              />
            ) : null}
          </View>

          <Panel
            title="Joined Students"
            description="Students who entered your access code."
            action={
              <Pressable onPress={() => reload(true)} hitSlop={10} accessibilityLabel="Refresh participants">
                <Ionicons name="refresh-outline" size={18} color={colors.tealText} />
              </Pressable>
            }>
            {data.students.length === 0 ? (
              <EmptyState
                icon="people-outline"
                title="No students have joined yet."
                description="Share the access code above. Students appear here as soon as they join."
              />
            ) : (
              data.students.map((student, index) => (
                <View
                  key={student.student_id}
                  style={[styles.studentRow, index !== data.students.length - 1 && styles.rowBorder]}>
                  <Avatar name={student.student_name} size={38} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.studentName}>{student.student_name}</Text>
                    <Text style={styles.studentMeta}>
                      {student.student_id_number ?? 'No student ID'} · Joined{' '}
                      {formatDateTime(student.joined_at)}
                    </Text>
                    {student.last_seen_at ? (
                      <Text style={styles.studentSeen}>
                        Last activity {formatDateTime(student.last_seen_at)}
                      </Text>
                    ) : null}
                  </View>
                  <SessionPill status={student.session_status} />
                </View>
              ))
            )}
          </Panel>

          <Panel title="Activity Log" description="Supported exam-mode events from student devices.">
            {data.activity.length === 0 ? (
              <EmptyState
                icon="pulse-outline"
                title="No activity yet."
                description="Events appear after a student starts exam mode on their phone."
              />
            ) : (
              data.activity.map((activity, index) => (
                <View
                  key={activity.id}
                  style={[styles.activityRow, index !== data.activity.length - 1 && styles.rowBorder]}>
                  <View style={styles.activityDot} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.activityTitle}>
                      {activity.student_name ?? 'Student'} · {activity.type_label}
                    </Text>
                    <Text style={styles.activityMeta}>
                      {formatDateTime(activity.occurred_at)}
                      {activity.detail ? ` · ${activity.detail}` : ''}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </Panel>

          {data.incidents.length > 0 ? (
            <Panel title="Incidents" description="Reports filed for this examination.">
              {data.incidents.map((incident, index) => (
                <View
                  key={incident.id}
                  style={[styles.incidentRow, index !== data.incidents.length - 1 && styles.rowBorder]}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.incidentTitle}>
                      {incident.student_name ?? 'General incident'}
                    </Text>
                    <Text style={styles.incidentBody}>{incident.description}</Text>
                    <Text style={styles.incidentMeta}>
                      Reported {formatDateTime(incident.reported_at)}
                    </Text>
                  </View>
                  <IncidentBadge status={incident.status} />
                </View>
              ))}
            </Panel>
          ) : null}
        </>
      ) : null}
    </AppScreen>
  );
}

function SessionPill({ status }: { status: Participant['session_status'] }) {
  const tone =
    status === 'completed'
      ? { bg: colors.greenSoft, border: colors.greenBorder, fg: colors.green, label: 'Finished' }
      : status === 'in_progress'
        ? { bg: colors.tealSoft, border: '#c4e6d5', fg: colors.tealText, label: 'In exam' }
        : { bg: '#f1f6f4', border: colors.border, fg: '#5f7b75', label: 'Joined' };

  return (
    <View style={[styles.sessionPill, { backgroundColor: tone.bg, borderColor: tone.border }]}>
      <Text style={[styles.sessionPillText, { color: tone.fg }]}>{tone.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },

  hero: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: 12,
    ...shadow.card,
  },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  heroTitle: { fontSize: 18, fontWeight: '800', color: colors.ink, letterSpacing: -0.4 },
  heroMeta: { fontSize: 12, color: colors.bodySoft, marginTop: 3 },
  heroMetaRow: { flexDirection: 'row', alignItems: 'center' },

  codePanel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.header,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
  },
  codeLabel: { fontSize: 8.5, fontWeight: '800', letterSpacing: 1.8, color: 'rgba(255,255,255,0.55)' },
  codeValue: { fontSize: 24, fontWeight: '800', letterSpacing: 5, color: '#ffffff', marginTop: 2 },

  heroStats: {
    flexDirection: 'row',
    backgroundColor: colors.tableHead,
    borderRadius: radius.md,
    paddingVertical: 10,
  },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatValue: { fontSize: 18, fontWeight: '800', color: colors.ink },
  heroStatLabel: { fontSize: 9.5, color: colors.bodySoft, marginTop: 1 },

  studentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: spacing.lg, paddingVertical: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
  studentName: { fontSize: 12.5, fontWeight: '700', color: colors.rowTitle },
  studentMeta: { fontSize: 10, color: colors.muted, marginTop: 2 },
  studentSeen: { fontSize: 9.5, color: colors.faint, marginTop: 1 },
  sessionPill: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 4 },
  sessionPillText: { fontSize: 9.5, fontWeight: '700' },

  activityRow: { flexDirection: 'row', gap: 9, paddingHorizontal: spacing.lg, paddingVertical: 12 },
  activityDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accent, marginTop: 5 },
  activityTitle: { fontSize: 11.5, fontWeight: '600', color: colors.inkSoft },
  activityMeta: { fontSize: 10, color: colors.muted, marginTop: 2 },

  incidentRow: { flexDirection: 'row', gap: 10, padding: spacing.lg, paddingVertical: 12 },
  incidentTitle: { fontSize: 12, fontWeight: '700', color: colors.ink },
  incidentBody: { fontSize: 11, lineHeight: 16, color: colors.body, marginTop: 2 },
  incidentMeta: { fontSize: 9.5, color: colors.faint, marginTop: 3 },
});
