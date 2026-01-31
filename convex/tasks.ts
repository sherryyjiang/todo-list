import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const tasks = await ctx.db.query("tasks").collect();
    return tasks.sort((a, b) => a.order - b.order);
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.union(v.literal("general"), v.literal("coding"), v.literal("health"))),
  },
  handler: async (ctx, args) => {
    const existingTasks = await ctx.db
      .query("tasks")
      .withIndex("by_status", (q) => q.eq("status", "backlog"))
      .collect();

    const maxOrder = existingTasks.reduce(
      (max, task) => Math.max(max, task.order),
      0
    );

    return await ctx.db.insert("tasks", {
      title: args.title,
      description: args.description,
      status: "backlog",
      category: args.category ?? "general",
      isCompleted: false,
      completedAt: undefined,
      order: maxOrder + 1,
      createdAt: Date.now(),
    });
  },
});

export const createWithStatus = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(
      v.literal("today"),
      v.literal("tomorrow"),
      v.literal("this_week"),
      v.literal("next_week"),
      v.literal("backlog"),
      v.literal("long_term")
    ),
    category: v.optional(v.union(v.literal("general"), v.literal("coding"), v.literal("health"))),
  },
  handler: async (ctx, args) => {
    const existingTasks = await ctx.db
      .query("tasks")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .collect();

    const maxOrder = existingTasks.reduce(
      (max, task) => Math.max(max, task.order),
      0
    );

    return await ctx.db.insert("tasks", {
      title: args.title,
      description: args.description,
      status: args.status,
      category: args.category ?? "general",
      isCompleted: false,
      completedAt: undefined,
      order: maxOrder + 1,
      createdAt: Date.now(),
    });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("tasks"),
    status: v.union(
      v.literal("today"),
      v.literal("tomorrow"),
      v.literal("this_week"),
      v.literal("next_week"),
      v.literal("backlog"),
      v.literal("long_term"),
      v.literal("archived")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
  },
});

export const archive = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: "archived" });
  },
});

export const archiveAllCompleted = mutation({
  args: {},
  handler: async (ctx) => {
    const tasks = await ctx.db.query("tasks").collect();
    const completedTasks = tasks.filter(
      (task) => task.isCompleted && task.status !== "archived"
    );

    await Promise.all(
      completedTasks.map((task) =>
        ctx.db.patch(task._id, { status: "archived" })
      )
    );

    return completedTasks.length;
  },
});

export const unarchive = mutation({
  args: {
    id: v.id("tasks"),
    status: v.union(
      v.literal("today"),
      v.literal("tomorrow"),
      v.literal("this_week"),
      v.literal("next_week"),
      v.literal("backlog"),
      v.literal("long_term")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
  },
});

export const updateDescription = mutation({
  args: {
    id: v.id("tasks"),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { description: args.description });
  },
});

export const updateCategory = mutation({
  args: {
    id: v.id("tasks"),
    category: v.union(v.literal("general"), v.literal("coding"), v.literal("health")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { category: args.category });
  },
});

export const updateTitle = mutation({
  args: {
    id: v.id("tasks"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { title: args.title });
  },
});

export const toggleComplete = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task) throw new Error("Task not found");
    const nextCompleted = !task.isCompleted;
    await ctx.db.patch(args.id, {
      isCompleted: nextCompleted,
      completedAt: nextCompleted ? Date.now() : task.completedAt,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
