"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Circle, CheckCircle2, Clock, Calendar, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Task } from "@/types";
import { formatDistanceToNow } from "date-fns";

interface TaskCardProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onEdit: (task: Task) => void;
  isDragging?: boolean;
}

export function TaskCard({ task, onToggleComplete, onEdit, isDragging }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: task._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const formatTime = (minutes: number | undefined) => {
    if (!minutes) return null;
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "card group relative cursor-default select-none p-3",
        isDragging && "card-dragging opacity-90",
        task.isCompleted && "opacity-60"
      )}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="drag-handle absolute left-1 top-1/2 -translate-y-1/2 p-1"
      >
        <GripVertical className="h-4 w-4" />
      </div>

      <div className="ml-5">
        {/* Header row */}
        <div className="flex items-start gap-2">
          {/* Checkbox */}
          <button
            onClick={() => onToggleComplete(task._id)}
            className="mt-0.5 flex-shrink-0 transition-colors"
          >
            {task.isCompleted ? (
              <CheckCircle2 className="h-5 w-5 text-[var(--color-success)]" />
            ) : (
              <Circle className="h-5 w-5 text-[var(--color-text-muted)] hover:text-[var(--color-primary)]" />
            )}
          </button>

          {/* Title */}
          <span
            className={cn(
              "flex-1 text-body text-[var(--color-text-primary)]",
              task.isCompleted && "line-through text-[var(--color-text-muted)]"
            )}
          >
            {task.title}
          </span>

          {/* More button */}
          <button
            onClick={() => onEdit(task)}
            className="flex-shrink-0 rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-[var(--color-bg-hover)]"
          >
            <MoreHorizontal className="h-4 w-4 text-[var(--color-text-muted)]" />
          </button>
        </div>

        {/* Meta row */}
        <div className="mt-2 flex flex-wrap items-center gap-3 text-caption">
          {/* Scheduled time */}
          {task.scheduledTime && (
            <div className="flex items-center gap-1 text-[var(--color-text-muted)]">
              <Calendar className="h-3 w-3" />
              <span>{task.scheduledTime}</span>
            </div>
          )}

          {/* Time estimate */}
          {(task.estimatedMinutes || task.actualMinutes) && (
            <div className="flex items-center gap-1 time-estimate">
              <Clock className="h-3 w-3" />
              <span>
                {task.actualMinutes
                  ? `${formatTime(task.actualMinutes)} / ${formatTime(task.estimatedMinutes)}`
                  : formatTime(task.estimatedMinutes)}
              </span>
            </div>
          )}
        </div>

        {/* Tags */}
        {task.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {task.tags.map((tag) => (
              <span key={tag} className="tag">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}



