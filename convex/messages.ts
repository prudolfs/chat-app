import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { authComponent } from './auth'

// Get messages
export const getMessages = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query('messages')
      .withIndex('by_timestamp')
      .order('asc')
      .take(100) // Last 100 messages
  },
})

// Send message (authenticated)
export const sendMessage = mutation({
  args: {
    text: v.string(),
  },
  handler: async (ctx, { text }) => {
    const user = await authComponent.getAuthUser(ctx)
    if (!user) throw new Error('Not authenticated')

    await ctx.db.insert('messages', {
      text,
      userId: user._id,
      userName: user.name ?? '',
      userImage: user.image ?? undefined,
      timestamp: Date.now(),
    })
  },
})

// Edit message (authenticated)
export const editMessage = mutation({
  args: {
    messageId: v.id('messages'),
    text: v.string(),
  },
  handler: async (ctx, { messageId, text }) => {
    const user = await authComponent.getAuthUser(ctx)
    if (!user) throw new Error('Not authenticated')

    const message = await ctx.db.get(messageId)
    if (!message || message.userId !== user._id) {
      throw new Error('Unauthorized')
    }

    await ctx.db.patch(messageId, {
      text,
      edited: true,
      editedAt: Date.now(),
    })
  },
})

// Delete message (authenticated)
export const deleteMessage = mutation({
  args: {
    messageId: v.id('messages'),
  },
  handler: async (ctx, { messageId }) => {
    const user = await authComponent.getAuthUser(ctx)
    if (!user) throw new Error('Not authenticated')

    const message = await ctx.db.get(messageId)
    if (!message || message.userId !== user._id) {
      throw new Error('Unauthorized')
    }

    await ctx.db.delete(messageId)
  },
})
