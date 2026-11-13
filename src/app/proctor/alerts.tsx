import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/components/screen';
import {
  EmptyState,
  ErrorBlock,
  IncidentBadge,
  LoadingBlock,
  Panel,
  PrimaryButton,
} from '@/components/ui';
import { ApiError, apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatDateTime } from '@/lib/format';
import { useApi } from '@/lib/use-api';
import { colors, radius, spacing } from '@/theme';
import type { ActivityEvent, Incident, IncidentStatus } from '@/types';

type AlertsPayload = {
  incidents: Incident[];
  counts: { pending: number; reviewed: number; dismissed: number };
  activity: ActivityEvent[];
};

type Filter = 'all' | IncidentStatus;

const filters: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'dismissed', label: 'Dismissed' },
];

export default function ProctorAlertsScreen() {
  const { token, user } = useAuth();
  const { data, error, loading, reload } = useApi<AlertsPayload>('/proctor/alerts');
  const [filter, setFilter] = useState<Filter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const refresh = async () => {
    setRefreshing(true);
    await reload(true);
    setRefreshing(false);
  };

  const updateStatus = async (incident: Incident, status: IncidentStatus) => {
    if (!token || busyId) return;

    setBusyId(incident.id);
    setActionError(null);

    try {
      await apiRequest(`/proctor/incidents/${incident.id}/status`, {
        method: 'PATCH',
        token,
        body: { status },
      });
      await reload(true);
    } catch (requestError) {
      setActionError(requestError instanceof ApiError ? requestError.message : 'Unable to update the incident.');
    } finally {
      setBusyId(null);
    }
  };

  const incidents = (data?.incidents ?? []).filter((incident) => filter === 'all' || incident.status === filter);

  return (
    <AppScreen
      title="Alerts"
      role={user?.role ?? 'proctor'}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.teal} />
      }>
      <View style={{ gap: 4 }}>
        <Text style={styles.heading}>Incidents & activity</Text>
        <Text style={styles.subheading}>
          Review incident reports and the monitoring events shared by students in exam mode.
        </Text>
      </View>

      {loading && !data ? <LoadingBlock /> : null}
      {error ? <ErrorBlock message={error} onRetry={() => reload()} /> : null}
      {actionError ? <ErrorBlock message={actionError} /> : null}

      {data ? (
        <>
          <View style={styles.countRow}>
            <View style={styles.countCard}>
              <Text style={styles.countValue}>{data.counts.pending}</Text>
              <Text style={styles.countLabel}>Pending</Text>
            </View>
            <View style={styles.countCard}>
              <Text style={styles.countValue}>{data.counts.reviewed}</Text>
              <Text style={styles.countLabel}>Reviewed</Text>
            </View>
            <View style={styles.countCard}>
              <Text style={styles.countValue}>{data.counts.dismissed}</Text>
              <Text style={styles.countLabel}>Dismissed</Text>
            </View>
          </View>

          <View style={styles.filterRow}>
            {filters.map((option) => {
              const selected = filter === option.value;

              return (
                <Pressable
                  key={option.value}
                  onPress={() => setFilter(option.value)}
                  style={[styles.filterChip, selected && styles.filterChipSelected]}>
                  <Text style={[styles.filterText, selected && styles.filterTextSelected]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {incidents.length === 0 ? (
            <Panel>
              <EmptyState
                icon="shield-checkmark-outline"
                title="No incidents here."
                description="Incident reports submitted for your examinations will appear in this list."
              />
            </Panel>
          ) : (
            incidents.map((incident) => (
              <View key={incident.id} style={styles.incidentCard}>
                <View style={styles.incidentTop}>
                  <View style={styles.incidentIcon}>
                    <Ionicons name="warning-outline" size={17} color={colors.amber} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.incidentTitle}>
                      {incident.student_name ?? 'Unassigned student'}
                    </Text>
                    <Text style={styles.incidentMeta} numberOfLines={1}>
                      {[incident.examination_title, incident.student_id_number].filter(Boolean).join(' · ')}
                    </Text>
                  </View>
                  <IncidentBadge status={incident.status} />
                </View>

                <Text style={styles.incidentBody}>{incident.description}</Text>
                <Text style={styles.incidentTime}>Reported {formatDateTime(incident.reported_at)}</Text>

                <View style={styles.incidentActions}>
                  {incident.status !== 'reviewed' ? (
                    <PrimaryButton
                      label="Mark reviewed"
                      variant="outline"
                      onPress={() => updateStatus(incident, 'reviewed')}
                      loading={busyId === incident.id}
                      style={{ flex: 1 }}
                    />
                  ) : null}
                  {incident.status !== 'dismissed' ? (
                    <PrimaryButton
                      label="Dismiss"
                      variant="ghost"
                      onPress={() => updateStatus(incident, 'dismissed')}
                      disabled={busyId === incident.id}
                      style={{ flex: 1 }}
                    />
                  ) : null}
                  {incident.status !== 'pending' ? (
                    <PrimaryButton
                      label="Reopen"
                      variant="ghost"
                      onPress={() => updateStatus(incident, 'pending')}
                      disabled={busyId === incident.id}
                      style={{ flex: 1 }}
                    />
                  ) : null}
                </View>
              </View>
            ))
          )}
        </>
      ) : null}

      {data ? (
        <Panel title="Activity Log" description="Exam-mode events reported by student devices.">
          {data.activity.length === 0 ? (
            <EmptyState
              icon="pulse-outline"
              title="No activity recorded yet."
              description="Events appear here after a student starts an examination in the mobile app."
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
                  <Text style={styles.activityMeta} numberOfLines={1}>
                    {[activity.examination_title, formatDateTime(activity.occurred_at)]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                  {activity.detail ? <Text style={styles.activityDetail}>{activity.detail}</Text> : null}
                </View>
              </View>
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

  countRow: { flexDirection: 'row', gap: 9 },
  countCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 12,
  },
  countValue: { fontSize: 20, fontWeight: '800', color: colors.ink },
  countLabel: { fontSize: 10.5, color: colors.muted, marginTop: 1 },

  filterRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  filterChipSelected: { backgroundColor: colors.teal, borderColor: colors.teal },
  filterText: { fontSize: 11, fontWeight: '600', color: colors.bodySoft },
  filterTextSelected: { color: '#ffffff' },

  incidentCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: 8,
  },
  incidentTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  incidentIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: colors.amberSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  incidentTitle: { fontSize: 13, fontWeight: '700', color: colors.ink },
  incidentMeta: { fontSize: 10.5, color: colors.muted, marginTop: 2 },
  incidentBody: { fontSize: 12, lineHeight: 18, color: colors.body },
  incidentTime: { fontSize: 9.5, color: colors.faint },
  incidentActions: { flexDirection: 'row', gap: 6, marginTop: 2 },

  activityRow: { flexDirection: 'row', gap: 9, paddingHorizontal: spacing.lg, paddingVertical: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
  activityDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accent, marginTop: 5 },
  activityTitle: { fontSize: 11.5, fontWeight: '600', color: colors.inkSoft },
  activityMeta: { fontSize: 10, color: colors.muted, marginTop: 2 },
  activityDetail: { fontSize: 10, color: colors.faint, marginTop: 2 },
});
