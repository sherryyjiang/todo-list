import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all pending reminders
export const listPending = query({
  args: {},
  handler: async (ctx) => {
    const reminders = await ctx.db
      .query("reminders")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();
    return reminders.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// Get reminder count for badge
export const pendingCount = query({
  args: {},
  handler: async (ctx) => {
    const reminders = await ctx.db
      .query("reminders")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();
    return reminders.length;
  },
});

// Add a reminder (public - no auth required)
export const add = mutation({
  args: {
    recipientShareableId: v.string(),
    senderEmail: v.string(),
    senderName: v.optional(v.string()),
    title: v.string(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("reminders", {
      recipientShareableId: args.recipientShareableId,
      senderEmail: args.senderEmail,
      senderName: args.senderName,
      title: args.title,
      note: args.note,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

// Accept a reminder and convert to task
export const accept = mutation({
  args: {
    id: v.id("reminders"),
    status: v.optional(
      v.union(
        v.literal("today"),
        v.literal("tomorrow"),
        v.literal("this_week"),
        v.literal("backlog")
      )
    ),
  },
  handler: async (ctx, args) => {
    const reminder = await ctx.db.get(args.id);
    if (!reminder) throw new Error("Reminder not found");

    const targetStatus = args.status ?? "backlog";

    // Get highest order in target column
    const existingTasks = await ctx.db
      .query("tasks")
      .withIndex("by_status", (q) => q.eq("status", targetStatus))
      .collect();

    const maxOrder = existingTasks.reduce(
      (max, task) => Math.max(max, task.order),
      0
    );

    const now = Date.now();

    // Create the task
    const taskId = await ctx.db.insert("tasks", {
      title: reminder.title,
      description: reminder.note,
      status: targetStatus,
      tags: [],
      order: maxOrder + 1,
      isCompleted: false,
      createdAt: now,
      updatedAt: now,
    });

    // Update reminder status
    await ctx.db.patch(args.id, {
      status: "accepted",
      convertedTaskId: taskId,
    });

    return taskId;
  },
});

// Dismiss a reminder
export const dismiss = mutation({
  args: { id: v.id("reminders") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: "dismissed" });
  },
});



