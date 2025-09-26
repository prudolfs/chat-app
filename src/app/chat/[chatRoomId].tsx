import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useQuery, useMutation } from 'convex/react'
import { useSession } from '@/lib/auth-client'
import { api } from '~/_generated/api'

export default function ChatScreen() {
  const { chatRoomId } = useLocalSearchParams<{ chatRoomId: string }>()
  const [newMessage, setNewMessage] = useState('')
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const flatListRef = useRef<FlatList>(null)
  const { data: session } = useSession()
  const user = session?.user

  const chatRoom = useQuery(api.chatRooms.getChatRoomDetails, {
    chatRoomId: chatRoomId as any,
  })
  const messages =
    useQuery(api.messages.getChatMessages, {
      chatRoomId: chatRoomId as any,
    }) ?? []
  const sendMessage = useMutation(api.messages.sendMessage)

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height)
      },
    )
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardHeight(0)
      },
    )

    return () => {
      keyboardDidShowListener.remove()
      keyboardDidHideListener.remove()
    }
  }, [])

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true })
      }, 100)
    }
  }, [messages.length])

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return

    try {
      await sendMessage({
        chatRoomId: chatRoomId as any,
        text: newMessage.trim(),
      })
      setNewMessage('')
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const renderMessage = ({ item }: { item: any }) => {
    const isMe = item.userId === user?.id
    const timeString = new Date(item.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })

    return (
      <View className={`mb-4 ${isMe ? 'items-end' : 'items-start'}`}>
        {!isMe && chatRoom?.type === 'group' && (
          <Text className="mb-1 ml-3 text-xs text-secondary-500">
            {item.userName || 'Unknown User'}
          </Text>
        )}
        <View
          className={`max-w-[80%] rounded-2xl px-4 py-3 ${
            isMe
              ? 'rounded-br-md bg-primary-500'
              : 'rounded-bl-md bg-secondary-100'
          }`}
        >
          <Text
            className={`text-base ${isMe ? 'text-white' : 'text-secondary-900'}`}
          >
            {item.text}
          </Text>
          <Text
            className={`mt-1 text-xs ${isMe ? 'text-blue-100' : 'text-secondary-500'}`}
          >
            {timeString}
            {item.edited && ' (edited)'}
          </Text>
        </View>
      </View>
    )
  }

  const getOnlineStatus = () => {
    if (
      chatRoom?.type === 'direct' &&
      'otherUser' in chatRoom &&
      chatRoom.otherUser
    ) {
      return chatRoom.otherUser.isOnline ? 'Online' : 'Offline'
    }
    if (chatRoom?.type === 'group') {
      return `Group Chat`
    }
    return null
  }

  if (!chatRoom) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center">
          <Text className="text-secondary-500">Loading chat...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View className="flex-row items-center bg-primary-500 px-4 py-4">
          <TouchableOpacity
            className="mr-3 h-10 w-10 items-center justify-center"
            onPress={() => router.back()}
          >
            <Text className="text-xl text-white">←</Text>
          </TouchableOpacity>

          <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-primary-600">
            <Text className="font-semibold text-white">
              {chatRoom.displayName?.charAt(0)?.toUpperCase() || 'C'}
            </Text>
          </View>

          <View className="flex-1">
            <Text className="text-lg font-bold text-white">
              {chatRoom.displayName}
            </Text>
            {getOnlineStatus() && (
              <Text className="text-sm text-blue-100">{getOnlineStatus()}</Text>
            )}
          </View>

          {chatRoom.type === 'group' && (
            <TouchableOpacity
              className="h-10 w-10 items-center justify-center"
              onPress={() => {
                console.log('Group settings')
              }}
            >
              <Text className="text-xl text-white">⋮</Text>
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item._id}
          className="flex-1 px-4"
          contentContainerStyle={{ paddingVertical: 16 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="min-h-[400px] flex-1 items-center justify-center">
              <View className="mb-6 rounded-full bg-secondary-100 p-8">
                <Text className="text-4xl">💬</Text>
              </View>
              <Text className="mb-2 text-center text-lg text-secondary-600">
                No messages yet
              </Text>
              <Text className="text-center text-secondary-500">
                {chatRoom.type === 'direct'
                  ? `Start the conversation with ${chatRoom.displayName}! Say hello.`
                  : 'Start the conversation! Say hello.'}
              </Text>
            </View>
          }
        />

        <View
          className="flex-row items-end border-t border-secondary-200 bg-secondary-50 px-4 py-4"
          style={{
            marginBottom: Platform.OS === 'ios' ? keyboardHeight : 0,
          }}
        >
          <TextInput
            className="mr-3 max-h-20 flex-1 rounded-full border border-secondary-300 bg-white px-4 py-3"
            placeholder={`Message ${chatRoom.displayName}...`}
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={1000}
            textAlignVertical="center"
            onSubmitEditing={() => {
              if (!newMessage.includes('\n')) {
                handleSendMessage()
              }
            }}
            blurOnSubmit={false}
          />

          <TouchableOpacity
            className={`h-12 w-12 items-center justify-center rounded-full ${
              newMessage.trim() ? 'bg-primary-500' : 'bg-secondary-300'
            }`}
            onPress={handleSendMessage}
            disabled={!newMessage.trim()}
          >
            <Text className="text-lg text-white">→</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
