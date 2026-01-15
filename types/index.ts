import { Id } from "../convex/_generated/dataModel";

export type TaskStatus = "today" | "tomorrow" | "this_week" | "next_week" | "backlog";

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

export const SECTIONS: { id: TaskStatus; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "tomorrow", label: "Tomorrow" },
  { id: "this_week", label: "This Week" },
  { id: "next_week", label: "Next Week" },
  { id: "backlog", label: "Backlog" },
];
