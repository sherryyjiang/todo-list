import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all categories
export const list = query({
  args: {},
  handler: async (ctx) => {
    const categories = await ctx.db.query("categories").collect();
    return categories.sort((a, b) => a.order - b.order);
  },
});

// Get categories by type (work or life)
export const listByType = query({
  args: { type: v.union(v.literal("work"), v.literal("life")) },
  handler: async (ctx, args) => {
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .collect();
    return categories.sort((a, b) => a.order - b.order);
  },
});

// Create a new category
export const create = mutation({
  args: {
    name: v.string(),
    type: v.union(v.literal("work"), v.literal("life")),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get the highest order for this type
    const existingCategories = await ctx.db
      .query("categories")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .collect();

    const maxOrder = existingCategories.reduce(
      (max, cat) => Math.max(max, cat.order),
      0
    );

    return await ctx.db.insert("categories", {
      name: args.name,
      type: args.type,
      color: args.color,
      order: maxOrder + 1,
    });
  },
});

// Update a category
export const update = mutation({
  args: {
    id: v.id("categories"),
    name: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined)
    );

    await ctx.db.patch(id, filteredUpdates);
  },
});

// Delete a category
export const remove = mutation({
  args: { id: v.id("categories") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Seed default categories (run once on first load)
export const seedDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("categories").collect();
    if (existing.length > 0) return; // Already seeded

    const defaults = [
      // Work categories
      { name: "Meetings", type: "work" as const, order: 1 },
      { name: "Projects", type: "work" as const, order: 2 },
      { name: "Admin", type: "work" as const, order: 3 },
      // Life categories
      { name: "Health", type: "life" as const, order: 1 },
      { name: "Finance", type: "life" as const, order: 2 },
      { name: "Home", type: "life" as const, order: 3 },
      { name: "Personal", type: "life" as const, order: 4 },
    ];

    for (const category of defaults) {
      await ctx.db.insert("categories", category);
    }
  },
});



