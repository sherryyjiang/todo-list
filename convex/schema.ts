import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Tasks table - simplified todo list
  tasks: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(
      v.literal("today"),
      v.literal("tomorrow"),
      v.literal("this_week"),
      v.literal("next_week"),
      v.literal("backlog"),
      v.literal("long_term"),
      v.literal("archived")
    ),
    category: v.optional(v.union(
      v.literal("general"),
      v.literal("coding"),
      v.literal("health")
    )),
    isCompleted: v.boolean(),
    order: v.number(),
    createdAt: v.number(),
  }).index("by_status", ["status"])
    .index("by_category", ["category"]),
});
