import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { authComponent } from './auth'

export const getUserChatRooms = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx)
    if (!user) return []

    const userChatRoomLinks = await ctx.db
      .query('userChatRooms')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect()

    const chatRooms = await Promise.all(
      userChatRoomLinks.map(async (link) => {
        return await ctx.db.get(link.chatRoomId)
      }),
    )

    return chatRooms
      .filter((room) => room !== null)
      .sort((a, b) => b.lastMessageTime - a.lastMessageTime)
  },
})

export const searchChatRooms = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, { searchTerm }) => {
    const user = await authComponent.getAuthUser(ctx)
    if (!user) return []

    const userChatRoomLinks = await ctx.db
      .query('userChatRooms')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect()

    if (!searchTerm.trim()) {
      const chatRooms = await Promise.all(
        userChatRoomLinks.map(async (link) => {
          return await ctx.db.get(link.chatRoomId)
        }),
      )

      return chatRooms
        .filter((room) => room !== null)
        .sort((a, b) => b.lastMessageTime - a.lastMessageTime)
        .slice(0, 20)
    }

    const chatRooms = await Promise.all(
      userChatRoomLinks.map(async (link) => {
        return await ctx.db.get(link.chatRoomId)
      }),
    )

    return chatRooms
      .filter((room) => room !== null)
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

    const userChatRoomLinks = await ctx.db
      .query('userChatRooms')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect()

    const otherUserChatRoomLinks = await ctx.db
      .query('userChatRooms')
      .withIndex('by_user', (q) => q.eq('userId', otherUserId))
      .collect()

    for (const userLink of userChatRoomLinks) {
      for (const otherUserLink of otherUserChatRoomLinks) {
        if (userLink.chatRoomId !== otherUserLink.chatRoomId) {
          continue
        }

        const chatRoom = await ctx.db.get(userLink.chatRoomId)
        if (chatRoom && chatRoom.type === 'direct') {
          return chatRoom._id
        }
      }
    }

    const chatRoomId = await ctx.db.insert('chatRooms', {
      type: 'direct',
      createdBy: user._id,
      lastMessageTime: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    await Promise.all([
      ctx.db.insert('userChatRooms', {
        userId: user._id,
        chatRoomId,
      }),
      ctx.db.insert('userChatRooms', {
        userId: otherUserId,
        chatRoomId,
      }),
    ])

    return chatRoomId
  },
})

export const createGroupChat = mutation({
  args: {
    name: v.string(),
    participantIds: v.array(v.string()),
  },
  handler: async (ctx, { name, participantIds }) => {
    const user = await authComponent.getAuthUser(ctx)
    if (!user) throw new Error('Not authenticated')

    const allParticipants = Array.from(new Set([user._id, ...participantIds]))

    const chatRoomId = await ctx.db.insert('chatRooms', {
      name,
      type: 'group',
      createdBy: user._id,
      lastMessageTime: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    await Promise.all(
      allParticipants.map((participantId) =>
        ctx.db.insert('userChatRooms', {
          userId: participantId,
          chatRoomId,
        }),
      ),
    )

    return chatRoomId
  },
})

export const addUserToChatRoom = mutation({
  args: {
    chatRoomId: v.id('chatRooms'),
    userId: v.string(),
  },
  handler: async (ctx, { chatRoomId, userId }) => {
    const user = await authComponent.getAuthUser(ctx)
    if (!user) throw new Error('Not authenticated')

    const chatRoom = await ctx.db.get(chatRoomId)
    if (!chatRoom) throw new Error('Chat room not found')

    if (chatRoom.createdBy !== user._id) {
      throw new Error('Not authorized to add participants')
    }

    const existingLink = await ctx.db
      .query('userChatRooms')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .filter((q) => q.eq(q.field('chatRoomId'), chatRoomId))
      .first()

    if (existingLink) {
      return
    }

    await ctx.db.insert('userChatRooms', {
      userId,
      chatRoomId,
    })

    await ctx.db.patch(chatRoomId, {
      updatedAt: Date.now(),
    })
  },
})

export const removeUserFromChatRoom = mutation({
  args: {
    chatRoomId: v.id('chatRooms'),
    userId: v.string(),
  },
  handler: async (ctx, { chatRoomId, userId }) => {
    const user = await authComponent.getAuthUser(ctx)
    if (!user) throw new Error('Not authenticated')

    const chatRoom = await ctx.db.get(chatRoomId)
    if (!chatRoom) throw new Error('Chat room not found')

    if (chatRoom.createdBy !== user._id && user._id !== userId) {
      throw new Error('Not authorized to remove participants')
    }

    const userChatRoomLink = await ctx.db
      .query('userChatRooms')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .filter((q) => q.eq(q.field('chatRoomId'), chatRoomId))
      .first()

    if (userChatRoomLink) {
      await ctx.db.delete(userChatRoomLink._id)
    }

    const remainingLinks = await ctx.db
      .query('userChatRooms')
      .filter((q) => q.eq(q.field('chatRoomId'), chatRoomId))
      .collect()

    if (remainingLinks.length === 0) {
      await ctx.db.delete(chatRoomId)
    } else {
      await ctx.db.patch(chatRoomId, {
        updatedAt: Date.now(),
      })
    }
  },
})

export const getChatRoomDetails = query({
  args: { chatRoomId: v.id('chatRooms') },
  handler: async (ctx, { chatRoomId }) => {
    const user = await authComponent.getAuthUser(ctx)
    if (!user) return null

    const userChatRoomLink = await ctx.db
      .query('userChatRooms')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .filter((q) => q.eq(q.field('chatRoomId'), chatRoomId))
      .first()

    if (!userChatRoomLink) {
      return null
    }

    const chatRoom = await ctx.db.get(chatRoomId)
    if (!chatRoom) return null

    if (chatRoom.type === 'direct') {
      const allParticipants = await ctx.db
        .query('userChatRooms')
        .filter((q) => q.eq(q.field('chatRoomId'), chatRoomId))
        .collect()

      const otherParticipant = allParticipants.find(
        (p) => p.userId !== user._id,
      )

      if (otherParticipant) {
        const otherUserProfile = await ctx.db
          .query('userProfiles')
          .withIndex('by_user_id', (q) =>
            q.eq('userId', otherParticipant.userId),
          )
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

export const getChatRoomParticipants = query({
  args: { chatRoomId: v.id('chatRooms') },
  handler: async (ctx, { chatRoomId }) => {
    const user = await authComponent.getAuthUser(ctx)
    if (!user) return null

    const userChatRoomLink = await ctx.db
      .query('userChatRooms')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .filter((q) => q.eq(q.field('chatRoomId'), chatRoomId))
      .first()

    if (!userChatRoomLink) {
      return null
    }

    const participantLinks = await ctx.db
      .query('userChatRooms')
      .filter((q) => q.eq(q.field('chatRoomId'), chatRoomId))
      .collect()

    const participants = await Promise.all(
      participantLinks.map(async (link) => {
        const profile = await ctx.db
          .query('userProfiles')
          .withIndex('by_user_id', (q) => q.eq('userId', link.userId))
          .first()
        return {
          userId: link.userId,
          profile,
        }
      }),
    )

    return participants
  },
})
