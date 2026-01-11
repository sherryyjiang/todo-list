"use client";

import { useState, useMemo } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Column } from "./column";
import { TaskCard } from "./task-card";
import { Task, TaskStatus, COLUMNS } from "@/types";
import { Id } from "@/convex/_generated/dataModel";

// Mock tasks for development
const MOCK_TASKS: Task[] = [
  {
    _id: "task1" as Id<"tasks">,
    _creationTime: Date.now(),
    title: "Review Q4 budget proposal",
    status: "today",
    tags: ["finance", "urgent"],
    estimatedMinutes: 60,
    order: 1,
    isCompleted: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    scheduledTime: "14:00",
  },
  {
    _id: "task2" as Id<"tasks">,
    _creationTime: Date.now(),
    title: "Team standup meeting",
    status: "today",
    tags: ["meeting"],
    estimatedMinutes: 30,
    actualMinutes: 25,
    order: 2,
    isCompleted: true,
    completedAt: Date.now(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    scheduledTime: "09:00",
  },
  {
    _id: "task3" as Id<"tasks">,
    _creationTime: Date.now(),
    title: "Write blog post draft",
    status: "today",
    tags: ["content", "marketing"],
    estimatedMinutes: 90,
    order: 3,
    isCompleted: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    _id: "task4" as Id<"tasks">,
    _creationTime: Date.now(),
    title: "Prepare client presentation",
    status: "tomorrow",
    tags: ["client"],
    estimatedMinutes: 120,
    order: 1,
    isCompleted: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    _id: "task5" as Id<"tasks">,
    _creationTime: Date.now(),
    title: "Code review for feature branch",
    status: "this_week",
    tags: ["dev"],
    estimatedMinutes: 45,
    order: 1,
    isCompleted: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    _id: "task6" as Id<"tasks">,
    _creationTime: Date.now(),
    title: "Update project documentation",
    status: "this_week",
    tags: ["docs"],
    estimatedMinutes: 60,
    order: 2,
    isCompleted: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    _id: "task7" as Id<"tasks">,
    _creationTime: Date.now(),
    title: "Research new design system",
    status: "backlog",
    tags: ["research", "design"],
    order: 1,
    isCompleted: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    _id: "task8" as Id<"tasks">,
    _creationTime: Date.now(),
    title: "Plan team offsite",
    status: "backlog",
    tags: ["planning"],
    order: 2,
    isCompleted: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

interface BoardProps {
  onEditTask: (task: Task) => void;
}

export function Board({ onEditTask }: BoardProps) {
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Sensors for drag and drop - supports both mouse and touch
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    })
  );

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      today: [],
      tomorrow: [],
      this_week: [],
      backlog: [],
      done: [],
    };

    for (const task of tasks) {
      grouped[task.status].push(task);
    }

    // Sort each column by order
    for (const status of Object.keys(grouped) as TaskStatus[]) {
      grouped[status].sort((a, b) => a.order - b.order);
    }

    return grouped;
  }, [tasks]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t._id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the active task
    const activeTask = tasks.find((t) => t._id === activeId);
    if (!activeTask) return;

    // Determine if we're over a column or a task
    const isOverColumn = COLUMNS.some((col) => col.id === overId);
    const overTask = tasks.find((t) => t._id === overId);

    const newStatus = isOverColumn
      ? (overId as TaskStatus)
      : overTask?.status;

    if (!newStatus || newStatus === activeTask.status) return;

    // Move to new column
    setTasks((prev) => {
      const updated = prev.map((t) => {
        if (t._id === activeId) {
          return { ...t, status: newStatus };
        }
        return t;
      });
      return updated;
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    // Find tasks
    const activeTask = tasks.find((t) => t._id === activeId);
    const overTask = tasks.find((t) => t._id === overId);

    if (!activeTask) return;

    // If dropped on another task in the same column, reorder
    if (overTask && activeTask.status === overTask.status) {
      setTasks((prev) => {
        const columnTasks = prev.filter((t) => t.status === activeTask.status);
        const oldIndex = columnTasks.findIndex((t) => t._id === activeId);
        const newIndex = columnTasks.findIndex((t) => t._id === overId);

        const reordered = arrayMove(columnTasks, oldIndex, newIndex);

        // Update order values
        const withNewOrder = reordered.map((t, i) => ({ ...t, order: i + 1 }));

        // Merge back with other tasks
        const otherTasks = prev.filter((t) => t.status !== activeTask.status);
        return [...otherTasks, ...withNewOrder];
      });
    }

    // TODO: Call Convex mutation to persist the change
  };

  const handleToggleComplete = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t._id === id) {
          const isCompleted = !t.isCompleted;
          return {
            ...t,
            isCompleted,
            status: isCompleted ? "done" : t.status,
            completedAt: isCompleted ? Date.now() : undefined,
          };
        }
        return t;
      })
    );

    // TODO: Call Convex mutation
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full gap-4 overflow-x-auto p-4 pb-6">
        {COLUMNS.map((column) => (
          <Column
            key={column.id}
            id={column.id}
            title={column.label}
            tasks={tasksByStatus[column.id]}
            colorClass={column.colorClass}
            onToggleComplete={handleToggleComplete}
            onEditTask={onEditTask}
          />
        ))}
      </div>

      {/* Drag overlay for smooth animation */}
      <DragOverlay>
        {activeTask && (
          <div className="w-[280px] md:w-[300px]">
            <TaskCard
              task={activeTask}
              onToggleComplete={() => {}}
              onEdit={() => {}}
              isDragging
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}



