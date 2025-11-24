import React, { useState, useRef, useEffect, useMemo } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Platform,
  Keyboard,
  Animated,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLocalSearchParams } from 'expo-router'
import { useQuery, useMutation } from 'convex/react'
import { useSession } from '@/lib/auth-client'
import { cn } from '@/lib/utils'
import { api } from '~/_generated/api'
import { Id } from '~/_generated/dataModel'
import type { Doc } from '~/_generated/dataModel'
import { TopBar } from '@/components/ui/top-bar'
import { GroupSettingsModal } from '@/components/group-settings-modal'
import { EmojiPicker } from '@/components/emoji-picker'
import {
  format,
  differenceInDays,
  differenceInMinutes,
  formatDistanceToNow,
} from 'date-fns'

export default function ChatScreen() {
  const { chatRoomId } = useLocalSearchParams<{ chatRoomId: Id<'chatRooms'> }>()
  const [newMessage, setNewMessage] = useState('')
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)
  const [showGroupSettings, setShowGroupSettings] = useState(false)
  const [selectedMessageId, setSelectedMessageId] =
    useState<Id<'messages'> | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const flatListRef = useRef<FlatList>(null)
  const keyboardHeightAnim = useRef(new Animated.Value(0)).current
  const insets = useSafeAreaInsets()
  const { data: session } = useSession()
  const user = session?.user

  const chatRoom = useQuery(api.chatRooms.getChatRoomDetails, {
    chatRoomId: chatRoomId,
  })
  const participants =
    useQuery(api.chatRooms.getChatRoomParticipants, {
      chatRoomId: chatRoomId,
    }) ?? []
  const messages =
    useQuery(api.messages.getChatMessages, {
      chatRoomId: chatRoomId,
    }) ?? []
  const sendMessage = useMutation(api.messages.sendMessage)
  const addReaction = useMutation(api.messages.addReaction)
  const reversedMessages = [...messages].reverse()

  // Get reactions for all messages
  const messageIds = useMemo(() => messages.map((m) => m._id), [messages])
  const reactionsData =
    useQuery(api.messages.getMessageReactions, {
      messageIds: messageIds,
    }) ?? []

  // Create a map of messageId -> reactions for quick lookup
  const reactionsMap = useMemo(() => {
    const map = new Map<
      Id<'messages'>,
      Array<{ emoji: string; count: number; userReacted: boolean }>
    >()
    for (const data of reactionsData) {
      map.set(data.messageId, data.reactions)
    }
    return map
  }, [reactionsData])

  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        const height = e.endCoordinates.height
        setIsKeyboardVisible(true)

        Animated.timing(keyboardHeightAnim, {
          toValue: height,
          duration: Platform.OS === 'ios' ? e.duration : 250,
          useNativeDriver: true,
        }).start()
      },
    )

    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      (e) => {
        setIsKeyboardVisible(false)

        Animated.timing(keyboardHeightAnim, {
          toValue: 0,
          duration: Platform.OS === 'ios' ? e.duration : 250,
          useNativeDriver: true,
        }).start()
      },
    )

    return () => {
      keyboardWillShowListener.remove()
      keyboardWillHideListener.remove()
    }
  }, [keyboardHeightAnim])

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return

    try {
      await sendMessage({
        chatRoomId: chatRoomId,
        text: newMessage.trim(),
      })
      setNewMessage('')
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleLongPressMessage = (messageId: Id<'messages'>) => {
    setSelectedMessageId(messageId)
    setShowEmojiPicker(true)
    Keyboard.dismiss()
  }

  const handleEmojiSelect = async (emoji: string) => {
    if (!selectedMessageId) return

    try {
      await addReaction({
        messageId: selectedMessageId,
        emoji,
      })
      setShowEmojiPicker(false)
      setSelectedMessageId(null)
    } catch (error) {
      console.error('Failed to add reaction:', error)
    }
  }

  const handleReactionPress = async (
    messageId: Id<'messages'>,
    emoji: string,
  ) => {
    try {
      await addReaction({
        messageId,
        emoji,
      })
    } catch (error) {
      console.error('Failed to toggle reaction:', error)
    }
  }

  const renderMessage = ({ item }: { item: Doc<'messages'> }) => {
    const isMe = item.userId === user?.id
    const timeString = new Date(item.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
    const reactions = reactionsMap.get(item._id) || []

    return (
      <View className={cn('mb-4', isMe ? 'items-end' : 'items-start')}>
        {!isMe && chatRoom?.type === 'group' && (
          <Text className="mb-1 ml-3 text-xs text-secondary-500">
            {item.userName || 'Unknown User'}
          </Text>
        )}
        <TouchableOpacity
          onLongPress={() => handleLongPressMessage(item._id)}
          activeOpacity={0.9}
        >
          <View
            className={cn(
              'max-w-[80%] rounded-2xl px-4 py-3',
              isMe
                ? 'rounded-br-md bg-primary-500'
                : 'rounded-bl-md bg-secondary-100',
            )}
          >
            <Text
              className={cn(
                'text-base',
                isMe ? 'text-white' : 'text-secondary-900',
              )}
            >
              {item.text}
            </Text>
            <Text
              className={cn(
                'mt-1 text-xs',
                isMe ? 'text-blue-100' : 'text-secondary-500',
              )}
            >
              {timeString}
              {item.edited && ' (edited)'}
            </Text>
          </View>
        </TouchableOpacity>
        {reactions.length > 0 && (
          <View
            className={cn(
              'mt-1 flex-row flex-wrap gap-1',
              isMe ? 'mr-0 justify-end' : 'ml-0 justify-start',
            )}
            style={{ maxWidth: '80%' }}
          >
            {reactions.map((reaction, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleReactionPress(item._id, reaction.emoji)}
                className={cn(
                  'flex-row items-center gap-1 rounded-full border px-2 py-1',
                  reaction.userReacted
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-secondary-300 bg-white',
                )}
              >
                <Text className="text-sm">{reaction.emoji}</Text>
                {reaction.count > 1 && (
                  <Text
                    className={cn(
                      'text-xs',
                      reaction.userReacted
                        ? 'text-primary-700'
                        : 'text-secondary-600',
                    )}
                  >
                    {reaction.count}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    )
  }

  const getOnlineStatus = () => {
    if (
      chatRoom?.type === 'direct' &&
      'otherUser' in chatRoom &&
      chatRoom.otherUser
    ) {
      if (chatRoom.otherUser.isOnline) {
        return 'Online'
      } else {
        // Show last seen time
        const lastSeen = chatRoom.otherUser.lastSeen
        if (lastSeen) {
          try {
            const now = new Date()
            const lastSeenDate = new Date(lastSeen)

            if (differenceInMinutes(now, lastSeenDate) < 1) {
              return 'Last seen just now'
            }

            if (differenceInDays(now, lastSeenDate) >= 7) {
              return `Last seen ${format(lastSeenDate, 'MMM d, yyyy')}`
            }

            const diffText = formatDistanceToNow(lastSeenDate, {
              addSuffix: true,
            })
            return `Last seen ${diffText}`
          } catch (e) {
            // Fallback in case of invalid lastSeen
            return 'Last seen some time ago'
          }
        }
        return 'Offline'
      }
    }
    if (chatRoom?.type === 'group') {
      const participantCount = participants?.length || 0
      return `${participantCount} member${participantCount !== 1 ? 's' : ''}`
    }
    return null
  }

  if (!chatRoom) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-secondary-500">Loading chat...</Text>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-white">
      <View className="flex-1">
        <View
          style={{
            zIndex: 10,
            elevation: 10,
          }}
        >
          <TopBar
            showBack
            title={chatRoom.displayName}
            subtitle={getOnlineStatus() || undefined}
            avatar={chatRoom.displayName?.charAt(0) || 'C'}
            isOnline={
              chatRoom.type === 'direct' &&
              'otherUser' in chatRoom &&
              chatRoom.otherUser
                ? chatRoom.otherUser.isOnline
                : undefined
            }
            rightAction={
              chatRoom.type === 'group' ? (
                <TouchableOpacity
                  className="h-7 w-7 items-center justify-center"
                  onPress={() => setShowGroupSettings(true)}
                >
                  <Text className="text-base text-white">⋮</Text>
                </TouchableOpacity>
              ) : undefined
            }
          />
        </View>

        <Animated.View
          style={{
            flex: 1,
            zIndex: 0,
            transform: [
              {
                translateY: keyboardHeightAnim.interpolate({
                  inputRange: [0, 1000],
                  outputRange: [0, -1000],
                }),
              },
            ],
          }}
        >
          <View className="flex-1">
            <FlatList
              ref={flatListRef}
              data={reversedMessages}
              renderItem={renderMessage}
              keyExtractor={(item) => item._id}
              className="flex-1 px-4"
              contentContainerStyle={{
                paddingVertical: 16,
              }}
              inverted
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View
                  className="min-h-[400px] flex-1 items-center justify-center"
                  style={{ transform: [{ scaleY: -1 }] }}
                >
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
          </View>

          <View>
            <EmojiPicker
              visible={showEmojiPicker}
              onEmojiSelect={handleEmojiSelect}
              onClose={() => {
                setShowEmojiPicker(false)
                setSelectedMessageId(null)
              }}
            />
            <View
              className="flex-row items-end border-t border-secondary-200 bg-secondary-50 px-4 py-4"
              style={{
                paddingBottom: isKeyboardVisible
                  ? 16
                  : Math.max(16, insets.bottom),
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
                className={cn(
                  'h-12 w-12 items-center justify-center rounded-full',
                  newMessage.trim() ? 'bg-primary-500' : 'bg-secondary-300',
                )}
                onPress={handleSendMessage}
                disabled={!newMessage.trim()}
              >
                <Text className="text-lg text-white">→</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>

      {chatRoom.type === 'group' && (
        <GroupSettingsModal
          visible={showGroupSettings}
          chatRoomId={chatRoomId}
          onClose={() => setShowGroupSettings(false)}
        />
      )}
    </View>
  )
}
