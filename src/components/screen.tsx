import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import {
  Pressable,
  RefreshControlProps,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandIcon, BrandMark } from '@/components/brand';
import { colors, radius, spacing } from '@/theme';
import type { Role } from '@/types';

/**
 * Dark teal header used on every screen, mirroring the web app's top bar.
 */
export function AppHeader({
  title,
  role,
  onBack,
  right,
  showBrand = true,
}: {
  title: string;
  role?: Role;
  onBack?: () => void;
  right?: ReactNode;
  showBrand?: boolean;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          {onBack ? (
            <Pressable
              onPress={onBack}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
              <Ionicons name="arrow-back" size={20} color="#ffffff" />
            </Pressable>
          ) : showBrand ? (
            <View style={styles.brandBox}>
              <BrandIcon size={18} color="#ffffff" />
            </View>
          ) : null}
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title}
          </Text>
        </View>

        {right ??
          (role ? (
            <View style={styles.rolePill}>
              <Text style={styles.roleText}>{role === 'proctor' ? 'Proctor' : 'Student'}</Text>
            </View>
          ) : null)}
      </View>
    </View>
  );
}

/**
 * Page shell: teal header, light gray body, optional scrolling/refresh.
 */
export function AppScreen({
  title,
  role,
  onBack,
  headerRight,
  children,
  scroll = true,
  refreshControl,
  contentStyle,
  footer,
}: {
  title: string;
  role?: Role;
  onBack?: () => void;
  headerRight?: ReactNode;
  children: ReactNode;
  scroll?: boolean;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  contentStyle?: StyleProp<ViewStyle>;
  footer?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const body = (
    <View style={[styles.body, { paddingBottom: scroll ? 32 : 0 }, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <AppHeader title={title} role={role} onBack={onBack} right={headerRight} />
      {scroll ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 20 }}
          refreshControl={refreshControl}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {body}
        </ScrollView>
      ) : (
        <View style={styles.scroll}>{body}</View>
      )}
      {footer}
    </SafeAreaView>
  );
}

export function LoginHeader() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.loginHeader, { paddingTop: insets.top + 28 }]}>
      <View style={styles.centered}>
        <BrandMark variant="light" iconSize={22} wordmarkSize={24} />
        <Text style={styles.tagline}>A calmer way to run every exam.</Text>
      </View>
    </View>
  );
}

/** Full-screen branded splash used while auth state loads. */
export function Splash() {
  return (
    <View style={styles.splash}>
      <BrandMark variant="light" iconSize={26} wordmarkSize={26} />
      <Text style={styles.splashHint}>Preparing your workspace…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.page },
  header: {
    backgroundColor: colors.header,
    paddingHorizontal: spacing.lg,
    paddingBottom: 14,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  brandBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  pressed: { opacity: 0.7 },
  headerTitle: { color: '#ffffff', fontSize: 18, fontWeight: '700', letterSpacing: -0.3, flexShrink: 1 },
  rolePill: { backgroundColor: colors.cream, borderRadius: radius.pill, paddingHorizontal: 13, paddingVertical: 5 },
  roleText: { color: colors.creamText, fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },
  scroll: { flex: 1 },
  body: { padding: spacing.lg, gap: spacing.lg },

  loginHeader: {
    backgroundColor: colors.header,
    paddingHorizontal: spacing.xl,
    paddingBottom: 46,
  },
  centered: { alignItems: 'center', gap: 10 },
  tagline: { color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: '500' },

  splash: { flex: 1, backgroundColor: colors.header, alignItems: 'center', justifyContent: 'center', gap: 14 },
  splashHint: { color: 'rgba(255,255,255,0.55)', fontSize: 12 },
});
