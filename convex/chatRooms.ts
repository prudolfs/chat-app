import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { authComponent } from './auth'

export const getUserChatRooms = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx)
    if (!user) return []

    const chatRooms = await ctx.db
      .query('chatRooms')
      .withIndex('by_participants', (q) => q.eq('participants', [user._id]))
      .order('desc')
      .collect()

    return chatRooms
      .filter((room) => room.participants.includes(user._id))
      .sort((a, b) => b.lastMessageTime - a.lastMessageTime)
  },
})

export const searchChatRooms = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, { searchTerm }) => {
    const user = await authComponent.getAuthUser(ctx)
    if (!user) return []

    if (!searchTerm.trim()) {
      return await ctx.db
        .query('chatRooms')
        .withIndex('by_participants', (q) => q.eq('participants', [user._id]))
        .order('desc')
        .take(20)
    }

    const allChatRooms = await ctx.db
      .query('chatRooms')
      .withIndex('by_participants', (q) => q.eq('participants', [user._id]))
      .collect()

    return allChatRooms
      .filter((room) => {
        const nameMatch = room.name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase())
        const textMatch = room.lastMessageText
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase())
        return nameMatch || textMatch
      })
      .sort((a, b) => b.lastMessageTime - a.lastMessageTime)
      .slice(0, 20)
  },
})

export const createOrGetDirectChat = mutation({
  args: { otherUserId: v.string() },
  handler: async (ctx, { otherUserId }) => {
    const user = await authComponent.getAuthUser(ctx)
    if (!user) throw new Error('Not authenticated')

    const existingChat = await ctx.db
      .query('chatRooms')
      .filter((q) =>
        q.and(
          q.eq(q.field('type'), 'direct'),
          q.eq(q.field('participants'), [user._id, otherUserId].sort()),
        ),
      )
      .first()

    if (existingChat) {
      return existingChat._id
    }

    const chatRoomId = await ctx.db.insert('chatRooms', {
      type: 'direct',
      participants: [user._id, otherUserId].sort(),
      createdBy: user._id,
      lastMessageTime: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    return chatRoomId
  },
})

export const getChatRoomDetails = query({
  args: { chatRoomId: v.id('chatRooms') },
  handler: async (ctx, { chatRoomId }) => {
    const user = await authComponent.getAuthUser(ctx)
    if (!user) return null

    const chatRoom = await ctx.db.get(chatRoomId)
    if (!chatRoom || !chatRoom.participants.includes(user._id)) {
      return null
    }

    if (chatRoom.type === 'direct') {
      const otherUserId = chatRoom.participants.find((id) => id !== user._id)
      if (otherUserId) {
        const otherUserProfile = await ctx.db
          .query('userProfiles')
          .withIndex('by_user_id', (q) => q.eq('userId', otherUserId))
          .first()

        return {
          ...chatRoom,
          otherUser: otherUserProfile,
          displayName: otherUserProfile?.name || 'Unknown User',
        }
      }
    }

    return {
      ...chatRoom,
      displayName: chatRoom.name || 'Group Chat',
    }
  },
})
