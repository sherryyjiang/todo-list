"use client";

import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Board } from "@/components/kanban/board";
import { AIInputBar } from "@/components/tasks/ai-input-bar";
import { Task, TaskStatus } from "@/types";

export default function Home() {
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const handleCreateTask = (task: {
    title: string;
    scheduledDate?: string;
    scheduledTime?: string;
    estimatedMinutes?: number;
    tags: string[];
    status: TaskStatus;
  }) => {
    // TODO: Call Convex mutation to create task
    console.log("Create task:", task);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    // TODO: Open edit modal
    console.log("Edit task:", task);
  };

  return (
    <MainLayout>
      <div className="flex h-full flex-col">
        {/* AI Input Bar */}
        <AIInputBar onCreateTask={handleCreateTask} />

        {/* Kanban Board */}
        <div className="flex-1 overflow-hidden">
          <Board onEditTask={handleEditTask} />
        </div>

        {/* Weekly Summary Footer */}
        <div className="border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-sidebar)] px-4 py-3">
          <div className="flex items-center justify-between text-caption">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[var(--color-work)]" />
                <span className="text-[var(--color-text-secondary)]">Work: 24h</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[var(--color-life)]" />
                <span className="text-[var(--color-text-secondary)]">Life: 8h</span>
              </div>
              <div className="text-[var(--color-text-muted)]">|</div>
              <span className="text-[var(--color-text-secondary)]">
                Total: <span className="font-medium text-[var(--color-text-primary)]">32h</span>
              </span>
            </div>

            {/* Progress bar */}
            <div className="flex items-center gap-2">
              <span className="text-[var(--color-text-muted)]">This week</span>
              <div className="h-1.5 w-32 overflow-hidden rounded-full bg-[var(--color-border)]">
                <div className="h-full w-3/4 rounded-full bg-[var(--color-primary)]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
