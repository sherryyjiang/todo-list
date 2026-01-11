import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table - simplified for single-user MVP
  users: defineTable({
    email: v.string(),
    name: v.string(),
    avatarUrl: v.optional(v.string()),
    shareableId: v.string(), // For others to send reminders
    createdAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_shareable_id", ["shareableId"]),

  // Categories table - Work and Life sections
  categories: defineTable({
    userId: v.optional(v.id("users")), // Optional for single-user MVP
    name: v.string(),
    type: v.union(v.literal("work"), v.literal("life")),
    color: v.optional(v.string()),
    order: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_type", ["type"]),

  // Tasks table - core of the app
  tasks: defineTable({
    userId: v.optional(v.id("users")), // Optional for single-user MVP
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(
      v.literal("today"),
      v.literal("tomorrow"),
      v.literal("this_week"),
      v.literal("backlog"),
      v.literal("done")
    ),
    categoryId: v.optional(v.id("categories")),
    scheduledDate: v.optional(v.string()), // ISO date string
    scheduledTime: v.optional(v.string()), // HH:mm format
    estimatedMinutes: v.optional(v.number()),
    actualMinutes: v.optional(v.number()),
    tags: v.array(v.string()), // Freeform tags
    order: v.number(), // For drag-drop ordering within columns
    isCompleted: v.boolean(),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_user_status", ["userId", "status"])
    .index("by_scheduled_date", ["scheduledDate"]),

  // Reminders table - from external people
  reminders: defineTable({
    recipientId: v.optional(v.id("users")), // Who the reminder is for
    recipientShareableId: v.string(), // Fallback lookup
    senderEmail: v.string(),
    senderName: v.optional(v.string()),
    title: v.string(),
    note: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("dismissed")
    ),
    convertedTaskId: v.optional(v.id("tasks")),
    createdAt: v.number(),
  })
    .index("by_recipient", ["recipientId"])
    .index("by_shareable_id", ["recipientShareableId"])
    .index("by_status", ["status"]),

  // Time entries table - for tracking actual time spent
  timeEntries: defineTable({
    userId: v.optional(v.id("users")),
    taskId: v.id("tasks"),
    minutes: v.number(),
    date: v.string(), // ISO date of entry
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_task", ["taskId"])
    .index("by_date", ["date"]),
});



