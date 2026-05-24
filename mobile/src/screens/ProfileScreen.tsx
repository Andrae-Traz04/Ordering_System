import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { useAuth } from '../context/AuthContext'
import { updateProfile, uploadProfileImage } from '../api/client'
import { colors, radii, spacing, typography, shadows, typeScale } from '../theme/design'
import * as ImagePicker from 'expo-image-picker'

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth()
  const navigation = useNavigation<any>()
  const [loading, setLoading] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const [firstName, setFirstName] = useState(user?.first_name ?? '')
  const [lastName, setLastName] = useState(user?.last_name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [address, setAddress] = useState((user as any)?.address ?? '')
  const [profileUri, setProfileUri] = useState<string | null>(
    (user as any)?.profile_image || 
    (user as any)?.avatar_url || 
    (user as any)?.profile?.profile_image || 
    null
  )

  const userRole = user?.role || (user as any)?.profile?.role || 'customer'
  const isCustomer = userRole === 'customer'

  useEffect(() => {
    setFirstName(user?.first_name ?? '')
    setLastName(user?.last_name ?? '')
    setEmail(user?.email ?? '')
    setAddress((user as any)?.address ?? '')
    setProfileUri(
      (user as any)?.profile_image || 
      (user as any)?.avatar_url || 
      (user as any)?.profile?.profile_image || 
      null
    )
  }, [user])

  const displayName = useMemo(() => {
    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim()
    return fullName || user?.first_name || user?.username || 'Customer'
  }, [firstName, lastName, user?.first_name, user?.username])

  const initials = useMemo(() => {
    if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase()
    if (firstName) return firstName[0].toUpperCase()
    if (user?.username) return user.username[0].toUpperCase()
    return 'U'
  }, [firstName, lastName, user?.username])

  const completionCount = [firstName, lastName, email, address].filter(Boolean).length
  const completionPercent = Math.round((completionCount / 4) * 100)

  const pickImage = useCallback(async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert(
          'Permission Needed',
          'Please grant permission to access your photos to add a profile picture.',
          [{ text: 'OK' }]
        )
        return
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      })

      if (!result.canceled && result.assets?.[0]?.uri) {
        const selectedUri = result.assets[0].uri
        setProfileUri(selectedUri)
        
        // Auto-upload the photo
        await uploadPhoto(selectedUri)
      }
    } catch (error) {
      console.error('Image picker error:', error)
      Alert.alert('Error', 'Failed to pick image. Please try again.')
    }
  }, [])

  const uploadPhoto = async (uri: string) => {
    setUploadingPhoto(true)
    try {
      // Create form data
      const formData = new FormData()
      
      // Get filename and extension
      const filename = uri.split('/').pop() || 'profile.jpg'
      const match = /\.(\w+)$/.exec(filename)
      const type = match ? `image/${match[1]}` : 'image/jpeg'
      
      // Append image file
      formData.append('profile_image', {
        uri,
        name: filename,
        type,
      } as any)

      // Call API to upload
      const response = await uploadProfileImage(formData)
      
      if (response.data?.profile_image || response.data?.avatar_url) {
        const newImageUrl = response.data.profile_image || response.data.avatar_url
        setProfileUri(newImageUrl)
        await refreshUser()
        Alert.alert('Success', 'Profile photo updated successfully!')
      } else {
        Alert.alert('Success', 'Profile photo uploaded!')
        await refreshUser()
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      const errorMsg = error?.response?.data?.detail || error?.message || 'Failed to upload photo'
      Alert.alert('Upload Failed', errorMsg)
    } finally {
      setUploadingPhoto(false)
    }
  }

  // Alternative upload method using base64
  const pickImageAndUploadBase64 = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Please grant permission to access your photos.')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true, // This will get base64 string
      })

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0]
        setUploadingPhoto(true)
        
        try {
          // Upload using base64
          await updateProfile({
            profile_image_base64: asset.base64,
            profile_image_type: asset.mimeType || 'image/jpeg',
          })
          
          setProfileUri(asset.uri)
          await refreshUser()
          Alert.alert('Success', 'Profile photo updated!')
        } catch (error: any) {
          Alert.alert('Error', error?.response?.data?.detail || 'Failed to upload photo')
        } finally {
          setUploadingPhoto(false)
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image')
    }
  }

  const handleSave = useCallback(() => {
    // Check if any changes were made
    const hasChanges = 
      firstName !== (user?.first_name ?? '') ||
      lastName !== (user?.last_name ?? '') ||
      email !== (user?.email ?? '') ||
      address !== ((user as any)?.address ?? '')

    if (!hasChanges) {
      Alert.alert('No Changes', 'No changes were made to your profile.')
      return
    }

    Alert.alert('Save Changes', 'Are you sure you want to save these changes?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Save',
        onPress: async () => {
          setLoading(true)
          try {
            // Update profile without image (image uploaded separately)
            await updateProfile({
              first_name: firstName,
              last_name: lastName,
              email,
              address,
            })
            
            await refreshUser()
            Alert.alert('Success', 'Profile updated successfully.')
          } catch (e: any) {
            if (e?.response?.status === 401) {
              Alert.alert('Session Expired', 'Your session has expired. Please log in again.')
              logout()
              return
            }
            const msg = e?.response?.data 
              ? Object.values(e.response.data).flat().join(', ') 
              : 'Failed to update profile'
            Alert.alert('Error', msg)
          } finally {
            setLoading(false)
          }
        },
      },
    ])
  }, [address, email, firstName, lastName, user, logout, refreshUser])

  const handleLogout = useCallback(() => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ])
  }, [logout])

  const handleApplyForOwner = useCallback(() => {
    navigation.navigate('ApplyForOwner')
  }, [navigation])

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <View style={styles.heroAccentOne} />
          <View style={styles.heroAccentTwo} />

          <View style={styles.heroTopRow}>
            <TouchableOpacity 
              style={styles.avatarRing} 
              onPress={pickImage} 
              activeOpacity={0.88}
              disabled={uploadingPhoto}
            >
              <View style={styles.avatar}>
                {profileUri ? (
                  <Image 
                    source={{ uri: profileUri }} 
                    style={styles.avatarImage} 
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={styles.avatarText}>{initials}</Text>
                )}
                {uploadingPhoto && (
                  <View style={styles.uploadingOverlay}>
                    <ActivityIndicator size="small" color={colors.textInverse} />
                  </View>
                )}
              </View>
              <View style={styles.cameraBadge}>
                <Text style={styles.cameraBadgeText}>📷</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutPill} onPress={handleLogout} activeOpacity={0.86}>
              <Text style={styles.logoutPillText}>Logout</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.changePhotoBtn}
            onPress={pickImage}
            activeOpacity={0.88}
            disabled={uploadingPhoto}
          >
            <Text style={styles.changePhotoBtnText}>
              {uploadingPhoto ? 'Uploading...' : profileUri ? 'Change Photo' : 'Add Photo'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            {email || 'Add an email address so receipts and account updates reach you.'}
          </Text>

          <View style={styles.badgeRow}>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>{userRole.toUpperCase()}</Text>
            </View>
            <View style={styles.progressBadge}>
              <Text style={styles.progressLabel}>Profile completion</Text>
              <Text style={styles.progressValue}>{completionPercent}%</Text>
            </View>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${completionPercent}%` }]} />
          </View>

          <View style={styles.metaGrid}>
            <View style={styles.metaCard}>
              <Text style={styles.metaValue}>{user?.username || '—'}</Text>
              <Text style={styles.metaLabel}>Username</Text>
            </View>
            <View style={styles.metaCard}>
              <Text style={styles.metaValue}>{isCustomer ? 'Customer' : 'Account'}</Text>
              <Text style={styles.metaLabel}>Access level</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionEyebrow}>Editable details</Text>
          <Text style={styles.sectionTitle}>Personal information</Text>
          <Text style={styles.sectionCopy}>
            Keep your identity and contact details accurate so the app can work for you without extra steps.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Email address</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="name@example.com"
              placeholderTextColor={colors.textMuted}
            />
            <Text style={styles.fieldHint}>Used for login, receipts, and account notifications.</Text>
          </View>

          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={styles.fieldLabel}>First name</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First name"
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <View style={styles.half}>
              <Text style={styles.fieldLabel}>Last name</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last name"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Address</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={4}
              placeholder="Enter your address"
              placeholderTextColor={colors.textMuted}
            />
            <Text style={styles.fieldHint}>This helps with delivery, support, and recovery tasks.</Text>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, (loading || uploadingPhoto) && styles.buttonDisabled]}
            disabled={loading || uploadingPhoto}
            onPress={handleSave}
            activeOpacity={0.88}
          >
            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={colors.textInverse} />
                <Text style={styles.primaryButtonText}>Saving...</Text>
              </View>
            ) : (
              <Text style={styles.primaryButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionEyebrow}>Quick actions</Text>
          <Text style={styles.sectionTitle}>Account tools</Text>
        </View>

        <View style={styles.actionsColumn}>
          {isCustomer && (
            <TouchableOpacity style={styles.actionCard} onPress={handleApplyForOwner} activeOpacity={0.88}>
              <View style={[styles.actionIcon, styles.actionIconSuccess]}>
                <Text style={styles.actionIconText}>★</Text>
              </View>
              <View style={styles.actionCopy}>
                <Text style={styles.actionTitle}>Apply for Owner</Text>
                <Text style={styles.actionDescription}>
                  Upgrade your account to access owner tools and workflows.
                </Text>
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.actionCard} onPress={handleLogout} activeOpacity={0.88}>
            <View style={[styles.actionIcon, styles.actionIconDanger]}>
              <Text style={styles.actionIconText}>↗</Text>
            </View>
            <View style={styles.actionCopy}>
              <Text style={styles.actionTitle}>Logout</Text>
              <Text style={styles.actionDescription}>End your session on this device and clear local access.</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  heroCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
    ...shadows.lg,
  },
  heroAccentOne: {
    position: 'absolute',
    top: -28,
    right: -18,
    width: 120,
    height: 120,
    borderRadius: 999,
    backgroundColor: colors.primarySoft,
    opacity: 0.9,
  },
  heroAccentTwo: {
    position: 'absolute',
    bottom: -36,
    left: -24,
    width: 96,
    height: 96,
    borderRadius: 999,
    backgroundColor: colors.bgTertiary,
    opacity: 0.95,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  avatarRing: {
    padding: 4,
    borderRadius: 999,
    backgroundColor: colors.primarySoft,
    position: 'relative',
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 30,
    color: colors.textInverse,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.bgCard,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  cameraBadgeText: {
    fontSize: 12,
  },
  logoutPill: {
    backgroundColor: colors.error + '10',
    borderColor: colors.error + '25',
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  logoutPillText: {
    ...typography.caption,
    color: colors.error,
    fontWeight: '700',
  },
  changePhotoBtn: {
    alignSelf: 'flex-start',
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.primary + '12',
    zIndex: 1,
  },
  changePhotoBtnText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  name: {
    ...typography.title,
    color: colors.textPrimary,
    marginTop: spacing.md,
    zIndex: 1,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 20,
    marginTop: spacing.xs,
    zIndex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    zIndex: 1,
  },
  roleBadge: {
    backgroundColor: colors.primaryBg,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  roleBadgeText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  progressBadge: {
    backgroundColor: colors.bgTertiary,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  progressValue: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '800',
  },
  progressTrack: {
    height: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.borderLight,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
  },
  metaGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
    zIndex: 1,
  },
  metaCard: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
  },
  metaValue: {
    ...typography.subheading,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  metaLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  sectionHeader: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionEyebrow: {
    ...typography.caption,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: '800',
    marginBottom: 4,
  },
  sectionTitle: {
    ...typography.heading,
    color: colors.textPrimary,
  },
  sectionCopy: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  fieldBlock: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  fieldHint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 6,
    lineHeight: 17,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  half: {
    flex: 1,
  },
  input: {
    backgroundColor: colors.bgPrimary,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    color: colors.textPrimary,
    fontSize: typeScale.body,
  },
  textArea: {
    minHeight: 98,
    textAlignVertical: 'top',
  },
  primaryButton: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  primaryButtonText: {
    ...typography.bodyBold,
    color: colors.textInverse,
    fontSize: 15,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionsColumn: {
    gap: spacing.md,
  },
  actionCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    ...shadows.sm,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  actionIconSuccess: {
    backgroundColor: colors.success + '15',
  },
  actionIconDanger: {
    backgroundColor: colors.error + '15',
  },
  actionIconText: {
    ...typography.heading,
    color: colors.textPrimary,
  },
  actionCopy: {
    flex: 1,
  },
  actionTitle: {
    ...typography.subheading,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  actionDescription: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
})