import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/components/screen';
import {
  EmptyState,
  ErrorBlock,
  Field,
  LoadingBlock,
  Meta,
  Panel,
  PrimaryButton,
  StatusBadge,
} from '@/components/ui';
import { ApiError, apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useApi } from '@/lib/use-api';
import { colors, radius, shadow, spacing } from '@/theme';
import type { Examination, StudentDashboard } from '@/types';

type JoinResponse = { message: string; examination: Examination };

export default function JoinExamScreen() {
  const router = useRouter();
  const { token, user } = useAuth();
  const { data, error, loading, reload } = useApi<StudentDashboard>('/student/dashboard');
  const [code, setCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joined, setJoined] = useState<Examination | null>(null);

  const active = joined ?? data?.active_examination ?? null;

  const submit = async () => {
    if (joining) return;

    const accessCode = code.trim().toUpperCase();

    if (accessCode.length !== 6) {
      setJoinError('The access code must be exactly 6 letters or numbers.');
      return;
    }

    setJoining(true);
    setJoinError(null);

    try {
      const payload = await apiRequest<JoinResponse>('/student/examinations/join', {
        method: 'POST',
        token,
        body: { access_code: accessCode },
      });

      setJoined(payload.examination);
      setCode('');
      await reload(true);
    } catch (requestError) {
      const message =
        requestError instanceof ApiError
          ? requestError.errors?.access_code?.[0] ?? requestError.message
          : 'Unable to join the examination.';
      setJoinError(message);
    } finally {
      setJoining(false);
    }
  };

  return (
    <AppScreen title="Join Examination" role={user?.role ?? 'student'}>
      {loading && !data ? <LoadingBlock /> : null}
      {error ? <ErrorBlock message={error} onRetry={() => reload()} /> : null}

      <Panel>
        <View style={styles.intro}>
          <View style={styles.introIcon}>
            <Ionicons name="key-outline" size={22} color={colors.tealText} />
          </View>
          <Text style={styles.introTitle}>Enter your access code</Text>
          <Text style={styles.introText}>
            Ask your proctor for the 6-character examination code, then enter it below to join the
            ongoing session.
          </Text>
        </View>

        <View style={styles.form}>
          <Field
            value={code}
            onChangeText={(value) => {
              setCode(value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6));
              if (joinError) setJoinError(null);
            }}
            placeholder="ABC123"
            maxLength={6}
            autoCapitalize="characters"
            autoFocus
            error={joinError}
            inputStyle={styles.codeInput}
          />

          <PrimaryButton
            label={joining ? 'Joining…' : 'Join Examination'}
            icon="enter-outline"
            onPress={submit}
            loading={joining}
            disabled={code.length !== 6}
          />
        </View>

        <View style={styles.note}>
          <Ionicons name="information-circle-outline" size={15} color={colors.bodySoft} />
          <Text style={styles.noteText}>
            Joining records your entry. Your proctor still confirms physical attendance, and only an
            ongoing examination can be joined.
          </Text>
        </View>
      </Panel>

      {active ? (
        <Panel title={joined ? 'Joined successfully' : 'Your active examination'}>
          <View style={styles.active}>
            <View style={styles.activeTop}>
              <Text style={styles.activeTitle}>{active.title}</Text>
              <StatusBadge status={active.status} compact />
            </View>
            <Text style={styles.activeMeta}>
              {[active.subject, active.section].filter(Boolean).join(' · ')}
            </Text>
            <Meta icon="calendar-outline" text={active.schedule} />

            {active.joined ? (
              <>
                <View style={styles.successBanner}>
                  <Ionicons name="checkmark-circle" size={18} color={colors.green} />
                  <Text style={styles.successText}>
                    {joined
                      ? 'Successfully joined the examination!'
                      : 'You have already joined this examination.'}
                  </Text>
                </View>
                <PrimaryButton
                  label={
                    active.session?.status === 'in_progress'
                      ? 'Open Exam Mode'
                      : active.session?.status === 'completed'
                        ? 'View Summary'
                        : 'Enter Exam Mode'
                  }
                  icon="play-forward-outline"
                  onPress={() => router.push(`/exam/${active.id}`)}
                />
              </>
            ) : (
              <Text style={styles.hint}>Use the access code above to join this session.</Text>
            )}
          </View>
        </Panel>
      ) : data ? (
        <Panel>
          <EmptyState
            icon="hourglass-outline"
            title="No examination is open right now."
            description="When your proctor starts your examination, it will appear here and you can join with the access code."
          />
        </Panel>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  intro: { alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, gap: 4 },
  introIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  introTitle: { fontSize: 17, fontWeight: '800', color: colors.ink },
  introText: { fontSize: 11.5, lineHeight: 18, color: colors.body, textAlign: 'center' },
  form: { padding: spacing.lg, gap: 12 },
  codeInput: {
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 8,
    color: colors.ink,
    paddingVertical: 12,
  },
  note: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    backgroundColor: '#f7faf9',
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    padding: spacing.lg,
  },
  noteText: { flex: 1, fontSize: 10.5, lineHeight: 16, color: colors.bodySoft },

  active: { padding: spacing.lg, gap: 8 },
  activeTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  activeTitle: { flex: 1, fontSize: 16, fontWeight: '800', color: colors.ink },
  activeMeta: { fontSize: 12, color: colors.bodySoft },
  successBanner: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: '#f0faf4',
    borderWidth: 1,
    borderColor: '#c9e6d6',
    borderRadius: radius.md,
    padding: 11,
    marginTop: 4,
  },
  successText: { flex: 1, fontSize: 11.5, fontWeight: '600', color: '#1d5c42' },
  hint: { fontSize: 11, color: colors.muted, marginTop: 4 },
});
