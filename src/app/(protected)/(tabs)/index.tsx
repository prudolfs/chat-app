import { useState, useMemo, useEffect } from 'react'
import {
  View,
  Text,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { router } from 'expo-router'
import { useQuery, useMutation } from 'convex/react'
import { useSession } from '@/lib/auth-client'
import { api } from '~/_generated/api'

export default function ChatsScreen() {
  const [searchTerm, setSearchTerm] = useState('')
  const [showNewChatModal, setShowNewChatModal] = useState(false)
  const [newChatSearch, setNewChatSearch] = useState('')
  const { data: session } = useSession()
  const user = session?.user

  const chatRooms = useQuery(api.chatRooms.getUserChatRooms) ?? []

  const searchResults =
    useQuery(
      api.chatRooms.searchChatRooms,
      searchTerm ? { searchTerm } : 'skip',
    ) ?? []

  const userSearchResults =
    useQuery(
      api.users.searchUsers,
      newChatSearch ? { searchTerm: newChatSearch } : 'skip',
    ) ?? []

  const createProfile = useMutation(api.users.createOrUpdateUserProfile)
  const createDirectChat = useMutation(api.chatRooms.createOrGetDirectChat)

  useEffect(() => {
    if (user) {
      createProfile()
    }
  }, [user])

  const displayData = useMemo(() => {
    return searchTerm.trim() ? searchResults : chatRooms
  }, [searchTerm, searchResults, chatRooms])

  const handleStartNewChat = async (otherUserId: string) => {
    try {
      const chatRoomId = await createDirectChat({ otherUserId })
      setShowNewChatModal(false)
      setNewChatSearch('')
      router.push(`/chat/${chatRoomId}`)
    } catch (error) {
      console.error('Failed to create chat:', error)
    }
  }

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)
    const diffDays = diffMs / (1000 * 60 * 60 * 24)

    if (diffHours < 1) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays < 1) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  const renderChatItem = ({ item }: { item: any }) => {
    let displayName = 'Unknown Chat'

    if (item.type === 'direct') {
      displayName = item.displayName || 'Direct Chat'
    } else if (item.type === 'group') {
      displayName = item.name || 'Group Chat'
    }

    return (
      <TouchableOpacity
        className="flex-row items-center border-b border-secondary-100 px-4 py-4 active:bg-secondary-50"
        onPress={() => router.push(`/chat/${item._id}`)}
      >
        <View className="mr-3 h-12 w-12 items-center justify-center rounded-full bg-primary-500">
          <Text className="text-lg font-semibold text-white">
            {displayName.charAt(0).toUpperCase()}
          </Text>
        </View>

        <View className="flex-1">
          <View className="mb-1 flex-row items-center justify-between">
            <Text className="text-base font-semibold text-secondary-900">
              {displayName}
            </Text>
            <Text className="text-sm text-secondary-500">
              {formatTimestamp(item.lastMessageTime)}
            </Text>
          </View>
          <Text className="text-sm text-secondary-600" numberOfLines={1}>
            {item.lastMessageText || 'No messages yet'}
          </Text>
        </View>
      </TouchableOpacity>
    )
  }

  const renderUserSearchItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      className="flex-row items-center px-4 py-3 active:bg-secondary-100"
      onPress={() => handleStartNewChat(item.userId)}
    >
      <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-primary-500">
        <Text className="font-semibold text-white">
          {item.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View className="flex-1">
        <Text className="font-medium text-secondary-900">{item.name}</Text>
        <Text className="text-sm text-secondary-600">{item.email}</Text>
      </View>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="bg-primary-500 px-4 py-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-xl font-bold text-white">Chats</Text>
          <TouchableOpacity
            className="h-10 w-10 items-center justify-center rounded-full bg-primary-600"
            onPress={() => setShowNewChatModal(true)}
          >
            <Text className="text-xl text-white">+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="border-b border-secondary-200 bg-secondary-50 px-4 py-3">
        <TextInput
          className="rounded-full border border-secondary-300 bg-white px-4 py-2 text-base"
          placeholder="Search chats..."
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      <FlatList
        data={displayData}
        renderItem={renderChatItem}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-20">
            <Text className="mb-4 text-6xl">💬</Text>
            <Text className="text-center text-lg text-secondary-600">
              {searchTerm ? 'No chats found' : 'No chats yet'}
            </Text>
            <Text className="mt-2 px-8 text-center text-secondary-500">
              {searchTerm
                ? 'Try a different search term'
                : 'Tap the + button to start a new conversation'}
            </Text>
          </View>
        }
      />

      <Modal
        visible={showNewChatModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView className="flex-1 bg-white">
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1"
          >
            <View className="flex-row items-center justify-between border-b border-secondary-200 px-4 py-4">
              <Text className="text-lg font-bold">New Chat</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowNewChatModal(false)
                  setNewChatSearch('')
                }}
              >
                <Text className="text-base font-medium text-primary-500">
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>

            <View className="border-b border-secondary-200 px-4 py-3">
              <TextInput
                className="rounded-lg bg-secondary-100 px-3 py-2 text-base"
                placeholder="Search by name or email..."
                value={newChatSearch}
                onChangeText={setNewChatSearch}
                autoFocus
              />
            </View>

            <FlatList
              data={userSearchResults}
              renderItem={renderUserSearchItem}
              keyExtractor={(item) => item.userId}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View className="flex-1 items-center justify-center py-20">
                  <Text className="mb-4 text-4xl">🔍</Text>
                  <Text className="text-center text-secondary-600">
                    {newChatSearch
                      ? 'No users found'
                      : 'Search for people to start chatting'}
                  </Text>
                </View>
              }
            />
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  )
}
