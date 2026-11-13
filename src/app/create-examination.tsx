import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/components/screen';
import { ErrorBlock, Field, Panel, PrimaryButton } from '@/components/ui';
import { ApiError, apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { todayIso } from '@/lib/format';
import { useApi } from '@/lib/use-api';
import { colors, radius, spacing } from '@/theme';
import type { AssignmentPair, Examination } from '@/types';

type ExamsPayload = { examinations: Examination[]; assignments: AssignmentPair[] };
type CreateResponse = { message: string; examination: Examination };

export default function CreateExaminationScreen() {
  const router = useRouter();
  const { token, user } = useAuth();
  const { data } = useApi<ExamsPayload>('/proctor/examinations');

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [section, setSection] = useState('');
  const [date, setDate] = useState(todayIso());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const assignments = data?.assignments ?? [];

  const submit = async () => {
    if (saving) return;

    const errors: Record<string, string[]> = {};

    if (title.trim().length < 3) errors.title = ['Enter an examination title (at least 3 characters).'];
    if (subject.trim().length < 2) errors.subject = ['Enter the course or subject.'];
    if (section.trim().length < 1) errors.section = ['Enter the section that will take this examination.'];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) errors.scheduled_date = ['Use the date format YYYY-MM-DD.'];
    if (!/^\d{2}:\d{2}$/.test(startTime)) errors.start_time = ['Use the time format HH:MM.'];
    if (!/^\d{2}:\d{2}$/.test(endTime)) errors.end_time = ['Use the time format HH:MM.'];

    if (Object.keys(errors).length === 0 && endTime <= startTime) {
      errors.end_time = ['The end time must be later than the start time.'];
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError(null);
      return;
    }

    setSaving(true);
    setError(null);
    setFieldErrors({});

    try {
      const payload = await apiRequest<CreateResponse>('/proctor/examinations', {
        method: 'POST',
        token,
        body: {
          title: title.trim(),
          subject: subject.trim(),
          section: section.trim(),
          scheduled_date: date,
          start_time: startTime,
          end_time: endTime,
        },
      });

      router.replace(`/examination/${payload.examination.id}`);
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setError(requestError.message);
        if (requestError.errors) setFieldErrors(requestError.errors);
      } else {
        setError('Unable to create the examination.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppScreen title="Create Examination" role={user?.role ?? 'proctor'} onBack={() => router.back()}>
      <View style={{ gap: 4 }}>
        <Text style={styles.heading}>New examination session</Text>
        <Text style={styles.subheading}>
          A unique 6-character access code is generated automatically when you save.
        </Text>
      </View>

      {error ? <ErrorBlock message={error} /> : null}

      <Panel title="Examination details">
        <View style={styles.form}>
          <Field
            label="Examination title"
            value={title}
            onChangeText={setTitle}
            placeholder="Midterm Examination"
            maxLength={120}
            error={fieldErrors.title?.[0]}
          />

          {assignments.length > 0 ? (
            <View style={{ gap: 6 }}>
              <Text style={styles.suggestionLabel}>Your subject & section assignments</Text>
              <View style={styles.chipRow}>
                {assignments.map((assignment) => (
                  <Pressable
                    key={`${assignment.subject}|${assignment.section}`}
                    onPress={() => {
                      setSubject(assignment.subject);
                      setSection(assignment.section);
                    }}
                    style={({ pressed }) => [styles.chip, pressed && { opacity: 0.7 }]}>
                    <Text style={styles.chipText}>
                      {assignment.subject} · {assignment.section}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          <Field
            label="Course or subject"
            value={subject}
            onChangeText={setSubject}
            placeholder="Networking 2"
            maxLength={120}
            error={fieldErrors.subject?.[0]}
          />

          <Field
            label="Section"
            value={section}
            onChangeText={setSection}
            placeholder="BSIT-3A"
            maxLength={80}
            error={fieldErrors.section?.[0]}
          />

          <Field
            label="Examination date"
            value={date}
            onChangeText={setDate}
            placeholder="2026-11-13"
            keyboardType="numbers-and-punctuation"
            maxLength={10}
            error={fieldErrors.scheduled_date?.[0]}
          />

          <View style={styles.timeRow}>
            <Field
              label="Start time"
              value={startTime}
              onChangeText={setStartTime}
              placeholder="13:00"
              keyboardType="numbers-and-punctuation"
              maxLength={5}
              style={{ flex: 1 }}
              error={fieldErrors.start_time?.[0]}
            />
            <Field
              label="End time"
              value={endTime}
              onChangeText={setEndTime}
              placeholder="14:00"
              keyboardType="numbers-and-punctuation"
              maxLength={5}
              style={{ flex: 1 }}
              error={fieldErrors.end_time?.[0]}
            />
          </View>

          <Text style={styles.hint}>
            Times use the 24-hour format (HH:MM). Students can join once you start the session.
          </Text>

          <PrimaryButton
            label={saving ? 'Creating…' : 'Create Examination'}
            icon="add"
            onPress={submit}
            loading={saving}
          />
        </View>
      </Panel>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 21, fontWeight: '800', color: colors.ink, letterSpacing: -0.5 },
  subheading: { fontSize: 12, lineHeight: 18, color: colors.body },
  form: { padding: spacing.lg, gap: 14 },
  suggestionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.6, color: colors.muted, textTransform: 'uppercase' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    backgroundColor: colors.tealSoft,
    borderWidth: 1,
    borderColor: '#d3e8e2',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipText: { fontSize: 10.5, fontWeight: '600', color: colors.tealText },
  timeRow: { flexDirection: 'row', gap: 10 },
  hint: { fontSize: 10.5, lineHeight: 16, color: colors.muted },
});
