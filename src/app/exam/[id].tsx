import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  AppState,
  BackHandler,
  StyleSheet,
  Text,
  View,
  type AppStateStatus,
} from 'react-native';

import { AppScreen } from '@/components/screen';
import {
  ErrorBlock,
  LoadingBlock,
  Meta,
  Panel,
  PrimaryButton,
  StatusBadge,
} from '@/components/ui';
import { ApiError, apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { confirmAction } from '@/lib/confirm';
import { elapsedLabel, formatDateTime } from '@/lib/format';
import { useApi } from '@/lib/use-api';
import { colors, radius, spacing } from '@/theme';
import type { ActivityEvent, Examination } from '@/types';

type ExamPayload = { examination: Examination; activities: ActivityEvent[] };
type SessionResponse = { message: string; session: ExamPayload['examination']['session'] };

const eventLabels: Record<string, string> = {
  exam_started: 'Started examination',
  exam_finished: 'Finished examination',
  app_background: 'App moved to background',
  app_foreground: 'Returned to app',
  exit_attempt: 'Attempted to leave exam mode',
  device_check: 'Device readiness check',
};

export default function ExamModeScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token, user } = useAuth();
  const path = id ? `/student/examinations/${id}` : null;
  const { data, error, loading, reload } = useApi<ExamPayload>(path);

  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [localEvents, setLocalEvents] = useState<ActivityEvent[]>([]);
  const [now, setNow] = useState(Date.now());

  const examination = data?.examination;
  const session = examination?.session ?? null;
  const inProgress = session?.status === 'in_progress';
  const completed = session?.status === 'completed';
  const joined = examination?.joined === true;

  const appState = useRef<AppStateStatus>('active');
  const inProgressRef = useRef(inProgress);
  inProgressRef.current = inProgress;

  const sendActivity = useCallback(
    async (type: string, detail: string) => {
      if (!token || !id) return;

      try {
        const payload = await apiRequest<{ event: ActivityEvent }>(
          `/student/examinations/${id}/activity`,
          { method: 'POST', token, body: { type, detail } },
        );

        setLocalEvents((previous) => [
          {
            ...payload.event,
            type_label: eventLabels[payload.event.type] ?? payload.event.type,
          },
          ...previous,
        ]);
      } catch {
        // Monitoring events are best-effort; they must never interrupt the exam.
      }
    },
    [id, token],
  );

  // Record the only app-level events Expo can observe reliably.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      const previous = appState.current;
      appState.current = next;

      if (!inProgressRef.current) return;

      const leftForeground = previous === 'active' && next !== 'active';
      const returned = previous !== 'active' && next === 'active';

      if (leftForeground) {
        void sendActivity('app_background', 'App left the foreground during the examination.');
      } else if (returned) {
        void sendActivity('app_foreground', 'Student returned to the app during the examination.');
      }
    });

    return () => subscription.remove();
  }, [sendActivity]);

  useEffect(() => {
    if (!inProgress) return;

    const interval = setInterval(() => setNow(Date.now()), 1000);

    return () => clearInterval(interval);
  }, [inProgress]);

  useEffect(() => {
    if (!inProgress) return;

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      void sendActivity('exit_attempt', 'Pressed the hardware back button during exam mode.');
      Alert.alert('Exam in progress', 'Finish the examination before leaving exam mode.');
      return true;
    });

    return () => subscription.remove();
  }, [inProgress, sendActivity]);

  const goBack = () => {
    if (inProgress) {
      void sendActivity('exit_attempt', 'Tried to close exam mode before finishing.');
      Alert.alert('Exam in progress', 'Finish the examination before leaving exam mode.');
      return;
    }

    router.back();
  };

  const startExam = async () => {
    if (!token || !id || busy) return;

    setBusy(true);
    setActionError(null);

    try {
      const payload = await apiRequest<SessionResponse>(`/student/examinations/${id}/start`, {
        method: 'POST',
        token,
      });
      setNotice(payload.message);
      await reload(true);
    } catch (requestError) {
      setActionError(requestError instanceof ApiError ? requestError.message : 'Unable to start the examination.');
    } finally {
      setBusy(false);
    }
  };

  const finishExam = async () => {
    const confirmed = await confirmAction(
      'Finish examination?',
      'Your proctor will see that you have finished. This cannot be undone.',
      'Finish',
    );

    if (!confirmed || !token || !id) return;

    setBusy(true);
    setActionError(null);

    try {
      const payload = await apiRequest<SessionResponse>(`/student/examinations/${id}/finish`, {
        method: 'POST',
        token,
      });
      setNotice(payload.message);
      await reload(true);
    } catch (requestError) {
      setActionError(
        requestError instanceof ApiError ? requestError.message : 'Unable to finish the examination.',
      );
    } finally {
      setBusy(false);
    }
  };

  const events = useMemo(() => {
    const combined = [...localEvents, ...(data?.activities ?? [])];

    return combined.filter((event, index) => combined.findIndex((row) => row.id === event.id) === index);
  }, [localEvents, data?.activities]);

  return (
    <AppScreen
      title="Exam Mode"
      role={user?.role ?? 'student'}
      onBack={goBack}
      headerRight={
        inProgress ? (
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>MONITORING</Text>
          </View>
        ) : undefined
      }>
      {loading && !data ? <LoadingBlock label="Opening examination…" /> : null}
      {error ? <ErrorBlock message={error} onRetry={() => reload()} /> : null}

      {examination ? (
        <>
          {inProgress ? (
            <View style={styles.timerCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.timerEyebrow}>EXAMINATION IN PROGRESS</Text>
                <Text style={styles.timerValue}>{elapsedLabel(session?.started_at, now)}</Text>
                <Text style={styles.timerHint}>Elapsed since you started</Text>
              </View>
              <View style={styles.timerIcon}>
                <Ionicons name="shield-checkmark" size={24} color={colors.accentSoft} />
              </View>
            </View>
          ) : null}

          {notice ? (
            <View style={styles.noticeBanner}>
              <Ionicons name="checkmark-circle" size={17} color={colors.green} />
              <Text style={styles.noticeText}>{notice}</Text>
            </View>
          ) : null}
          {actionError ? <ErrorBlock message={actionError} /> : null}

          <Panel title="Examination Details">
            <View style={styles.details}>
              <View style={styles.detailsTop}>
                <Text style={styles.title}>{examination.title}</Text>
                <StatusBadge status={examination.status} compact />
              </View>
              <Text style={styles.metaLine}>
                {[examination.subject, examination.section].filter(Boolean).join(' · ')}
              </Text>
              <Meta icon="calendar-outline" text={examination.schedule} />
              <Meta icon="key-outline" text={`Access code ${examination.access_code}`} />
              {joined ? <Meta icon="checkmark-circle-outline" text="You have joined this examination." /> : null}
            </View>
          </Panel>

          {!joined ? (
            <Panel title="Join required">
              <View style={styles.actionArea}>
                <Text style={styles.bodyText}>
                  Enter the access code provided by your proctor to join this examination before you can
                  enter exam mode.
                </Text>
                <PrimaryButton
                  label="Join with access code"
                  icon="key-outline"
                  onPress={() => router.push('/student/join')}
                />
              </View>
            </Panel>
          ) : !session ? (
            <Panel title="Before you start">
              <View style={styles.actionArea}>
                <View style={styles.bullet}>
                  <Ionicons name="wifi-outline" size={16} color={colors.tealText} />
                  <Text style={styles.bulletText}>Make sure your device is charged and connected.</Text>
                </View>
                <View style={styles.bullet}>
                  <Ionicons name="notifications-off-outline" size={16} color={colors.tealText} />
                  <Text style={styles.bulletText}>Close other apps and silence notifications.</Text>
                </View>
                <View style={styles.bullet}>
                  <Ionicons name="eye-outline" size={16} color={colors.tealText} />
                  <Text style={styles.bulletText}>
                    ProctorAide records when the app leaves the foreground, when you return, and when you
                    start or finish.
                  </Text>
                </View>
                <PrimaryButton
                  label={busy ? 'Starting…' : 'Start Examination'}
                  icon="play-outline"
                  onPress={startExam}
                  loading={busy}
                  disabled={examination.status !== 'ongoing'}
                />
                {examination.status !== 'ongoing' ? (
                  <Text style={styles.hint}>Your proctor has not started this examination yet.</Text>
                ) : null}
              </View>
            </Panel>
          ) : (
            <Panel title="Monitoring Activity" description="Supported events reported from this device.">
              <View style={{ padding: spacing.lg, gap: 10 }}>
                <View style={styles.sessionRow}>
                  <Text style={styles.sessionLabel}>
                    {completed ? 'Finished' : 'Started'} {formatDateTime(session.started_at)}
                  </Text>
                  {completed ? <Text style={styles.sessionDone}>Completed</Text> : null}
                </View>

                {events.length === 0 ? (
                  <Text style={styles.hint}>No events recorded yet.</Text>
                ) : (
                  events.slice(0, 10).map((event) => (
                    <View key={event.id} style={styles.eventRow}>
                      <View style={styles.eventDot} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.eventLabel}>
                          {eventLabels[event.type] ?? event.type_label}
                        </Text>
                        <Text style={styles.eventTime}>{formatDateTime(event.occurred_at)}</Text>
                      </View>
                    </View>
                  ))
                )}

                {inProgress ? (
                  <PrimaryButton
                    label={busy ? 'Finishing…' : 'Finish Examination'}
                    icon="checkmark-done-outline"
                    variant="danger"
                    onPress={() => void finishExam()}
                    loading={busy}
                    style={{ marginTop: 6 }}
                  />
                ) : null}
              </View>
            </Panel>
          )}

          <View style={styles.disclaimer}>
            <Ionicons name="information-circle-outline" size={15} color={colors.muted} />
            <Text style={styles.disclaimerText}>
              Expo cannot block other Android applications or monitor activity outside ProctorAide. Only
              the events listed here are recorded, and they are shared with your proctor.
            </Text>
          </View>
        </>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(143,214,199,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(143,214,199,0.4)',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accentSoft },
  liveText: { fontSize: 8.5, fontWeight: '800', letterSpacing: 1, color: colors.accentSoft },

  timerCard: {
    backgroundColor: colors.header,
    borderRadius: radius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timerEyebrow: { fontSize: 8.5, fontWeight: '800', letterSpacing: 1.8, color: colors.accentSoft },
  timerValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 1,
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  timerHint: { fontSize: 10.5, color: 'rgba(255,255,255,0.55)' },
  timerIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  noticeBanner: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: '#f0faf4',
    borderWidth: 1,
    borderColor: '#c9e6d6',
    borderRadius: radius.md,
    padding: 11,
  },
  noticeText: { flex: 1, fontSize: 11.5, fontWeight: '600', color: '#1d5c42' },

  details: { padding: spacing.lg, gap: 6 },
  detailsTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { flex: 1, fontSize: 17, fontWeight: '800', color: colors.ink },
  metaLine: { fontSize: 12, color: colors.bodySoft, marginBottom: 2 },

  actionArea: { padding: spacing.lg, gap: 10 },
  bodyText: { fontSize: 12, lineHeight: 18, color: colors.body },
  bullet: { flexDirection: 'row', gap: 9, alignItems: 'flex-start' },
  bulletText: { flex: 1, fontSize: 11.5, lineHeight: 17, color: colors.bodySoft },
  hint: { fontSize: 10.5, color: colors.muted },

  sessionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  sessionLabel: { fontSize: 11, color: colors.bodySoft },
  sessionDone: { fontSize: 10, fontWeight: '800', color: colors.green },
  eventRow: { flexDirection: 'row', gap: 9, alignItems: 'flex-start' },
  eventDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent, marginTop: 5 },
  eventLabel: { fontSize: 11.5, fontWeight: '600', color: colors.inkSoft },
  eventTime: { fontSize: 10, color: colors.muted, marginTop: 1 },

  disclaimer: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', paddingHorizontal: 4 },
  disclaimerText: { flex: 1, fontSize: 10, lineHeight: 15.5, color: colors.muted },
});
