"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { TaskCard } from "./task-card";
import { Task, TaskStatus } from "@/types";
import { cn } from "@/lib/utils";

interface ColumnProps {
  id: TaskStatus;
  title: string;
  tasks: Task[];
  colorClass: string;
  onToggleComplete: (id: string) => void;
  onEditTask: (task: Task) => void;
}

export function Column({
  id,
  title,
  tasks,
  colorClass,
  onToggleComplete,
  onEditTask,
}: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  // Calculate total time for the column
  const totalEstimated = tasks.reduce((sum, t) => sum + (t.estimatedMinutes ?? 0), 0);
  const totalActual = tasks.reduce((sum, t) => sum + (t.actualMinutes ?? 0), 0);

  const formatHours = (minutes: number) => {
    if (minutes === 0) return "0h";
    const hours = minutes / 60;
    return hours < 1 ? `${minutes}m` : `${hours.toFixed(1)}h`;
  };

  return (
    <div className="flex h-full w-[280px] flex-shrink-0 flex-col md:w-[300px]">
      {/* Column Header */}
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className={cn("column-indicator", colorClass)} />
          <h2 className="text-heading text-[var(--color-text-primary)]">{title}</h2>
          <span className="text-caption text-[var(--color-text-muted)]">({tasks.length})</span>
        </div>

        {totalEstimated > 0 && (
          <div className="time-estimate">
            {totalActual > 0 ? (
              <span>
                {formatHours(totalActual)} / {formatHours(totalEstimated)}
              </span>
            ) : (
              <span>{formatHours(totalEstimated)}</span>
            )}
          </div>
        )}
      </div>

      {/* Task list */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 space-y-2 overflow-y-auto rounded-lg p-2 transition-colors",
          isOver && "drop-zone-active"
        )}
      >
        <SortableContext items={tasks.map((t) => t._id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onToggleComplete={onToggleComplete}
              onEdit={onEditTask}
            />
          ))}
        </SortableContext>

        {/* Empty state */}
        {tasks.length === 0 && (
          <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-[var(--color-border)] text-caption text-[var(--color-text-muted)]">
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
}



