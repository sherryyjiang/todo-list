"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Task, TaskStatus, ActiveTaskStatus, SECTIONS, LONG_TERM_SECTION, ALL_SECTIONS } from "@/types";
import {
  ChevronDown,
  ChevronRight,
  Check,
  GripVertical,
  Plus,
  Trash2,
  Archive,
  ArchiveRestore,
} from "lucide-react";
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

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
  const archiveTask = useMutation(api.tasks.archive);
  const unarchiveTask = useMutation(api.tasks.unarchive);

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Set<TaskStatus>>(new Set());
  const [showArchived, setShowArchived] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const taskById = useMemo(() => {
    const map = new Map<string, Task>();
    tasks?.forEach((task) => {
      map.set(String(task._id), task);
    });
    return map;
  }, [tasks]);

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

  const handleArchive = async (taskId: string) => {
    await archiveTask({ id: taskId as Task["_id"] });
  };

  const handleUnarchive = async (taskId: string, status: ActiveTaskStatus) => {
    await unarchiveTask({ id: taskId as Task["_id"], status });
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

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeTask = taskById.get(String(active.id));
    if (!activeTask) return;

    const nextStatus = getStatusFromOver(over.id, taskById);
    if (!nextStatus || nextStatus === activeTask.status) return;

    updateStatus({ id: activeTask._id, status: nextStatus });
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
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
                <TaskSection
                  key={section.id}
                  section={section}
                  sectionTasks={sectionTasks}
                  isCollapsed={isCollapsed}
                  completedCount={completedCount}
                  expandedTask={expandedTask}
                  onToggleSection={() => toggleSection(section.id)}
                  onToggleExpand={(taskId) =>
                    setExpandedTask(expandedTask === taskId ? null : taskId)
                  }
                  onToggleComplete={handleToggleComplete}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                  onDescriptionChange={handleDescriptionChange}
                  onArchive={handleArchive}
                />
              );
            })}
          </div>

          {/* Long Term Section */}
          <div className="mt-8">
            <TaskSection
              section={LONG_TERM_SECTION}
              sectionTasks={getTasksForSection("long_term")}
              isCollapsed={collapsedSections.has("long_term")}
              completedCount={getTasksForSection("long_term").filter((t) => t.isCompleted).length}
              expandedTask={expandedTask}
              onToggleSection={() => toggleSection("long_term")}
              onToggleExpand={(taskId) =>
                setExpandedTask(expandedTask === taskId ? null : taskId)
              }
              onToggleComplete={handleToggleComplete}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
              onDescriptionChange={handleDescriptionChange}
              onArchive={handleArchive}
              isLongTerm
            />
          </div>

          {/* Archived Section Toggle */}
          <div className="mt-8 border-t border-[var(--color-border)] pt-6">
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              <Archive size={18} />
              <span className="text-body">
                {showArchived ? "Hide Archived" : "Show Archived"}
              </span>
              <span className="text-caption">
                ({getTasksForSection("archived").length})
              </span>
            </button>

            {showArchived && (
              <div className="mt-4">
                <ArchivedSection
                  tasks={getTasksForSection("archived")}
                  expandedTask={expandedTask}
                  onToggleExpand={(taskId) =>
                    setExpandedTask(expandedTask === taskId ? null : taskId)
                  }
                  onToggleComplete={handleToggleComplete}
                  onDelete={handleDelete}
                  onUnarchive={handleUnarchive}
                  onDescriptionChange={handleDescriptionChange}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </DndContext>
  );
}

function TaskItem({
  task,
  isExpanded,
  onToggleExpand,
  onToggleComplete,
  onDelete,
  onStatusChange,
  onDescriptionChange,
  onArchive,
}: TaskItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task._id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.6 : 1,
  };
  const [description, setDescription] = useState(task.description || "");

  const handleDescriptionBlur = () => {
    if (description !== (task.description || "")) {
      onDescriptionChange(description);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border border-[var(--color-border)] p-3 transition-all ${
        task.isCompleted ? "bg-[var(--color-bg-hover)] opacity-60" : "bg-[var(--color-bg-card)]"
      }`}
    >
      <div className="flex items-center gap-3">
        <button
          {...attributes}
          {...listeners}
          className="btn-ghost rounded p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          aria-label="Drag task"
          type="button"
        >
          <GripVertical size={16} />
        </button>
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
          {ALL_SECTIONS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>

        {/* Archive button - only show for completed tasks */}
        {task.isCompleted && onArchive && (
          <button
            onClick={onArchive}
            className="btn-ghost rounded p-1 text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
            title="Archive task"
          >
            <Archive size={16} />
          </button>
        )}

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

function TaskSection({
  section,
  sectionTasks,
  isCollapsed,
  completedCount,
  expandedTask,
  onToggleSection,
  onToggleExpand,
  onToggleComplete,
  onDelete,
  onStatusChange,
  onDescriptionChange,
  onArchive,
  isLongTerm,
}: TaskSectionProps) {
  const sectionDropId = getSectionDropId(section.id);
  const { isOver, setNodeRef } = useDroppable({ id: sectionDropId });

  return (
    <div
      ref={setNodeRef}
      className={`card p-4 transition ${isOver ? "ring-2 ring-[var(--color-primary)]/40" : ""} ${
        isLongTerm ? "border-dashed border-[var(--color-border)]" : ""
      }`}
    >
      <button onClick={onToggleSection} className="flex w-full items-center gap-2 text-left">
        {isCollapsed ? (
          <ChevronRight size={18} className="text-[var(--color-text-muted)]" />
        ) : (
          <ChevronDown size={18} className="text-[var(--color-text-muted)]" />
        )}
        <h2 className="text-heading text-[var(--color-text-primary)]">{section.label}</h2>
        {isLongTerm && (
          <span className="text-caption text-[var(--color-text-muted)] italic">
            — important reminders for later
          </span>
        )}
        <span className="text-caption text-[var(--color-text-muted)] ml-auto">
          {completedCount}/{sectionTasks.length}
        </span>
      </button>

      {!isCollapsed && (
        <div className="mt-4 space-y-2">
          {sectionTasks.length === 0 ? (
            <p className="text-body text-[var(--color-text-muted)] py-2">
              {isLongTerm ? "No long term items" : "No tasks"}
            </p>
          ) : (
            sectionTasks.map((task) => (
              <TaskItem
                key={task._id}
                task={task}
                isExpanded={expandedTask === task._id}
                onToggleExpand={() => onToggleExpand(task._id)}
                onToggleComplete={() => onToggleComplete(task._id)}
                onDelete={() => onDelete(task._id)}
                onStatusChange={(status) => onStatusChange(task._id, status)}
                onDescriptionChange={(desc) => onDescriptionChange(task._id, desc)}
                onArchive={() => onArchive(task._id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function getSectionDropId(status: TaskStatus) {
  return `section-${status}`;
}

function getStatusFromOver(
  overId: string | number,
  taskById: Map<string, Task>
): TaskStatus | null {
  const overKey = String(overId);
  if (overKey.startsWith("section-")) {
    return overKey.replace("section-", "") as TaskStatus;
  }
  const overTask = taskById.get(overKey);
  return overTask ? overTask.status : null;
}

function ArchivedSection({
  tasks,
  expandedTask,
  onToggleExpand,
  onToggleComplete,
  onDelete,
  onUnarchive,
  onDescriptionChange,
}: ArchivedSectionProps) {
  const [unarchiveStatus, setUnarchiveStatus] = useState<Record<string, ActiveTaskStatus>>({});

  if (tasks.length === 0) {
    return (
      <div className="card p-4">
        <p className="text-body text-[var(--color-text-muted)]">No archived tasks</p>
      </div>
    );
  }

  return (
    <div className="card p-4">
      <h2 className="text-heading text-[var(--color-text-primary)] mb-4">Archived</h2>
      <div className="space-y-2">
        {tasks.map((task) => (
          <ArchivedTaskItem
            key={task._id}
            task={task}
            isExpanded={expandedTask === task._id}
            onToggleExpand={() => onToggleExpand(task._id)}
            onToggleComplete={() => onToggleComplete(task._id)}
            onDelete={() => onDelete(task._id)}
            unarchiveStatus={unarchiveStatus[task._id] || "backlog"}
            onUnarchiveStatusChange={(status) =>
              setUnarchiveStatus((prev) => ({ ...prev, [task._id]: status }))
            }
            onUnarchive={() => onUnarchive(task._id, unarchiveStatus[task._id] || "backlog")}
            onDescriptionChange={(desc) => onDescriptionChange(task._id, desc)}
          />
        ))}
      </div>
    </div>
  );
}

function ArchivedTaskItem({
  task,
  isExpanded,
  onToggleExpand,
  onToggleComplete,
  onDelete,
  unarchiveStatus,
  onUnarchiveStatusChange,
  onUnarchive,
  onDescriptionChange,
}: {
  task: Task;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onToggleComplete: () => void;
  onDelete: () => void;
  unarchiveStatus: ActiveTaskStatus;
  onUnarchiveStatusChange: (status: ActiveTaskStatus) => void;
  onUnarchive: () => void;
  onDescriptionChange: (description: string) => void;
}) {
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

        {/* Restore dropdown */}
        <select
          value={unarchiveStatus}
          onChange={(e) => onUnarchiveStatusChange(e.target.value as ActiveTaskStatus)}
          className="input py-1 text-caption"
        >
          {ALL_SECTIONS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>

        {/* Restore button */}
        <button
          onClick={onUnarchive}
          className="btn-ghost rounded p-1 text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
          title="Restore task"
        >
          <ArchiveRestore size={16} />
        </button>

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

interface TaskItemProps {
  task: Task;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onToggleComplete: () => void;
  onDelete: () => void;
  onStatusChange: (status: TaskStatus) => void;
  onDescriptionChange: (description: string) => void;
  onArchive?: () => void;
}

interface TaskSectionProps {
  section: { id: TaskStatus; label: string };
  sectionTasks: Task[];
  isCollapsed: boolean;
  completedCount: number;
  expandedTask: string | null;
  onToggleSection: () => void;
  onToggleExpand: (taskId: Task["_id"]) => void;
  onToggleComplete: (taskId: Task["_id"]) => void;
  onDelete: (taskId: Task["_id"]) => void;
  onStatusChange: (taskId: Task["_id"], status: TaskStatus) => void;
  onDescriptionChange: (taskId: Task["_id"], description: string) => void;
  onArchive: (taskId: Task["_id"]) => void;
  isLongTerm?: boolean;
}

interface ArchivedSectionProps {
  tasks: Task[];
  expandedTask: string | null;
  onToggleExpand: (taskId: Task["_id"]) => void;
  onToggleComplete: (taskId: Task["_id"]) => void;
  onDelete: (taskId: Task["_id"]) => void;
  onUnarchive: (taskId: Task["_id"], status: ActiveTaskStatus) => void;
  onDescriptionChange: (taskId: Task["_id"], description: string) => void;
}
