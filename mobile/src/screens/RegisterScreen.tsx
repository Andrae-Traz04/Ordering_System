import React, { useMemo, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  TouchableOpacity,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'

import { useNavigation } from '@react-navigation/native'

import { register } from '../api/client'

import { colors, radii, spacing, typeScale } from '../theme/design'
import RedErrorPill from '../components/RedErrorPill'


export default function RegisterScreen() {
  const navigation = useNavigation<any>()


  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [profileUri, setProfileUri] = useState<string | null>(null)
  const [picking, setPicking] = useState(false)

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const avatarLetter = useMemo(() => {
    const t = (firstName || username || '').trim()
    return t ? t[0].toUpperCase() : '?'
  }, [firstName, username])

  const pickImage = async () => {
    try {
      setPicking(true)
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (!perm.granted) {
        Alert.alert('Permission needed', 'Media library permission is required to upload a profile picture.')
        return
      }

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (res.canceled) return
      const uri = res.assets?.[0]?.uri
      if (uri) setProfileUri(uri)
    } finally {
      setPicking(false)
    }
  }

  const handleRegister = async () => {
    setErrorMsg('')

    if (!firstName || !lastName || !email || !username || !password || !confirmPassword) {
      setErrorMsg('Please fill in all required fields.')
      return
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const form = new FormData()
      form.append('first_name', firstName)
      form.append('last_name', lastName)
      form.append('email', email)
      form.append('username', username)
      form.append('password', password)
      form.append('role', 'customer')

      if (profileUri) {
        // expo-image-picker returns file:// URI
        const filename = profileUri.split('/').pop() || 'profile.jpg'
        const match = /(\.[a-zA-Z0-9]+)$/.exec(filename)
        const ext = (match?.[1] || '.jpg').replace('.', '')
        const type = `image/${ext}`
        form.append('profile_image', {
          uri: profileUri,
          name: filename,
          type,
        } as any)
      }

      // Backend returns activation pending redirect data; mobile currently doesn't implement activation routes.
      // We'll rely on a generic navigation to ActivationPending if present.
      const res = await register(form)

      // Some backends return {detail} only. We'll handle both.
      const pendingData: any = res.data
      const uid = pendingData?.uid || pendingData?.uidb64 || pendingData?.user_id
      const token = pendingData?.token

      if (navigation?.navigate) {
        navigation.navigate('ActivationPending', { uid, token } as never)
      }
    } catch (e: any) {
      const msg = e?.response?.data
        ? Object.values(e.response.data).flat().join(', ')
        : e?.message || 'Registration failed'
      setErrorMsg(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.heroCard}>
            <Text style={styles.badge}>SMART ORDERING</Text>
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>Set up your customer profile in seconds.</Text>
          </View>

          <RedErrorPill message={errorMsg} />

          <View style={styles.formCard}>
            <View style={styles.row}>
              <View style={styles.half}>
                <Text style={styles.label}>First Name *</Text>
                <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} autoCapitalize="words" />
              </View>
              <View style={styles.half}>
                <Text style={styles.label}>Last Name *</Text>
                <TextInput style={styles.input} value={lastName} onChangeText={setLastName} autoCapitalize="words" />
              </View>
            </View>

            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Username *</Text>
            <TextInput style={styles.input} value={username} onChangeText={setUsername} autoCapitalize="none" />

            <Text style={styles.label}>Password *</Text>
            <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />

            <Text style={styles.label}>Confirm Password *</Text>
            <TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />

            <View style={styles.divider} />

            <Text style={styles.label}>Profile Picture (optional)</Text>

            <TouchableOpacity style={styles.uploadBtn} onPress={pickImage} disabled={picking}>
              <Text style={styles.uploadBtnText}>{picking ? 'Picking...' : 'Choose Image'}</Text>
            </TouchableOpacity>

            <View style={styles.avatarPreviewWrap}>
              {profileUri ? (
                <Image source={{ uri: profileUri }} style={styles.avatarPreview} />
              ) : (
                <View style={[styles.avatarPreview, styles.avatarFallback]}>
                  <Text style={styles.avatarFallbackText}>{avatarLetter}</Text>
                </View>
              )}
            </View>

            <Pressable style={[styles.primaryButton, loading && { opacity: 0.7 }]} onPress={handleRegister} disabled={loading}>
              {loading ? <ActivityIndicator color={colors.textSecondary} /> : <Text style={styles.primaryButtonText}>Register</Text>}
            </Pressable>

            <Text style={styles.roleHint}>Role is set to CUSTOMER (no self-registration as admin/owner).</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgBottom },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg, gap: spacing.lg },
  heroCard: {
    padding: spacing.lg,
    backgroundColor: colors.panelDark,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: '#8F6AEE',
  },
  badge: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
    color: '#5B3900',
    fontWeight: '700',
    fontSize: typeScale.caption,
  },
  title: { marginTop: spacing.md, fontSize: typeScale.hero, fontWeight: '800', color: colors.textPrimary },
  subtitle: { marginTop: spacing.sm, color: colors.textSecondary, fontSize: typeScale.body, lineHeight: 22 },

  formCard: {
    backgroundColor: colors.panelSoft,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#9D82F2',
  },
  row: { flexDirection: 'row', gap: spacing.sm },
  half: { flex: 1 },
  label: { color: colors.textPrimary, fontWeight: '800', marginBottom: spacing.xs, fontSize: 12 },
  input: {
    minHeight: 50,
    borderRadius: radii.md,
    backgroundColor: '#7A57E8',
    borderWidth: 1,
    borderColor: '#A98DF6',
    color: colors.white,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    paddingVertical: 10,
  },
  divider: { height: 1, backgroundColor: '#9D82F2', opacity: 0.6, marginVertical: spacing.md },

  uploadBtn: { backgroundColor: colors.panel, borderWidth: 1, borderColor: '#A98DF6', borderRadius: radii.md, paddingVertical: 12, alignItems: 'center' },
  uploadBtnText: { color: colors.textPrimary, fontWeight: '900' },

  avatarPreviewWrap: { alignItems: 'center', marginTop: spacing.md },
  avatarPreview: { width: 92, height: 92, borderRadius: 46, borderWidth: 2, borderColor: '#A98DF6' },
  avatarFallback: { backgroundColor: colors.panelSoft, justifyContent: 'center', alignItems: 'center' },
  avatarFallbackText: { color: colors.textPrimary, fontWeight: '900', fontSize: 30 },

  primaryButton: { marginTop: spacing.md, backgroundColor: colors.accent, borderRadius: radii.md, paddingVertical: 14, alignItems: 'center' },
  primaryButtonText: { color: '#4B2A00', fontWeight: '900', fontSize: 16 },
  roleHint: { marginTop: spacing.md, color: colors.textMuted, fontWeight: '700', fontSize: 12, textAlign: 'center' },
})

