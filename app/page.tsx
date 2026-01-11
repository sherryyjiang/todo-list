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
      <div className="relative flex h-full flex-col">
        {/* Kanban Board */}
        <div className="flex-1 overflow-hidden">
          <Board onEditTask={handleEditTask} />
        </div>

        {/* Floating AI Input Bar */}
        <div className="absolute bottom-16 left-0 right-0 z-10">
          <AIInputBar onCreateTask={handleCreateTask} />
        </div>

        {/* Weekly Summary Footer */}
        <div className="glass border-t border-[var(--color-border-subtle)] px-6 py-4 shadow-lg">
          <div className="flex items-center justify-between text-caption">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2.5">
                <div className="h-2.5 w-2.5 rounded-full bg-[var(--color-work)] shadow-sm" />
                <span className="text-[var(--color-text-secondary)] font-medium">Work: 24h</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="h-2.5 w-2.5 rounded-full bg-[var(--color-life)] shadow-sm" />
                <span className="text-[var(--color-text-secondary)] font-medium">Life: 8h</span>
              </div>
              <div className="h-4 w-px bg-[var(--color-border)] opacity-50" />
              <span className="text-[var(--color-text-secondary)]">
                Total Focus: <span className="font-bold text-[var(--color-text-primary)]">32h</span>
              </span>
            </div>

            {/* Progress bar */}
            <div className="flex items-center gap-4">
              <span className="text-[var(--color-text-muted)] font-medium">Weekly Goal</span>
              <div className="h-2 w-48 overflow-hidden rounded-full bg-[var(--color-bg-active)] shadow-inner">
                <div className="h-full w-3/4 rounded-full grad-primary shadow-sm" />
              </div>
              <span className="font-bold text-[var(--color-primary)]">75%</span>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
