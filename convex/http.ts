import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// List all tasks
http.route({
  path: "/tasks",
  method: "GET",
  handler: httpAction(async (ctx) => {
    const tasks = await ctx.runQuery(api.tasks.list);
    return new Response(JSON.stringify(tasks), {
      headers: { "Content-Type": "application/json" },
    });
  }),
});

// Create a new task
http.route({
  path: "/tasks",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    const { title, description } = body as { title: string; description?: string };

    if (!title) {
      return new Response(JSON.stringify({ error: "Title is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const id = await ctx.runMutation(api.tasks.create, { title, description });
    return new Response(JSON.stringify({ id, success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }),
});

// Update task status
http.route({
  path: "/tasks/status",
  method: "PUT",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    const { id, status } = body as { id: string; status: string };

    const validStatuses = ["today", "tomorrow", "this_week", "next_week", "backlog"];
    if (!validStatuses.includes(status)) {
      return new Response(JSON.stringify({ error: "Invalid status" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    await ctx.runMutation(api.tasks.updateStatus, {
      id: id as any,
      status: status as any
    });
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }),
});

// Toggle task completion
http.route({
  path: "/tasks/complete",
  method: "PUT",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    const { id } = body as { id: string };

    await ctx.runMutation(api.tasks.toggleComplete, { id: id as any });
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }),
});

// Delete a task
http.route({
  path: "/tasks",
  method: "DELETE",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    const { id } = body as { id: string };

    await ctx.runMutation(api.tasks.remove, { id: id as any });
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;
