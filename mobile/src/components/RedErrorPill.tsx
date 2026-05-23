import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, radii, spacing } from '../theme/design'

export default function RedErrorPill({ message }: { message: string }) {
  if (!message) return null

  return (
    <View style={styles.pill}>
      <Text style={styles.text}>{message}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  pill: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  text: {
    color: '#ef4444',
    fontWeight: '900',
  },
})

