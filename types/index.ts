import { Id } from "../convex/_generated/dataModel";

export type TaskStatus = "today" | "tomorrow" | "this_week" | "next_week" | "backlog" | "long_term" | "archived";

// Status types that can be used as destinations (excludes archived)
export type ActiveTaskStatus = Exclude<TaskStatus, "archived">;

export interface Task {
  _id: Id<"tasks">;
  _creationTime: number;
  title: string;
  description?: string;
  status: TaskStatus;
  isCompleted: boolean;
  order: number;
  createdAt: number;
}

// Main sections shown in the primary view
export const SECTIONS: { id: TaskStatus; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "tomorrow", label: "Tomorrow" },
  { id: "this_week", label: "This Week" },
  { id: "next_week", label: "Next Week" },
  { id: "backlog", label: "Backlog" },
];

// Long term section (shown separately at bottom)
export const LONG_TERM_SECTION = { id: "long_term" as TaskStatus, label: "Long Term" };

// All sections for dropdown (excludes archived)
export const ALL_SECTIONS: { id: TaskStatus; label: string }[] = [
  ...SECTIONS,
  LONG_TERM_SECTION,
];
