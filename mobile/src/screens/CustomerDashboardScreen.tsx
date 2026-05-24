import React, { useState, useEffect, useCallback } from 'react'
import { useNavigation } from '@react-navigation/native'
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
  RefreshControl,
  Modal,
  Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../context/AuthContext'
import { fetchProducts, fetchOrders, createOrder, cancelOrder } from '../api/client'
import { Product, Order } from '../types'
import { colors, radii, spacing, typography, shadows, typeScale } from '../theme/design'

export default function CustomerDashboardScreen() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'shop' | 'cart' | 'orders'>('shop')
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<(Product & { quantity: number })[]>([])
  const [placing, setPlacing] = useState(false)
  const [cancellingId, setCancellingId] = useState<number | null>(null)
  const [showCartModal, setShowCartModal] = useState(false)

  const CATEGORIES = ['All', 'Electronics', 'Beauty', 'Fitness', 'Gifts', 'Kitchen', 'Others']

  const loadData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const [pRes, oRes] = await Promise.all([fetchProducts(), fetchOrders()])
      setProducts(pRes.data?.products || pRes.data || [])
      setOrders(oRes.data?.orders || oRes.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadData()
  }, [loadData])

  const navigation = useNavigation<any>()

  const onRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    completed: orders.filter(o => o.status === 'completed').length,
  }

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const cartTotal = cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0)

  const filteredProducts = products.filter(p =>
    (category === 'All' || p.category === category) &&
    (search === '' || p.name?.toLowerCase().includes(search.toLowerCase()))
  )

  const addToCart = (product: Product) => {
    const exists = cart.find(i => i.id === product.id)
    if (exists) {
      setCart(cart.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i))
    } else {
      setCart([...cart, { ...product, quantity: 1 }])
    }
    Alert.alert('Added to Cart', `${product.name} added to your cart`)
  }

  const updateCartQty = (id: number, qty: number) => {
    if (qty <= 0) {
      setCart(cart.filter(i => i.id !== id))
    } else {
      setCart(cart.map(i => i.id === id ? { ...i, quantity: qty } : i))
    }
  }

  const placeOrder = async () => {
    if (!cart.length) {
      Alert.alert('Cart Empty', 'Add items to your cart before placing an order.')
      return
    }
    setPlacing(true)
    try {
      await createOrder({
        customer_name: user?.first_name || user?.email || 'Customer',
        customer_email: user?.email || '',
        items: cart.map(i => ({
          product_id: i.id,
          product_name: i.name,
          quantity: i.quantity,
          unit_price: i.price,
        })),
      })
      setCart([])
      setShowCartModal(false)
      Alert.alert('Success', 'Order placed successfully!')
      await loadData()
      setActiveTab('orders')
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
              await loadData()
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

  const renderProduct = ({ item }: { item: Product }) => {
    const inCart = cart.find(c => c.id === item.id)
    return (
      <TouchableOpacity style={styles.productCard} onPress={() => navigation.navigate('ProductDetail', { product: item })} activeOpacity={0.9}>
          <View style={styles.productImageContainer}>
            {item.image ? (
              <Image source={{ uri: item.image }} style={styles.productImage} />
            ) : (
              <Text style={styles.productEmoji}>{item.emoji || '📦'}</Text>
            )}
          {item.badge && (
            <View style={styles.productBadge}>
              <Text style={styles.productBadgeText}>{item.badge}</Text>
            </View>
          )}
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.productCategory}>{item.category}</Text>
          <Text style={styles.productPrice}>₱{Number(item.price).toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.addButton, inCart && styles.inCartButton]}
          onPress={() => addToCart(item)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.85}
        >
          <Text style={styles.addButtonText}>{inCart ? '✓ Added' : 'Add to Cart'}</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    )
  }

  const renderOrder = ({ item }: { item: Order }) => {
    const statusColors: Record<string, string> = {
      pending: colors.statusPending,
      processing: colors.statusProcessing,
      shipped: colors.statusShipped,
      completed: colors.statusCompleted,
      cancelled: colors.statusCancelled,
    }
    const status = item.status?.toLowerCase() || 'pending'
    
    return (
      <TouchableOpacity style={styles.orderCard} activeOpacity={0.8}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderId}>Order #{item.order_number || item.id}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColors[status] + '15' }]}>
            <Text style={[styles.statusText, { color: statusColors[status] }]}>
              {status.toUpperCase()}
            </Text>
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
        {item.status === 'pending' && (
          <TouchableOpacity
            style={styles.cancelOrderButton}
            onPress={() => handleCancelOrder(item.id)}
            disabled={cancellingId === item.id}
          >
            <Text style={styles.cancelOrderText}>
              {cancellingId === item.id ? 'Cancelling...' : 'Cancel Order'}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    )
  }

  const renderCartItem = ({ item }: { item: Product & { quantity: number } }) => (
    <View style={styles.cartItem}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <View style={styles.cartItemImageWrap}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.cartItemImage} />
          ) : (
            <Text style={styles.productEmoji}>{item.emoji || '📦'}</Text>
          )}
        </View>
        <View style={styles.cartItemInfo}>
          <Text style={styles.cartItemName}>{item.name}</Text>
          <Text style={styles.cartItemPrice}>₱{Number(item.price).toFixed(2)} each</Text>
        </View>
      </View>
      <View style={styles.cartItemControls}>
        <TouchableOpacity 
          style={styles.cartQtyButton} 
          onPress={() => updateCartQty(item.id, item.quantity - 1)}
        >
          <Text style={styles.cartQtyButtonText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.cartQtyText}>{item.quantity}</Text>
        <TouchableOpacity 
          style={styles.cartQtyButton} 
          onPress={() => updateCartQty(item.id, item.quantity + 1)}
        >
          <Text style={styles.cartQtyButtonText}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.cartRemoveButton} 
          onPress={() => updateCartQty(item.id, 0)}
        >
          <Text style={styles.cartRemoveText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  const renderShopTab = () => (
    <>
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total Orders</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.statusPending }]}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.statusShipped }]}>{stats.shipped}</Text>
          <Text style={styles.statLabel}>Shipped</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.statusCompleted }]}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>

      <View style={styles.filterSection}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryChip, category === cat && styles.categoryChipActive]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.categoryChipText, category === cat && styles.categoryChipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {filteredProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No products available yet.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderProduct}
          numColumns={2}
          columnWrapperStyle={styles.productRow}
          showsVerticalScrollIndicator={false}
        />
      )}
    </>
  )

  const renderCartTab = () => (
    <View style={styles.cartContainer}>
      {cart.length === 0 ? (
        <View style={styles.emptyCartContainer}>
          <Text style={styles.emptyCartTitle}>Your cart is empty</Text>
          <Text style={styles.emptyCartText}>Browse products and add items to get started</Text>
          <TouchableOpacity style={styles.shopNowButton} onPress={() => setActiveTab('shop')}>
            <Text style={styles.shopNowButtonText}>Browse Products</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={cart}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderCartItem}
            showsVerticalScrollIndicator={false}
          />
          <View style={styles.cartFooter}>
            <View style={styles.cartTotalRow}>
              <Text style={styles.cartTotalLabel}>Total Items:</Text>
              <Text style={styles.cartTotalValue}>{cartCount}</Text>
            </View>
            <View style={styles.cartTotalRow}>
              <Text style={styles.cartTotalLabel}>Total Amount:</Text>
              <Text style={styles.cartTotalPrice}>₱{cartTotal.toFixed(2)}</Text>
            </View>
            <TouchableOpacity 
              style={[styles.checkoutButton, placing && styles.buttonDisabled]} 
              onPress={placeOrder}
              disabled={placing}
            >
              <Text style={styles.checkoutButtonText}>
                {placing ? 'Placing Order...' : 'Proceed to Checkout'}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  )

  const renderOrdersTab = () => (
    <FlatList
      data={orders}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderOrder}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No orders yet</Text>
          <TouchableOpacity style={styles.shopNowButton} onPress={() => setActiveTab('shop')}>
            <Text style={styles.shopNowButtonText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      }
    />
  )

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.screenBody}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.storeName}>MY STORE</Text>
            <Text style={styles.greeting}>
              {getGreeting()}, {user?.first_name || user?.username || 'Customer'}
            </Text>
            <Text style={styles.headerSubtitle}>
              Browse products, manage your cart and track orders.
            </Text>
          </View>
          <TouchableOpacity onPress={() => setShowCartModal(true)} style={styles.cartIconContainer}>
            <Text style={styles.cartIcon}>Cart</Text>
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Tab Bar */}
        <View style={styles.tabBar}>
          {[
            { key: 'shop', label: 'Shop', icon: '' },
            { key: 'cart', label: 'Cart', icon: '' },
            { key: 'orders', label: 'My Orders', icon: '' },
          ].map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.activeTab]}
              onPress={() => setActiveTab(tab.key as any)}
            >
              {tab.icon ? <Text style={styles.tabIcon}>{tab.icon}</Text> : null}
              <Text style={[styles.tabLabel, activeTab === tab.key && styles.activeTabLabel]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {activeTab === 'shop' && renderShopTab()}
          {activeTab === 'cart' && renderCartTab()}
          {activeTab === 'orders' && renderOrdersTab()}
        </View>
      </View>

      {/* Cart Modal */}
      <Modal visible={showCartModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Your Cart</Text>
              <TouchableOpacity onPress={() => setShowCartModal(false)} style={styles.modalClose}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            {cart.length === 0 ? (
              <View style={styles.emptyCartModal}>
                <Text style={styles.emptyCartText}>Your cart is empty</Text>
              </View>
            ) : (
              <>
                <FlatList
                  data={cart}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={renderCartItem}
                  style={styles.modalCartList}
                />
                <View style={styles.modalFooter}>
                  <Text style={styles.modalTotal}>Total: ₱{cartTotal.toFixed(2)}</Text>
                  <TouchableOpacity 
                    style={[styles.modalCheckout, placing && styles.buttonDisabled]} 
                    onPress={placeOrder}
                    disabled={placing}
                  >
                    <Text style={styles.modalCheckoutText}>
                      {placing ? 'Placing...' : 'Place Order'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  screenBody: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  header: {
    backgroundColor: colors.bgCard,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomLeftRadius: radii.lg,
    borderBottomRightRadius: radii.lg,
    ...shadows.sm,
  },
  storeName: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: 'bold',
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
  cartIconContainer: {
    position: 'absolute',
    right: spacing.lg,
    top: spacing.lg,
    padding: spacing.sm,
  },
  cartIcon: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: 'bold',
  },
  cartBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    ...typography.caption,
    color: colors.textInverse,
    fontWeight: 'bold',
    fontSize: 10,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.bgCard,
    margin: spacing.lg,
    borderRadius: radii.md,
    padding: spacing.xs,
    ...shadows.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
    gap: spacing.xs,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabIcon: {
    fontSize: 16,
  },
  tabLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  activeTabLabel: {
    color: colors.textInverse,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: radii.md,
    padding: spacing.sm,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    color: colors.textPrimary,
    fontSize: typeScale.body,
  },
  categoriesScroll: {
    marginTop: spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.bgCard,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  categoryChipTextActive: {
    color: colors.textInverse,
  },
  productRow: {
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  productCard: {
    flex: 1,
    flexBasis: '48%',
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    padding: spacing.md + 2,
    marginBottom: spacing.md,
    marginHorizontal: spacing.xs,
    minWidth: 160,
    ...shadows.sm,
  },
  productImageContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    height: 190,
    borderRadius: radii.lg,
    backgroundColor: colors.bgPrimary,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  productEmoji: {
    fontSize: 68,
  },
  productBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  productBadgeText: {
    ...typography.caption,
    color: colors.textInverse,
    fontWeight: 'bold',
  },
  productInfo: {
    marginBottom: spacing.sm,
  },
  productName: {
    ...typography.subheading,
    color: colors.textPrimary,
    fontSize: 16,
  },
  productCategory: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  productPrice: {
    ...typography.heading,
    color: colors.primary,
    marginTop: spacing.xs,
    fontSize: 18,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  inCartButton: {
    backgroundColor: colors.success,
  },
  addButtonText: {
    ...typography.caption,
    color: colors.textInverse,
    fontWeight: 'bold',
    fontSize: 14,
  },
  cartContainer: {
    flex: 1,
  },
  cartItem: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  cartItemInfo: {
    marginBottom: spacing.sm,
  },
  cartItemName: {
    ...typography.subheading,
    color: colors.textPrimary,
  },
  cartItemPrice: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  cartItemControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cartItemImageWrap: {
    width: 56,
    height: 56,
    borderRadius: radii.sm,
    overflow: 'hidden',
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartItemImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cartQtyButton: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    backgroundColor: colors.bgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  cartQtyButtonText: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: 'bold',
  },
  cartQtyText: {
    ...typography.body,
    color: colors.textPrimary,
    minWidth: 30,
    textAlign: 'center',
  },
  cartRemoveButton: {
    backgroundColor: colors.error + '10',
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.error + '30',
  },
  cartRemoveText: {
    ...typography.caption,
    color: colors.error,
  },
  cartFooter: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
    ...shadows.md,
  },
  cartTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  cartTotalLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  cartTotalValue: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  cartTotalPrice: {
    ...typography.heading,
    color: colors.primary,
    fontWeight: 'bold',
  },
  checkoutButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  checkoutButtonText: {
    ...typography.bodyBold,
    color: colors.textInverse,
  },
  orderCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  orderId: {
    ...typography.subheading,
    color: colors.textPrimary,
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
    marginBottom: spacing.sm,
  },
  cancelOrderButton: {
    backgroundColor: colors.error + '10',
    borderRadius: radii.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.error + '30',
  },
  cancelOrderText: {
    ...typography.caption,
    color: colors.error,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  emptyCartContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyCartTitle: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  emptyCartText: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  shopNowButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  shopNowButtonText: {
    ...typography.bodyBold,
    color: colors.textInverse,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalTitle: {
    ...typography.heading,
    color: colors.textPrimary,
  },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    backgroundColor: colors.bgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  modalCartList: {
    padding: spacing.md,
  },
  modalFooter: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  modalTotal: {
    ...typography.heading,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  modalCheckout: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  modalCheckoutText: {
    ...typography.bodyBold,
    color: colors.textInverse,
  },
  emptyCartModal: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
})