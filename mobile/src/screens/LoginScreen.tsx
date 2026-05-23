import React, { useState } from 'react'
import {
  View,
  TextInput,
  StyleSheet,
  Text,
  Alert,
  ActivityIndicator,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { useAuth } from '../context/AuthContext'
import { login as apiLogin } from '../api/client'
import { colors, radii, spacing, typeScale } from '../theme/design'

export default function LoginScreen() {
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const { login } = useAuth()

  const normalizeUserPayload = (payload: any) => {
    const raw = payload?.user ? payload.user : payload
    const role = raw?.profile?.role || raw?.role || 'user'
    return { ...raw, role, profile: raw?.profile || null }
  }

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password')
      return
    }
    
    setLoading(true)
    try {
      const res = await apiLogin({ email, password })
      // Backend returns: { access, refresh, user }
      const { access, refresh, user: userObj } = res.data
      const userData = normalizeUserPayload(userObj ? { user: userObj } : res.data)
      await login(access, refresh, userData)

    } catch (error: any) {
      const msg = error.response?.data?.detail || error.response?.data?.error || error.message || 'Invalid credentials'
      Alert.alert('Login Failed', msg)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    )
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.glowOrbLarge} />
      <View style={styles.glowOrbSmall} />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.heroCard}>
          <Text style={styles.badge}>SMART ORDERING</Text>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Track orders, manage products, and stay in flow.</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Pressable style={styles.primaryButton} onPress={handleLogin}>
            <Text style={styles.primaryButtonText}>Login</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgBottom,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: colors.bgBottom,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowOrbLarge: {
    position: 'absolute',
    top: -120,
    right: -90,
    width: 280,
    height: 280,
    borderRadius: 160,
    backgroundColor: colors.bgTop,
    opacity: 0.6,
  },
  glowOrbSmall: {
    position: 'absolute',
    bottom: 60,
    left: -70,
    width: 200,
    height: 200,
    borderRadius: 120,
    backgroundColor: colors.panel,
    opacity: 0.45,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    gap: spacing.lg,
  },
  heroCard: {
    padding: spacing.lg,
    backgroundColor: colors.panelDark,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: '#8F6AEE',
    shadowColor: colors.shadow,
    shadowOpacity: 0.32,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 14 },
    elevation: 8,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
    color: '#5B3900',
    fontWeight: '700',
    fontSize: typeScale.caption,
    letterSpacing: 0.5,
  },
  title: {
    marginTop: spacing.md,
    fontSize: typeScale.hero,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontSize: typeScale.body,
    lineHeight: 22,
  },
  formCard: {
    backgroundColor: colors.panelSoft,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#9D82F2',
  },
  inputLabel: {
    color: colors.textPrimary,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  input: {
    minHeight: 50,
    borderRadius: radii.md,
    backgroundColor: '#7A57E8',
    borderWidth: 1,
    borderColor: '#A98DF6',
    color: colors.white,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: radii.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  primaryButtonText: {
    color: '#4B2A00',
    fontSize: 16,
    fontWeight: '800',
  },
})