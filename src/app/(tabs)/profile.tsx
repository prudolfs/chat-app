import React from 'react'
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useSession, signOut } from '@/lib/auth-client'
import { router } from 'expo-router'

export default function ProfileScreen() {
  const { data: session } = useSession()
  const user = session?.user

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut()
            router.navigate('/(auth)/welcome')
          } catch (error) {
            console.error('Sign out error:', error)
            Alert.alert('Error', 'Failed to sign out')
          }
        },
      },
    ])
  }

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center">
          <Text className="text-secondary-500">Loading profile...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="bg-primary-500 px-4 py-4">
          <Text className="text-center text-xl font-bold text-white">
            Profile
          </Text>
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingVertical: 32,
            paddingBottom: 120, // Extra space for tab bar
          }}
        >
          <View className="mb-8 items-center">
            <View className="mb-4 h-24 w-24 items-center justify-center rounded-full bg-primary-500 shadow-lg">
              <Text className="text-3xl font-bold text-white">
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
            <Text className="mb-1 text-2xl font-bold text-secondary-900">
              {user.name}
            </Text>
            <Text className="mb-2 text-secondary-600">{user.email}</Text>
            <Text className="px-4 text-center text-secondary-500">
              Hey there! I'm using ChatApp.
            </Text>
          </View>

          <View className="mb-8 space-y-3">
            <View className="rounded-xl bg-secondary-50 p-4">
              <Text className="mb-1 text-sm font-medium text-secondary-500">
                User ID
              </Text>
              <Text className="font-mono text-xs text-secondary-900">
                {user.id}
              </Text>
            </View>

            <View className="rounded-xl bg-secondary-50 p-4">
              <Text className="mb-1 text-sm font-medium text-secondary-500">
                Member Since
              </Text>
              <Text className="text-secondary-900">
                {new Date(user.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>

            <View className="rounded-xl bg-secondary-50 p-4">
              <Text className="mb-1 text-sm font-medium text-secondary-500">
                Status
              </Text>
              <View className="flex-row items-center">
                <View className="mr-2 h-2 w-2 rounded-full bg-green-500" />
                <Text className="text-secondary-900">Online</Text>
              </View>
            </View>

            <View className="rounded-xl bg-secondary-50 p-4">
              <Text className="mb-1 text-sm font-medium text-secondary-500">
                Email Verified
              </Text>
              <View className="flex-row items-center">
                <View
                  className={`mr-2 h-2 w-2 rounded-full ${user.emailVerified ? 'bg-green-500' : 'bg-yellow-500'}`}
                />
                <Text className="text-secondary-900">
                  {user.emailVerified ? 'Verified' : 'Not verified'}
                </Text>
              </View>
            </View>
          </View>

          <View className="mb-8 space-y-3">
            <TouchableOpacity className="flex-row items-center justify-between rounded-xl bg-secondary-100 px-4 py-4 active:bg-secondary-200">
              <View className="flex-row items-center">
                <Text className="mr-3 text-lg">👤</Text>
                <Text className="font-medium text-secondary-700">
                  Edit Profile
                </Text>
              </View>
              <Text className="text-lg text-secondary-400">›</Text>
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center justify-between rounded-xl bg-secondary-100 px-4 py-4 active:bg-secondary-200">
              <View className="flex-row items-center">
                <Text className="mr-3 text-lg">🔔</Text>
                <Text className="font-medium text-secondary-700">
                  Notifications
                </Text>
              </View>
              <Text className="text-lg text-secondary-400">›</Text>
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center justify-between rounded-xl bg-secondary-100 px-4 py-4 active:bg-secondary-200">
              <View className="flex-row items-center">
                <Text className="mr-3 text-lg">🔒</Text>
                <Text className="font-medium text-secondary-700">
                  Privacy & Security
                </Text>
              </View>
              <Text className="text-lg text-secondary-400">›</Text>
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center justify-between rounded-xl bg-secondary-100 px-4 py-4 active:bg-secondary-200">
              <View className="flex-row items-center">
                <Text className="mr-3 text-lg">🎨</Text>
                <Text className="font-medium text-secondary-700">Theme</Text>
              </View>
              <Text className="text-lg text-secondary-400">›</Text>
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center justify-between rounded-xl bg-secondary-100 px-4 py-4 active:bg-secondary-200">
              <View className="flex-row items-center">
                <Text className="mr-3 text-lg">❓</Text>
                <Text className="font-medium text-secondary-700">
                  Help & Support
                </Text>
              </View>
              <Text className="text-lg text-secondary-400">›</Text>
            </TouchableOpacity>
          </View>

          <View className="mb-8 rounded-xl bg-secondary-50 p-4">
            <Text className="mb-2 text-sm font-medium text-secondary-500">
              App Information
            </Text>
            <Text className="text-sm text-secondary-700">
              ChatApp v1.0.0{'\n'}
              Built with Expo, Convex, and Better Auth{'\n'}
              Made with 💙 for real-time communication
            </Text>
          </View>

          <TouchableOpacity
            className="mb-4 rounded-xl bg-red-500 px-8 py-4 shadow-sm active:bg-red-600"
            onPress={handleSignOut}
          >
            <View className="flex-row items-center justify-center">
              <Text className="mr-2 text-lg">🚪</Text>
              <Text className="text-lg font-semibold text-white">Sign Out</Text>
            </View>
          </TouchableOpacity>

          <View className="h-8" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
