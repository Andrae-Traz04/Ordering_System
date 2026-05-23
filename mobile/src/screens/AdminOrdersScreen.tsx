import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchOrders, updateStatus } from '../api/client';
import { colors, radii, spacing, typeScale } from '../theme/design';
import { Order } from '../types';
import { useAuth } from '../context/AuthContext';

const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',
  processing: '#6C47FF',
  shipped: '#9B6DFF',
  completed: '#10B981',
  cancelled: '#EF4444',
};

export default function AdminOrdersScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);

  const loadOrders = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const res = await fetchOrders();
      const data = res.data?.orders ?? res.data;
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to load orders:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const canAdvance = (status?: string) => {
    const s = (status || '').toLowerCase();
    return ['pending', 'processing', 'shipped'].includes(s);
  };

  const getNextStatus = (status?: string) => {
    const s = (status || '').toLowerCase();
    const nextMap: Record<string, string> = {
      pending: 'processing',
      processing: 'shipped',
      shipped: 'completed',
    };
    return nextMap[s];
  };

  const onAdvance = async (order: Order) => {
    const next = getNextStatus(order.status);
    if (!next) return;
    try {
      await updateStatus(order.id, next);
      await loadOrders(true);
    } catch (e) {
      console.error('Failed to advance order:', e);
    }
  };

  const header = useMemo(() => {
    return (
      <View style={styles.header}>
        <Text style={styles.title}>Admin Orders</Text>
        <Text style={styles.subtitle}>
          {user ? `Logged in as ${user.username}` : '—'}
        </Text>
      </View>
    );
  }, [user]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={header}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadOrders(true);
            }}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.centered}>
              <Text style={styles.muted}>Loading orders...</Text>
            </View>
          ) : (
            <View style={styles.centered}>
              <Text style={styles.muted}>No orders found.</Text>
            </View>
          )
        }
        renderItem={({ item }) => {
          const status = (item.status || '').toLowerCase();
          return (
            <View style={styles.card}>
              <View style={styles.rowTop}>
                <View>
                  <Text style={styles.orderNumber}>{item.order_number}</Text>
                  <Text style={styles.customer}>{item.customer_name}</Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: colors.panelSoft }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLORS[status] || colors.textMuted }]}>
                    {status ? status.toUpperCase() : '—'}
                  </Text>
                </View>
              </View>

              <View style={styles.rowBottom}>
                <Text style={styles.price}>₱{Number((item as any).total || (item as any).total_amount || 0).toLocaleString()}</Text>

                {canAdvance(item.status) && (
                  <TouchableOpacity style={styles.advanceBtn} onPress={() => onAdvance(item)}>
                    <Text style={styles.advanceBtnText}>Advance</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgBottom },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.md },
  header: { padding: spacing.md, gap: 4, borderBottomWidth: 1, borderBottomColor: '#F0EBFF' },
  title: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginBottom: 2 },
  subtitle: { fontSize: 12, color: colors.textMuted },
  muted: { color: colors.textMuted, fontWeight: '600' },
  card: {
    backgroundColor: colors.panel,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: '#F0EBFF',
  },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm },
  orderNumber: { fontSize: 14, fontWeight: '900', color: colors.primary },
  customer: { marginTop: 2, fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  statusPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radii.pill },
  statusText: { fontSize: 11, fontWeight: '900' },
  rowBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md },
  price: { fontSize: 16, fontWeight: '900', color: colors.textPrimary },
  advanceBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radii.pill, backgroundColor: '#EDEAFF' },
  advanceBtnText: { fontSize: 11, fontWeight: '800', color: colors.primary },
});

