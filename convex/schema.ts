import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  // Better Auth component will create these tables automatically:
  // - betterAuth_user
  // - betterAuth_session
  // - betterAuth_account
  // - betterAuth_verification

  // Our chat-specific tables
  messages: defineTable({
    text: v.string(),
    userId: v.string(), // Better Auth user ID
    userName: v.string(), // Cache for performance
    userImage: v.optional(v.string()),
    timestamp: v.number(),
    edited: v.optional(v.boolean()),
    editedAt: v.optional(v.number()),
  }).index('by_timestamp', ['timestamp']),
})
