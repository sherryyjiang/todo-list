#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const CONVEX_URL = process.env.CONVEX_HTTP_URL;

if (!CONVEX_URL) {
  console.error("Error: CONVEX_HTTP_URL environment variable is required");
  console.error("Set it to your Convex deployment HTTP URL (e.g., https://your-deployment.convex.site)");
  process.exit(1);
}

type TaskStatus = "today" | "tomorrow" | "this_week" | "next_week" | "backlog";

interface Task {
  _id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  isCompleted: boolean;
}

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
        description: "List all tasks in the todo list, grouped by their status (today, tomorrow, this_week, next_week, backlog)",
        inputSchema: {
          type: "object",
          properties: {
            status: {
              type: "string",
              description: "Optional: filter by status (today, tomorrow, this_week, next_week, backlog)",
              enum: ["today", "tomorrow", "this_week", "next_week", "backlog"],
            },
          },
        },
      },
      {
        name: "add_task",
        description: "Add a new task to the todo list. Tasks are automatically added to the backlog.",
        inputSchema: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "The title/name of the task",
            },
            description: {
              type: "string",
              description: "Optional description with more details about the task",
            },
          },
          required: ["title"],
        },
      },
      {
        name: "complete_task",
        description: "Mark a task as complete or incomplete (toggles the completion status)",
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
        description: "Move a task to a different time bucket (today, tomorrow, this_week, next_week, or backlog)",
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
        description: "Delete a task from the todo list",
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

        const typedArgs = args as { status?: TaskStatus };
        let filteredTasks = tasks as Task[];
        if (typedArgs?.status) {
          filteredTasks = filteredTasks.filter((task) => task.status === typedArgs.status);
        }

        // Group by status for display
        const grouped: Record<TaskStatus, Task[]> = {
          today: [],
          tomorrow: [],
          this_week: [],
          next_week: [],
          backlog: [],
        };

        for (const task of filteredTasks) {
          grouped[task.status].push(task);
        }

        let result = "";
        for (const [status, statusTasks] of Object.entries(grouped)) {
          if (statusTasks.length > 0) {
            const label = status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
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

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Todo List MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
