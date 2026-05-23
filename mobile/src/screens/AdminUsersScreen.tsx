import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchUsers, updateUserRole } from '../api/client';
import { colors, radii, spacing } from '../theme/design';
import { useAuth } from '../context/AuthContext';
import { User } from '../types';

const ROLE_OPTIONS = ['customer', 'owner', 'admin'] as const;

type RoleOption = (typeof ROLE_OPTIONS)[number];

export default function AdminUsersScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState<Array<User & { role?: string }>>([]);
  
  const loadUsers = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const res = await fetchUsers();
      const data = res.data?.users ?? res.data;
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to load users:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const onSetRole = async (userId: number, role: RoleOption) => {
    try {
      await updateUserRole(userId, role);
      await loadUsers(true);
    } catch (e) {
      console.error('Failed to update role:', e);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: spacing.md }}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Users</Text>
            <Text style={styles.subtitle}>{user ? `Admin: ${user.username}` : ''}</Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadUsers(true);
            }}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.muted}>{loading ? 'Loading users...' : 'No users found.'}</Text>
          </View>
        }
        renderItem={({ item }) => {
          const current = (item.role || '').toLowerCase();
          return (
            <View style={styles.card}>
              <View style={styles.rowTop}>
                <View>
                  <Text style={styles.name}>{item.username}</Text>
                  <Text style={styles.email}>{item.email}</Text>
                </View>
                <View style={styles.rolePill}>
                  <Text style={styles.roleText}>{current ? current.toUpperCase() : '—'}</Text>
                </View>
              </View>

              <View style={styles.rolesRow}>
                {ROLE_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.roleBtn, current === opt && styles.roleBtnActive]}
                    onPress={() => onSetRole(item.id, opt)}
                  >
                    <Text style={[styles.roleBtnText, current === opt && styles.roleBtnTextActive]}>
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}
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
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xl },
  muted: { color: colors.textMuted, fontWeight: '700' },
  header: { marginBottom: spacing.md },
  title: { fontSize: 20, fontWeight: '900', color: colors.textPrimary, marginBottom: 2 },
  subtitle: { color: colors.textMuted, fontWeight: '700' },
  card: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: '#F0EBFF',
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm },
  name: { fontSize: 14, fontWeight: '900', color: colors.textPrimary },
  email: { marginTop: 2, fontSize: 12, fontWeight: '700', color: colors.textMuted },
  rolePill: { backgroundColor: colors.panelSoft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radii.pill },
  roleText: { fontSize: 11, fontWeight: '900', color: colors.primary },
  rolesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: spacing.md },
  roleBtn: { backgroundColor: '#EDEAFF', paddingHorizontal: 10, paddingVertical: 8, borderRadius: radii.pill },
  roleBtnActive: { backgroundColor: colors.primary },
  roleBtnText: { fontSize: 11, fontWeight: '800', color: colors.primary },
  roleBtnTextActive: { color: '#fff' },
});

