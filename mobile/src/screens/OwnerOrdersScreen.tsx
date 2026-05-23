import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../context/AuthContext'
import { fetchOrders, updateStatus } from '../api/client'
import { Order } from '../types'
import { colors, radii, spacing, typeScale } from '../theme/design'
import { useNavigation } from '@react-navigation/native'

const NEXT_STATUS: Record<string, string | null> = {
  pending: 'processing',
  processing: 'shipped',
  shipped: 'completed',
  completed: null,
}

export default function OwnerOrdersScreen() {
  const { user } = useAuth()


  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [statusFilter, setStatusFilter] = useState<string>('')

  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [error, setError] = useState<string>('')

  const loadOrders = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetchOrders()
      const data = res.data?.orders ?? res.data
      setOrders(Array.isArray(data) ? data : [])
    } catch {
      setError('Failed to load orders')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onRefresh = async () => {
    setRefreshing(true)
    await loadOrders()
    setRefreshing(false)
  }

  const displayedOrders = statusFilter
    ? orders.filter(o => o.status === statusFilter)
    : orders

  const handleAdvance = async (order: Order) => {
    const next = NEXT_STATUS[(order.status || '').toLowerCase()]
    if (!next) return
    setUpdatingId(order.id)
    try {
      await updateStatus(order.id, next)
      await loadOrders()
    } catch {
      setError('Failed to update order status')
    } finally {
      setUpdatingId(null)
    }
  }

  const navigation = useNavigation<any>()

  const renderOrder = ({ item }: { item: Order }) => {
    const next = NEXT_STATUS[(item.status || '').toLowerCase()]
    const isUpdating = updatingId === item.id

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => navigation.navigate('OrderDetail' as never, { orderId: item.id } as never)}
      >

          <View style={styles.orderCard}>
            <View style={styles.rowTop}>
              <View>
                <Text style={styles.orderId}>Order #{item.id}</Text>
                {!!item.customer_name && <Text style={styles.customerName}>{item.customer_name}</Text>}
              </View>
              <View style={styles.statusPill}>
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>

            <Text style={styles.orderTotal}>₱{Number(item.total).toFixed(2)}</Text>
            <Text style={styles.orderDate}>{new Date(item.created_at).toLocaleDateString()}</Text>

            {next && (
              <TouchableOpacity
                style={[styles.advanceBtn, isUpdating && styles.advanceBtnDisabled]}
                disabled={isUpdating}
                onPress={() => handleAdvance(item)}
              >
                <Text style={styles.advanceBtnText}>{isUpdating ? 'Processing...' : `→ ${next}`}</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <View style={styles.loadingScreen}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={displayedOrders}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderOrder}
          ListEmptyComponent={<Text style={styles.empty}>No orders found</Text>}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListHeaderComponent={
            <View>
              <View style={styles.header}>
                <View>
                  <Text style={styles.welcome}>Hi {user?.first_name || 'there'},</Text>
                  <Text style={styles.title}>Owner Orders</Text>
                </View>

              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <View style={styles.filterRow}>
                {['', 'pending', 'processing', 'shipped', 'completed'].map((s) => (
                  <TouchableOpacity
                    key={s || 'all'}
                    style={[styles.filterBtn, statusFilter === s && styles.filterBtnActive]}
                    onPress={() => setStatusFilter(s)}
                  >
                    <Text style={[styles.filterBtnText, statusFilter === s && styles.filterBtnTextActive]}>
                      {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sectionTitle}>Customer Orders</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgBottom,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgBottom,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  welcome: {
    color: colors.textSecondary,
    fontSize: typeScale.body,
    fontWeight: '600',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '900',
    marginTop: 2,
  },

  errorText: {
    color: '#ff6b6b',
    marginBottom: spacing.sm,
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
  empty: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  orderCard: {
    backgroundColor: colors.panel,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: '#A98DF6',
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  orderId: {
    color: colors.textPrimary,
    fontWeight: '900',
    fontSize: 15,
  },
  customerName: {
    marginTop: 2,
    color: colors.textSecondary,
    fontWeight: '700',
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
    fontWeight: '800',
    fontSize: 12,
    textTransform: 'capitalize',
  },
  orderTotal: {
    color: colors.accent,
    fontSize: 22,
    fontWeight: '900',
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
    fontWeight: '700',
    fontSize: 12,
  },
})

