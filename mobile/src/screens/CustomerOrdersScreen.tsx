import React, { useCallback, useEffect, useState } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../context/AuthContext'
import { useNavigation } from '@react-navigation/native'

import { fetchOrders, createOrder, cancelOrder, fetchProducts } from '../api/client'
import { Product, Order } from '../types'
import { colors, radii, spacing, typeScale } from '../theme/design'

export default function CustomerOrdersScreen() {
  const { user } = useAuth()

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)

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
      setOrders([])
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
    setCancellingId(orderId)
    try {
      await cancelOrder(orderId)
      await loadOrders()
    } catch {
      Alert.alert('Error', 'Failed to cancel order')
    } finally {
      setCancellingId(null)
    }
  }

  const navigation = useNavigation<any>()

  const renderOrder = ({ item }: { item: Order }) => (
    <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}>
      <View style={styles.orderCard}>
        <View style={styles.orderRow}>
          <Text style={styles.orderId}>Order #{item.id}</Text>
          <View style={styles.statusPill}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
        <Text style={styles.orderTotal}>₱{Number(item.total).toFixed(2)}</Text>
        <Text style={styles.orderDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
        {item.status === 'pending' && (
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => handleCancelOrder(item.id)}
            disabled={cancellingId === item.id}
          >
            <Text style={styles.cancelBtnText}>{cancellingId === item.id ? 'Cancelling...' : 'Cancel'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  )

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingScreen}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcome}>Hi {user?.first_name || 'there'}!</Text>
          <Text style={styles.title}>My Orders</Text>
        </View>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderOrder}
        contentContainerStyle={orders.length === 0 ? styles.listEmpty : styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={<Text style={styles.empty}>No orders yet</Text>}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.md,
    gap: spacing.sm,
  },
  welcome: {
    color: colors.textPrimary,
    fontSize: typeScale.title,
    fontWeight: '700',
  },
  title: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  listEmpty: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
  },
  empty: {
    color: colors.textSecondary,
    textAlign: 'center',
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
  statusPill: {
    backgroundColor: '#5A2ECB',
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    color: colors.textSecondary,
    fontWeight: '700',
    fontSize: 12,
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
  cancelBtn: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: radii.sm,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },
  cancelBtnText: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 12,
  },
})
