import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get time entries for a specific task
export const listByTask = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("timeEntries")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();
  },
});

// Get time entries for a date range (for weekly review)
export const listByDateRange = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const entries = await ctx.db.query("timeEntries").collect();

    return entries.filter(
      (entry) => entry.date >= args.startDate && entry.date <= args.endDate
    );
  },
});

// Get total time for today
export const todayTotal = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("timeEntries")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .collect();

    return entries.reduce((sum, entry) => sum + entry.minutes, 0);
  },
});

// Add a time entry
export const add = mutation({
  args: {
    taskId: v.id("tasks"),
    minutes: v.number(),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    // Also update the task's actualMinutes
    const task = await ctx.db.get(args.taskId);
    if (task) {
      const currentActual = task.actualMinutes ?? 0;
      await ctx.db.patch(args.taskId, {
        actualMinutes: currentActual + args.minutes,
        updatedAt: Date.now(),
      });
    }

    return await ctx.db.insert("timeEntries", {
      taskId: args.taskId,
      minutes: args.minutes,
      date: args.date,
      createdAt: Date.now(),
    });
  },
});

// Update a time entry
export const update = mutation({
  args: {
    id: v.id("timeEntries"),
    minutes: v.number(),
  },
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.id);
    if (!entry) throw new Error("Time entry not found");

    // Update task's actualMinutes
    const task = await ctx.db.get(entry.taskId);
    if (task) {
      const currentActual = task.actualMinutes ?? 0;
      const diff = args.minutes - entry.minutes;
      await ctx.db.patch(entry.taskId, {
        actualMinutes: Math.max(0, currentActual + diff),
        updatedAt: Date.now(),
      });
    }

    await ctx.db.patch(args.id, { minutes: args.minutes });
  },
});

// Delete a time entry
export const remove = mutation({
  args: { id: v.id("timeEntries") },
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.id);
    if (!entry) return;

    // Update task's actualMinutes
    const task = await ctx.db.get(entry.taskId);
    if (task) {
      const currentActual = task.actualMinutes ?? 0;
      await ctx.db.patch(entry.taskId, {
        actualMinutes: Math.max(0, currentActual - entry.minutes),
        updatedAt: Date.now(),
      });
    }

    await ctx.db.delete(args.id);
  },
});

// Get weekly summary grouped by category and tag
export const weeklySummary = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const entries = await ctx.db.query("timeEntries").collect();

    const filteredEntries = entries.filter(
      (entry) => entry.date >= args.startDate && entry.date <= args.endDate
    );

    // Get all related tasks
    const taskIds = [...new Set(filteredEntries.map((e) => e.taskId))];
    const tasks = await Promise.all(taskIds.map((id) => ctx.db.get(id)));
    const taskMap = new Map(
      tasks.filter(Boolean).map((t) => [t!._id, t!])
    );

    // Aggregate by category
    const byCategory = new Map<string, number>();
    const byTag = new Map<string, number>();
    const byDay = new Map<string, number>();

    for (const entry of filteredEntries) {
      const task = taskMap.get(entry.taskId);
      if (!task) continue;

      // By day
      byDay.set(entry.date, (byDay.get(entry.date) ?? 0) + entry.minutes);

      // By category (using categoryId)
      if (task.categoryId) {
        const catId = task.categoryId.toString();
        byCategory.set(catId, (byCategory.get(catId) ?? 0) + entry.minutes);
      }

      // By tag
      for (const tag of task.tags) {
        byTag.set(tag, (byTag.get(tag) ?? 0) + entry.minutes);
      }
    }

    return {
      totalMinutes: filteredEntries.reduce((sum, e) => sum + e.minutes, 0),
      byCategory: Object.fromEntries(byCategory),
      byTag: Object.fromEntries(byTag),
      byDay: Object.fromEntries(byDay),
    };
  },
});



