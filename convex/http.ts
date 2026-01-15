import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { z } from "zod";

const http = httpRouter();

const taskStatusSchema = z.enum(["today", "tomorrow", "this_week", "next_week", "backlog"]);

function createErrorResponse(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function parseBody<T>(request: Request, schema: z.ZodSchema<T>) {
  const body = await request.json();
  return schema.safeParse(body);
}

function asTaskId(id: string) {
  return id as Id<"tasks">;
}

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
    const parsed = await parseBody(
      request,
      z.object({
        title: z.string().min(1, "Title is required"),
        description: z.string().optional(),
      })
    );
    if (!parsed.success) {
      return createErrorResponse("Invalid request body");
    }

    const { title, description } = parsed.data;
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
    const parsed = await parseBody(
      request,
      z.object({
        id: z.string().min(1),
        status: taskStatusSchema,
      })
    );
    if (!parsed.success) {
      return createErrorResponse("Invalid request body");
    }

    const { id, status } = parsed.data;
    await ctx.runMutation(api.tasks.updateStatus, {
      id: asTaskId(id),
      status,
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
    const parsed = await parseBody(
      request,
      z.object({
        id: z.string().min(1),
      })
    );
    if (!parsed.success) {
      return createErrorResponse("Invalid request body");
    }

    const { id } = parsed.data;
    await ctx.runMutation(api.tasks.toggleComplete, { id: asTaskId(id) });
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
    const parsed = await parseBody(
      request,
      z.object({
        id: z.string().min(1),
      })
    );
    if (!parsed.success) {
      return createErrorResponse("Invalid request body");
    }

    const { id } = parsed.data;
    await ctx.runMutation(api.tasks.remove, { id: asTaskId(id) });
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;
