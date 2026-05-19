import React, { useState } from 'react'
import { View, TextInput, Button, StyleSheet, Text, Alert, ActivityIndicator } from 'react-native'
import { useAuth } from '../context/AuthContext'
import { login as apiLogin } from '../api/client'

export default function LoginScreen() {
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const { login } = useAuth()

  const normalizeUserPayload = (payload: any) => {
    const raw = payload?.user ? payload.user : payload
    const role = raw?.profile?.role || raw?.role || 'user'
    return { ...raw, role, profile: raw?.profile || null }
  }

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password')
      return
    }
    
    setLoading(true)
    try {
      const res = await apiLogin({ email, password })
      const { access, refresh } = res.data
      const userData = normalizeUserPayload(res.data)
      await login(access, refresh, userData)
    } catch (error: any) {
      const msg = error.response?.data?.detail || error.response?.data?.error || error.message || 'Invalid credentials'
      Alert.alert('Login Failed', msg)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ordering System</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title="Login" onPress={handleLogin} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
})