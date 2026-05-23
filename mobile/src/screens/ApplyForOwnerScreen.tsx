import React, { useMemo, useState } from 'react'
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Pressable, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'

import { useAuth } from '../context/AuthContext'
import { createOwnerApplication } from '../api/client'
import { colors, radii, spacing } from '../theme/design'
import RedErrorPill from '../components/RedErrorPill'

import { fetchMe } from '../api/client'

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

  // Redirect if unauthenticated or not a regular user
  React.useEffect(() => {
    if (!user) {
      _nav?.navigate?.('Login')
      return
    }

    // Only regular customer users can apply for owner privileges
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

      Alert.alert('Submitted', 'Your owner application has been submitted.')
      _nav?.navigate?.('Profile')
    } catch (e: any) {
      const msg = e?.response?.data ? Object.values(e.response.data).flat().join(', ') : e?.message || 'Failed to submit application'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Apply for Owner</Text>

        <View style={styles.stepper}>
          {steps.map((label, i) => {
            const idx = i + 1
            const done = idx < step
            const active = idx === step

            return (
              <View key={label} style={styles.stepItem}>
                <View
                  style={[
                    styles.stepDot,
                    done && styles.stepDotDone,
                    active && styles.stepDotActive,
                  ]}
                >
                  <Text style={styles.stepDotText}>{done ? '✓' : idx}</Text>
                </View>
                <Text style={[styles.stepLabel, done && styles.stepLabelDone, active && styles.stepLabelActive]}>
                  {label}
                </Text>
              </View>
            )
          })}
        </View>

        <RedErrorPill message={error} />

        {step === 1 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Step 1 — Business Info</Text>

            <Text style={styles.label}>Business name *</Text>
            <TextInput style={styles.input} value={businessName} onChangeText={setBusinessName} />

            <Text style={styles.label}>Business description *</Text>
            <TextInput
              style={[styles.input, { minHeight: 90 }]}
              value={businessDescription}
              onChangeText={setBusinessDescription}
              multiline
            />

            <Text style={styles.label}>Business address *</Text>
            <TextInput style={styles.input} value={businessAddress} onChangeText={setBusinessAddress} />
          </View>
        )}

        {step === 2 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Step 2 — Contact Details</Text>

            <Text style={styles.label}>Phone number *</Text>
            <TextInput style={styles.input} value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" />

            <Text style={styles.label}>Website (optional)</Text>
            <TextInput style={styles.input} value={website} onChangeText={setWebsite} autoCapitalize="none" />
            {!isWebsiteValid && <Text style={styles.hintBad}>Website must start with http:// or https://</Text>}
          </View>
        )}

        {step === 3 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Step 3 — Experience & Motivation</Text>

            <Text style={styles.label}>Years of experience *</Text>
            <TextInput
              style={styles.input}
              value={experienceYears}
              onChangeText={setExperienceYears}
              keyboardType="numeric"
            />

            <Text style={styles.label}>Motivation *</Text>
            <TextInput
              style={[styles.input, { minHeight: 120 }]}
              value={motivation}
              onChangeText={setMotivation}
              multiline
              placeholder="Why do you want to become an owner?"
            />
          </View>
        )}

        <View style={styles.navRow}>
          <TouchableOpacity
            onPress={() => {
              if (step > 1) setStep(step - 1)
            }}
            disabled={step === 1}
            style={[styles.navBtn, step === 1 && styles.navBtnDisabled]}
          >
            <Text style={styles.navBtnText}>Previous</Text>
          </TouchableOpacity>

          {step < 3 ? (
            <TouchableOpacity
              onPress={() => {
                if (canProceed()) setStep(step + 1)
              }}
              style={[styles.navBtnPrimary, submitting && { opacity: 0.7 }]}
              disabled={submitting}
            >
              <Text style={styles.navBtnPrimaryText}>Next</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={submit}
              style={[styles.navBtnPrimary, submitting && { opacity: 0.7 }]}
              disabled={submitting}
            >
              <Text style={styles.navBtnPrimaryText}>{submitting ? 'Submitting...' : 'Submit Application'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgBottom },
  content: { flexGrow: 1, padding: spacing.lg },
  title: { color: colors.textPrimary, fontWeight: '900', fontSize: 28, marginBottom: spacing.lg },

  stepper: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm, marginBottom: spacing.lg },
  stepItem: { flex: 1, alignItems: 'center' },
  stepDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#A98DF6',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.panelSoft,
  },
  stepDotDone: { backgroundColor: '#ECFDF5', borderColor: '#6EE7B7' },
  stepDotActive: { backgroundColor: '#7A57E8', borderColor: '#7A57E8' },
  stepDotText: { fontWeight: '900', color: colors.textSecondary },
  stepLabel: { marginTop: 6, fontWeight: '800', fontSize: 10, color: colors.textMuted, textAlign: 'center' },
  stepLabelDone: { color: colors.textPrimary },
  stepLabelActive: { color: colors.textPrimary },

  card: {
    backgroundColor: colors.panelSoft,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: '#9D82F2',
    padding: spacing.lg,
  },
  cardTitle: { color: colors.textPrimary, fontWeight: '900', fontSize: 18, marginBottom: spacing.md },
  label: { color: colors.textPrimary, fontWeight: '900', marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: '#A98DF6',
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    color: colors.textPrimary,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  hintBad: { color: '#ef4444', fontWeight: '800', marginTop: -spacing.sm, marginBottom: spacing.sm },

  navRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  navBtn: {
    flex: 1,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: '#A98DF6',
    backgroundColor: colors.panelSoft,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  navBtnDisabled: { opacity: 0.55 },
  navBtnText: { color: colors.textSecondary, fontWeight: '900' },
  navBtnPrimary: {
    flex: 1,
    borderRadius: radii.md,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#16a34a',
  },
  navBtnPrimaryText: { color: '#fff', fontWeight: '900' },
})

