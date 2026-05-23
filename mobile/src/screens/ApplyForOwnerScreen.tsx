import React, { useMemo, useState } from 'react'
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { useAuth } from '../context/AuthContext'
import { createOwnerApplication } from '../api/client'
import { colors, radii, spacing, typography, shadows } from '../theme/design'

const steps = ['Business Info', 'Contact Details', 'Experience & Motivation'] as const

export default function ApplyForOwnerScreen({ navigation: propNav }: any) {
  const { user } = useAuth()
  const navigation = useNavigation<any>()
  const _nav = propNav?.navigate ? propNav : navigation

  const [step, setStep] = useState(1)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [businessName, setBusinessName] = useState('')
  const [businessDescription, setBusinessDescription] = useState('')
  const [businessAddress, setBusinessAddress] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [website, setWebsite] = useState('')
  const [experienceYears, setExperienceYears] = useState('')
  const [motivation, setMotivation] = useState('')

  const isWebsiteValid = useMemo(() => {
    const w = website.trim()
    if (!w) return true
    return w.startsWith('http://') || w.startsWith('https://')
  }, [website])

  React.useEffect(() => {
    if (!user) {
      _nav?.navigate?.('Login')
      return
    }
    if (String((user as any)?.role) !== 'customer') {
      _nav?.navigate?.('Profile')
      return
    }
  }, [user])

  const canProceed = () => {
    setError('')

    if (step === 1) {
      if (!businessName.trim()) return setError('Business name is required.'), false
      if (!businessDescription.trim()) return setError('Business description is required.'), false
      if (!businessAddress.trim()) return setError('Business address is required.'), false
      return true
    }

    if (step === 2) {
      if (!phoneNumber.trim()) return setError('Phone number is required.'), false
      if (!isWebsiteValid) return setError('Website must start with http:// or https://'), false
      return true
    }

    if (step === 3) {
      const years = Number(experienceYears)
      if (experienceYears === '' || Number.isNaN(years) || years < 0) {
        return setError('Experience years must be a valid non-negative number.'), false
      }
      if (!motivation.trim()) return setError('Motivation is required.'), false
      return true
    }

    return false
  }

  const submit = async () => {
    if (!canProceed()) return

    setSubmitting(true)
    setError('')
    try {
      const yearsInt = parseInt(experienceYears, 10)
      await createOwnerApplication({
        business_name: businessName.trim(),
        business_description: businessDescription.trim(),
        business_address: businessAddress.trim(),
        phone_number: phoneNumber.trim(),
        website: website.trim() || null,
        experience_years: Number.isNaN(yearsInt) ? 0 : yearsInt,
        motivation: motivation.trim(),
      })
      Alert.alert('Application Submitted', 'Your owner application has been submitted for review.', [
        { text: 'OK', onPress: () => _nav?.navigate?.('Profile') }
      ])
    } catch (e: any) {
      const msg = e?.response?.data ? Object.values(e.response.data).flat().join(', ') : e?.message || 'Failed to submit application'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.storeName}>MY STORE</Text>
          <Text style={styles.title}>Become an Owner</Text>
          <Text style={styles.subtitle}>Apply for owner privileges to manage products and orders</Text>
        </View>

        <View style={styles.stepper}>
          {steps.map((label, i) => {
            const idx = i + 1
            const done = idx < step
            const active = idx === step
            return (
              <View key={label} style={styles.stepItem}>
                <View style={[styles.stepDot, done && styles.stepDotDone, active && styles.stepDotActive]}>
                  <Text style={styles.stepDotText}>{done ? '✓' : idx}</Text>
                </View>
                <Text style={[styles.stepLabel, done && styles.stepLabelDone, active && styles.stepLabelActive]}>
                  {label}
                </Text>
              </View>
            )
          })}
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {step === 1 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📋 Business Information</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Business Name *</Text>
              <TextInput style={styles.input} value={businessName} onChangeText={setBusinessName} placeholderTextColor={colors.textMuted} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Business Description *</Text>
              <TextInput style={[styles.input, styles.textArea]} value={businessDescription} onChangeText={setBusinessDescription} multiline placeholderTextColor={colors.textMuted} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Business Address *</Text>
              <TextInput style={styles.input} value={businessAddress} onChangeText={setBusinessAddress} placeholderTextColor={colors.textMuted} />
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📞 Contact Details</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number *</Text>
              <TextInput style={styles.input} value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" placeholderTextColor={colors.textMuted} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Website (optional)</Text>
              <TextInput style={styles.input} value={website} onChangeText={setWebsite} autoCapitalize="none" placeholderTextColor={colors.textMuted} placeholder="https://example.com" />
            </View>
            {!isWebsiteValid && website.trim() !== '' && (
              <Text style={styles.hintBad}>Website must start with http:// or https://</Text>
            )}
          </View>
        )}

        {step === 3 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>💼 Experience & Motivation</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Years of Experience *</Text>
              <TextInput style={styles.input} value={experienceYears} onChangeText={setExperienceYears} keyboardType="numeric" placeholderTextColor={colors.textMuted} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Why do you want to become an owner? *</Text>
              <TextInput style={[styles.input, styles.textAreaLarge]} value={motivation} onChangeText={setMotivation} multiline placeholderTextColor={colors.textMuted} />
            </View>
          </View>
        )}

        <View style={styles.navRow}>
          <TouchableOpacity
            onPress={() => step > 1 && setStep(step - 1)}
            style={[styles.navButton, step === 1 && styles.navButtonDisabled]}
            disabled={step === 1}
          >
            <Text style={styles.navButtonText}>Previous</Text>
          </TouchableOpacity>

          {step < 3 ? (
            <TouchableOpacity
              onPress={() => canProceed() && setStep(step + 1)}
              style={styles.navButtonPrimary}
            >
              <Text style={styles.navButtonPrimaryText}>Next</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={submit}
              style={[styles.navButtonPrimary, submitting && styles.buttonDisabled]}
              disabled={submitting}
            >
              <Text style={styles.navButtonPrimaryText}>
                {submitting ? 'Submitting...' : 'Submit Application'}
              </Text>
            </TouchableOpacity>
          )}
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
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  storeName: {
    ...typography.caption,
    color: colors.primary,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  stepper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
  },
  stepDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgCard,
  },
  stepDotDone: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  stepDotActive: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  stepDotText: {
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  stepLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  stepLabelDone: {
    color: colors.success,
  },
  stepLabelActive: {
    color: colors.primary,
    fontWeight: 'bold',
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
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  cardTitle: {
    ...typography.subheading,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: colors.bgPrimary,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  textAreaLarge: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  hintBad: {
    ...typography.caption,
    color: colors.error,
    marginTop: -spacing.sm,
    marginBottom: spacing.sm,
  },
  navRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  navButton: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  navButtonPrimary: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  navButtonPrimaryText: {
    ...typography.bodyBold,
    color: colors.textInverse,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});