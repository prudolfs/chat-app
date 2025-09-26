import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { authComponent } from './auth'

export const getChatMessages = query({
  args: { chatRoomId: v.id('chatRooms') },
  handler: async (ctx, { chatRoomId }) => {
    const user = await authComponent.getAuthUser(ctx)
    if (!user) return []

    const userChatRoomLink = await ctx.db
      .query('userChatRooms')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .filter((q) => q.eq(q.field('chatRoomId'), chatRoomId))
      .first()

    if (!userChatRoomLink) {
      return []
    }

    return await ctx.db
      .query('messages')
      .withIndex('by_chat_room', (q) => q.eq('chatRoomId', chatRoomId))
      .order('asc')
      .take(100)
  },
})

export const sendMessage = mutation({
  args: {
    chatRoomId: v.id('chatRooms'),
    text: v.string(),
  },
  handler: async (ctx, { chatRoomId, text }) => {
    const user = await authComponent.getAuthUser(ctx)
    if (!user) throw new Error('Not authenticated')

    const userChatRoomLink = await ctx.db
      .query('userChatRooms')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .filter((q) => q.eq(q.field('chatRoomId'), chatRoomId))
      .first()

    if (!userChatRoomLink) {
      throw new Error('Not authorized to send messages to this chat')
    }

    const userProfile = await ctx.db
      .query('userProfiles')
      .withIndex('by_user_id', (q) => q.eq('userId', user._id))
      .first()

    const messageId = await ctx.db.insert('messages', {
      chatRoomId,
      text,
      userId: user._id,
      userName: userProfile?.name || user.name || 'Unknown User',
      userImage: userProfile?.image || user.image || undefined,
      timestamp: Date.now(),
    })

    await ctx.db.patch(chatRoomId, {
      lastMessageId: messageId,
      lastMessageTime: Date.now(),
      lastMessageText: text.substring(0, 100),
      updatedAt: Date.now(),
    })

    return messageId
  },
})

export const editMessage = mutation({
  args: {
    messageId: v.id('messages'),
    newText: v.string(),
  },
  handler: async (ctx, { messageId, newText }) => {
    const user = await authComponent.getAuthUser(ctx)
    if (!user) throw new Error('Not authenticated')

    const message = await ctx.db.get(messageId)
    if (!message) throw new Error('Message not found')

    if (message.userId !== user._id) {
      throw new Error('Not authorized to edit this message')
    }

    await ctx.db.patch(messageId, {
      text: newText,
      edited: true,
      editedAt: Date.now(),
    })

    const chatRoom = await ctx.db.get(message.chatRoomId)
    if (chatRoom?.lastMessageId === messageId) {
      await ctx.db.patch(message.chatRoomId, {
        lastMessageText: newText.substring(0, 100),
        updatedAt: Date.now(),
      })
    }

    return messageId
  },
})

export const deleteMessage = mutation({
  args: {
    messageId: v.id('messages'),
  },
  handler: async (ctx, { messageId }) => {
    const user = await authComponent.getAuthUser(ctx)
    if (!user) throw new Error('Not authenticated')

    const message = await ctx.db.get(messageId)
    if (!message) throw new Error('Message not found')

    if (message.userId !== user._id) {
      throw new Error('Not authorized to delete this message')
    }

    await ctx.db.delete(messageId)

    const chatRoom = await ctx.db.get(message.chatRoomId)
    if (chatRoom?.lastMessageId === messageId) {
      const previousMessage = await ctx.db
        .query('messages')
        .withIndex('by_chat_room', (q) =>
          q.eq('chatRoomId', message.chatRoomId),
        )
        .order('desc')
        .first()

      if (previousMessage) {
        await ctx.db.patch(message.chatRoomId, {
          lastMessageId: previousMessage._id,
          lastMessageTime: previousMessage.timestamp,
          lastMessageText: previousMessage.text.substring(0, 100),
          updatedAt: Date.now(),
        })
      } else {
        await ctx.db.patch(message.chatRoomId, {
          lastMessageId: undefined,
          lastMessageTime: chatRoom.createdAt,
          lastMessageText: undefined,
          updatedAt: Date.now(),
        })
      }
    }

    return messageId
  },
})
