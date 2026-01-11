import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all tasks grouped by status
export const list = query({
  args: {},
  handler: async (ctx) => {
    const tasks = await ctx.db.query("tasks").collect();
    return tasks.sort((a, b) => a.order - b.order);
  },
});

// Get tasks by status
export const listByStatus = query({
  args: { status: v.string() },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_status", (q) =>
        q.eq(
          "status",
          args.status as
            | "today"
            | "tomorrow"
            | "this_week"
            | "backlog"
            | "done"
        )
      )
      .collect();
    return tasks.sort((a, b) => a.order - b.order);
  },
});

// Create a new task
export const create = mutation({
  args: {
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
    scheduledDate: v.optional(v.string()),
    scheduledTime: v.optional(v.string()),
    estimatedMinutes: v.optional(v.number()),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // Get the highest order in this status column
    const existingTasks = await ctx.db
      .query("tasks")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .collect();

    const maxOrder = existingTasks.reduce(
      (max, task) => Math.max(max, task.order),
      0
    );

    const now = Date.now();
    return await ctx.db.insert("tasks", {
      title: args.title,
      description: args.description,
      status: args.status,
      categoryId: args.categoryId,
      scheduledDate: args.scheduledDate,
      scheduledTime: args.scheduledTime,
      estimatedMinutes: args.estimatedMinutes,
      actualMinutes: undefined,
      tags: args.tags,
      order: maxOrder + 1,
      isCompleted: args.status === "done",
      completedAt: args.status === "done" ? now : undefined,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update a task
export const update = mutation({
  args: {
    id: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    categoryId: v.optional(v.id("categories")),
    scheduledDate: v.optional(v.string()),
    scheduledTime: v.optional(v.string()),
    estimatedMinutes: v.optional(v.number()),
    actualMinutes: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined)
    );

    await ctx.db.patch(id, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });
  },
});

// Move task to a different column (drag and drop)
export const move = mutation({
  args: {
    id: v.id("tasks"),
    newStatus: v.union(
      v.literal("today"),
      v.literal("tomorrow"),
      v.literal("this_week"),
      v.literal("backlog"),
      v.literal("done")
    ),
    newOrder: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const isCompleted = args.newStatus === "done";

    await ctx.db.patch(args.id, {
      status: args.newStatus,
      order: args.newOrder,
      isCompleted,
      completedAt: isCompleted ? now : undefined,
      updatedAt: now,
    });
  },
});

// Toggle task completion
export const toggleComplete = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task) throw new Error("Task not found");

    const now = Date.now();
    const isCompleted = !task.isCompleted;

    await ctx.db.patch(args.id, {
      isCompleted,
      status: isCompleted ? "done" : task.status,
      completedAt: isCompleted ? now : undefined,
      updatedAt: now,
    });
  },
});

// Delete a task
export const remove = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Reorder tasks within a column
export const reorder = mutation({
  args: {
    taskOrders: v.array(
      v.object({
        id: v.id("tasks"),
        order: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    for (const { id, order } of args.taskOrders) {
      await ctx.db.patch(id, { order, updatedAt: now });
    }
  },
});



