import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { colors, radius, shadow, spacing } from '@/theme';
import { examStatusTone, incidentStatusTone, initials } from '@/lib/format';
import type { ExamStatus, IncidentStatus } from '@/types';

type IconName = ComponentProps<typeof Ionicons>['name'];

export function Panel({
  title,
  description,
  action,
  children,
  style,
  bodyStyle,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  bodyStyle?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.panel, style]}>
      {(title || action) && (
        <View style={styles.panelHeader}>
          <View style={{ flex: 1, minWidth: 0 }}>
            {title ? <Text style={styles.panelTitle}>{title}</Text> : null}
            {description ? <Text style={styles.panelDescription}>{description}</Text> : null}
          </View>
          {action}
        </View>
      )}
      <View style={bodyStyle}>{children}</View>
    </View>
  );
}

export function StatCard({
  icon,
  value,
  label,
  hint,
}: {
  icon: IconName;
  value: string;
  label: string;
  hint?: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>
        <Ionicons name={icon} size={18} color={colors.tealText} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel} numberOfLines={1}>
        {label}
      </Text>
      {hint ? (
        <Text style={styles.statHint} numberOfLines={1}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

export function StatPill({
  label,
  value,
  tone = 'teal',
}: {
  label: string;
  value: number;
  tone?: 'teal' | 'red' | 'green';
}) {
  const dot = tone === 'red' ? colors.dangerDot : tone === 'green' ? colors.greenDot : colors.greenDot;

  return (
    <View style={styles.statPill}>
      <View style={[styles.dot, { backgroundColor: dot }]} />
      <Text style={styles.statPillLabel}>{label}</Text>
      <Text style={styles.statPillValue}>{value}</Text>
    </View>
  );
}

export function StatusBadge({ status, compact }: { status: ExamStatus; compact?: boolean }) {
  const tone = examStatusTone[status] ?? examStatusTone.scheduled;

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: tone.bg, borderColor: tone.border },
        compact && { paddingHorizontal: 8, paddingVertical: 3 },
      ]}>
      <View style={[styles.dot, { backgroundColor: tone.dot }]} />
      <Text style={[styles.badgeText, { color: tone.fg }, compact && { fontSize: 10 }]}>{tone.label}</Text>
    </View>
  );
}

export function IncidentBadge({ status }: { status: IncidentStatus }) {
  const tone = incidentStatusTone[status] ?? incidentStatusTone.pending;

  return (
    <View style={[styles.badge, { backgroundColor: tone.bg, borderColor: tone.border }]}>
      <Text style={[styles.badgeText, { color: tone.fg }]}>{tone.label}</Text>
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  icon,
  loading,
  disabled,
  variant = 'primary',
  style,
}: {
  label: string;
  onPress?: () => void;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'outline' | 'danger' | 'ghost';
  style?: StyleProp<ViewStyle>;
}) {
  const isDisabled = disabled || loading;
  const palette = {
    primary: { bg: colors.teal, border: colors.teal, fg: '#ffffff' },
    outline: { bg: colors.white, border: colors.field, fg: colors.tealText },
    danger: { bg: '#a4453a', border: '#a4453a', fg: '#ffffff' },
    ghost: { bg: 'transparent', border: 'transparent', fg: colors.tealText },
  }[variant];

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: palette.bg, borderColor: palette.border },
        pressed && !isDisabled && styles.pressed,
        isDisabled && { opacity: 0.6 },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator size="small" color={palette.fg} />
      ) : icon ? (
        <Ionicons name={icon} size={16} color={palette.fg} />
      ) : null}
      <Text style={[styles.buttonText, { color: palette.fg }]}>{label}</Text>
    </Pressable>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  maxLength,
  autoFocus,
  editable = true,
  right,
  error,
  style,
  inputStyle,
  multiline,
}: {
  label?: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  maxLength?: number;
  autoFocus?: boolean;
  editable?: boolean;
  right?: ReactNode;
  error?: string | null;
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  multiline?: boolean;
}) {
  return (
    <View style={[styles.field, style]}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <View style={[styles.inputWrap, multiline && { alignItems: 'flex-start', paddingVertical: 10 }]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.fieldPlaceholder}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          maxLength={maxLength}
          autoFocus={autoFocus}
          editable={editable}
          multiline={multiline}
          style={[styles.input, multiline && { minHeight: 84, textAlignVertical: 'top' }, inputStyle]}
        />
        {right}
      </View>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: IconName;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={20} color="#8aa39d" />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{description}</Text>
      {action ? <View style={{ marginTop: 12 }}>{action}</View> : null}
    </View>
  );
}

export function InfoRow({ icon, label, value }: { icon: IconName; label: string; value?: string | null }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={16} color={colors.faint} style={{ marginTop: 1 }} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue} numberOfLines={2}>
          {value && value.trim().length > 0 ? value : 'Not provided'}
        </Text>
      </View>
    </View>
  );
}

export function Avatar({ name, size = 44 }: { name?: string | null; size?: number }) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.32 }]}>{initials(name)}</Text>
    </View>
  );
}

export function LoadingBlock({ label = 'Loading…' }: { label?: string }) {
  return (
    <View style={styles.loadingBlock}>
      <ActivityIndicator color={colors.teal} />
      <Text style={styles.loadingText}>{label}</Text>
    </View>
  );
}

export function ErrorBlock({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.errorBlock}>
      <View style={styles.errorHeader}>
        <Ionicons name="alert-circle" size={18} color={colors.danger} />
        <Text style={styles.errorText}>{message}</Text>
      </View>
      {onRetry ? (
        <PrimaryButton label="Try again" variant="outline" onPress={onRetry} style={{ marginTop: 12 }} />
      ) : null}
    </View>
  );
}

export function Divider() {
  return <View style={styles.divider} />;
}

export function Meta({ icon, text }: { icon: IconName; text: string }) {
  return (
    <View style={styles.meta}>
      <Ionicons name={icon} size={13} color={colors.muted} />
      <Text style={styles.metaText} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow.card,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  panelTitle: { fontSize: 15, fontWeight: '700', color: colors.ink, letterSpacing: -0.2 },
  panelDescription: { fontSize: 11.5, color: colors.muted, marginTop: 2 },

  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 13,
    gap: 2,
    minWidth: 0,
    ...shadow.card,
  },
  statIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: colors.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: { fontSize: 22, fontWeight: '800', color: colors.ink, letterSpacing: -0.6 },
  statLabel: { fontSize: 11, fontWeight: '600', color: '#5f7b75' },
  statHint: { fontSize: 10, color: colors.faint },

  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.tableHead,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flex: 1,
  },
  statPillLabel: { fontSize: 11, fontWeight: '600', color: '#5c6f6b', flexShrink: 1 },
  statPillValue: { fontSize: 16, fontWeight: '800', color: colors.ink, marginLeft: 'auto' },
  dot: { width: 6, height: 6, borderRadius: 3 },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  badgeText: { fontSize: 10.5, fontWeight: '700' },

  button: {
    minHeight: 46,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: { fontSize: 13.5, fontWeight: '700' },
  pressed: { opacity: 0.82 },

  field: { gap: 6 },
  fieldLabel: { fontSize: 12.5, fontWeight: '600', color: '#294b46' },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 46,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.field,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
  },
  input: { flex: 1, fontSize: 14, color: '#123c37', paddingVertical: 10 },
  fieldError: { fontSize: 11.5, fontWeight: '600', color: colors.danger },

  empty: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 36 },
  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f7f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: { fontSize: 13.5, fontWeight: '700', color: '#2f4a45', textAlign: 'center' },
  emptyText: { fontSize: 11.5, color: colors.muted, textAlign: 'center', marginTop: 4, lineHeight: 17 },

  infoRow: { flexDirection: 'row', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f3' },
  infoLabel: { fontSize: 9.5, fontWeight: '700', letterSpacing: 1.1, color: colors.faint, textTransform: 'uppercase' },
  infoValue: { fontSize: 12.5, fontWeight: '600', color: '#2f4a45', marginTop: 2 },

  avatar: { backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.creamText, fontWeight: '800' },

  loadingBlock: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, gap: 10 },
  loadingText: { fontSize: 12, color: colors.muted },
  errorBlock: {
    backgroundColor: '#fff7f6',
    borderWidth: 1,
    borderColor: '#f4d1cc',
    borderRadius: radius.lg,
    padding: 14,
  },
  errorHeader: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  errorText: { flex: 1, fontSize: 12.5, color: colors.danger, lineHeight: 18 },

  divider: { height: 1, backgroundColor: colors.borderSoft },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 5, minWidth: 0 },
  metaText: { fontSize: 11, color: colors.muted, flexShrink: 1 },
});
