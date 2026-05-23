import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../context/AuthContext'
import { fetchSummary, fetchOrders, updateStatus } from '../api/client'

import { OrderSummary as Summary, Order } from '../types'
import { colors, radii, spacing, typeScale } from '../theme/design'

const WORKFLOW = ['pending', 'processing', 'shipped', 'completed']
const NEXT_STATUS: Record<string, string | null> = {
  pending: 'processing',
  processing: 'shipped',
  shipped: 'completed',
  completed: null,
}

export default function OwnerDashboardScreen() {
  const { user } = useAuth()
  const [summary, setSummary] = useState<Summary | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [error, setError] = useState<string>('')

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const [summaryRes, ordersRes] = await Promise.all([
        fetchSummary(),
        fetchOrders(),
      ])
      setSummary(summaryRes.data)
      setOrders(ordersRes.data.orders || ordersRes.data || [])
    } catch (err) {
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const onRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  const displayedOrders = statusFilter
    ? orders.filter(o => o.status === statusFilter)
    : orders

  const handleAdvance = async (orderId: number, currentStatus: string) => {
    const nextStatus = NEXT_STATUS[currentStatus]
    if (!nextStatus) return
    setUpdatingId(orderId)
    try {
      await updateStatus(orderId, nextStatus, `Manually advanced to ${nextStatus}`)
      await loadData()
    } catch (err) {
      setError('Failed to update status')
    } finally {
      setUpdatingId(null)
    }
  }

  const renderOrderItem = ({ item }: { item: Order }) => {
    const nextStatus = NEXT_STATUS[item.status]
    const isUpdating = updatingId === item.id

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderRow}>
          <Text style={styles.orderId}>Order #{item.id}</Text>
          <View style={styles.statusPill}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
        <Text style={styles.customerName}>{item.customer_name}</Text>
        <Text style={styles.orderTotal}>₱{Number(item.total).toFixed(2)}</Text>
        <Text style={styles.orderDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
        {nextStatus && (
          <TouchableOpacity
            style={[styles.advanceBtn, isUpdating && styles.advanceBtnDisabled]}
            onPress={() => handleAdvance(item.id, item.status)}
            disabled={isUpdating}
          >
            <Text style={styles.advanceBtnText}>
              {isUpdating ? 'Processing...' : `→ ${nextStatus}`}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    )
  }

  const listHeader = (
    <>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcome}>Hi {user?.first_name || 'there'},</Text>
          <Text style={styles.headline}>Owner Dashboard</Text>
        </View>
      </View>


      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {summary && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Business Overview</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.metricTile}>
              <Text style={styles.metricValue}>{summary.total_orders}</Text>
              <Text style={styles.metricLabel}>Total Orders</Text>
            </View>
            <View style={styles.metricTile}>
              <Text style={styles.metricValue}>{summary.by_status.pending}</Text>
              <Text style={styles.metricLabel}>Pending</Text>
            </View>
            <View style={styles.metricTileWide}>
              <Text style={styles.metricValue}>₱{Number(summary.total_revenue).toFixed(2)}</Text>
              <Text style={styles.metricLabel}>Revenue</Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.filterRow}>
        {['', 'pending', 'processing', 'shipped', 'completed'].map((status) => (
          <TouchableOpacity
            key={status || 'all'}
            style={[
              styles.filterBtn,
              statusFilter === status && styles.filterBtnActive,
            ]}
            onPress={() => setStatusFilter(status)}
          >
            <Text
              style={[
                styles.filterBtnText,
                statusFilter === status && styles.filterBtnTextActive,
              ]}
            >
              {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'All'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Customer Orders</Text>
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
    <SafeAreaView style={styles.container}>
      <FlatList
        data={displayedOrders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderOrderItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={<Text style={styles.empty}>No orders found</Text>}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </SafeAreaView>
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
  listContent: {
    padding: spacing.md,
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

  errorText: {
    color: '#ff6b6b',
    marginBottom: spacing.sm,
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
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  filterBtn: {
    backgroundColor: colors.panelSoft,
    borderWidth: 1,
    borderColor: '#A98DF6',
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterBtnActive: {
    backgroundColor: '#7A57E8',
    borderColor: '#A98DF6',
  },
  filterBtnText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  filterBtnTextActive: {
    color: colors.textPrimary,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontWeight: '800',
    fontSize: 18,
    marginBottom: spacing.sm,
  },
  orderCard: {
    backgroundColor: colors.panel,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: '#A98DF6',
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderId: {
    color: colors.textPrimary,
    fontWeight: '800',
    fontSize: 15,
  },
  customerName: {
    color: colors.textSecondary,
    marginTop: 4,
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
  orderDate: {
    color: colors.textMuted,
    marginTop: 4,
  },
  advanceBtn: {
    backgroundColor: '#5A2ECB',
    borderRadius: radii.sm,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },
  advanceBtnDisabled: {
    opacity: 0.6,
  },
  advanceBtnText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 12,
  },
  empty: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
})