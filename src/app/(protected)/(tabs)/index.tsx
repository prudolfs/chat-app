import { useState, useMemo } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useQuery, useMutation } from 'convex/react'
import { api } from '~/_generated/api'
import { TopBar } from '@/components/ui/top-bar'
import { cn } from '@/lib/utils'

type ChatMode = 'direct' | 'group'

export default function ChatsScreen() {
  const [searchTerm, setSearchTerm] = useState('')
  const [showNewChatModal, setShowNewChatModal] = useState(false)
  const [chatMode, setChatMode] = useState<ChatMode>('direct')
  const [newChatSearch, setNewChatSearch] = useState('')
  const [groupName, setGroupName] = useState('')
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])

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

  const createDirectChat = useMutation(api.chatRooms.createOrGetDirectChat)
  const createGroupChat = useMutation(api.chatRooms.createGroupChat)

  const displayData = useMemo(() => {
    return searchTerm.trim() ? searchResults : chatRooms
  }, [searchTerm, searchResults, chatRooms])

  const handleStartNewChat = async (otherUserId: string) => {
    try {
      const chatRoomId = await createDirectChat({ otherUserId })
      setShowNewChatModal(false)
      setNewChatSearch('')
      setChatMode('direct')
      router.push(`/chat/${chatRoomId}`)
    } catch (error) {
      console.error('Failed to create chat:', error)
    }
  }

  const handleCreateGroupChat = async () => {
    if (!groupName.trim() || selectedParticipants.length === 0) {
      return
    }

    try {
      const chatRoomId = await createGroupChat({
        name: groupName.trim(),
        participantIds: selectedParticipants,
      })
      setShowNewChatModal(false)
      setNewChatSearch('')
      setGroupName('')
      setSelectedParticipants([])
      setChatMode('direct')
      router.push(`/chat/${chatRoomId}`)
    } catch (error) {
      console.error('Failed to create group chat:', error)
    }
  }

  const toggleParticipant = (userId: string) => {
    setSelectedParticipants((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    )
  }

  const resetModal = () => {
    setShowNewChatModal(false)
    setNewChatSearch('')
    setGroupName('')
    setSelectedParticipants([])
    setChatMode('direct')
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
    const isDirectChat = item.type === 'direct'
    const isOnline = isDirectChat && item.otherUser?.isOnline

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
        <View className="relative mr-3">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-primary-500">
            <Text className="text-lg font-semibold text-white">
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
          {isDirectChat && (
            <View
              className={cn(
                'absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white',
                isOnline ? 'bg-green-500' : 'bg-secondary-400',
              )}
            />
          )}
        </View>

        <View className="flex-1">
          <View className="mb-1 flex-row items-center justify-between">
            <View className="flex-1 flex-row items-center">
              <Text className="text-base font-semibold text-secondary-900">
                {displayName}
              </Text>
              {isDirectChat && (
                <Text
                  className={cn(
                    'ml-2 text-xs',
                    isOnline ? 'text-green-600' : 'text-secondary-500',
                  )}
                >
                  {isOnline ? 'Online' : 'Offline'}
                </Text>
              )}
            </View>
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

  const renderUserSearchItem = ({ item }: { item: any }) => {
    const isSelected = selectedParticipants.includes(item.userId)
    const isOnline = item.isOnline

    if (chatMode === 'direct') {
      return (
        <TouchableOpacity
          className="flex-row items-center px-4 py-3 active:bg-secondary-100"
          onPress={() => handleStartNewChat(item.userId)}
        >
          <View className="relative mr-3">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-primary-500">
              <Text className="font-semibold text-white">
                {item.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View
              className={cn(
                'absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white',
                isOnline ? 'bg-green-500' : 'bg-secondary-400',
              )}
            />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center">
              <Text className="font-medium text-secondary-900">
                {item.name}
              </Text>
              <Text
                className={cn(
                  'ml-2 text-xs',
                  isOnline ? 'text-green-600' : 'text-secondary-500',
                )}
              >
                {isOnline ? 'Online' : 'Offline'}
              </Text>
            </View>
            <Text className="text-sm text-secondary-600">{item.email}</Text>
          </View>
        </TouchableOpacity>
      )
    }

    return (
      <TouchableOpacity
        className={cn(
          'flex-row items-center px-4 py-3',
          isSelected ? 'bg-primary-50' : 'active:bg-secondary-100',
        )}
        onPress={() => toggleParticipant(item.userId)}
      >
        <View className="relative mr-3">
          <View
            className={cn(
              'h-10 w-10 items-center justify-center rounded-full',
              isSelected ? 'bg-primary-500' : 'bg-secondary-300',
            )}
          >
            <Text className="font-semibold text-white">
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View
            className={cn(
              'absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white',
              isOnline ? 'bg-green-500' : 'bg-secondary-400',
            )}
          />
        </View>
        <View className="flex-1">
          <View className="flex-row items-center">
            <Text className="font-medium text-secondary-900">{item.name}</Text>
            <Text
              className={cn(
                'ml-2 text-xs',
                isOnline ? 'text-green-600' : 'text-secondary-500',
              )}
            >
              {isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
          <Text className="text-sm text-secondary-600">{item.email}</Text>
        </View>
        {isSelected && (
          <View className="ml-2 h-6 w-6 items-center justify-center rounded-full bg-primary-500">
            <Text className="text-xs font-bold text-white">✓</Text>
          </View>
        )}
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['bottom']}>
      <TopBar
        title="Chats"
        rightAction={
          <TouchableOpacity
            className="h-7 w-7 items-center justify-center rounded-full bg-primary-600"
            onPress={() => setShowNewChatModal(true)}
          >
            <Text className="text-base text-white">+</Text>
          </TouchableOpacity>
        }
      />

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
              <TouchableOpacity onPress={resetModal}>
                <Text className="text-base font-medium text-primary-500">
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>

            {/* Chat Mode Selector */}
            <View className="flex-row border-b border-secondary-200 px-4 py-3">
              <TouchableOpacity
                className={cn(
                  'flex-1 rounded-lg px-4 py-2',
                  chatMode === 'direct' ? 'bg-primary-500' : 'bg-secondary-100',
                )}
                onPress={() => {
                  setChatMode('direct')
                  setSelectedParticipants([])
                  setGroupName('')
                }}
              >
                <Text
                  className={cn(
                    'text-center font-medium',
                    chatMode === 'direct' ? 'text-white' : 'text-secondary-700',
                  )}
                >
                  Direct Chat
                </Text>
              </TouchableOpacity>
              <View className="w-3" />
              <TouchableOpacity
                className={cn(
                  'flex-1 rounded-lg px-4 py-2',
                  chatMode === 'group' ? 'bg-primary-500' : 'bg-secondary-100',
                )}
                onPress={() => {
                  setChatMode('group')
                  setSelectedParticipants([])
                }}
              >
                <Text
                  className={cn(
                    'text-center font-medium',
                    chatMode === 'group' ? 'text-white' : 'text-secondary-700',
                  )}
                >
                  Group Chat
                </Text>
              </TouchableOpacity>
            </View>

            {/* Group Name Input (only for group mode) */}
            {chatMode === 'group' && (
              <View className="border-b border-secondary-200 px-4 py-3">
                <TextInput
                  className="rounded-lg bg-secondary-100 px-3 py-2 text-base"
                  placeholder="Group name..."
                  value={groupName}
                  onChangeText={setGroupName}
                />
              </View>
            )}

            {/* Selected Participants (only for group mode) */}
            {chatMode === 'group' && selectedParticipants.length > 0 && (
              <View className="border-b border-secondary-200 bg-secondary-50 px-4 py-3">
                <Text className="mb-2 text-sm font-medium text-secondary-700">
                  Selected ({selectedParticipants.length})
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-2">
                    {userSearchResults
                      .filter((user) =>
                        selectedParticipants.includes(user.userId),
                      )
                      .map((user) => (
                        <View
                          key={user.userId}
                          className="flex-row items-center rounded-full bg-primary-500 px-3 py-1"
                        >
                          <Text className="mr-2 text-sm text-white">
                            {user.name}
                          </Text>
                          <TouchableOpacity
                            onPress={() => toggleParticipant(user.userId)}
                          >
                            <Text className="text-sm font-bold text-white">
                              ×
                            </Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* User Search */}
            <View className="border-b border-secondary-200 px-4 py-3">
              <TextInput
                className="rounded-lg bg-secondary-100 px-3 py-2 text-base"
                placeholder="Search by name or email..."
                value={newChatSearch}
                onChangeText={setNewChatSearch}
                autoFocus={chatMode === 'direct'}
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

            {/* Create Group Button (only for group mode) */}
            {chatMode === 'group' && (
              <View className="border-t border-secondary-200 bg-white px-4 py-4">
                <TouchableOpacity
                  className={cn(
                    'rounded-lg px-4 py-3',
                    groupName.trim() && selectedParticipants.length > 0
                      ? 'bg-primary-500'
                      : 'bg-secondary-300',
                  )}
                  onPress={handleCreateGroupChat}
                  disabled={
                    !groupName.trim() || selectedParticipants.length === 0
                  }
                >
                  <Text className="text-center text-base font-semibold text-white">
                    Create Group ({selectedParticipants.length} member
                    {selectedParticipants.length !== 1 ? 's' : ''})
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  )
}
