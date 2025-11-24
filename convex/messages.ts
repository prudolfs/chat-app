import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { authComponent } from './auth'
import { api } from './_generated/api'

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

    // Schedule push notification (don't await - fire and forget)
    ctx.scheduler
      .runAfter(0, api.notifications.sendPushNotifications, {
        chatRoomId,
        senderId: user._id,
        messageText: text,
        senderName: userProfile?.name || user.name || 'Unknown User',
      })
      .catch(console.error)

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

export const getMessageReactions = query({
  args: { messageIds: v.array(v.id('messages')) },
  handler: async (ctx, { messageIds }) => {
    const user = await authComponent.getAuthUser(ctx)
    if (!user) return []

    const reactions = await Promise.all(
      messageIds.map(async (messageId) => {
        const messageReactions = await ctx.db
          .query('messageReactions')
          .withIndex('by_message', (q) => q.eq('messageId', messageId))
          .collect()

        // Group reactions by emoji
        const grouped: Record<
          string,
          { emoji: string; count: number; userReacted: boolean }
        > = {}

        for (const reaction of messageReactions) {
          if (!grouped[reaction.emoji]) {
            grouped[reaction.emoji] = {
              emoji: reaction.emoji,
              count: 0,
              userReacted: false,
            }
          }
          grouped[reaction.emoji].count++
          if (reaction.userId === user._id) {
            grouped[reaction.emoji].userReacted = true
          }
        }

        return {
          messageId,
          reactions: Object.values(grouped),
        }
      }),
    )

    return reactions
  },
})

export const addReaction = mutation({
  args: {
    messageId: v.id('messages'),
    emoji: v.string(),
  },
  handler: async (ctx, { messageId, emoji }) => {
    const user = await authComponent.getAuthUser(ctx)
    if (!user) throw new Error('Not authenticated')

    // Check if user already reacted with this emoji
    const existingReaction = await ctx.db
      .query('messageReactions')
      .withIndex('by_user_and_message', (q) =>
        q.eq('userId', user._id).eq('messageId', messageId),
      )
      .filter((q) => q.eq(q.field('emoji'), emoji))
      .first()

    if (existingReaction) {
      // Remove existing reaction (toggle off)
      await ctx.db.delete(existingReaction._id)
      return { added: false }
    }

    // Check if message exists and user has access
    const message = await ctx.db.get(messageId)
    if (!message) throw new Error('Message not found')

    const userChatRoomLink = await ctx.db
      .query('userChatRooms')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .filter((q) => q.eq(q.field('chatRoomId'), message.chatRoomId))
      .first()

    if (!userChatRoomLink) {
      throw new Error('Not authorized to react to this message')
    }

    // Add new reaction
    await ctx.db.insert('messageReactions', {
      messageId,
      userId: user._id,
      emoji,
      timestamp: Date.now(),
    })

    return { added: true }
  },
})

export const removeReaction = mutation({
  args: {
    messageId: v.id('messages'),
    emoji: v.string(),
  },
  handler: async (ctx, { messageId, emoji }) => {
    const user = await authComponent.getAuthUser(ctx)
    if (!user) throw new Error('Not authenticated')

    const reaction = await ctx.db
      .query('messageReactions')
      .withIndex('by_user_and_message', (q) =>
        q.eq('userId', user._id).eq('messageId', messageId),
      )
      .filter((q) => q.eq(q.field('emoji'), emoji))
      .first()

    if (reaction) {
      await ctx.db.delete(reaction._id)
    }

    return { removed: true }
  },
})
