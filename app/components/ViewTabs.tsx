"use client";

import type { Task, TaskCategory } from "@/types";

export type ViewMode = "tasks" | "lists";

interface ViewTabsProps {
  mode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
  categories: { id: TaskCategory; label: string; icon: string }[];
  selectedCategory: TaskCategory;
  onCategoryChange: (category: TaskCategory) => void;
  tasks?: Task[];
}

export default function ViewTabs({
  mode,
  onModeChange,
  categories,
  selectedCategory,
  onCategoryChange,
  tasks,
}: ViewTabsProps) {
  return (
    <div className="flex items-center gap-1 bg-[var(--color-bg-hover)] rounded-lg p-1">
      {categories.map((category) => {
        const categoryTasks = tasks?.filter(
          (task) => (task.category || "general") === category.id && task.status !== "archived"
        ) || [];
        const categoryCompleted = categoryTasks.filter((task) => task.isCompleted).length;

        return (
          <button
            key={category.id}
            onClick={() => {
              if (mode !== "tasks") onModeChange("tasks");
              onCategoryChange(category.id);
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-body transition-all duration-150 ${
              mode === "tasks" && selectedCategory === category.id
                ? "bg-[var(--color-bg-card)] text-[var(--color-text-primary)] shadow-sm font-medium"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            <span>{category.icon}</span>
            <span className="hidden sm:inline">{category.label}</span>
            {categoryTasks.length > 0 && (
              <span className="text-caption tabular-nums opacity-60">
                {categoryCompleted}/{categoryTasks.length}
              </span>
            )}
          </button>
        );
      })}

      <button
        onClick={() => onModeChange("lists")}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-body transition-all duration-150 ${
          mode === "lists"
            ? "bg-[var(--color-bg-card)] text-[var(--color-text-primary)] shadow-sm font-medium"
            : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
        }`}
      >
        <span>📌</span>
        <span className="hidden sm:inline">Important Lists</span>
      </button>
    </div>
  );
}
