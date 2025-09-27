import React from 'react'
import { Redirect, Stack } from 'expo-router'
import { useSession } from '@/lib/auth-client'
import { View, Text } from 'react-native'

export default function ProtectedLayout() {
  const { data: session, isPending } = useSession()

  if (isPending) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <View className="mb-4 rounded-full bg-primary-500 p-6">
          <Text className="text-4xl text-white">💬</Text>
        </View>
        <Text className="mb-2 text-2xl font-bold text-primary-600">
          ChatApp
        </Text>
        <Text className="text-secondary-500">Loading...</Text>
      </View>
    )
  }

  if (!session?.user) {
    return <Redirect href="/(auth)/welcome" />
  }

  return <Stack screenOptions={{ headerShown: false }} />
}
