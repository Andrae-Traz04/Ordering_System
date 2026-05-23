import React, { useCallback, useEffect, useState } from 'react'
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  ActivityIndicator, Alert, RefreshControl 
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../context/AuthContext'
import { useNavigation } from '@react-navigation/native'
import { fetchOrders, cancelOrder } from '../api/client'
import { Order } from '../types'
import { colors, radii, spacing, typography, shadows } from '../theme/design'

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: colors.statusPending },
  processing: { label: 'Processing', color: colors.statusProcessing },
  shipped: { label: 'Shipped', color: colors.statusShipped },
  completed: { label: 'Completed', color: colors.statusCompleted },
  cancelled: { label: 'Cancelled', color: colors.statusCancelled },
}

export default function CustomerOrdersScreen() {
  const { user } = useAuth()
  const navigation = useNavigation<any>()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [cancellingId, setCancellingId] = useState<number | null>(null)

  const loadOrders = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const res = await fetchOrders()
      const data = res.data?.orders ?? res.data
      setOrders(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  const onRefresh = async () => {
    setRefreshing(true)
    await loadOrders()
    setRefreshing(false)
  }

  const handleCancelOrder = async (orderId: number) => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            setCancellingId(orderId)
            try {
              await cancelOrder(orderId)
              await loadOrders()
              Alert.alert('Success', 'Order cancelled successfully')
            } catch {
              Alert.alert('Error', 'Failed to cancel order')
            } finally {
              setCancellingId(null)
            }
          }
        }
      ]
    )
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const renderOrder = ({ item }: { item: Order }) => {
    const config = STATUS_CONFIG[item.status?.toLowerCase()] || STATUS_CONFIG.pending
    return (
      <TouchableOpacity 
        style={styles.orderCard} 
        onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
        activeOpacity={0.7}
      >
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderNumber}>Order #{item.order_number || item.id}</Text>
            <Text style={styles.orderDate}>
              {new Date(item.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: config.color + '15' }]}>
            <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
          </View>
        </View>
        <Text style={styles.orderTotal}>₱{Number(item.total).toFixed(2)}</Text>
        {item.status === 'pending' && (
          <TouchableOpacity
            style={[styles.cancelButton, cancellingId === item.id && styles.buttonDisabled]}
            onPress={() => handleCancelOrder(item.id)}
            disabled={cancellingId === item.id}
          >
            <Text style={styles.cancelButtonText}>
              {cancellingId === item.id ? 'Cancelling...' : 'Cancel Order'}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    )
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your orders...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderOrder}
        contentContainerStyle={orders.length === 0 ? styles.emptyContent : styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.storeName}>MY STORE</Text>
            <Text style={styles.greeting}>{getGreeting()}, {user?.first_name || 'Customer'}</Text>
            <Text style={styles.title}>My Orders</Text>
            <Text style={styles.subtitle}>Track and manage your order history</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No orders yet</Text>
            <Text style={styles.emptyHint}>Start shopping to see your orders here</Text>
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
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  header: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    padding: spacing.lg,
    margin: spacing.md,
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
  listContent: {
    padding: spacing.md,
    paddingTop: 0,
  },
  emptyContent: {
    flexGrow: 1,
    padding: spacing.md,
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
    marginBottom: 2,
  },
  orderDate: {
    ...typography.caption,
    color: colors.textSecondary,
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
    marginBottom: spacing.md,
  },
  cancelButton: {
    backgroundColor: colors.error + '10',
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.error + '30',
  },
  cancelButtonText: {
    ...typography.bodyBold,
    color: colors.error,
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
    marginBottom: spacing.xs,
  },
  emptyHint: {
    ...typography.caption,
    color: colors.textMuted,
  },
})