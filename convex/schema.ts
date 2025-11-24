import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  // Better Auth tables are created automatically

  chatRooms: defineTable({
    name: v.optional(v.string()), // For group chats
    type: v.union(v.literal('direct'), v.literal('group')),
    createdBy: v.string(), // Better Auth user ID
    lastMessageId: v.optional(v.id('messages')),
    lastMessageTime: v.number(),
    lastMessageText: v.optional(v.string()), // Cache for chat list
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_last_message_time', ['lastMessageTime']),

  userChatRooms: defineTable({
    userId: v.string(),
    chatRoomId: v.id('chatRooms'),
  }).index('by_user', ['userId']),

  messages: defineTable({
    chatRoomId: v.id('chatRooms'),
    text: v.string(),
    userId: v.string(), // Better Auth user ID
    userName: v.string(), // Cache for performance
    userImage: v.optional(v.string()),
    timestamp: v.number(),
    edited: v.optional(v.boolean()),
    editedAt: v.optional(v.number()),
  })
    .index('by_chat_room', ['chatRoomId', 'timestamp'])
    .index('by_timestamp', ['timestamp']),

  // User profiles (for search)
  userProfiles: defineTable({
    userId: v.string(), // Better Auth user ID
    name: v.string(),
    email: v.string(),
    image: v.optional(v.string()),
    status: v.optional(v.string()),
    isOnline: v.boolean(),
    lastSeen: v.number(),
    pushToken: v.optional(v.string()), // Expo push notification token
  })
    .index('by_user_id', ['userId'])
    .index('by_name', ['name'])
    .index('by_email', ['email']),

  // Message reactions
  messageReactions: defineTable({
    messageId: v.id('messages'),
    userId: v.string(), // Better Auth user ID
    emoji: v.string(), // Emoji character
    timestamp: v.number(),
  })
    .index('by_message', ['messageId'])
    .index('by_user_and_message', ['userId', 'messageId']),
})
