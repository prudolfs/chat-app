import React from 'react'
import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { cn } from '@/lib/utils'

const COMMON_EMOJIS = [
  '👍',
  '❤️',
  '😂',
  '😮',
  '😢',
  '🙏',
  '🔥',
  '👏',
  '🎉',
  '✅',
  '❌',
  '💯',
  '👎',
  '😍',
  '🤔',
  '😴',
  '😎',
  '🤯',
  '🥳',
  '😊',
  '😭',
  '🤣',
  '😡',
  '🤮',
  '💪',
  '🙌',
  '👀',
  '🤷',
  '🤦',
  '💀',
]

type EmojiPickerProps = {
  visible: boolean
  onEmojiSelect: (emoji: string) => void
  onClose?: () => void
}

export function EmojiPicker({
  visible,
  onEmojiSelect,
  onClose,
}: EmojiPickerProps) {
  if (!visible) return null

  return (
    <View className="border-t border-secondary-200 bg-white">
      <View className="flex-row items-center justify-between border-b border-secondary-200 px-4 py-2">
        <Text className="text-sm font-semibold text-secondary-700">
          Add Reaction
        </Text>
        {onClose && (
          <TouchableOpacity onPress={onClose}>
            <Text className="text-sm text-primary-500">Done</Text>
          </TouchableOpacity>
        )}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="py-3"
        contentContainerStyle={{ paddingHorizontal: 12 }}
      >
        {COMMON_EMOJIS.map((emoji, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => onEmojiSelect(emoji)}
            className="mx-1 h-10 w-10 items-center justify-center rounded-full bg-secondary-100 active:bg-secondary-200"
          >
            <Text className="text-xl">{emoji}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
}
