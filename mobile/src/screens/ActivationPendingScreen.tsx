import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, radii, spacing, typography, shadows } from '../theme/design'

export default function ActivationPendingScreen({ route, navigation }: any) {
  const [message, setMessage] = useState('')

  useEffect(() => {
    const _uid = route?.params?.uid
    setMessage(_uid ? 'Check your email to activate your account.' : 'Account activation is pending. Please check your email.')
  }, [route?.params])

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.appName}>MY STORE</Text>
          <Text style={styles.title}>Activation Pending</Text>
          <Text style={styles.subtitle}>{message}</Text>

          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.lg }} />

          <Pressable
            style={styles.btn}
            onPress={() => navigation?.navigate?.('Login')}
          >
            <Text style={styles.btnText}>Back to Login</Text>
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
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.xl,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.lg,
  },
  appName: {
    ...typography.caption,
    color: colors.primary,
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
    lineHeight: 22,
  },
  btn: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    ...shadows.sm,
  },
  btnText: {
    ...typography.bodyBold,
    color: colors.textInverse,
  },
})