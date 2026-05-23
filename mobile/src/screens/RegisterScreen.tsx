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
import { colors, radii, spacing, typography, shadows, typeScale } from '../theme/design'

export default function RegisterScreen() {
  const navigation = useNavigation<any>()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

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

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.')
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

      await register(form)
      Alert.alert('Success', 'Registration successful! Please login.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') }
      ])
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
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.headerSection}>
            <Text style={styles.appName}>MY STORE</Text>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join Smart Ordering today</Text>
          </View>

          {errorMsg ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          <View style={styles.formContainer}>
            <View style={styles.avatarSection}>
              <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
                {profileUri ? (
                  <Image source={{ uri: profileUri }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarLetter}>{avatarLetter}</Text>
                  </View>
                )}
                <View style={styles.cameraIcon}>
                  <Text style={styles.cameraIconText}>+</Text>
                </View>
              </TouchableOpacity>
              <Text style={styles.avatarHint}>Tap to add profile photo</Text>
            </View>

            <View style={styles.row}>
              <View style={styles.half}>
                <Text style={styles.inputLabel}>First Name *</Text>
                <TextInput 
                  style={styles.input} 
                  value={firstName} 
                  onChangeText={setFirstName} 
                  placeholderTextColor={colors.textMuted}
                  placeholder="First name"
                />
              </View>
              <View style={styles.half}>
                <Text style={styles.inputLabel}>Last Name *</Text>
                <TextInput 
                  style={styles.input} 
                  value={lastName} 
                  onChangeText={setLastName} 
                  placeholderTextColor={colors.textMuted}
                  placeholder="Last name"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email *</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={colors.textMuted}
                placeholder="you@example.com"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Username *</Text>
              <TextInput 
                style={styles.input} 
                value={username} 
                onChangeText={setUsername} 
                autoCapitalize="none"
                placeholderTextColor={colors.textMuted}
                placeholder="username"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password *</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholderTextColor={colors.textMuted}
                  placeholder="Create a password"
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)} 
                  style={styles.eyeIcon}
                >
                  <Text>{showPassword ? 'Hide' : 'Show'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm Password *</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  placeholderTextColor={colors.textMuted}
                  placeholder="Confirm your password"
                />
                <TouchableOpacity 
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)} 
                  style={styles.eyeIcon}
                >
                  <Text>{showConfirmPassword ? 'Hide' : 'Show'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Pressable 
              style={[styles.registerButton, loading && styles.buttonDisabled]} 
              onPress={handleRegister} 
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.textInverse} />
              ) : (
                <Text style={styles.registerButtonText}>Create Account</Text>
              )}
            </Pressable>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  headerSection: {
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  appName: {
    ...typography.caption,
    color: colors.primary,
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.hero,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  errorContainer: {
    backgroundColor: colors.error + '10',
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.error + '30',
  },
  errorText: {
    ...typography.body,
    color: colors.error,
  },
  formContainer: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.xl,
    padding: spacing.lg,
    ...shadows.lg,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 40,
    color: colors.textInverse,
    fontWeight: 'bold',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.bgCard,
    borderRadius: 20,
    padding: 8,
    borderWidth: 2,
    borderColor: colors.primary,
    ...shadows.sm,
  },
  cameraIconText: {
    fontSize: 16,
  },
  avatarHint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
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
    backgroundColor: colors.bgPrimary,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.textPrimary,
    fontSize: typeScale.body,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: spacing.xl,
  },
  eyeIcon: {
    position: 'absolute',
    right: spacing.md,
    top: spacing.md,
  },
  registerButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
    ...shadows.sm,
  },
  registerButtonText: {
    ...typography.bodyBold,
    color: colors.textInverse,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  loginText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  loginLink: {
    ...typography.bodyBold,
    color: colors.primary,
  },
})