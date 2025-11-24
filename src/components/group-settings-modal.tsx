import React, { useState } from 'react'
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
import { Id } from '~/_generated/dataModel'
import { useSession } from '@/lib/auth-client'
import { cn } from '@/lib/utils'

interface GroupSettingsModalProps {
  visible: boolean
  chatRoomId: Id<'chatRooms'>
  onClose: () => void
}

export function GroupSettingsModal({
  visible,
  chatRoomId,
  onClose,
}: GroupSettingsModalProps) {
  const { data: session } = useSession()
  const user = session?.user
  const [showAddMember, setShowAddMember] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])

  const chatRoom = useQuery(api.chatRooms.getChatRoomDetails, {
    chatRoomId,
  })
  const participants =
    useQuery(api.chatRooms.getChatRoomParticipants, {
      chatRoomId,
    }) ?? []

  const userSearchResults =
    useQuery(api.users.searchUsers, searchTerm ? { searchTerm } : 'skip') ?? []

  const addUserToChatRoom = useMutation(api.chatRooms.addUserToChatRoom)
  const removeUserFromChatRoom = useMutation(
    api.chatRooms.removeUserFromChatRoom,
  )

  const isCreator = chatRoom?.createdBy === user?.id
  const existingParticipantIds = participants.map((p) => p.userId)

  const availableUsers = userSearchResults.filter(
    (u) => !existingParticipantIds.includes(u.userId),
  )

  const handleAddMembers = async () => {
    if (selectedParticipants.length === 0) return

    try {
      await Promise.all(
        selectedParticipants.map((userId) =>
          addUserToChatRoom({ chatRoomId, userId }),
        ),
      )
      setShowAddMember(false)
      setSearchTerm('')
      setSelectedParticipants([])
    } catch (error) {
      console.error('Failed to add members:', error)
    }
  }

  const handleRemoveMember = async (userId: string) => {
    const isCurrentUser = userId === user?.id
    try {
      await removeUserFromChatRoom({ chatRoomId, userId })
      if (isCurrentUser) {
        onClose()
        router.replace('/(tabs)')
      }
    } catch (error) {
      console.error('Failed to remove member:', error)
    }
  }

  const toggleParticipant = (userId: string) => {
    setSelectedParticipants((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    )
  }

  const resetAddMember = () => {
    setShowAddMember(false)
    setSearchTerm('')
    setSelectedParticipants([])
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-white">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          {/* Header */}
          <View className="flex-row items-center justify-between border-b border-secondary-200 px-4 py-4">
            <Text className="text-lg font-bold">Group Settings</Text>
            <TouchableOpacity onPress={onClose}>
              <Text className="text-base font-medium text-primary-500">
                Done
              </Text>
            </TouchableOpacity>
          </View>

          {!showAddMember ? (
            <ScrollView className="flex-1">
              {/* Group Name */}
              <View className="border-b border-secondary-200 px-4 py-4">
                <Text className="mb-2 text-sm font-medium text-secondary-700">
                  Group Name
                </Text>
                <Text className="text-lg text-secondary-900">
                  {chatRoom?.name || 'Unnamed Group'}
                </Text>
              </View>

              {/* Participants */}
              <View className="border-b border-secondary-200 px-4 py-4">
                <View className="mb-3 flex-row items-center justify-between">
                  <Text className="text-sm font-medium text-secondary-700">
                    Participants ({participants.length})
                  </Text>
                  {isCreator && (
                    <TouchableOpacity
                      onPress={() => setShowAddMember(true)}
                      className="rounded-lg bg-primary-500 px-3 py-1.5"
                    >
                      <Text className="text-sm font-medium text-white">
                        + Add
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                <FlatList
                  data={participants}
                  scrollEnabled={false}
                  keyExtractor={(item) => item.userId}
                  renderItem={({ item }) => {
                    const profile = item.profile
                    const isCurrentUser = item.userId === user?.id
                    const canRemove = isCreator || isCurrentUser

                    return (
                      <View className="mb-3 flex-row items-center justify-between">
                        <View className="flex-1 flex-row items-center">
                          <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-primary-500">
                            <Text className="font-semibold text-white">
                              {profile?.name?.charAt(0).toUpperCase() || '?'}
                            </Text>
                          </View>
                          <View className="flex-1">
                            <Text className="font-medium text-secondary-900">
                              {profile?.name || 'Unknown User'}
                              {isCurrentUser && ' (You)'}
                            </Text>
                            <Text className="text-sm text-secondary-600">
                              {profile?.email || 'No email'}
                            </Text>
                          </View>
                        </View>
                        {canRemove && !isCurrentUser && (
                          <TouchableOpacity
                            onPress={() => handleRemoveMember(item.userId)}
                            className="ml-2 rounded-lg bg-red-100 px-3 py-1.5"
                          >
                            <Text className="text-sm font-medium text-red-600">
                              Remove
                            </Text>
                          </TouchableOpacity>
                        )}
                        {isCurrentUser && (
                          <TouchableOpacity
                            onPress={() => handleRemoveMember(item.userId)}
                            className="ml-2 rounded-lg bg-red-100 px-3 py-1.5"
                          >
                            <Text className="text-sm font-medium text-red-600">
                              Leave
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )
                  }}
                />
              </View>
            </ScrollView>
          ) : (
            <>
              {/* Add Member Header */}
              <View className="flex-row items-center justify-between border-b border-secondary-200 px-4 py-4">
                <Text className="text-lg font-bold">Add Members</Text>
                <TouchableOpacity onPress={resetAddMember}>
                  <Text className="text-base font-medium text-primary-500">
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Selected Participants */}
              {selectedParticipants.length > 0 && (
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

              {/* Search */}
              <View className="border-b border-secondary-200 px-4 py-3">
                <TextInput
                  className="rounded-lg bg-secondary-100 px-3 py-2 text-base"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChangeText={setSearchTerm}
                  autoFocus
                />
              </View>

              {/* User List */}
              <FlatList
                data={availableUsers}
                keyExtractor={(item) => item.userId}
                renderItem={({ item }) => {
                  const isSelected = selectedParticipants.includes(item.userId)
                  return (
                    <TouchableOpacity
                      className={cn(
                        'flex-row items-center px-4 py-3',
                        isSelected
                          ? 'bg-primary-50'
                          : 'active:bg-secondary-100',
                      )}
                      onPress={() => toggleParticipant(item.userId)}
                    >
                      <View
                        className={cn(
                          'mr-3 h-10 w-10 items-center justify-center rounded-full',
                          isSelected ? 'bg-primary-500' : 'bg-secondary-300',
                        )}
                      >
                        <Text className="font-semibold text-white">
                          {item.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="font-medium text-secondary-900">
                          {item.name}
                        </Text>
                        <Text className="text-sm text-secondary-600">
                          {item.email}
                        </Text>
                      </View>
                      {isSelected && (
                        <View className="ml-2 h-6 w-6 items-center justify-center rounded-full bg-primary-500">
                          <Text className="text-xs font-bold text-white">
                            ✓
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  )
                }}
                ListEmptyComponent={
                  <View className="flex-1 items-center justify-center py-20">
                    <Text className="mb-4 text-4xl">🔍</Text>
                    <Text className="text-center text-secondary-600">
                      {searchTerm
                        ? 'No users found'
                        : 'Search for people to add'}
                    </Text>
                  </View>
                }
              />

              {/* Add Button */}
              <View className="border-t border-secondary-200 bg-white px-4 py-4">
                <TouchableOpacity
                  className={cn(
                    'rounded-lg px-4 py-3',
                    selectedParticipants.length > 0
                      ? 'bg-primary-500'
                      : 'bg-secondary-300',
                  )}
                  onPress={handleAddMembers}
                  disabled={selectedParticipants.length === 0}
                >
                  <Text className="text-center text-base font-semibold text-white">
                    Add ({selectedParticipants.length} member
                    {selectedParticipants.length !== 1 ? 's' : ''})
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  )
}
