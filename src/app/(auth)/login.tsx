import React, { useState } from 'react'
import { router } from 'expo-router'
import { signIn } from '@/lib/auth-client'
import {
  Platform,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native'
import { FormField } from '@/components/ui/form-field'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }

    setIsLoading(true)
    try {
      const result = await signIn.email({
        email: email.trim().toLowerCase(),
        password,
      })

      if (result.error) {
        Alert.alert(
          'Login Failed',
          result.error.message || 'Invalid credentials',
        )
      } else {
        router.replace('/(tabs)/chats')
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred')
      console.error('Login error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-8">
          <View className="mb-8 pt-12">
            <TouchableOpacity
              className="h-10 w-10 justify-center active:opacity-70"
              onPress={() => router.back()}
            >
              <Text className="text-2xl text-primary-500">←</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-1 justify-center">
            <View className="mb-8 items-center">
              <View className="mb-6 rounded-full bg-primary-500 p-6">
                <Text className="text-4xl text-white">💬</Text>
              </View>

              <Text className="mb-2 text-3xl font-bold text-secondary-900">
                Welcome back
              </Text>
              <Text className="text-center text-secondary-600">
                Sign in to continue chatting
              </Text>
            </View>

            <View className="mb-8 space-y-4">
              <FormField
                label="Email"
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />

              <FormField
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="current-password"
              />
            </View>

            <TouchableOpacity
              className={`rounded-xl px-8 py-4 ${isLoading ? 'bg-secondary-300' : 'bg-primary-500 active:bg-primary-600'}`}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text className="text-center text-lg font-semibold text-white">
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Text>
            </TouchableOpacity>

            <View className="mt-6 flex-row justify-center">
              <Text className="text-secondary-600">
                Don't have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                <Text className="font-semibold text-primary-500">Sign up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
