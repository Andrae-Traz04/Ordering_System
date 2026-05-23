import React, { useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Pressable,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import axios from 'axios'

import * as SecureStore from 'expo-secure-store'
import { colors, radii, spacing, typeScale } from '../theme/design'
import RedErrorPill from '../components/RedErrorPill'

// Resolve API base URL similar to mobile/src/api/client.ts
import Constants from 'expo-constants'
import { Platform } from 'react-native'

const FALLBACK_LAN_HOST = '192.168.254.121:8000'

const resolveApiBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim()
  if (envUrl) {
    return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`
  }

  if (Platform.OS === 'web') {
    return '/api'
  }

  const hostUri = (Constants as any).expoConfig?.hostUri || (Constants as any).manifest2?.extra?.expoClient?.hostUri
  if (hostUri) {
    const host = hostUri.split(':')[0]
    return `http://${host}:8000/api/v1`
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000/api/v1'
  }

  return `http://${FALLBACK_LAN_HOST}/api/v1`
}

const API_BASE_URL = resolveApiBaseUrl()

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

  useEffect(() => {
    if (!userId || !token) {
      setErrorStage('error')
      setErrorMsg('Invalid reset link.')
    }
  }, [userId, token])

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
      // Backend expects: /auth/password-reset/confirm/<uid>/<token>/
      // We'll try common endpoint patterns; adjust if your backend differs.
      const url = `${API_BASE_URL}/auth/password-reset/confirm/${userId}/${token}/`

      await axios.post(url, { new_password: password, token, uid: userId }, {
        timeout: 15000,
        headers: { 'Content-Type': 'application/json' },
      })

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
          <Text style={styles.successTitle}>Password updated</Text>
          <Text style={styles.subtitle}>Redirecting to login...</Text>
          <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: spacing.lg }} />
        </View>
      </SafeAreaView>
    )
  }

  if (errorStage === 'error') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.centerWrap}>
          <RedErrorPill message={errorMsg} />
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => {
              setErrorStage('form')
              setErrorMsg('')
            }}
            disabled={submitting}
          >
            <Text style={styles.primaryButtonText}>{submitting ? 'Working...' : 'Try Again'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>Choose a strong new password.</Text>

        <Text style={styles.label}>New Password *</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
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
              <Text style={[styles.checkIcon, c.ok ? styles.checkIconOk : styles.checkIconBad]}>{c.ok ? '✓' : '•'}</Text>
              <Text style={[styles.checkText, c.ok ? styles.checkTextOk : styles.checkTextBad]}>{c.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.label}>Confirm Password *</Text>
        <TextInput style={styles.input} value={confirm} onChangeText={setConfirm} secureTextEntry />

        <Pressable style={[styles.primaryButton, submitting && { opacity: 0.7 }]} onPress={submit} disabled={submitting}>
          <Text style={styles.primaryButtonText}>{submitting ? 'Updating...' : 'Update Password'}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgBottom },
  content: { flexGrow: 1, padding: spacing.lg, justifyContent: 'center' },
  centerWrap: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  title: { color: colors.textPrimary, fontWeight: '900', fontSize: 28 },
  subtitle: { color: colors.textSecondary, fontWeight: '700', marginTop: spacing.xs, lineHeight: 22 },
  label: { color: colors.textPrimary, fontWeight: '800', marginTop: spacing.md, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.panelSoft,
    borderWidth: 1,
    borderColor: '#A98DF6',
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  meterWrap: { marginTop: spacing.sm },
  meterLabel: { color: colors.textSecondary, fontWeight: '900' },
  meterTrack: {
    height: 12,
    backgroundColor: '#eee',
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#A98DF6',
    marginTop: 8,
  },
  meterFill: { height: 12, backgroundColor: colors.accent, borderRadius: 999 },
  checklist: {
    marginTop: spacing.md,
    backgroundColor: colors.panel,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: '#9D82F2',
    padding: spacing.md,
  },
  checkRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  checkIcon: { width: 24, textAlign: 'center', fontWeight: '900' },
  checkIconOk: { color: '#22c55e' },
  checkIconBad: { color: '#9ca3af' },
  checkText: { flex: 1, fontWeight: '800' },
  checkTextOk: { color: colors.textPrimary },
  checkTextBad: { color: colors.textMuted },
  primaryButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#5B3900',
  },
  primaryButtonText: { color: '#4B2A00', fontWeight: '900', fontSize: 16 },
  successTitle: { color: colors.textPrimary, fontWeight: '900', fontSize: 26, textAlign: 'center' },
})

