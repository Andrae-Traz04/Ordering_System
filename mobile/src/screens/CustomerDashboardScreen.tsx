import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../context/AuthContext'
import { fetchProducts, fetchOrders, createOrder, cancelOrder } from '../api/client'
import { Product, Order } from '../types'
import { colors, radii, spacing, typeScale } from '../theme/design'

export default function CustomerDashboardScreen() {
  const { user } = useAuth()
  const [tab, setTab] = useState<'shop' | 'orders'>('shop')
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [category, setCategory] = useState<string>('All')
  const [search, setSearch] = useState<string>('')
  const [cart, setCart] = useState<Product[]>([])
  const [placing, setPlacing] = useState<boolean>(false)
  const [cancellingId, setCancellingId] = useState<number | null>(null)

  const CATEGORIES = ['All', 'Electronics', 'Beauty', 'Fitness', 'Gifts', 'Kitchen', 'Others']

  const loadData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const [pRes, oRes] = await Promise.all([fetchProducts(), fetchOrders()])
      setProducts(pRes.data.products || [])
      setOrders(oRes.data.orders || oRes.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadData()
  }, [loadData])

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    completed: orders.filter(o => o.status === 'completed').length,
  }

  const cartCount = cart.length
  const cartTotal = cart.reduce((sum, item) => sum + (Number(item.price) || 0) * (item.quantity || 1), 0) // Fixed cart total calculation

  const filteredProducts = products.filter(p =>
    (category === 'All' || p.category === category) &&
    (search === '' || p.name?.toLowerCase().includes(search.toLowerCase()))
  )

  const addToCart = (product: Product) => {
    const exists = cart.find(i => i.id === product.id)
    if (exists) {
      setCart(cart.map(i => i.id === product.id ? { ...i, quantity: (i.quantity || 1) + 1 } : i))
    } else {
      setCart([...cart, { ...product, quantity: 1 }])
    }
  }

  const updateQty = (id: number, qty: number) => {
    if (qty <= 0) {
      setCart(cart.filter(i => i.id !== id))
    } else {
      setCart(cart.map(i => i.id === id ? { ...i, quantity: qty } : i))
    }
  }

  const placeOrder = async () => {
    if (!cart.length) return
    setPlacing(true)
    try {
      await createOrder({
        customer_name: user?.first_name || user?.email || 'Customer',
        customer_email: user?.email || '',
        items: cart.map(i => ({
          product_id: i.id,
          product_name: i.name,
          quantity: i.quantity || 1,
          unit_price: i.price,
        })),
      })
      setCart([])
      Alert.alert('Success', 'Order placed successfully!')
      await loadData()
      setTab('orders')
    } catch (err: any) {
      const msg = err?.response?.data
        ? Object.values(err.response.data).flat().join(', ')
        : 'Failed to place order'
      Alert.alert('Error', msg)
    } finally {
      setPlacing(false)
    }
  }

  const handleCancelOrder = async (orderId: number) => {
    setCancellingId(orderId)
    try {
      await cancelOrder(orderId)
      await loadData()
    } catch (err) {
      Alert.alert('Error', 'Failed to cancel order')
    } finally {
      setCancellingId(null)
    }
  }

  const renderProduct = ({ item }: { item: Product }) => {
    const inCart = cart.find(c => c.id === item.id)
    return (
      <View style={styles.productCard}>
        <View style={styles.productImage}>
          <Text style={styles.productEmoji}>📦</Text>
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productCategory}>{item.category}</Text>
          <Text style={styles.productPrice}>₱{Number(item.price).toFixed(2)}</Text>
        </View>
        <View style={styles.productActions}>
          {inCart ? (
            <View style={styles.qtyControls}>
              <TouchableOpacity onPress={() => updateQty(item.id, (inCart.quantity || 1) - 1)}>
                <Text style={styles.qtyBtn}>−</Text>
              </TouchableOpacity>
              <Text style={styles.qtyText}>{inCart.quantity || 1}</Text>
              <TouchableOpacity onPress={() => updateQty(item.id, (inCart.quantity || 1) + 1)}>
                <Text style={styles.qtyBtn}>+</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(item)}>
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    )
  }

  const renderOrder = ({ item }: { item: Order }) => (
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
          <Text style={styles.cancelBtnText}>
            {cancellingId === item.id ? 'Cancelling...' : 'Cancel'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  )

  const renderShopTab = () => (
    <>
      <View style={styles.summaryRow}>
        {['Total', 'Pending', 'Shipped', 'Completed'].map((label, i) => {
          const values = [stats.total, stats.pending, stats.shipped, stats.completed]
          return (
            <View key={label} style={styles.statCard}>
              <Text style={styles.statValue}>{values[i]}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </View>
          )
        })}
      </View>

      <View style={styles.filterRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryBtn,
                category === cat && styles.categoryBtnActive,
              ]}
              onPress={() => setCategory(cat)}
            >
              <Text
                style={[
                  styles.categoryBtnText,
                  category === cat && styles.categoryBtnTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {filteredProducts.length === 0 ? (
        <Text style={styles.empty}>No products available</Text>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderProduct}
          numColumns={2}
          columnWrapperStyle={styles.productRow}
        />
      )}
    </>
  )

  const renderOrdersTab = () => (
    <>
      <View style={styles.summaryRow}>
        {['Total', 'Pending', 'Shipped', 'Completed'].map((label, i) => {
          const values = [stats.total, stats.pending, stats.shipped, stats.completed]
          return (
            <View key={label} style={styles.statCard}>
              <Text style={styles.statValue}>{values[i]}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </View>
          )
        })}
      </View>

      {orders.length === 0 ? (
        <Text style={styles.empty}>No orders yet</Text>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderOrder}
        />
      )}
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
      <View style={styles.header}>
        <Text style={styles.welcome}>Hi {user?.first_name || 'there'}!</Text>
      </View>

      <View style={styles.tabRow}>
        {(['shop', 'orders'] as const).map(tabKey => (
          <TouchableOpacity
            key={tabKey}
            style={[styles.tabBtn, tab === tabKey && styles.tabBtnActive]}
            onPress={() => setTab(tabKey)}
          >
            <Text
              style={[
                styles.tabBtnText,
                tab === tabKey && styles.tabBtnTextActive,
              ]}
            >
              {tabKey === 'shop' ? '🛍️ Shop' : '📦 Orders'}
            </Text>
          </TouchableOpacity>
        ))}
        {cartCount > 0 && (
          <TouchableOpacity style={styles.cartBtn} onPress={placeOrder} disabled={placing}>
            <Text style={styles.cartBtnText}>
              🛒 {cartCount} - ₱{cartTotal.toFixed(2)}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        {tab === 'shop' ? renderShopTab() : renderOrdersTab()}
      </View>
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
    alignItems: 'center',
    padding: spacing.md,
  },
  welcome: {
    color: colors.textPrimary,
    fontSize: typeScale.title,
    fontWeight: '700',
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  tabBtn: {
    backgroundColor: colors.panelSoft,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radii.pill,
    marginRight: spacing.sm,
  },
  tabBtnActive: {
    backgroundColor: '#7A57E8',
  },
  tabBtnText: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  tabBtnTextActive: {
    color: colors.textPrimary,
  },
  cartBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.sm,
    marginLeft: 'auto',
  },
  cartBtnText: {
    color: '#4B2A00',
    fontWeight: '700',
    fontSize: 12,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.panel,
    borderRadius: radii.sm,
    padding: spacing.sm,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  statValue: {
    color: colors.accent,
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 10,
  },
  filterRow: {
    marginBottom: spacing.md,
  },
  searchInput: {
    backgroundColor: colors.panelSoft,
    borderRadius: radii.sm,
    padding: spacing.sm,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  categoryBtn: {
    backgroundColor: colors.panelSoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    marginRight: spacing.xs,
  },
  categoryBtnActive: {
    backgroundColor: '#7A57E8',
  },
  categoryBtnText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  categoryBtnTextActive: {
    color: colors.textPrimary,
  },
  productRow: {
    justifyContent: 'space-between',
  },
  productCard: {
    backgroundColor: colors.panel,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: '#A98DF6',
    padding: spacing.sm,
    marginBottom: spacing.sm,
    flex: 1,
    marginHorizontal: 2,
  },
  productImage: {
    alignItems: 'center',
    padding: spacing.sm,
  },
  productEmoji: {
    fontSize: 32,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
  productCategory: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  productPrice: {
    color: colors.accent,
    fontWeight: '800',
    fontSize: 16,
    marginTop: 4,
  },
  productActions: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  qtyBtn: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  qtyText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    minWidth: 20,
    textAlign: 'center',
  },
  addBtn: {
    backgroundColor: '#7A57E8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.sm,
  },
  addBtnText: {
    color: colors.textPrimary,
    fontWeight: '700',
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
  empty: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
})