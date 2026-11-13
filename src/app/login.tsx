import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { LoginHeader } from '@/components/screen';
import { Field, PrimaryButton } from '@/components/ui';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { colors, radius, shadow, spacing } from '@/theme';
import type { Role } from '@/types';

const roles: { value: Role; label: string; description: string; icon: 'school-outline' | 'shield-checkmark-outline' }[] = [
  { value: 'student', label: 'Student', description: 'Exam taker / learner', icon: 'school-outline' },
  { value: 'proctor', label: 'Proctor', description: 'Instructor / staff', icon: 'shield-checkmark-outline' },
];

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [role, setRole] = useState<Role>('student');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (loading) return;

    if (!identifier.trim() || !password) {
      setError('Enter your email or student ID number and your password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const user = await login(identifier.trim(), password, role);
      router.replace(user.role === 'proctor' ? '/proctor' : '/student');
    } catch (requestError) {
      const message =
        requestError instanceof ApiError
          ? requestError.errors?.identifier?.[0] ?? requestError.message
          : 'Unable to sign in. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <LoginHeader />

        <View style={styles.card}>
          <View style={styles.cardIntro}>
            <Text style={styles.eyebrow}>WELCOME TO PROCTORAIDE</Text>
            <Text style={styles.title}>Log in to continue</Text>
            <Text style={styles.subtitle}>Choose your role and enter your account details.</Text>
          </View>

          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={17} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Text style={styles.sectionLabel}>Select your role</Text>
          <View style={styles.roleRow}>
            {roles.map((option) => {
              const selected = role === option.value;

              return (
                <Pressable
                  key={option.value}
                  onPress={() => setRole(option.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  style={[styles.roleCard, selected && styles.roleCardSelected]}>
                  <View style={[styles.roleIcon, selected && styles.roleIconSelected]}>
                    <Ionicons
                      name={option.icon}
                      size={18}
                      color={selected ? '#146b5e' : '#738783'}
                    />
                  </View>
                  <Text style={styles.roleLabel}>{option.label}</Text>
                  <Text style={styles.roleDescription}>{option.description}</Text>
                </Pressable>
              );
            })}
          </View>

          <Field
            label="Email or student ID number"
            value={identifier}
            onChangeText={setIdentifier}
            placeholder="you@university.edu or 2024-00001"
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading}
          />

          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            editable={!loading}
            right={
              <Pressable
                onPress={() => setShowPassword((value) => !value)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={19}
                  color="#849995"
                />
              </Pressable>
            }
          />

          <PrimaryButton
            label={loading ? 'Signing in…' : 'Login'}
            icon="arrow-forward"
            onPress={submit}
            loading={loading}
            style={{ marginTop: 4 }}
          />

          <Text style={styles.footNote}>
            By continuing, you confirm that you are authorized to access this system, and you agree to
            our Terms of Service and Privacy Policy.
          </Text>
        </View>

        <Text style={styles.helper}>ProctorAide · Examination monitoring made simple</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.page },
  scroll: { paddingBottom: 32 },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.lg,
    marginTop: -32,
    padding: spacing.xl,
    gap: 14,
    ...shadow.card,
  },
  cardIntro: { gap: 4, marginBottom: 4 },
  eyebrow: { fontSize: 9.5, fontWeight: '700', letterSpacing: 2.6, color: '#3d8075' },
  title: { fontSize: 22, fontWeight: '800', color: colors.ink, letterSpacing: -0.6 },
  subtitle: { fontSize: 12.5, color: '#657a76', lineHeight: 18 },
  sectionLabel: { fontSize: 12.5, fontWeight: '700', color: '#294b46' },

  errorBanner: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    backgroundColor: '#fef3f2',
    borderWidth: 1,
    borderColor: '#f4d1cc',
    borderRadius: radius.md,
    padding: 11,
  },
  errorText: { flex: 1, fontSize: 12, color: colors.danger, lineHeight: 17 },

  roleRow: { flexDirection: 'row', gap: 10 },
  roleCard: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#d9e4e0',
    backgroundColor: colors.white,
    padding: 12,
    gap: 3,
  },
  roleCardSelected: {
    borderColor: colors.accent,
    backgroundColor: '#f0f8f6',
  },
  roleIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: '#f1f5f4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  roleIconSelected: { backgroundColor: '#dcefeb' },
  roleLabel: { fontSize: 13, fontWeight: '700', color: '#123c37' },
  roleDescription: { fontSize: 10, color: '#6c807c' },

  footNote: { fontSize: 10.5, lineHeight: 16, color: '#849691', textAlign: 'center' },
  helper: { marginTop: 18, textAlign: 'center', fontSize: 10.5, color: '#9baba7' },
});
