import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { cn } from '@/lib/utils'

type TopBarProps = {
  title: string
  subtitle?: string
  showBack?: boolean
  onBack?: () => void
  leftAction?: React.ReactNode
  rightAction?: React.ReactNode
  centerTitle?: boolean
  avatar?: string
  isOnline?: boolean
}

export function TopBar({
  title,
  subtitle,
  showBack = false,
  onBack,
  leftAction,
  rightAction,
  centerTitle = false,
  avatar,
  isOnline,
}: TopBarProps) {
  const insets = useSafeAreaInsets()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      router.back()
    }
  }

  return (
    <>
      <View style={{ paddingTop: insets.top }} className="bg-primary-500" />
      <View className="flex-row items-center bg-primary-500 px-3 pb-2.5 pt-0.5">
        {/* Left side: Back button or left action */}
        {showBack && (
          <TouchableOpacity
            className="mr-2 h-7 w-7 items-center justify-center"
            onPress={handleBack}
          >
            <Text className="text-base text-white">←</Text>
          </TouchableOpacity>
        )}
        {leftAction && <View className="mr-2">{leftAction}</View>}

        {/* Avatar (for chat screen) */}
        {avatar && (
          <View className="relative mr-2">
            <View className="h-7 w-7 items-center justify-center rounded-full bg-primary-600">
              <Text className="text-xs font-semibold text-white">
                {avatar.toUpperCase()}
              </Text>
            </View>
            {isOnline !== undefined && (
              <View
                className={cn(
                  'absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-primary-500',
                  isOnline ? 'bg-green-500' : 'bg-secondary-400',
                )}
              />
            )}
          </View>
        )}

        {/* Center: Title and subtitle */}
        <View
          className={cn('flex-1', centerTitle ? 'items-center' : 'items-start')}
        >
          <Text
            className={cn(
              'text-sm font-bold text-white',
              centerTitle ? 'text-center' : '',
            )}
          >
            {title}
          </Text>
          {subtitle && (
            <Text className="text-xs leading-tight text-blue-100">
              {subtitle}
            </Text>
          )}
        </View>

        {/* Right side: Right action */}
        {rightAction && <View className="ml-2">{rightAction}</View>}
      </View>
    </>
  )
}
