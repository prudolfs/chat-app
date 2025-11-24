import React, { useEffect, useRef } from 'react'
import { Redirect, Stack, useRouter } from 'expo-router'
import { useSession } from '@/lib/auth-client'
import { View, Text, AppState, AppStateStatus, Platform } from 'react-native'
import { useMutation } from 'convex/react'
import { api } from '~/_generated/api'
import * as Notifications from 'expo-notifications'

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

export default function ProtectedLayout() {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const setUserOnline = useMutation(api.users.setUserOnline)
  const setUserOffline = useMutation(api.users.setUserOffline)
  const updateHeartbeat = useMutation(api.users.updateUserHeartbeat)
  const registerPushToken = useMutation(api.users.registerPushToken)
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const appStateRef = useRef<AppStateStatus>(AppState.currentState)
  const notificationListenerRef = useRef<Notifications.Subscription | null>(
    null,
  )
  const responseListenerRef = useRef<Notifications.Subscription | null>(null)

  // Set up push notifications
  useEffect(() => {
    if (!session?.user) return

    async function registerForPushNotifications() {
      // Skip on web
      if (Platform.OS === 'web') {
        return
      }

      const { status: existingStatus } =
        await Notifications.getPermissionsAsync()
      let finalStatus = existingStatus

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync()
        finalStatus = status
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!')
        return
      }

      try {
        // Get push token - projectId is optional, will use default if not provided
        const tokenData = await Notifications.getExpoPushTokenAsync(
          process.env.EXPO_PUBLIC_PROJECT_ID
            ? { projectId: process.env.EXPO_PUBLIC_PROJECT_ID }
            : undefined,
        )
        const token = tokenData.data
        console.log('Expo push token obtained:', token.substring(0, 20) + '...')

        // Register token with backend
        try {
          await registerPushToken({ pushToken: token })
          console.log('Push token registered successfully with backend')
        } catch (mutationError) {
          console.error(
            'Error calling registerPushToken mutation:',
            mutationError,
          )
          if (mutationError instanceof Error) {
            console.error('Mutation error message:', mutationError.message)
          }
        }
      } catch (error) {
        console.error('Error getting Expo push token:', error)
        if (error instanceof Error) {
          console.error('Error message:', error.message)
          // Common error: "getDevicePushTokenAsync: getDevicePushTokenAsync is not available"
          // This happens in development/simulator - it's expected
          if (
            error.message.includes('not available') ||
            error.message.includes('simulator')
          ) {
            console.log(
              'Note: Push tokens are only available on physical devices, not simulators',
            )
          }
        }
      }
    }

    registerForPushNotifications()

    // Set up notification listeners
    notificationListenerRef.current =
      Notifications.addNotificationReceivedListener((notification) => {
        // Handle notification received while app is in foreground
        console.log('Notification received:', notification)
      })

    responseListenerRef.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        // Handle notification tap
        const data = response.notification.request.content.data
        if (data?.chatRoomId && data?.type === 'message') {
          router.push(`/(protected)/chat/${data.chatRoomId}`)
        }
      })

    return () => {
      if (notificationListenerRef.current) {
        notificationListenerRef.current.remove()
      }
      if (responseListenerRef.current) {
        responseListenerRef.current.remove()
      }
    }
  }, [session?.user, registerPushToken, router])

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
