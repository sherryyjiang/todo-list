import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const lists = await ctx.db.query("importantLists").order("asc").collect();
    const items = await ctx.db.query("importantListItems").order("asc").collect();

    const itemsByList = new Map<string, typeof items>();
    for (const item of items) {
      const existing = itemsByList.get(item.listId) ?? [];
      existing.push(item);
      itemsByList.set(item.listId, existing);
    }

    return lists.map((list) => ({
      ...list,
      items: itemsByList.get(list._id) ?? [],
    }));
  },
});

export const createList = mutation({
  args: { title: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.insert("importantLists", {
      title: args.title,
      createdAt: Date.now(),
    });
  },
});

export const updateListTitle = mutation({
  args: { id: v.id("importantLists"), title: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { title: args.title });
  },
});

export const removeList = mutation({
  args: { id: v.id("importantLists") },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("importantListItems")
      .withIndex("by_list", (q) => q.eq("listId", args.id))
      .collect();

    await Promise.all(items.map((item) => ctx.db.delete(item._id)));
    await ctx.db.delete(args.id);
  },
});

export const createItem = mutation({
  args: { listId: v.id("importantLists"), label: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.insert("importantListItems", {
      listId: args.listId,
      label: args.label,
      createdAt: Date.now(),
    });
  },
});

export const updateItem = mutation({
  args: { id: v.id("importantListItems"), label: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { label: args.label });
  },
});

export const removeItem = mutation({
  args: { id: v.id("importantListItems") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
