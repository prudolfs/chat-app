import React, { useEffect } from 'react'
import { View, Text } from 'react-native'
import { router } from 'expo-router'
import { useSession } from '@/lib/auth-client'

export default function Index() {
  const { data: session, isPending } = useSession()

  useEffect(() => {
    if (!isPending) {
      if (session?.user) {
        router.replace('/(tabs)/chat')
      } else {
        router.replace('/(auth)/welcome')
      }
    }
  }, [session, isPending])

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

  return null
}
