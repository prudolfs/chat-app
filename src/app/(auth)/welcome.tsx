import React from 'react'
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native'
import { router } from 'expo-router'

export default function Welcome() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-8">
        <View className="mb-8 rounded-full bg-primary-500 p-8 shadow-lg">
          <Text className="text-6xl text-white">💬</Text>
        </View>

        <Text className="mb-4 text-center text-4xl font-bold text-secondary-900">
          Welcome to ChatApp
        </Text>

        <Text className="mb-12 text-center text-lg leading-6 text-secondary-600">
          Connect with friends and family{'\n'}
          Share moments, stay close
        </Text>

        <View className="mb-12 w-full">
          <FeatureItem icon="💬" text="Real-time messaging" />
          <FeatureItem icon="🔒" text="Secure and private" />
          <FeatureItem icon="⚡" text="Fast and reliable" />
          <FeatureItem icon="🌍" text="Global edge database" />
        </View>

        <View className="w-full space-y-4">
          <TouchableOpacity
            className="rounded-xl bg-primary-500 px-8 py-4 shadow-sm active:bg-primary-600"
            onPress={() => router.push('/(auth)/register')}
          >
            <Text className="text-center text-lg font-semibold text-white">
              Create Account
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="rounded-xl border border-secondary-300 px-8 py-4 active:bg-secondary-50"
            onPress={() => router.push('/(auth)/login')}
          >
            <Text className="text-center text-lg font-semibold text-secondary-700">
              Sign In
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}

function FeatureItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View className="mb-4 flex-row items-center">
      <View className="mr-3 h-8 w-8 items-center justify-center rounded-full bg-primary-100">
        <Text className="text-lg text-primary-500">{icon}</Text>
      </View>
      <Text className="text-secondary-700">{text}</Text>
    </View>
  )
}