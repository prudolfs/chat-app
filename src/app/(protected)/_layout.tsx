import React, { useEffect, useRef } from 'react'
import { Redirect, Stack } from 'expo-router'
import { useSession } from '@/lib/auth-client'
import { View, Text, AppState, AppStateStatus } from 'react-native'
import { useMutation } from 'convex/react'
import { api } from '~/_generated/api'

export default function ProtectedLayout() {
  const { data: session, isPending } = useSession()
  const setUserOnline = useMutation(api.users.setUserOnline)
  const setUserOffline = useMutation(api.users.setUserOffline)
  const updateHeartbeat = useMutation(api.users.updateUserHeartbeat)
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const appStateRef = useRef<AppStateStatus>(AppState.currentState)

  useEffect(() => {
    if (!session?.user) return

    // Set user online when component mounts
    setUserOnline().catch(console.error)

    // Set up heartbeat to keep status fresh (every 30 seconds)
    heartbeatIntervalRef.current = setInterval(() => {
      updateHeartbeat().catch(console.error)
    }, 30000)

    // Handle app state changes
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to the foreground
        setUserOnline().catch(console.error)
      } else if (nextAppState.match(/inactive|background/)) {
        // App has gone to the background
        setUserOffline().catch(console.error)
      }
      appStateRef.current = nextAppState
    })

    return () => {
      // Cleanup: set offline and clear interval
      setUserOffline().catch(console.error)
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
      }
      subscription.remove()
    }
  }, [session?.user, setUserOnline, setUserOffline, updateHeartbeat])

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
