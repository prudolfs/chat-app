import React from 'react'
import { Tabs } from 'expo-router'
import { Text, View } from 'react-native'

const TabIcon = ({
  focused,
  children,
  label,
}: {
  focused: boolean
  children: string
  label: string
}) => (
  <View className="items-center justify-center">
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
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          height: 85,
          paddingBottom: 25,
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
