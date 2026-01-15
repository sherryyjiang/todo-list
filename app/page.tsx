"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Task, TaskStatus, SECTIONS } from "@/types";
import { Plus, Trash2, Check, ChevronDown, ChevronRight } from "lucide-react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

export default function Home() {
  if (!convexUrl) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-main)] p-4 md:p-8">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-display mb-8 text-[var(--color-text-primary)]">Todo List</h1>
          <div className="card p-6">
            <h2 className="text-heading mb-4">Setup Required</h2>
            <p className="text-body text-[var(--color-text-secondary)] mb-4">
              To use this app, you need to set up Convex:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-body text-[var(--color-text-secondary)]">
              <li>Run <code className="bg-[var(--color-bg-active)] px-2 py-1 rounded">npx convex dev</code></li>
              <li>Follow the prompts to create a Convex project</li>
              <li>The app will automatically connect once configured</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return <TodoApp />;
}

function TodoApp() {
  const tasks = useQuery(api.tasks.list) as Task[] | undefined;
  const createTask = useMutation(api.tasks.create);
  const toggleComplete = useMutation(api.tasks.toggleComplete);
  const updateStatus = useMutation(api.tasks.updateStatus);
  const updateDescription = useMutation(api.tasks.updateDescription);
  const removeTask = useMutation(api.tasks.remove);

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Set<TaskStatus>>(new Set());

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    await createTask({ title: newTaskTitle.trim() });
    setNewTaskTitle("");
  };

  const handleToggleComplete = async (taskId: string) => {
    await toggleComplete({ id: taskId as Task["_id"] });
  };

  const handleDelete = async (taskId: string) => {
    await removeTask({ id: taskId as Task["_id"] });
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    await updateStatus({ id: taskId as Task["_id"], status: newStatus });
  };

  const handleDescriptionChange = async (taskId: string, description: string) => {
    await updateDescription({ id: taskId as Task["_id"], description });
  };

  const toggleSection = (sectionId: TaskStatus) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const getTasksForSection = (status: TaskStatus) => {
    if (!tasks) return [];
    return tasks.filter((task) => task.status === status);
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-main)] p-4 md:p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-display mb-8 text-[var(--color-text-primary)]">Todo List</h1>

        {/* Add Task Form */}
        <form onSubmit={handleAddTask} className="mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Add a new task..."
              className="input flex-1"
            />
            <button type="submit" className="btn btn-primary">
              <Plus size={20} />
              Add
            </button>
          </div>
        </form>

        {/* Task Sections */}
        <div className="space-y-6">
          {SECTIONS.map((section) => {
            const sectionTasks = getTasksForSection(section.id);
            const isCollapsed = collapsedSections.has(section.id);
            const completedCount = sectionTasks.filter((t) => t.isCompleted).length;

            return (
              <div key={section.id} className="card p-4">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="flex w-full items-center gap-2 text-left"
                >
                  {isCollapsed ? (
                    <ChevronRight size={18} className="text-[var(--color-text-muted)]" />
                  ) : (
                    <ChevronDown size={18} className="text-[var(--color-text-muted)]" />
                  )}
                  <h2 className="text-heading text-[var(--color-text-primary)]">{section.label}</h2>
                  <span className="text-caption text-[var(--color-text-muted)]">
                    {completedCount}/{sectionTasks.length}
                  </span>
                </button>

                {!isCollapsed && (
                  <div className="mt-4 space-y-2">
                    {sectionTasks.length === 0 ? (
                      <p className="text-body text-[var(--color-text-muted)] py-2">No tasks</p>
                    ) : (
                      sectionTasks.map((task) => (
                        <TaskItem
                          key={task._id}
                          task={task}
                          isExpanded={expandedTask === task._id}
                          onToggleExpand={() =>
                            setExpandedTask(expandedTask === task._id ? null : task._id)
                          }
                          onToggleComplete={() => handleToggleComplete(task._id)}
                          onDelete={() => handleDelete(task._id)}
                          onStatusChange={(status) => handleStatusChange(task._id, status)}
                          onDescriptionChange={(desc) => handleDescriptionChange(task._id, desc)}
                        />
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface TaskItemProps {
  task: Task;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onToggleComplete: () => void;
  onDelete: () => void;
  onStatusChange: (status: TaskStatus) => void;
  onDescriptionChange: (description: string) => void;
}

function TaskItem({
  task,
  isExpanded,
  onToggleExpand,
  onToggleComplete,
  onDelete,
  onStatusChange,
  onDescriptionChange,
}: TaskItemProps) {
  const [description, setDescription] = useState(task.description || "");

  const handleDescriptionBlur = () => {
    if (description !== (task.description || "")) {
      onDescriptionChange(description);
    }
  };

  return (
    <div
      className={`rounded-lg border border-[var(--color-border)] p-3 transition-all ${
        task.isCompleted ? "bg-[var(--color-bg-hover)] opacity-60" : "bg-[var(--color-bg-card)]"
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Checkbox */}
        <button
          onClick={onToggleComplete}
          className={`flex h-5 w-5 items-center justify-center rounded border transition-all ${
            task.isCompleted
              ? "border-[var(--color-success)] bg-[var(--color-success)]"
              : "border-[var(--color-border)] hover:border-[var(--color-primary)]"
          }`}
        >
          {task.isCompleted && <Check size={14} className="text-white" />}
        </button>

        {/* Title */}
        <button
          onClick={onToggleExpand}
          className={`flex-1 text-left text-body ${
            task.isCompleted
              ? "text-[var(--color-text-muted)] line-through"
              : "text-[var(--color-text-primary)]"
          }`}
        >
          {task.title}
        </button>

        {/* Status Dropdown */}
        <select
          value={task.status}
          onChange={(e) => onStatusChange(e.target.value as TaskStatus)}
          className="input py-1 text-caption"
        >
          {SECTIONS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>

        {/* Delete */}
        <button
          onClick={onDelete}
          className="btn-ghost rounded p-1 text-[var(--color-text-muted)] hover:text-[var(--color-urgent)]"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Expanded Description */}
      {isExpanded && (
        <div className="mt-3 pl-8">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleDescriptionBlur}
            placeholder="Add a description..."
            className="input w-full resize-none text-body"
            rows={2}
          />
        </div>
      )}
    </div>
  );
}
