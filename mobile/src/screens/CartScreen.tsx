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
import { colors, radii, spacing, typeScale } from '../theme/design';

type CartLine = Product & { quantity: number };

export default function CartScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Cart is still client-side in this UI, but will be reflected server-side by creating an Order.
  // Backend cart endpoints are not present; this screen is the dedicated checkout experience.
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
  };

  const updateQty = (id: number, qty: number) => {
    setCart((prev) => {
      if (qty <= 0) return prev.filter((i) => i.id !== id);
      return prev.map((i) => (i.id === id ? { ...i, quantity: qty } : i));
    });
  };

  const placeOrder = async () => {
    if (!cart.length) {
      Alert.alert('Cart is empty', 'Add products before placing an order.');
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
    setCancellingId(orderId);
    try {
      await cancelOrder(orderId);
      Alert.alert('Cancelled', 'Order cancelled successfully.');
      await loadData();
    } catch (e) {
      Alert.alert('Error', 'Failed to cancel order');
    } finally {
      setCancellingId(null);
    }
  };

  const recentOrders = useMemo(() => {
    // show last few orders for quick access
    return orders.slice(0, 6);
  }, [orders]);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={colors.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Cart</Text>
      </View>

      <View style={styles.cartSummary}>
        <Text style={styles.cartSummaryText}>Items: {cartCount}</Text>
        <Text style={styles.cartTotalText}>Total: ₱{cartTotal.toFixed(2)}</Text>
        <TouchableOpacity style={[styles.placeBtn, placing && styles.placeBtnDisabled]} onPress={placeOrder} disabled={placing}>
          <Text style={styles.placeBtnText}>{placing ? 'Placing...' : 'Place Order'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>Your Cart Lines</Text>
      </View>

      {cart.length === 0 ? (
        <Text style={styles.empty}>Cart is empty. Add items from the Shop below.</Text>
      ) : (
        <FlatList
          data={cart}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => {
            const lineTotal = Number(item.price) * item.quantity;
            return (
              <View style={styles.lineCard}>
                <View style={styles.lineRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.lineName}>{item.name}</Text>
                    <Text style={styles.lineMeta}>₱{Number(item.price).toFixed(2)} each</Text>
                  </View>
                  <Text style={styles.lineTotal}>₱{lineTotal.toFixed(2)}</Text>
                </View>

                <View style={styles.qtyRow}>
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
          }}
        />
      )}

      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>Shop (quick add)</Text>
      </View>
      <FlatList
        data={products.slice(0, 10)}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.quickProductCard} onPress={() => addToCart(item)}>
            <Text style={styles.quickEmoji}>🛍️</Text>
            <Text style={styles.quickName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.quickPrice}>₱{Number(item.price).toFixed(2)}</Text>
            <Text style={styles.quickAdd}>Add</Text>
          </TouchableOpacity>
        )}
      />

      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>Recent Orders</Text>
      </View>
      {recentOrders.length === 0 ? (
        <Text style={styles.muted}>No orders yet.</Text>
      ) : (
        <FlatList
          data={recentOrders}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.orderCard}>
              <Text style={styles.orderTop}>Order #{item.id} • {item.status}</Text>
              <Text style={styles.orderTotal}>₱{Number(item.total).toFixed(2)}</Text>
              {item.status === 'pending' && (
                <TouchableOpacity
                  style={[styles.cancelBtn, cancellingId === item.id && styles.cancelBtnDisabled]}
                  onPress={() => handleCancelOrder(item.id)}
                  disabled={cancellingId === item.id}
                >
                  <Text style={styles.cancelBtnText}>{cancellingId === item.id ? 'Cancelling...' : 'Cancel'}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgBottom, padding: spacing.md },
  loadingScreen: { flex: 1, backgroundColor: colors.bgBottom, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: '900' },

  cartSummary: {
    backgroundColor: colors.panel,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#A98DF6',
    marginBottom: spacing.md,
  },
  cartSummaryText: { color: colors.textSecondary, fontWeight: '800' },
  cartTotalText: { color: colors.accent, fontWeight: '900', fontSize: 18, marginTop: 4 },
  placeBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  placeBtnDisabled: { opacity: 0.6 },
  placeBtnText: { color: '#4B2A00', fontWeight: '900' },

  sectionTitleRow: { marginTop: spacing.md, marginBottom: spacing.xs },
  sectionTitle: { color: colors.textPrimary, fontWeight: '900', fontSize: 16 },
  empty: { color: colors.textMuted, fontWeight: '700', marginTop: spacing.md },
  muted: { color: colors.textMuted, fontWeight: '700' },

  lineCard: {
    backgroundColor: colors.panel,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: '#F0EBFF',
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  lineRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  lineName: { color: colors.textPrimary, fontWeight: '900' },
  lineMeta: { color: colors.textMuted, fontWeight: '700', marginTop: 2 },
  lineTotal: { color: colors.accent, fontWeight: '900' },

  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm },
  qtyBtn: { backgroundColor: colors.panelSoft, borderRadius: radii.sm, paddingHorizontal: 10, paddingVertical: 6 },
  qtyBtnText: { color: colors.textPrimary, fontWeight: '900' },
  qtyText: { color: colors.textPrimary, fontWeight: '900', minWidth: 26, textAlign: 'center' },
  removeBtn: { backgroundColor: '#fef2f2', borderRadius: radii.sm, paddingHorizontal: 10, paddingVertical: 6 },
  removeBtnText: { color: '#ef4444', fontWeight: '800', fontSize: 12 },

  quickProductCard: {
    width: 150,
    backgroundColor: colors.panel,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#F0EBFF',
    marginRight: spacing.sm,
  },
  quickEmoji: { fontSize: 22 },
  quickName: { color: colors.textPrimary, fontWeight: '900', marginTop: 6 },
  quickPrice: { color: colors.accent, fontWeight: '900', marginTop: 4 },
  quickAdd: { color: colors.primary, fontWeight: '900', marginTop: 6 },

  orderCard: {
    backgroundColor: colors.panel,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: '#F0EBFF',
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  orderTop: { color: colors.textPrimary, fontWeight: '900' },
  orderTotal: { color: colors.accent, fontWeight: '900', fontSize: 16, marginTop: 6 },
  cancelBtn: { marginTop: spacing.sm, backgroundColor: '#fef2f2', borderRadius: radii.sm, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: '#fecaca' },
  cancelBtnDisabled: { opacity: 0.6 },
  cancelBtnText: { color: '#ef4444', fontWeight: '900' },
});
