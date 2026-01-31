import { render, screen } from "@testing-library/react";
import WeeklySummary from "../components/WeeklySummary";
import type { Task } from "@/types";

const now = new Date("2026-01-31T12:00:00Z").getTime();

const buildTask = (overrides: Partial<Task>): Task => ({
  _id: "task-id" as Task["_id"],
  _creationTime: now,
  title: "Sample task",
  status: "today",
  category: "general",
  isCompleted: false,
  order: 1,
  createdAt: now,
  ...overrides,
});

describe("WeeklySummary", () => {
  beforeEach(() => {
    jest.spyOn(Date, "now").mockReturnValue(now);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("shows completed tasks from the last 7 days", () => {
    const tasks: Task[] = [
      buildTask({
        title: "Shipped feature",
        isCompleted: true,
        completedAt: now - 2 * 24 * 60 * 60 * 1000,
      }),
      buildTask({
        title: "Old task",
        isCompleted: true,
        completedAt: now - 10 * 24 * 60 * 60 * 1000,
      }),
    ];

    render(<WeeklySummary tasks={tasks} />);

    expect(screen.getByRole("heading", { name: /weekly summary/i })).toBeInTheDocument();
    expect(screen.getByText(/1 task completed/i)).toBeInTheDocument();
    expect(screen.getByText("Shipped feature")).toBeInTheDocument();
    expect(screen.queryByText("Old task")).not.toBeInTheDocument();
  });
});
