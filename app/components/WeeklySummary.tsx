"use client";

import type { Task } from "@/types";
import { CATEGORIES } from "@/types";

interface WeeklySummaryProps {
  tasks?: Task[];
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export default function WeeklySummary({ tasks }: WeeklySummaryProps) {
  const now = Date.now();
  const weekStart = now - WEEK_MS;

  const completedThisWeek =
    tasks?.filter(
      (task) =>
        task.isCompleted &&
        typeof task.completedAt === "number" &&
        task.completedAt >= weekStart &&
        task.completedAt <= now
    ) ?? [];

  const totalCompleted = completedThisWeek.length;
  const highlights = [...completedThisWeek]
    .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))
    .slice(0, 5);

  return (
    <section className="flex h-full flex-col gap-4 overflow-auto p-4">
      <div>
        <h2 className="text-title text-[var(--color-text-primary)]">Weekly Summary</h2>
        <p className="text-caption text-[var(--color-text-muted)]">
          A quick progress report from the last 7 days.
        </p>
      </div>

      {!tasks ? (
        <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-4 text-caption text-[var(--color-text-muted)]">
          Loading summary...
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-4">
            <p className="text-caption text-[var(--color-text-muted)]">Completed</p>
            <p className="text-heading text-[var(--color-text-primary)]">
              {totalCompleted} {totalCompleted === 1 ? "task" : "tasks"} completed
            </p>

            {totalCompleted === 0 ? (
              <p className="mt-3 text-caption text-[var(--color-text-muted)]">
                No completed tasks logged in the last 7 days.
              </p>
            ) : (
              <div className="mt-4 space-y-2">
                <p className="text-caption text-[var(--color-text-muted)]">Highlights</p>
                <ul className="space-y-2">
                  {highlights.map((task) => (
                    <li
                      key={task._id}
                      className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-hover)] px-3 py-2 text-body text-[var(--color-text-primary)]"
                    >
                      {task.title}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-4">
            <p className="text-caption text-[var(--color-text-muted)]">By category</p>
            <div className="mt-3 space-y-2">
              {CATEGORIES.map((category) => {
                const categoryCompleted = completedThisWeek.filter(
                  (task) => (task.category || "general") === category.id
                ).length;

                return (
                  <div
                    key={category.id}
                    className="flex items-center justify-between rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-hover)] px-3 py-2 text-body text-[var(--color-text-primary)]"
                  >
                    <span className="flex items-center gap-2">
                      <span>{category.icon}</span>
                      <span>{category.label}</span>
                    </span>
                    <span className="text-caption tabular-nums text-[var(--color-text-muted)]">
                      {categoryCompleted}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
