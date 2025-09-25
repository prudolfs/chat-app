import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native'
import { useQuery, useMutation } from 'convex/react'
import { useSession } from '@/lib/auth-client'
import { api } from '~/_generated/api'

export default function ChatScreen() {
  const [newMessage, setNewMessage] = useState('')
  const scrollViewRef = useRef<ScrollView>(null)
  const { data: session } = useSession()
  const user = session?.user

  // Real-time messages from Convex
  const messages = useQuery(api.messages.getMessages) ?? []
  const sendMessage = useMutation(api.messages.sendMessage)

  // Auto-scroll to bottom
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true })
      }, 100)
    }
  }, [messages.length])

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return

    try {
      await sendMessage({ text: newMessage.trim() })
      setNewMessage('')
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const MessageBubble = ({ message }: { message: any }) => {
    const isMe = message.userId === user?.id
    const timeString = new Date(message.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })

    return (
      <View className={`mb-4 ${isMe ? 'items-end' : 'items-start'}`}>
        {!isMe && (
          <Text className="mb-1 ml-3 text-xs text-secondary-500">
            {message.userName}
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
            {message.text}
          </Text>
          <Text
            className={`mt-1 text-xs ${isMe ? 'text-blue-100' : 'text-secondary-500'}`}
          >
            {timeString}
            {message.edited && ' (edited)'}
          </Text>
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-primary-500 px-4 py-4">
        <Text className="text-center text-xl font-bold text-white">
          Chat Room
        </Text>
        <Text className="text-center text-sm text-blue-100">
          Welcome, {user?.name}
        </Text>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        className="flex-1 px-4 py-4"
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 ? (
          <View className="min-h-[400px] flex-1 items-center justify-center">
            <View className="mb-6 rounded-full bg-secondary-100 p-8">
              <Text className="text-4xl">💬</Text>
            </View>
            <Text className="mb-2 text-center text-lg text-secondary-600">
              No messages yet
            </Text>
            <Text className="text-center text-secondary-500">
              Start the conversation! Say hello to everyone.
            </Text>
          </View>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message._id} message={message} />
          ))
        )}
      </ScrollView>

      {/* Input */}
      <View className="flex-row items-center border-t border-secondary-200 bg-secondary-50 px-4 py-4">
        <TextInput
          className="mr-3 flex-1 rounded-full border border-secondary-300 bg-white px-4 py-3"
          placeholder="Type a message..."
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          maxLength={1000}
          onSubmitEditing={handleSendMessage}
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
    </SafeAreaView>
  )
}
