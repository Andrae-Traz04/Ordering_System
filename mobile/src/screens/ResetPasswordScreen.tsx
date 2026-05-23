import React, { useMemo, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import axios from 'axios'
import { colors, radii, spacing, typography, shadows, typeScale } from '../theme/design'

const API_BASE_URL = 'YOUR_API_BASE_URL' // Replace with your actual API URL

function calcStrength(pw: string) {
  const length6 = pw.length >= 6
  const length12 = pw.length >= 12
  const hasUpper = /[A-Z]/.test(pw)
  const hasLower = /[a-z]/.test(pw)
  const hasNumber = /\d/.test(pw)
  const hasSpecial = /[^A-Za-z0-9]/.test(pw)

  const mixedCase = (hasUpper && hasLower) || (/([A-Z].*[a-z])|([a-z].*[A-Z])/.test(pw))

  let score = 0
  if (length6) score += 1
  if (length12) score += 1
  if (mixedCase) score += 1
  if (hasNumber) score += 1
  if (hasSpecial) score += 1

  const clamped = Math.max(0, Math.min(5, score))

  const label =
    clamped <= 1
      ? 'Weak'
      : clamped === 2
        ? 'Fair'
        : clamped === 3
          ? 'Good'
          : clamped === 4
            ? 'Strong'
            : 'Very Strong'

  return { score: clamped, label, checks: { length6, length12, mixedCase, hasNumber, hasSpecial } }
}

export default function ResetPasswordScreen({ route }: any) {
  const navigation = useNavigation<any>()

  const userId = route?.params?.userId
  const token = route?.params?.token

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorStage, setErrorStage] = useState<'form' | 'error' | 'success'>('form')
  const [errorMsg, setErrorMsg] = useState('')

  const strength = useMemo(() => calcStrength(password), [password])

  const checks = [
    { key: 'length6', label: 'At least 6 characters', ok: strength.checks.length6 },
    { key: 'length12', label: 'At least 12 characters', ok: strength.checks.length12 },
    { key: 'mixedCase', label: 'Mixed case', ok: strength.checks.mixedCase },
    { key: 'hasNumber', label: 'Contains a number', ok: strength.checks.hasNumber },
    { key: 'hasSpecial', label: 'Contains a special character', ok: strength.checks.hasSpecial },
  ]

  const submit = async () => {
    setErrorMsg('')

    if (!password || !confirm) {
      setErrorMsg('Please enter and confirm your new password.')
      setErrorStage('error')
      return
    }

    if (password !== confirm) {
      setErrorMsg('Passwords do not match.')
      setErrorStage('error')
      return
    }

    setSubmitting(true)
    try {
      const url = `${API_BASE_URL}/auth/password-reset/confirm/${userId}/${token}/`
      await axios.post(url, { new_password: password, token, uid: userId })
      setErrorStage('success')
      setTimeout(() => navigation.navigate('Login'), 3000)
    } catch (e: any) {
      const msg = e?.response?.data ? Object.values(e.response.data).flat().join(', ') : e?.message || 'Reset failed'
      setErrorStage('error')
      setErrorMsg(msg)
    } finally {
      setSubmitting(false)
    }
  }

  if (errorStage === 'success') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerWrap}>
          <Text style={styles.successTitle}>Password Updated!</Text>
          <Text style={styles.subtitle}>Redirecting to login...</Text>
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.lg }} />
        </View>
      </SafeAreaView>
    )
  }

  if (errorStage === 'error') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.centerWrap}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => {
              setErrorStage('form')
              setErrorMsg('')
            }}
            disabled={submitting}
          >
            <Text style={styles.primaryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.appName}>MY STORE</Text>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>Choose a strong new password.</Text>

        <View style={styles.formContainer}>
          <Text style={styles.label}>New Password *</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor={colors.textMuted}
            placeholder="Enter new password"
          />

          <View style={styles.meterWrap}>
            <Text style={styles.meterLabel}>{strength.label}</Text>
            <View style={styles.meterTrack}>
              <View style={[styles.meterFill, { width: `${(strength.score / 5) * 100}%` }]} />
            </View>
          </View>

          <View style={styles.checklist}>
            {checks.map(c => (
              <View key={c.key} style={styles.checkRow}>
                <Text style={[styles.checkIcon, c.ok ? styles.checkIconOk : styles.checkIconBad]}>
                  {c.ok ? '✓' : '○'}
                </Text>
                <Text style={[styles.checkText, c.ok ? styles.checkTextOk : styles.checkTextBad]}>
                  {c.label}
                </Text>
              </View>
            ))}
          </View>

          <Text style={styles.label}>Confirm Password *</Text>
          <TextInput 
            style={styles.input} 
            value={confirm} 
            onChangeText={setConfirm} 
            secureTextEntry
            placeholderTextColor={colors.textMuted}
            placeholder="Confirm your password"
          />

          <Pressable style={[styles.primaryButton, submitting && styles.buttonDisabled]} onPress={submit} disabled={submitting}>
            <Text style={styles.primaryButtonText}>{submitting ? 'Updating...' : 'Update Password'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  content: {
    flexGrow: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  centerWrap: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  appName: {
    ...typography.caption,
    color: colors.primary,
    letterSpacing: 2,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  title: {
    ...typography.hero,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginTop: spacing.lg,
    ...shadows.lg,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.bgPrimary,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.textPrimary,
    fontSize: typeScale.body,
  },
  meterWrap: {
    marginTop: spacing.sm,
  },
  meterLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: 'bold',
  },
  meterTrack: {
    height: 8,
    backgroundColor: colors.borderLight,
    borderRadius: radii.pill,
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
  meterFill: {
    height: 8,
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
  },
  checklist: {
    marginTop: spacing.md,
    backgroundColor: colors.bgPrimary,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  checkIcon: {
    width: 24,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 14,
  },
  checkIconOk: {
    color: colors.success,
  },
  checkIconBad: {
    color: colors.textMuted,
  },
  checkText: {
    flex: 1,
    ...typography.body,
  },
  checkTextOk: {
    color: colors.textPrimary,
  },
  checkTextBad: {
    color: colors.textSecondary,
  },
  primaryButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  primaryButtonText: {
    ...typography.bodyBold,
    color: colors.textInverse,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  errorContainer: {
    backgroundColor: colors.error + '10',
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.error + '30',
  },
  errorText: {
    ...typography.body,
    color: colors.error,
  },
  successTitle: {
    ...typography.hero,
    color: colors.success,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
})