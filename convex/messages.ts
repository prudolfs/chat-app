import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { authComponent } from './auth'

export const getChatMessages = query({
  args: { chatRoomId: v.id('chatRooms') },
  handler: async (ctx, { chatRoomId }) => {
    const user = await authComponent.getAuthUser(ctx)
    if (!user) return []

    const chatRoom = await ctx.db.get(chatRoomId)
    if (!chatRoom || !chatRoom.participants.includes(user._id)) {
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

    const chatRoom = await ctx.db.get(chatRoomId)
    if (!chatRoom || !chatRoom.participants.includes(user._id)) {
      throw new Error('Not authorized to send messages to this chat')
    }

    const messageId = await ctx.db.insert('messages', {
      chatRoomId,
      text,
      userId: user._id,
      userName: user.name || 'Unknown User',
      userImage: user.image ?? undefined,
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
