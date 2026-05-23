import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchSummary, fetchOrders, updateStatus } from '../api/client';
import { OrderSummary, Order } from '../types';
import { useAuth } from '../context/AuthContext';
import { colors, radii, spacing, typeScale } from '../theme/design';

const { width } = Dimensions.get('window');
const WORKFLOW = ['pending', 'processing', 'shipped', 'completed'];

const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',
  processing: '#6C47FF',
  shipped: '#9B6DFF',
  completed: '#10B981',
};

export default function AdminDashboardScreen() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<OrderSummary | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('All');

  const loadData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const [sRes, oRes] = await Promise.all([fetchSummary(), fetchOrders()]);
      setSummary(sRes.data);

      // Support both shapes: { orders: [...] } or [...]
      const nextOrders = oRes.data?.orders ?? oRes.data ?? [];
      setOrders(Array.isArray(nextOrders) ? nextOrders : []);
    } catch (error) {
      console.error('Error fetching admin dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Prevent excessive reloading while scrolling (no-op for now; reload is handled by pull-to-refresh).
  // Kept here to avoid future accidental high-frequency calls.
  const onScrollToTopReload = useCallback(() => {
    if (!loading && !refreshing) {
      loadData(true);
    }
  }, [loading, refreshing, loadData]);

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData(true);
  }, [loadData]);

  const handleAdvance = async (orderId: number, currentStatus: string) => {
    const nextMap: Record<string, string> = {
      pending: 'processing',
      processing: 'shipped',
      shipped: 'completed',
    };
    const next = nextMap[currentStatus];
    if (!next) return;

    try {
      await updateStatus(orderId, next);
      loadData(true);
    } catch (err) {
      console.error('Failed to advance status:', err);
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) return null;

  const filteredOrders = filter === 'All'
    ? orders
    : orders.filter(o => o.status?.toLowerCase() === filter.toLowerCase());

  const renderHeader = () => (
    <View style={styles.headerSection}>
      <View style={styles.header}>
        <Text style={styles.roleLabel}>SYSTEM ADMINISTRATOR</Text>
        <Text style={styles.welcomeText}>System Overview 🛡️</Text>
        <Text style={styles.userText}>Logged in as {user?.username}</Text>
      </View>

      {summary && (
        <View style={styles.statsGrid}>
          <StatCard label="Total Orders" value={summary.total_orders} icon="📦" color="#3B82F6" />
          <StatCard
            label="Revenue"
            value={`₱${Math.floor(Number(summary.total_revenue || 0)).toLocaleString()}`}
            icon="💰"
            color="#10B981"
          />
          <StatCard label="Pending" value={summary.by_status?.pending || 0} icon="⏳" color="#F59E0B" />
          <StatCard label="Completed" value={summary.by_status?.completed || 0} icon="✅" color="#7C3AED" />
        </View>
      )}

      <Text style={styles.sectionTitle}>Order Pipeline</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pipeline}>
        <TouchableOpacity
          onPress={() => setFilter('All')}
          style={[styles.pipeBtn, filter === 'All' && styles.pipeBtnActive]}
        >
          <Text style={[styles.pipeBtnText, filter === 'All' && styles.pipeBtnTextActive]}>All</Text>
        </TouchableOpacity>
        {WORKFLOW.map(s => (
          <TouchableOpacity
            key={s}
            onPress={() => setFilter(s)}
            style={[styles.pipeBtn, filter === s && styles.pipeBtnActive]}
          >
            <Text style={[styles.pipeBtnText, filter === s && styles.pipeBtnTextActive]}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        contentContainerStyle={styles.scrollContent}
        renderItem={({ item }) => (
          <View style={styles.orderCard}>
            <View style={styles.orderRow}>
              <View>
                <Text style={styles.orderNum}>{item.order_number}</Text>
                <Text style={styles.custName}>{item.customer_name}</Text>
              </View>
              <View style={styles.statusPill}>
                <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] || colors.textMuted }]}>
                  {item.status.toUpperCase()}
                </Text>
              </View>
            </View>
            <View style={styles.orderFooter}>
              <Text style={styles.orderPrice}>₱{Number(item.total || item.total_amount || 0).toLocaleString()}</Text>
              {['pending', 'processing', 'shipped'].includes(item.status) && (
                <TouchableOpacity style={styles.advanceBtn} onPress={() => handleAdvance(item.id, item.status)}>
                  <Text style={styles.advanceBtnText}>Advance →</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No orders found in this category.</Text>}
      />
    </SafeAreaView>
  );
}

const StatCard = ({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: string }) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <Text style={styles.statIconHeader}>{icon}</Text>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgBottom },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: spacing.md },
  headerSection: { marginBottom: spacing.md },
  header: { marginBottom: spacing.lg },
  roleLabel: { fontSize: 10, fontWeight: '700', color: colors.secondary, letterSpacing: 1.5, marginBottom: 4 },
  welcomeText: { fontSize: typeScale.headline, fontWeight: '800', color: colors.textPrimary },
  userText: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: spacing.sm },
  statCard: {
    width: (width - spacing.md * 2 - spacing.sm) / 2,
    backgroundColor: colors.panel,
    padding: spacing.md,
    borderRadius: radii.lg,
    marginBottom: spacing.xs,
    borderLeftWidth: 5,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  statIconHeader: { fontSize: 18, marginBottom: 8 },
  statLabel: { fontSize: 10, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', marginBottom: 2 },
  statValue: { fontSize: 20, fontWeight: '800' },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.md },
  pipeline: { flexDirection: 'row', marginBottom: spacing.md },
  pipeBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: radii.pill, backgroundColor: colors.panelSoft, marginRight: 8, borderWidth: 1, borderColor: '#F0EBFF' },
  pipeBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pipeBtnText: { color: colors.textMuted, fontWeight: '700', fontSize: 12 },
  pipeBtnTextActive: { color: '#fff' },
  orderCard: { backgroundColor: colors.panel, padding: spacing.md, borderRadius: radii.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: '#F0EBFF' },
  orderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  orderNum: { fontSize: 13, fontWeight: '800', color: colors.primary },
  custName: { fontSize: 14, color: colors.textPrimary, fontWeight: '600' },
  statusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: radii.sm, backgroundColor: colors.panelSoft },
  statusText: { fontSize: 10, fontWeight: '800' },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderPrice: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  advanceBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radii.pill, backgroundColor: '#EDEAFF' },
  advanceBtnText: { fontSize: 11, fontWeight: '700', color: colors.primary },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xl },
});