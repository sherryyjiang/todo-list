import { Id } from "../convex/_generated/dataModel";

export type TaskStatus = "today" | "tomorrow" | "this_week" | "backlog" | "done";

export type CategoryType = "work" | "life";

export interface Task {
  _id: Id<"tasks">;
  _creationTime: number;
  userId?: Id<"users">;
  title: string;
  description?: string;
  status: TaskStatus;
  categoryId?: Id<"categories">;
  scheduledDate?: string;
  scheduledTime?: string;
  estimatedMinutes?: number;
  actualMinutes?: number;
  tags: string[];
  order: number;
  isCompleted: boolean;
  completedAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface Category {
  _id: Id<"categories">;
  _creationTime: number;
  userId?: Id<"users">;
  name: string;
  type: CategoryType;
  color?: string;
  order: number;
}

export interface Reminder {
  _id: Id<"reminders">;
  _creationTime: number;
  recipientId?: Id<"users">;
  recipientShareableId: string;
  senderEmail: string;
  senderName?: string;
  title: string;
  note?: string;
  status: "pending" | "accepted" | "dismissed";
  convertedTaskId?: Id<"tasks">;
  createdAt: number;
}

export interface TimeEntry {
  _id: Id<"timeEntries">;
  _creationTime: number;
  userId?: Id<"users">;
  taskId: Id<"tasks">;
  minutes: number;
  date: string;
  createdAt: number;
}

export interface ParsedTask {
  title: string;
  scheduledDate: string | null;
  scheduledTime: string | null;
  estimatedMinutes: number | null;
  tags: string[];
  category: CategoryType | null;
  suggestedCategoryName: string | null;
}

// Column configuration
export const COLUMNS: { id: TaskStatus; label: string; colorClass: string }[] = [
  { id: "today", label: "Today", colorClass: "column-today" },
  { id: "tomorrow", label: "Tomorrow", colorClass: "column-tomorrow" },
  { id: "this_week", label: "This Week", colorClass: "column-this-week" },
  { id: "backlog", label: "Backlog", colorClass: "column-backlog" },
  { id: "done", label: "Done", colorClass: "column-done" },
];



