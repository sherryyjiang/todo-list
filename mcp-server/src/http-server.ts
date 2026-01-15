#!/usr/bin/env node

/**
 * Todo List MCP Server - HTTP Transport for Poke.com
 *
 * This server exposes the todo list tools via HTTP transport (SSE/Streamable HTTP)
 * for compatibility with Poke.com and other remote MCP clients.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import http from "http";

const CONVEX_URL = process.env.CONVEX_HTTP_URL;

if (!CONVEX_URL) {
  console.error("Error: CONVEX_HTTP_URL environment variable is required");
  console.error(
    "Set it to your Convex deployment HTTP URL (e.g., https://your-deployment.convex.site)"
  );
  process.exit(1);
}

const PORT = parseInt(process.env.PORT || "8000", 10);

// Store active transports for cleanup
const transports = new Map<string, SSEServerTransport>();

function createServer(): Server {
  const server = new Server(
    {
      name: "todo-list-mcp",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Define available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "list_tasks",
          description:
            "List all tasks in the todo list, grouped by their status (today, tomorrow, this_week, next_week, backlog). Use this to show the user their current tasks.",
          inputSchema: {
            type: "object",
            properties: {
              status: {
                type: "string",
                description:
                  "Optional: filter by status (today, tomorrow, this_week, next_week, backlog)",
                enum: ["today", "tomorrow", "this_week", "next_week", "backlog"],
              },
            },
          },
        },
        {
          name: "add_task",
          description:
            "Add a new task to the todo list. Tasks are automatically added to the backlog. Use this when the user wants to create a new task or reminder.",
          inputSchema: {
            type: "object",
            properties: {
              title: {
                type: "string",
                description: "The title/name of the task",
              },
              description: {
                type: "string",
                description:
                  "Optional description with more details about the task",
              },
            },
            required: ["title"],
          },
        },
        {
          name: "complete_task",
          description:
            "Mark a task as complete or incomplete (toggles the completion status). Use this when the user says they finished a task.",
          inputSchema: {
            type: "object",
            properties: {
              task_id: {
                type: "string",
                description: "The ID of the task to complete",
              },
            },
            required: ["task_id"],
          },
        },
        {
          name: "move_task",
          description:
            "Move a task to a different time bucket (today, tomorrow, this_week, next_week, or backlog). Use this to reschedule or prioritize tasks.",
          inputSchema: {
            type: "object",
            properties: {
              task_id: {
                type: "string",
                description: "The ID of the task to move",
              },
              status: {
                type: "string",
                description: "The new status/bucket for the task",
                enum: ["today", "tomorrow", "this_week", "next_week", "backlog"],
              },
            },
            required: ["task_id", "status"],
          },
        },
        {
          name: "delete_task",
          description:
            "Delete a task from the todo list. Use this when the user wants to remove a task entirely.",
          inputSchema: {
            type: "object",
            properties: {
              task_id: {
                type: "string",
                description: "The ID of the task to delete",
              },
            },
            required: ["task_id"],
          },
        },
      ],
    };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case "list_tasks": {
          const response = await fetch(`${CONVEX_URL}/tasks`);
          const tasks = await response.json();

          const typedArgs = args as { status?: string };
          let filteredTasks = tasks;
          if (typedArgs?.status) {
            filteredTasks = tasks.filter(
              (t: Record<string, unknown>) => t.status === typedArgs.status
            );
          }

          // Group by status for display
          const grouped: Record<string, Record<string, unknown>[]> = {
            today: [],
            tomorrow: [],
            this_week: [],
            next_week: [],
            backlog: [],
          };

          for (const task of filteredTasks) {
            const taskRecord = task as Record<string, unknown>;
            const status = taskRecord.status as string;
            if (grouped[status]) {
              grouped[status].push(taskRecord);
            }
          }

          let result = "";
          for (const [status, statusTasks] of Object.entries(grouped)) {
            if (statusTasks.length > 0) {
              const label = status
                .replace("_", " ")
                .replace(/\b\w/g, (c) => c.toUpperCase());
              result += `\n## ${label}\n`;
              for (const task of statusTasks) {
                const checkbox = task.isCompleted ? "[x]" : "[ ]";
                result += `- ${checkbox} ${task.title} (ID: ${task._id})`;
                if (task.description) {
                  result += `\n  ${task.description}`;
                }
                result += "\n";
              }
            }
          }

          return {
            content: [
              {
                type: "text",
                text: result || "No tasks found.",
              },
            ],
          };
        }

        case "add_task": {
          const typedArgs = args as { title: string; description?: string };
          const response = await fetch(`${CONVEX_URL}/tasks`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: typedArgs.title,
              description: typedArgs.description,
            }),
          });

          const result = await response.json();
          if (result.success) {
            return {
              content: [
                {
                  type: "text",
                  text: `Task "${typedArgs.title}" added to backlog. (ID: ${result.id})`,
                },
              ],
            };
          } else {
            throw new Error(result.error || "Failed to add task");
          }
        }

        case "complete_task": {
          const typedArgs = args as { task_id: string };
          const response = await fetch(`${CONVEX_URL}/tasks/complete`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: typedArgs.task_id }),
          });

          const result = await response.json();
          if (result.success) {
            return {
              content: [
                {
                  type: "text",
                  text: `Task completion toggled.`,
                },
              ],
            };
          } else {
            throw new Error(result.error || "Failed to complete task");
          }
        }

        case "move_task": {
          const typedArgs = args as { task_id: string; status: string };
          const response = await fetch(`${CONVEX_URL}/tasks/status`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: typedArgs.task_id,
              status: typedArgs.status,
            }),
          });

          const result = await response.json();
          if (result.success) {
            const label = typedArgs.status.replace("_", " ");
            return {
              content: [
                {
                  type: "text",
                  text: `Task moved to "${label}".`,
                },
              ],
            };
          } else {
            throw new Error(result.error || "Failed to move task");
          }
        }

        case "delete_task": {
          const typedArgs = args as { task_id: string };
          const response = await fetch(`${CONVEX_URL}/tasks`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: typedArgs.task_id }),
          });

          const result = await response.json();
          if (result.success) {
            return {
              content: [
                {
                  type: "text",
                  text: `Task deleted.`,
                },
              ],
            };
          } else {
            throw new Error(result.error || "Failed to delete task");
          }
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}

// Create HTTP server with SSE support
const httpServer = http.createServer(async (req, res) => {
  // Enable CORS for all origins (adjust for production)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url || "/", `http://localhost:${PORT}`);

  // Health check endpoint
  if (url.pathname === "/health" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", server: "todo-list-mcp" }));
    return;
  }

  // SSE endpoint for MCP
  if (url.pathname === "/sse" && req.method === "GET") {
    console.log("New SSE connection");

    const server = createServer();
    const transport = new SSEServerTransport("/messages", res);

    // Store transport for cleanup
    const sessionId = crypto.randomUUID();
    transports.set(sessionId, transport);

    // Clean up on close
    res.on("close", () => {
      console.log("SSE connection closed");
      transports.delete(sessionId);
    });

    await server.connect(transport);
    return;
  }

  // Messages endpoint for SSE transport
  if (url.pathname === "/messages" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      const sessionId = url.searchParams.get("sessionId");
      if (!sessionId || !transports.has(sessionId)) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid session" }));
        return;
      }

      const transport = transports.get(sessionId)!;
      try {
        await transport.handlePostMessage(req, res, body);
      } catch (error) {
        console.error("Error handling message:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: error instanceof Error ? error.message : "Unknown error",
          })
        );
      }
    });
    return;
  }

  // Default: 404
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

httpServer.listen(PORT, () => {
  console.log(`🚀 Todo List MCP Server (HTTP/SSE) running on port ${PORT}`);
  console.log(`   SSE endpoint: http://localhost:${PORT}/sse`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
  console.log(`   Convex URL: ${CONVEX_URL}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("Shutting down...");
  httpServer.close(() => {
    process.exit(0);
  });
});
