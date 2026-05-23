import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../api/client';
import { colors, radii, spacing, typography, shadows, typeScale } from '../theme/design';
import { useNavigation } from '@react-navigation/native';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);

  const [firstName, setFirstName] = useState(user?.first_name ?? '');
  const [lastName, setLastName] = useState(user?.last_name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [address, setAddress] = useState((user as any)?.address ?? '');

  const userRole = user?.role || (user as any)?.profile?.role || 'customer';
  const isCustomer = userRole === 'customer';

  useEffect(() => {
    setFirstName(user?.first_name ?? '');
    setLastName(user?.last_name ?? '');
    setEmail(user?.email ?? '');
    setAddress((user as any)?.address ?? '');
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
      Alert.alert('Success', 'Profile updated successfully.');
    } catch (e: any) {
      const msg = e?.response?.data ? Object.values(e.response.data).flat().join(', ') : 'Failed to update profile';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }, [firstName, lastName, email, address]);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout }
      ]
    );
  };

  const handleApplyForOwner = () => {
    navigation.navigate('ApplyForOwner');
  };

  const getInitials = () => {
    if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
    if (firstName) return firstName[0].toUpperCase();
    if (user?.username) return user.username[0].toUpperCase();
    return 'U';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials()}</Text>
            </View>
          </View>
          <Text style={styles.userName}>{user?.first_name || user?.username || 'Customer'}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{userRole.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput 
              style={styles.input} 
              value={email} 
              onChangeText={setEmail} 
              keyboardType="email-address" 
              autoCapitalize="none"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={styles.inputLabel}>First Name</Text>
              <TextInput 
                style={styles.input} 
                value={firstName} 
                onChangeText={setFirstName}
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <View style={styles.half}>
              <Text style={styles.inputLabel}>Last Name</Text>
              <TextInput 
                style={styles.input} 
                value={lastName} 
                onChangeText={setLastName}
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Address</Text>
            <TextInput 
              style={[styles.input, styles.textArea]} 
              value={address} 
              onChangeText={setAddress}
              multiline
              numberOfLines={3}
              placeholderTextColor={colors.textMuted}
              placeholder="Enter your address"
            />
          </View>

          <TouchableOpacity 
            style={[styles.saveButton, loading && styles.buttonDisabled]} 
            disabled={loading} 
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Text>
          </TouchableOpacity>

          {isCustomer && (
            <TouchableOpacity style={styles.applyButton} onPress={handleApplyForOwner}>
              <Text style={styles.applyButtonText}>Apply for Owner Account</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    ...shadows.sm,
  },
  avatarContainer: {
    marginBottom: spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 40,
    color: colors.textInverse,
    fontWeight: 'bold',
  },
  userName: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  roleBadge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
  },
  roleText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: 'bold',
  },
  formContainer: {
    padding: spacing.lg,
  },
  sectionTitle: {
    ...typography.heading,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  half: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.textPrimary,
    fontSize: typeScale.body,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
    ...shadows.sm,
  },
  saveButtonText: {
    ...typography.bodyBold,
    color: colors.textInverse,
  },
  applyButton: {
    backgroundColor: colors.success + '15',
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.success + '30',
  },
  applyButtonText: {
    ...typography.bodyBold,
    color: colors.success,
  },
  logoutButton: {
    backgroundColor: colors.error + '10',
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.error + '30',
  },
  logoutButtonText: {
    ...typography.bodyBold,
    color: colors.error,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});