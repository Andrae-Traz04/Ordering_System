import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchCustomers } from '../api/client';
import { colors, radii, spacing } from '../theme/design';
import { useAuth } from '../context/AuthContext';

export default function AdminCustomersScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);

  const loadCustomers = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const res = await fetchCustomers();
      const data = res.data?.customers ?? res.data;
      setCustomers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to load customers:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={customers}
        keyExtractor={(item) => (item.id ?? item.email ?? Math.random()).toString()}
        contentContainerStyle={{ padding: spacing.md }}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Customers</Text>
            <Text style={styles.subtitle}>{user ? `Admin: ${user.username}` : ''}</Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadCustomers(true);
            }}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.muted}>{loading ? 'Loading customers...' : 'No customers found.'}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name || item.username || '—'}</Text>
            <Text style={styles.email}>{item.email || '—'}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgBottom },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xl },
  muted: { color: colors.textMuted, fontWeight: '700' },
  header: { marginBottom: spacing.md },
  title: { fontSize: 20, fontWeight: '900', color: colors.textPrimary, marginBottom: 2 },
  subtitle: { color: colors.textMuted, fontWeight: '700' },
  card: {
    backgroundColor: colors.panel,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#F0EBFF',
    marginBottom: spacing.sm,
  },
  name: { fontSize: 14, fontWeight: '900', color: colors.textPrimary },
  email: { marginTop: 2, fontSize: 12, fontWeight: '700', color: colors.textMuted },
});

