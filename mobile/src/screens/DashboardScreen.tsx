import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useAuth } from '../context/AuthContext'
import { fetchSummary, fetchOrders } from '../api/client'
import { Summary, Order } from '../types'
import { colors, radii, spacing, typeScale } from '../theme/design'

export default function DashboardScreen() {
  const { user, logout } = useAuth()
  const [summary, setSummary] = useState<Summary | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  const loadData = async () => {
    setLoading(true)
    try {
      const [summaryRes, ordersRes] = await Promise.all([
        fetchSummary(),
        fetchOrders(),
      ])
      setSummary(summaryRes.data)
      setOrders(ordersRes.data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const renderOrderItem = ({ item }: { item: Order }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderRow}>
        <Text style={styles.orderId}>Order #{item.id}</Text>
        <View style={styles.statusPill}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.orderTotal}>${Number(item.total).toFixed(2)}</Text>
      <Text style={styles.orderMeta}>{new Date(item.created_at).toLocaleDateString()}</Text>
    </View>
  )

  const listHeader = (
    <>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcome}>Hi {user?.first_name || 'there'},</Text>
          <Text style={styles.headline}>Your order cockpit</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {summary && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Today at a glance</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.metricTile}>
              <Text style={styles.metricValue}>{summary.total_orders}</Text>
              <Text style={styles.metricLabel}>Total orders</Text>
            </View>
            <View style={styles.metricTile}>
              <Text style={styles.metricValue}>{summary.pending_orders}</Text>
              <Text style={styles.metricLabel}>Pending</Text>
            </View>
            <View style={styles.metricTileWide}>
              <Text style={styles.metricValue}>${Number(summary.total_revenue).toFixed(2)}</Text>
              <Text style={styles.metricLabel}>Revenue</Text>
            </View>
          </View>
        </View>
      )}

      <Text style={styles.sectionTitle}>Recent orders</Text>
    </>
  )

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderOrderItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={<Text style={styles.empty}>No orders yet.</Text>}
        contentContainerStyle={styles.listContent}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgBottom,
  },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgBottom,
  },
  glowTop: {
    position: 'absolute',
    top: -120,
    left: -100,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: colors.bgTop,
    opacity: 0.55,
  },
  glowBottom: {
    position: 'absolute',
    bottom: -120,
    right: -100,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: colors.panel,
    opacity: 0.45,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  welcome: {
    color: colors.textSecondary,
    fontSize: typeScale.body,
    fontWeight: '600',
  },
  headline: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    marginTop: 2,
  },
  logoutButton: {
    backgroundColor: '#7A57E8',
    borderWidth: 1,
    borderColor: '#A98DF6',
    borderRadius: radii.pill,
    paddingHorizontal: 14,
    minHeight: 36,
    justifyContent: 'center',
  },
  logoutText: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.2,
  },
  summaryCard: {
    backgroundColor: colors.panelDark,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: '#8F6AEE',
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  summaryTitle: {
    color: colors.textPrimary,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metricTile: {
    flexGrow: 1,
    flexBasis: '48%',
    backgroundColor: colors.panelSoft,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#A98DF6',
  },
  metricTileWide: {
    width: '100%',
    backgroundColor: '#7E53EC',
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#B49CF6',
  },
  metricValue: {
    color: colors.accent,
    fontSize: typeScale.title,
    fontWeight: '800',
  },
  metricLabel: {
    color: colors.textSecondary,
    marginTop: 4,
  },
  orderCard: {
    backgroundColor: colors.panel,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: '#A98DF6',
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  orderId: {
    color: colors.textPrimary,
    fontWeight: '800',
    fontSize: 15,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusPill: {
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    minHeight: 26,
    justifyContent: 'center',
    backgroundColor: '#5A2ECB',
    borderWidth: 1,
    borderColor: '#9E84F4',
  },
  statusText: {
    color: colors.textSecondary,
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'capitalize',
  },
  orderTotal: {
    color: colors.accent,
    fontSize: 22,
    fontWeight: '800',
    marginTop: spacing.sm,
  },
  orderMeta: {
    color: colors.textMuted,
    marginTop: 4,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontWeight: '800',
    fontSize: 18,
    marginBottom: spacing.sm,
  },
  empty: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
})