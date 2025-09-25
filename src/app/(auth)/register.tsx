import React, { useState } from 'react'
import { router } from 'expo-router'
import {
  Platform,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  ScrollView,
  Alert,
} from 'react-native'
import { signUp } from '@/lib/auth-client'
import { FormField } from '@/components/ui/form-field'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match')
      return
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address')
      return
    }

    setIsLoading(true)
    try {
      const result = await signUp.email({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      })

      if (result.error) {
        Alert.alert(
          'Registration Failed',
          result.error.message || 'Could not create account',
        )
      } else {
        router.replace('/(tabs)/chat')
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred')
      console.error('Registration error:', error)
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

          <View className="flex-1">
            <View className="mb-8 items-center">
              <View className="mb-6 rounded-full bg-primary-500 p-6">
                <Text className="text-4xl text-white">💬</Text>
              </View>

              <Text className="mb-2 text-3xl font-bold text-secondary-900">
                Create Account
              </Text>
              <Text className="text-center text-secondary-600">
                Join the conversation today
              </Text>
            </View>

            <View className="mb-8 space-y-4">
              <FormField
                label="Full Name"
                placeholder="Enter your full name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoComplete="name"
              />

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
                placeholder="Create a password (8+ characters)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="new-password"
              />

              <FormField
                label="Confirm Password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoComplete="new-password"
              />
            </View>

            <TouchableOpacity
              className={`rounded-xl px-8 py-4 ${isLoading ? 'bg-secondary-300' : 'bg-primary-500 active:bg-primary-600'}`}
              onPress={handleRegister}
              disabled={isLoading}
            >
              <Text className="text-center text-lg font-semibold text-white">
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Text>
            </TouchableOpacity>

            <View className="mt-6 flex-row justify-center">
              <Text className="text-secondary-600">
                Already have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text className="font-semibold text-primary-500">Sign in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
