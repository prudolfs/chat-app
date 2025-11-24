import React from 'react'
import { Tabs } from 'expo-router'
import { Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const TabIcon = ({
  focused,
  children,
  label,
}: {
  focused: boolean
  children: string
  label: string
}) => (
  <View className="w-16 items-center justify-center">
    <Text className={`text-2xl ${focused ? 'opacity-100' : 'opacity-50'}`}>
      {children}
    </Text>
    <Text
      className={`mt-1 text-xs ${focused ? 'text-primary-500' : 'text-secondary-400'}`}
    >
      {label}
    </Text>
  </View>
)

export default function TabLayout() {
  const insets = useSafeAreaInsets()

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          height: 60 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 10),
          paddingTop: 10,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} label="Chats">
              💬
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} label="Profile">
              👤
            </TabIcon>
          ),
        }}
      />
    </Tabs>
  )
}
