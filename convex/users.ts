import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { authComponent } from './auth'

export const searchUsers = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, { searchTerm }) => {
    const currentUser = await authComponent.getAuthUser(ctx)
    if (!currentUser) return []

    if (!searchTerm.trim()) return []

    const userProfiles = await ctx.db.query('userProfiles').collect()

    return userProfiles
      .filter((profile) => {
        const nameMatch = profile.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
        const emailMatch = profile.email
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
        return (nameMatch || emailMatch) && profile.userId !== currentUser._id
      })
      .slice(0, 10)
  },
})

export const createOrUpdateUserProfile = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx)
    if (!user) throw new Error('Not authenticated')

    const existing = await ctx.db
      .query('userProfiles')
      .withIndex('by_user_id', (q) => q.eq('userId', user._id))
      .first()

    const profileData = {
      userId: user._id,
      name: user.name || 'Unknown User',
      email: user.email || '',
      image: user.image ?? undefined,
      status: "Hey there! I'm using ChatApp.",
      isOnline: true,
      lastSeen: Date.now(),
    }

    if (existing) {
      await ctx.db.patch(existing._id, profileData)
      return existing._id
    } else {
      return await ctx.db.insert('userProfiles', profileData)
    }
  },
})

export const setUserOnline = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx)
    if (!user) throw new Error('Not authenticated')

    const existing = await ctx.db
      .query('userProfiles')
      .withIndex('by_user_id', (q) => q.eq('userId', user._id))
      .first()

    if (existing) {
      await ctx.db.patch(existing._id, {
        isOnline: true,
        lastSeen: Date.now(),
      })
    } else {
      // Create profile if it doesn't exist
      await ctx.db.insert('userProfiles', {
        userId: user._id,
        name: user.name || 'Unknown User',
        email: user.email || '',
        image: user.image ?? undefined,
        status: "Hey there! I'm using ChatApp.",
        isOnline: true,
        lastSeen: Date.now(),
      })
    }
  },
})

export const setUserOffline = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx)
    if (!user) throw new Error('Not authenticated')

    const existing = await ctx.db
      .query('userProfiles')
      .withIndex('by_user_id', (q) => q.eq('userId', user._id))
      .first()

    if (existing) {
      await ctx.db.patch(existing._id, {
        isOnline: false,
        lastSeen: Date.now(),
      })
    }
  },
})

export const updateUserHeartbeat = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx)
    if (!user) throw new Error('Not authenticated')

    const existing = await ctx.db
      .query('userProfiles')
      .withIndex('by_user_id', (q) => q.eq('userId', user._id))
      .first()

    if (existing) {
      // Only update if user is already marked as online
      // This prevents marking offline users as online
      if (existing.isOnline) {
        await ctx.db.patch(existing._id, {
          lastSeen: Date.now(),
        })
      }
    }
  },
})

export const registerPushToken = mutation({
  args: {
    pushToken: v.string(),
  },
  handler: async (ctx, { pushToken }) => {
    const user = await authComponent.getAuthUser(ctx)
    if (!user) {
      throw new Error('Not authenticated')
    }

    if (!pushToken || pushToken.trim().length === 0) {
      throw new Error('Push token cannot be empty')
    }

    const existing = await ctx.db
      .query('userProfiles')
      .withIndex('by_user_id', (q) => q.eq('userId', user._id))
      .first()

    if (existing) {
      await ctx.db.patch(existing._id, {
        pushToken,
      })
      return { success: true, updated: true }
    } else {
      // Create profile if it doesn't exist
      await ctx.db.insert('userProfiles', {
        userId: user._id,
        name: user.name || 'Unknown User',
        email: user.email || '',
        image: user.image ?? undefined,
        status: "Hey there! I'm using ChatApp.",
        isOnline: true,
        lastSeen: Date.now(),
        pushToken,
      })
      return { success: true, created: true }
    }
  },
})
