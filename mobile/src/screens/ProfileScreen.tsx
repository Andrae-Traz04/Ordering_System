import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../api/client';
import { colors, radii, spacing } from '../theme/design';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);

  const [firstName, setFirstName] = useState(user?.first_name ?? '');
  const [lastName, setLastName] = useState(user?.last_name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [address, setAddress] = useState((user as any)?.address ?? '');

  useEffect(() => {
    setFirstName(user?.first_name ?? '');
    setLastName(user?.last_name ?? '');
    setEmail(user?.email ?? '');
  }, [user]);

  const handleSave = useCallback(async () => {
    setLoading(true);
    try {
      await updateProfile({
        first_name: firstName,
        last_name: lastName,
        email,
        address,
      });
      Alert.alert('Saved', 'Profile updated successfully.');
    } catch (e: any) {
      const msg = e?.response?.data ? Object.values(e.response.data).flat().join(', ') : 'Failed to update profile';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }, [firstName, lastName, email, address]);

  const maybePickAvatar = async () => {
    // File upload is not currently wired in mobile.
    // Keeping the button so Profile UI exists; backend upload can be added later.
    Alert.alert('Not wired', 'Profile image upload is not wired end-to-end yet.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

        <Text style={styles.label}>First name</Text>
        <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} autoCapitalize="words" />

        <Text style={styles.label}>Last name</Text>
        <TextInput style={styles.input} value={lastName} onChangeText={setLastName} autoCapitalize="words" />

        <Text style={styles.label}>Address</Text>
        <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="Enter your address" />

        <TouchableOpacity style={[styles.saveBtn, loading && styles.saveBtnDisabled]} disabled={loading} onPress={handleSave}>
          <Text style={styles.saveBtnText}>{loading ? 'Saving...' : 'Save Changes'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.avatarBtn} onPress={maybePickAvatar}>
          <Text style={styles.avatarBtnText}>Change Profile Image</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.muted}>Role: {(user?.role || 'user').toUpperCase()}</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgBottom, padding: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: '900' },

  logoutBtn: { backgroundColor: colors.panelDark, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radii.sm },
  logoutText: { color: colors.textSecondary, fontWeight: '800', fontSize: 12 },

  card: { backgroundColor: colors.panel, borderRadius: radii.lg, padding: spacing.md, borderWidth: 1, borderColor: '#F0EBFF' },
  label: { color: colors.textSecondary, fontWeight: '800', marginTop: spacing.sm, marginBottom: 6 },
  input: {
    backgroundColor: colors.panelSoft,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#A98DF6',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },

  saveBtn: { marginTop: spacing.md, backgroundColor: colors.accent, borderRadius: radii.md, paddingVertical: 12, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#4B2A00', fontWeight: '900' },

  avatarBtn: { marginTop: spacing.sm, backgroundColor: colors.panelSoft, borderRadius: radii.md, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: '#A98DF6' },
  avatarBtnText: { color: colors.textPrimary, fontWeight: '900' },

  muted: { color: colors.textMuted, fontWeight: '800', marginTop: spacing.md, textAlign: 'center' },
});

