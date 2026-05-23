import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, radii, spacing, typeScale } from '../theme/design'

export default function ActivationPendingScreen({ route, navigation }: any) {
  const [message, setMessage] = useState('')

  useEffect(() => {
    const _uid = route?.params?.uid
    // Token is present only if backend returns it; otherwise just show pending message.
    setMessage(_uid ? 'Check your email to activate your account.' : 'Account activation is pending. Please check your email.')
  }, [route?.params])

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>Activation Pending</Text>
          <Text style={styles.subtitle}>{message || 'Account activation is pending.'}</Text>

          <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: spacing.lg }} />

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
  container: { flex: 1, backgroundColor: colors.bgBottom },
  content: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  card: {
    backgroundColor: colors.panelSoft,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: '#9D82F2',
    padding: spacing.lg,
  },
  title: { color: colors.textPrimary, fontWeight: '900', fontSize: 26 },
  subtitle: { color: colors.textSecondary, fontWeight: '800', marginTop: spacing.sm, lineHeight: 22 },
  btn: {
    marginTop: spacing.lg,
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#5B3900',
  },
  btnText: { color: '#4B2A00', fontWeight: '900', fontSize: 16 },
})

