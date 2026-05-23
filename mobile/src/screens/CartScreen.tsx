import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { fetchProducts, createOrder, fetchOrders, cancelOrder } from '../api/client';
import { Product, Order } from '../types';
import { colors, radii, spacing, typography, shadows } from '../theme/design';

type CartLine = Product & { quantity: number };

export default function CartScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [placing, setPlacing] = useState(false);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, oRes] = await Promise.all([fetchProducts(), fetchOrders()]);
      setProducts(pRes.data.products || []);
      setOrders(oRes.data.orders || oRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const cartCount = cart.reduce((sum, l) => sum + l.quantity, 0);
  const cartTotal = cart.reduce((sum, l) => sum + Number(l.price) * l.quantity, 0);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const exists = prev.find((i) => i.id === product.id);
      if (exists) {
        return prev.map((i) => (i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...(product as any), quantity: 1 }];
    });
    Alert.alert('Added', `${product.name} added to cart`);
  };

  const updateQty = (id: number, qty: number) => {
    setCart((prev) => {
      if (qty <= 0) return prev.filter((i) => i.id !== id);
      return prev.map((i) => (i.id === id ? { ...i, quantity: qty } : i));
    });
  };

  const placeOrder = async () => {
    if (!cart.length) {
      Alert.alert('Cart Empty', 'Add products before placing an order.');
      return;
    }
    setPlacing(true);
    try {
      await createOrder({
        customer_name: user?.first_name || user?.email || 'Customer',
        customer_email: user?.email || '',
        items: cart.map((i) => ({
          product_id: i.id,
          product_name: i.name,
          quantity: i.quantity,
          unit_price: i.price,
        })),
      });
      setCart([]);
      Alert.alert('Success', 'Order placed successfully!');
      await loadData();
    } catch (err: any) {
      const msg = err?.response?.data
        ? Object.values(err.response.data).flat().join(', ')
        : 'Failed to place order';
      Alert.alert('Error', msg);
    } finally {
      setPlacing(false);
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    Alert.alert('Cancel Order', 'Are you sure?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes',
        style: 'destructive',
        onPress: async () => {
          setCancellingId(orderId);
          try {
            await cancelOrder(orderId);
            Alert.alert('Cancelled', 'Order cancelled successfully.');
            await loadData();
          } catch {
            Alert.alert('Error', 'Failed to cancel order');
          } finally {
            setCancellingId(null);
          }
        }
      }
    ]);
  };

  const recentOrders = useMemo(() => orders.slice(0, 6), [orders]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={[]}
        renderItem={null}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <Text style={styles.storeName}>MY STORE</Text>
              <Text style={styles.greeting}>{getGreeting()}, {user?.first_name || 'Customer'}</Text>
              <Text style={styles.headerSubtitle}>Manage your cart and track orders</Text>
            </View>

            <View style={styles.cartSummary}>
              <Text style={styles.cartSummaryTitle}>Cart Summary</Text>
              <View style={styles.cartSummaryRow}>
                <Text style={styles.cartSummaryLabel}>Items:</Text>
                <Text style={styles.cartSummaryValue}>{cartCount}</Text>
              </View>
              <View style={styles.cartSummaryRow}>
                <Text style={styles.cartSummaryLabel}>Total:</Text>
                <Text style={styles.cartSummaryPrice}>₱{cartTotal.toFixed(2)}</Text>
              </View>
              <TouchableOpacity style={[styles.placeBtn, placing && styles.buttonDisabled]} onPress={placeOrder} disabled={placing}>
                <Text style={styles.placeBtnText}>{placing ? 'Placing...' : 'Place Order'}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Your Cart</Text>
          </>
        }
        ListFooterComponent={
          <>
            {cart.length === 0 ? (
              <View style={styles.emptyCart}>
                <Text style={styles.emptyCartText}>Your cart is empty</Text>
                <Text style={styles.emptyCartHint}>Add items from the shop below</Text>
              </View>
            ) : (
              cart.map((item) => {
                const lineTotal = Number(item.price) * item.quantity;
                return (
                  <View key={item.id} style={styles.cartItem}>
                    <View style={styles.cartItemHeader}>
                      <Text style={styles.cartItemName}>{item.name}</Text>
                      <Text style={styles.cartItemTotal}>₱{lineTotal.toFixed(2)}</Text>
                    </View>
                    <Text style={styles.cartItemPrice}>₱{Number(item.price).toFixed(2)} each</Text>
                    <View style={styles.cartItemControls}>
                      <TouchableOpacity onPress={() => updateQty(item.id, item.quantity - 1)} style={styles.qtyBtn}>
                        <Text style={styles.qtyBtnText}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.qtyText}>{item.quantity}</Text>
                      <TouchableOpacity onPress={() => updateQty(item.id, item.quantity + 1)} style={styles.qtyBtn}>
                        <Text style={styles.qtyBtnText}>+</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => updateQty(item.id, 0)} style={styles.removeBtn}>
                        <Text style={styles.removeBtnText}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}

            <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Quick Add from Shop</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.shopScroll}>
              {products.slice(0, 10).map((product) => (
                <TouchableOpacity key={product.id} style={styles.quickProduct} onPress={() => addToCart(product)}>
                  <Text style={styles.quickName} numberOfLines={1}>{product.name}</Text>
                  <Text style={styles.quickPrice}>₱{Number(product.price).toFixed(2)}</Text>
                  <Text style={styles.quickAdd}>Add</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Recent Orders</Text>
            {recentOrders.length === 0 ? (
              <Text style={styles.muted}>No orders yet.</Text>
            ) : (
              recentOrders.map((order) => (
                <View key={order.id} style={styles.orderCard}>
                  <View style={styles.orderHeader}>
                    <Text style={styles.orderNumber}>Order #{order.id}</Text>
                    <View style={[styles.orderStatus, { backgroundColor: colors.statusPending + '15' }]}>
                      <Text style={[styles.orderStatusText, { color: colors.statusPending }]}>{order.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.orderTotal}>₱{Number(order.total).toFixed(2)}</Text>
                  {order.status === 'pending' && (
                    <TouchableOpacity
                      style={[styles.cancelBtn, cancellingId === order.id && styles.buttonDisabled]}
                      onPress={() => handleCancelOrder(order.id)}
                      disabled={cancellingId === order.id}
                    >
                      <Text style={styles.cancelBtnText}>{cancellingId === order.id ? 'Cancelling...' : 'Cancel'}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            )}
          </>
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      />
    </SafeAreaView>
  );
}

const ScrollView = ({ horizontal, showsHorizontalScrollIndicator, children, style }: any) => {
  const { ScrollView: RNScrollView } = require('react-native');
  return (
    <RNScrollView horizontal={horizontal} showsHorizontalScrollIndicator={showsHorizontalScrollIndicator} style={style}>
      {children}
    </RNScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  loadingScreen: {
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
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
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
  cartSummary: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  cartSummaryTitle: {
    ...typography.subheading,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  cartSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  cartSummaryLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  cartSummaryValue: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  cartSummaryPrice: {
    ...typography.heading,
    color: colors.primary,
    fontWeight: 'bold',
  },
  placeBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  placeBtnText: {
    ...typography.bodyBold,
    color: colors.textInverse,
  },
  sectionTitle: {
    ...typography.subheading,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  emptyCart: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyCartText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  emptyCartHint: {
    ...typography.caption,
    color: colors.textMuted,
  },
  cartItem: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  cartItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  cartItemName: {
    ...typography.subheading,
    color: colors.textPrimary,
  },
  cartItemTotal: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  cartItemPrice: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  cartItemControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    backgroundColor: colors.bgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  qtyBtnText: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: 'bold',
  },
  qtyText: {
    ...typography.body,
    color: colors.textPrimary,
    minWidth: 30,
    textAlign: 'center',
  },
  removeBtn: {
    backgroundColor: colors.error + '10',
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.error + '30',
  },
  removeBtnText: {
    ...typography.caption,
    color: colors.error,
  },
  shopScroll: {
    marginBottom: spacing.md,
  },
  quickProduct: {
    width: 120,
    backgroundColor: colors.bgCard,
    borderRadius: radii.md,
    padding: spacing.sm,
    marginRight: spacing.sm,
    alignItems: 'center',
    ...shadows.sm,
  },
  quickName: {
    ...typography.caption,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  quickPrice: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: 'bold',
    marginTop: 2,
  },
  quickAdd: {
    ...typography.caption,
    color: colors.textInverse,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    marginTop: spacing.xs,
  },
  muted: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  orderCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  orderNumber: {
    ...typography.subheading,
    color: colors.textPrimary,
  },
  orderStatus: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  orderStatusText: {
    ...typography.caption,
    fontWeight: 'bold',
  },
  orderTotal: {
    ...typography.heading,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  cancelBtn: {
    backgroundColor: colors.error + '10',
    borderRadius: radii.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.error + '30',
  },
  cancelBtnText: {
    ...typography.caption,
    color: colors.error,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});