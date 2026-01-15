/**
 * MCP Server API Route for Poke.com Integration
 * 
 * This exposes the todo list MCP tools via SSE transport
 * directly from your Next.js app - no separate server needed!
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import type { ServerResponse } from "node:http";
import { deleteTransport, setTransport } from "@/lib/mcp/transports";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL?.replace('.cloud', '.site') 
  || process.env.CONVEX_HTTP_URL;

function createMCPServer(): Server {
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

    if (!CONVEX_URL) {
      return {
        content: [{ type: "text", text: "Error: Convex URL not configured" }],
        isError: true,
      };
    }

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
            content: [{ type: "text", text: result || "No tasks found." }],
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
              content: [{ type: "text", text: "Task completion toggled." }],
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
              content: [{ type: "text", text: `Task moved to "${label}".` }],
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
              content: [{ type: "text", text: "Task deleted." }],
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

// SSE endpoint - GET /api/mcp
export async function GET() {
  const server = createMCPServer();
  
  // Create a readable stream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      
      // Create a custom response-like object for SSEServerTransport
      const mockRes = {
        writeHead: () => mockRes,
        write: (data: string) => {
          controller.enqueue(encoder.encode(data));
          return true;
        },
        on: () => mockRes,
        once: () => mockRes,
        emit: () => false,
        end: () => controller.close(),
        flushHeaders: () => {},
      } as unknown as ServerResponse;

      const transport = new SSEServerTransport("/api/mcp/message", mockRes);
      const sessionId = transport.sessionId;
      setTransport(sessionId, transport);
      transport.onclose = () => deleteTransport(sessionId);
      
      await server.connect(transport);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

// Handle preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
