import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../context/AuthContext'
import { fetchOrders, updateStatus } from '../api/client'
import { Order } from '../types'
import { colors, radii, spacing, typography, shadows } from '../theme/design'
import { useNavigation } from '@react-navigation/native'

const STATUS_CONFIG: Record<string, { label: string; color: string; next?: string }> = {
  pending: { label: 'Pending', color: colors.statusPending, next: 'processing' },
  processing: { label: 'Processing', color: colors.statusProcessing, next: 'shipped' },
  shipped: { label: 'Shipped', color: colors.statusShipped, next: 'completed' },
  completed: { label: 'Completed', color: colors.statusCompleted },
}

export default function OwnerOrdersScreen() {
  const { user } = useAuth()
  const navigation = useNavigation<any>()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  const loadOrders = async () => {
    setLoading(true)
    try {
      const res = await fetchOrders()
      const data = res.data?.orders ?? res.data
      setOrders(Array.isArray(data) ? data : [])
    } catch {
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  const onRefresh = async () => {
    setRefreshing(true)
    await loadOrders()
    setRefreshing(false)
  }

  const handleAdvance = async (order: Order) => {
    const next = STATUS_CONFIG[order.status?.toLowerCase()]?.next
    if (!next) return
    setUpdatingId(order.id)
    try {
      await updateStatus(order.id, next)
      await loadOrders()
    } catch {
      // Error handling
    } finally {
      setUpdatingId(null)
    }
  }

  const displayedOrders = statusFilter
    ? orders.filter(o => o.status?.toLowerCase() === statusFilter.toLowerCase())
    : orders

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const renderOrder = ({ item }: { item: Order }) => {
    const config = STATUS_CONFIG[item.status?.toLowerCase()] || STATUS_CONFIG.pending
    const canAdvance = !!STATUS_CONFIG[item.status?.toLowerCase()]?.next
    const isUpdating = updatingId === item.id

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
      >
        <View style={styles.orderCard}>
          <View style={styles.orderHeader}>
            <View>
              <Text style={styles.orderNumber}>#{item.order_number || item.id}</Text>
              <Text style={styles.customerName}>{item.customer_name || 'Guest'}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: config.color + '15' }]}>
              <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
            </View>
          </View>

          <Text style={styles.orderTotal}>₱{Number(item.total).toFixed(2)}</Text>
          <Text style={styles.orderDate}>
            {new Date(item.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </Text>

          {canAdvance && (
            <TouchableOpacity
              style={[styles.advanceButton, isUpdating && styles.buttonDisabled]}
              disabled={isUpdating}
              onPress={() => handleAdvance(item)}
            >
              <Text style={styles.advanceButtonText}>
                {isUpdating ? 'Processing...' : `Mark as ${config.next?.toUpperCase()}`}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    )
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={displayedOrders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderOrder}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <Text style={styles.storeName}>MY STORE</Text>
              <Text style={styles.greeting}>{getGreeting()}, {user?.first_name || user?.username || 'Owner'}</Text>
              <Text style={styles.title}>Order Management</Text>
              <Text style={styles.subtitle}>Process and track customer orders</Text>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Filter by Status</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                <TouchableOpacity
                  style={[styles.filterChip, !statusFilter && styles.filterChipActive]}
                  onPress={() => setStatusFilter('')}
                >
                  <Text style={[styles.filterChipText, !statusFilter && styles.filterChipTextActive]}>All</Text>
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
              </ScrollView>
            </View>

            <Text style={styles.resultCount}>{displayedOrders.length} order{displayedOrders.length !== 1 ? 's' : ''}</Text>
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

const ScrollView = ({ horizontal, showsHorizontalScrollIndicator, children, style }: any) => {
  const { ScrollView: RNScrollView } = require('react-native')
  return (
    <RNScrollView horizontal={horizontal} showsHorizontalScrollIndicator={showsHorizontalScrollIndicator} style={style}>
      {children}
    </RNScrollView>
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
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  listContent: {
    padding: spacing.md,
    paddingTop: 0,
  },
  header: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    padding: spacing.lg,
    margin: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  storeName: {
    ...typography.caption,
    color: colors.primary,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  greeting: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  filterSection: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  filterLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  filterScroll: {
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
  resultCount: {
    ...typography.caption,
    color: colors.textSecondary,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
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