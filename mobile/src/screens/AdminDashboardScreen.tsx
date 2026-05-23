import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  FlatList,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { fetchSummary, fetchOrders, updateStatus } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { colors, radii, spacing, typography, shadows } from '../theme/design'

const { width } = Dimensions.get('window')
const WORKFLOW = ['pending', 'processing', 'shipped', 'completed']

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: colors.statusPending },
  processing: { label: 'Processing', color: colors.statusProcessing },
  shipped: { label: 'Shipped', color: colors.statusShipped },
  completed: { label: 'Completed', color: colors.statusCompleted },
}

export default function AdminDashboardScreen() {
  const { user } = useAuth()
  const [summary, setSummary] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState('All')

  const loadData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true)
    try {
      const [sRes, oRes] = await Promise.all([fetchSummary(), fetchOrders()])
      setSummary(sRes.data)
      const nextOrders = oRes.data?.orders ?? oRes.data ?? []
      setOrders(Array.isArray(nextOrders) ? nextOrders : [])
    } catch (error) {
      console.error('Error fetching admin dashboard data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    loadData(true)
  }, [loadData])

  const handleAdvance = async (orderId: number, currentStatus: string) => {
    const nextMap: Record<string, string> = {
      pending: 'processing',
      processing: 'shipped',
      shipped: 'completed',
    }
    const next = nextMap[currentStatus]
    if (!next) return

    try {
      await updateStatus(orderId, next)
      loadData(true)
    } catch (err) {
      console.error('Failed to advance status:', err)
    }
  }

  const filteredOrders = filter === 'All'
    ? orders
    : orders.filter(o => o.status?.toLowerCase() === filter.toLowerCase())

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  if (!user) return null

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={styles.scrollContent}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <Text style={styles.storeName}>MY STORE</Text>
              <Text style={styles.greeting}>
                {getGreeting()}, {user?.first_name || user?.username}
              </Text>
              <Text style={styles.headerSubtitle}>System Overview - Admin Dashboard</Text>
            </View>

            {summary && (
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{summary.total_orders}</Text>
                  <Text style={styles.statLabel}>Total Orders</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>₱{Math.floor(Number(summary.total_revenue || 0)).toLocaleString()}</Text>
                  <Text style={styles.statLabel}>Revenue</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={[styles.statValue, { color: colors.statusPending }]}>{summary.by_status?.pending || 0}</Text>
                  <Text style={styles.statLabel}>Pending</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={[styles.statValue, { color: colors.statusCompleted }]}>{summary.by_status?.completed || 0}</Text>
                  <Text style={styles.statLabel}>Completed</Text>
                </View>
              </View>
            )}

            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>Order Pipeline</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pipelineScroll}>
                <TouchableOpacity
                  onPress={() => setFilter('All')}
                  style={[styles.filterChip, filter === 'All' && styles.filterChipActive]}
                >
                  <Text style={[styles.filterChipText, filter === 'All' && styles.filterChipTextActive]}>All</Text>
                </TouchableOpacity>
                {WORKFLOW.map(status => {
                  const config = STATUS_CONFIG[status]
                  return (
                    <TouchableOpacity
                      key={status}
                      onPress={() => setFilter(status)}
                      style={[styles.filterChip, filter === status && styles.filterChipActive]}
                    >
                      <Text style={[styles.filterChipText, filter === status && styles.filterChipTextActive]}>
                        {config.label}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </ScrollView>
            </View>

            <Text style={styles.sectionTitle}>Recent Orders</Text>
          </>
        }
        renderItem={({ item }) => {
          const config = STATUS_CONFIG[item.status?.toLowerCase()] || STATUS_CONFIG.pending
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
              <View style={styles.orderFooter}>
                <Text style={styles.orderTotal}>₱{Number(item.total || item.total_amount || 0).toLocaleString()}</Text>
                {['pending', 'processing', 'shipped'].includes(item.status?.toLowerCase()) && (
                  <TouchableOpacity style={styles.advanceBtn} onPress={() => handleAdvance(item.id, item.status)}>
                    <Text style={styles.advanceBtnText}>Advance →</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )
        }}
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bgPrimary,
  },
  scrollContent: {
    padding: spacing.md,
  },
  header: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    padding: spacing.lg,
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
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: colors.bgCard,
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
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
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.subheading,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  pipelineScroll: {
    flexDirection: 'row',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.bgCard,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: spacing.xs,
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
    gap: 4,
  },
  statusText: {
    ...typography.caption,
    fontWeight: 'bold',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderTotal: {
    ...typography.heading,
    color: colors.primary,
    fontWeight: 'bold',
  },
  advanceBtn: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
  },
  advanceBtnText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: 'bold',
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