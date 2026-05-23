import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView as RNScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../context/AuthContext'
import { fetchSummary, fetchOrders, updateStatus } from '../api/client'
import { colors, radii, spacing, typography, shadows } from '../theme/design'

const STATUS_CONFIG: Record<string, { label: string; color: string; next?: string }> = {
  pending: { label: 'Pending', color: colors.statusPending, next: 'processing' },
  processing: { label: 'Processing', color: colors.statusProcessing, next: 'shipped' },
  shipped: { label: 'Shipped', color: colors.statusShipped, next: 'completed' },
  completed: { label: 'Completed', color: colors.statusCompleted },
}

export default function OwnerDashboardScreen() {
  const { user } = useAuth()
  const [summary, setSummary] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [summaryRes, ordersRes] = await Promise.all([fetchSummary(), fetchOrders()])
      setSummary(summaryRes.data)
      setOrders(ordersRes.data.orders || ordersRes.data || [])
    } catch (err) {
      console.error(err)
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

  const handleAdvance = async (orderId: number, currentStatus: string) => {
    const next = STATUS_CONFIG[currentStatus]?.next
    if (!next) return
    setUpdatingId(orderId)
    try {
      await updateStatus(orderId, next)
      await loadData()
    } catch (err) {
      console.error(err)
    } finally {
      setUpdatingId(null)
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const displayedOrders = statusFilter
    ? orders.filter(o => o.status === statusFilter)
    : orders

  const renderOrderItem = ({ item }: { item: any }) => {
    const config = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending
    const canAdvance = !!STATUS_CONFIG[item.status]?.next

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderNumber}>#{item.order_number || item.id}</Text>
            <Text style={styles.customerName}>{item.customer_name}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: config.color + '15' }]}>
            <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
          </View>
        </View>
        
        <Text style={styles.orderTotal}>₱{Number(item.total || item.total_amount).toFixed(2)}</Text>
        <Text style={styles.orderDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
        
        {canAdvance && (
          <TouchableOpacity
            style={[styles.advanceButton, updatingId === item.id && styles.buttonDisabled]}
            onPress={() => handleAdvance(item.id, item.status)}
            disabled={updatingId === item.id}
          >
            <Text style={styles.advanceButtonText}>
              {updatingId === item.id ? 'Processing...' : `Mark as ${STATUS_CONFIG[item.status]?.next?.toUpperCase()}`}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    )
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={displayedOrders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderOrderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <Text style={styles.storeName}>MY STORE</Text>
              <Text style={styles.greeting}>
                {getGreeting()}, {user?.first_name || user?.username || 'Owner'}
              </Text>
              <Text style={styles.headerSubtitle}>Manage orders, track inventory, and grow your business.</Text>
            </View>

            {summary && (
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{summary.total_orders}</Text>
                  <Text style={styles.statLabel}>Total Orders</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={[styles.statValue, { color: colors.statusPending }]}>{summary.by_status?.pending || 0}</Text>
                  <Text style={styles.statLabel}>Pending</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={[styles.statValue, { color: colors.statusProcessing }]}>{summary.by_status?.processing || 0}</Text>
                  <Text style={styles.statLabel}>Processing</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={[styles.statValue, { color: colors.statusShipped }]}>{summary.by_status?.shipped || 0}</Text>
                  <Text style={styles.statLabel}>Shipped</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={[styles.statValue, { color: colors.statusCompleted }]}>{summary.by_status?.completed || 0}</Text>
                  <Text style={styles.statLabel}>Completed</Text>
                </View>
                <View style={[styles.statCard, styles.wideCard]}>
                  <Text style={styles.statValue}>₱{Number(summary.total_revenue).toLocaleString()}</Text>
                  <Text style={styles.statLabel}>Total Revenue</Text>
                </View>
              </View>
            )}

            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>Filter by Status</Text>
              <RNScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                  style={[styles.filterChip, !statusFilter && styles.filterChipActive]}
                  onPress={() => setStatusFilter('')}
                >
                  <Text style={[styles.filterChipText, !statusFilter && styles.filterChipTextActive]}>All Orders</Text>
                </TouchableOpacity>
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <TouchableOpacity
                    key={key}
                    style={[styles.filterChip, statusFilter === key && styles.filterChipActive]}
                    onPress={() => setStatusFilter(statusFilter === key ? '' : key)}
                  >
                    <Text style={[styles.filterChipText, statusFilter === key && styles.filterChipTextActive]}>
                      {config.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </RNScrollView>
            </View>

            <Text style={styles.sectionTitle}>Recent Orders</Text>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No orders found</Text>
          </View>
        }
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgPrimary,
  },
  header: {
    backgroundColor: colors.bgCard,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  storeName: {
    ...typography.caption,
    color: colors.primary,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  greeting: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: colors.bgCard,
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  wideCard: {
    width: '100%',
  },
  statValue: {
    ...typography.heading,
    color: colors.primary,
    fontWeight: 'bold',
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  filterSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.subheading,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.bgCard,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.textInverse,
  },
  orderCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  orderNumber: {
    ...typography.subheading,
    color: colors.textPrimary,
  },
  customerName: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  statusText: {
    ...typography.caption,
    fontWeight: 'bold',
  },
  orderTotal: {
    ...typography.heading,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  orderDate: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  advanceButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  advanceButtonText: {
    ...typography.bodyBold,
    color: colors.textInverse,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
  },
})