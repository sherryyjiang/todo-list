"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Task, TaskStatus, TaskCategory, ActiveTaskStatus, SECTIONS, LONG_TERM_SECTION, ALL_SECTIONS, CATEGORIES } from "@/types";
import {
  ChevronDown,
  ChevronRight,
  Check,
  GripVertical,
  Plus,
  Trash2,
  Archive,
  ArchiveRestore,
  Pencil,
} from "lucide-react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  closestCenter,
  MeasuringStrategy,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";

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
  const createTaskWithStatus = useMutation(api.tasks.createWithStatus);
  const toggleComplete = useMutation(api.tasks.toggleComplete);
  const updateStatus = useMutation(api.tasks.updateStatus);
  const updateDescription = useMutation(api.tasks.updateDescription);
  const updateTitle = useMutation(api.tasks.updateTitle);
  const removeTask = useMutation(api.tasks.remove);
  const archiveTask = useMutation(api.tasks.archive);
  const archiveAllCompleted = useMutation(api.tasks.archiveAllCompleted);
  const unarchiveTask = useMutation(api.tasks.unarchive);

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Set<TaskStatus>>(new Set());
  const [showArchived, setShowArchived] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory>("general");
  // More responsive sensors with touch and keyboard support
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 3 }, // Reduced from 8 for snappier response
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 150, tolerance: 5 }, // Slight delay to distinguish from scroll
  });
  const keyboardSensor = useSensor(KeyboardSensor);
  const sensors = useSensors(pointerSensor, touchSensor, keyboardSensor);

  // Track if we've already created a "Clear backlog" task this session
  const clearBacklogCreatedRef = useRef(false);

  const CLEAR_BACKLOG_TITLE = "Clear backlog";
  const BACKLOG_THRESHOLD = 7;

  // Auto-create "Clear backlog" task when backlog has more than 7 items
  useEffect(() => {
    if (!tasks) return;

    const backlogTasks = tasks.filter((t) => t.status === "backlog" && !t.isCompleted);
    const todayTasks = tasks.filter((t) => t.status === "today");

    // Check if "Clear backlog" already exists in today's tasks
    const clearBacklogExists = todayTasks.some(
      (t) => t.title === CLEAR_BACKLOG_TITLE && !t.isCompleted
    );

    // If backlog has more than 7 items and no "Clear backlog" task exists in today
    if (
      backlogTasks.length > BACKLOG_THRESHOLD &&
      !clearBacklogExists &&
      !clearBacklogCreatedRef.current
    ) {
      clearBacklogCreatedRef.current = true;
      createTaskWithStatus({
        title: CLEAR_BACKLOG_TITLE,
        description: `You have ${backlogTasks.length} items in your backlog. Time to prioritize and clear some out!`,
        status: "today",
        category: "general",
      });
    }

    // Reset the ref if backlog drops to 7 or below, so it can trigger again later
    if (backlogTasks.length <= BACKLOG_THRESHOLD) {
      clearBacklogCreatedRef.current = false;
    }
  }, [tasks, createTaskWithStatus]);

  const taskById = useMemo(() => {
    const map = new Map<string, Task>();
    tasks?.forEach((task) => {
      map.set(String(task._id), task);
    });
    return map;
  }, [tasks]);

  const handleAddTask = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    await createTask({ title: newTaskTitle.trim(), category: selectedCategory });
    setNewTaskTitle("");
  }, [newTaskTitle, createTask, selectedCategory]);

  const handleToggleComplete = useCallback((taskId: string) => {
    toggleComplete({ id: taskId as Task["_id"] });
  }, [toggleComplete]);

  const handleDelete = useCallback((taskId: string) => {
    removeTask({ id: taskId as Task["_id"] });
  }, [removeTask]);

  const handleStatusChange = useCallback((taskId: string, newStatus: TaskStatus) => {
    updateStatus({ id: taskId as Task["_id"], status: newStatus });
  }, [updateStatus]);

  const handleDescriptionChange = useCallback((taskId: string, description: string) => {
    updateDescription({ id: taskId as Task["_id"], description });
  }, [updateDescription]);

  const handleTitleChange = useCallback((taskId: string, title: string) => {
    updateTitle({ id: taskId as Task["_id"], title });
  }, [updateTitle]);

  const handleArchive = useCallback((taskId: string) => {
    archiveTask({ id: taskId as Task["_id"] });
  }, [archiveTask]);

  const handleArchiveAllCompleted = useCallback(() => {
    archiveAllCompleted({});
  }, [archiveAllCompleted]);

  const handleUnarchive = useCallback((taskId: string, status: ActiveTaskStatus) => {
    unarchiveTask({ id: taskId as Task["_id"], status });
  }, [unarchiveTask]);

  const toggleSection = useCallback((sectionId: TaskStatus) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }, []);

  const handleToggleExpand = useCallback((taskId: string) => {
    setExpandedTask((prev) => prev === taskId ? null : taskId);
  }, []);

  // Filter tasks by selected category (treat undefined/null as "general" for existing tasks)
  const filteredTasks = useMemo(() => {
    return tasks?.filter((task) => {
      const taskCategory = task.category || "general";
      return taskCategory === selectedCategory;
    });
  }, [tasks, selectedCategory]);

  // Memoize tasks by section to avoid filtering on every render
  const tasksBySection = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = {
      today: [],
      tomorrow: [],
      this_week: [],
      next_week: [],
      backlog: [],
      long_term: [],
      archived: [],
    };
    filteredTasks?.forEach((task) => {
      map[task.status].push(task);
    });
    return map;
  }, [filteredTasks]);

  // Count completed tasks that are not archived (for the "Archive All Done" button)
  const completedNotArchivedCount = useMemo(() => {
    return filteredTasks?.filter((task) => task.isCompleted && task.status !== "archived").length ?? 0;
  }, [filteredTasks]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    
    if (!over) return;

    const activeTask = taskById.get(String(active.id));
    if (!activeTask) return;

    const nextStatus = getStatusFromOver(over.id, taskById);
    if (!nextStatus || nextStatus === activeTask.status) return;

    updateStatus({ id: activeTask._id, status: nextStatus });
  }, [taskById, updateStatus]);

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  const activeTask = activeId ? taskById.get(activeId) : null;

  // Measuring configuration for better drop zone detection
  const measuringConfig = useMemo(() => ({
    droppable: {
      strategy: MeasuringStrategy.Always,
    },
  }), []);

  // Calculate overall progress for sidebar
  const overallStats = useMemo(() => {
    if (!filteredTasks) return { total: 0, completed: 0, today: 0, todayCompleted: 0 };
    const activeTasks = filteredTasks.filter(t => t.status !== 'archived');
    const todayTasks = filteredTasks.filter(t => t.status === 'today');
    return {
      total: activeTasks.length,
      completed: activeTasks.filter(t => t.isCompleted).length,
      today: todayTasks.length,
      todayCompleted: todayTasks.filter(t => t.isCompleted).length,
    };
  }, [filteredTasks]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToWindowEdges]}
      measuring={measuringConfig}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="h-screen flex flex-col bg-[var(--color-bg-main)] overflow-hidden">
        {/* Top Header Bar */}
        <header className="flex-shrink-0 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/80 backdrop-blur-sm">
          <div className="px-4 lg:px-6 py-3 flex items-center justify-between gap-4">
            {/* Logo & Title */}
            <div className="flex items-center gap-4">
              <h1 className="text-title text-[var(--color-text-primary)] tracking-tight font-semibold">
                TaskFlow
              </h1>
              
              {/* Category Tabs - Inline */}
              <div className="flex items-center gap-1 bg-[var(--color-bg-hover)] rounded-lg p-1">
                {CATEGORIES.map((category) => {
                  const categoryTasks = tasks?.filter(t => (t.category || 'general') === category.id && t.status !== 'archived') || [];
                  const categoryCompleted = categoryTasks.filter(t => t.isCompleted).length;
                  
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-body transition-all duration-150 ${
                        selectedCategory === category.id
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
              </div>
            </div>

            {/* Add Task Form - Compact */}
            <form onSubmit={handleAddTask} className="flex-1 max-w-md">
              <div className="flex gap-2 items-center">
                <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-bg-main)] border border-[var(--color-border)] focus-within:border-[var(--color-primary)] focus-within:ring-2 focus-within:ring-[var(--color-primary)]/20 transition-all">
                  <Plus size={16} className="text-[var(--color-text-muted)] flex-shrink-0" />
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Add task..."
                    className="flex-1 bg-transparent border-none outline-none text-body text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={!newTaskTitle.trim()}
                  className={`px-4 py-2 rounded-lg text-body font-medium transition-all duration-150 ${
                    newTaskTitle.trim()
                      ? "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]"
                      : "bg-[var(--color-bg-active)] text-[var(--color-text-muted)] cursor-not-allowed"
                  }`}
                >
                  Add
                </button>
              </div>
            </form>

            {/* Today's Progress - Compact */}
            {overallStats.today > 0 && (
              <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-[var(--color-bg-hover)]">
                <span className="text-caption text-[var(--color-text-muted)]">Today</span>
                <div className="w-20 h-1.5 bg-[var(--color-bg-active)] rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${(overallStats.todayCompleted / overallStats.today) * 100}%`,
                      background: overallStats.todayCompleted === overallStats.today
                        ? 'var(--color-success)'
                        : 'var(--grad-primary)',
                    }}
                  />
                </div>
                <span className="text-caption text-[var(--color-text-primary)] font-medium tabular-nums">
                  {overallStats.todayCompleted}/{overallStats.today}
                </span>
              </div>
            )}

            {/* Archive Actions */}
            <div className="flex items-center gap-2">
              {completedNotArchivedCount > 0 && (
                <button
                  onClick={handleArchiveAllCompleted}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-caption text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-subtle)] transition-all"
                  title="Archive all completed tasks"
                >
                  <Archive size={14} />
                  <span className="hidden sm:inline">Archive</span>
                  <span className="bg-[var(--color-success)] text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                    {completedNotArchivedCount}
                  </span>
                </button>
              )}
              <button
                onClick={() => setShowArchived(!showArchived)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-caption transition-all ${
                  showArchived 
                    ? "bg-[var(--color-primary-subtle)] text-[var(--color-primary)]"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]"
                }`}
              >
                <Archive size={14} />
                <span className="hidden sm:inline">{showArchived ? "Hide" : "Show"}</span>
                <span className="text-[10px] opacity-60">({tasksBySection.archived.length})</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Kanban Board */}
        <main className="flex-1 overflow-hidden">
          <div className="h-full flex">
            {/* Kanban Columns */}
            <div className="flex-1 flex gap-3 p-4 overflow-x-auto kanban-scroll">
              {SECTIONS.map((section) => (
                <KanbanColumn
                  key={section.id}
                  section={section}
                  sectionTasks={tasksBySection[section.id]}
                  expandedTask={expandedTask}
                  activeId={activeId}
                  onToggleExpand={handleToggleExpand}
                  onToggleComplete={handleToggleComplete}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                  onDescriptionChange={handleDescriptionChange}
                  onTitleChange={handleTitleChange}
                  onArchive={handleArchive}
                />
              ))}
              
              {/* Long Term Column */}
              <KanbanColumn
                section={LONG_TERM_SECTION}
                sectionTasks={tasksBySection.long_term}
                expandedTask={expandedTask}
                activeId={activeId}
                onToggleExpand={handleToggleExpand}
                onToggleComplete={handleToggleComplete}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
                onDescriptionChange={handleDescriptionChange}
                onTitleChange={handleTitleChange}
                onArchive={handleArchive}
                isLongTerm
              />
            </div>

            {/* Archived Panel - Slide out */}
            {showArchived && (
              <div className="w-80 flex-shrink-0 border-l border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/50 overflow-y-auto animate-slideInRight">
                <div className="p-4">
                  <ArchivedSection
                    tasks={tasksBySection.archived}
                    expandedTask={expandedTask}
                    onToggleExpand={handleToggleExpand}
                    onToggleComplete={handleToggleComplete}
                    onDelete={handleDelete}
                    onUnarchive={handleUnarchive}
                    onDescriptionChange={handleDescriptionChange}
                    onTitleChange={handleTitleChange}
                  />
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Drag Overlay - renders floating preview with spring animation */}
      <DragOverlay 
        dropAnimation={{
          duration: 280,
          easing: 'cubic-bezier(0.32, 0.72, 0, 1)', // iOS-like spring
          sideEffects: ({ active }) => {
            active.node.animate(
              [{ opacity: 0 }, { opacity: 1 }],
              { duration: 200, easing: 'ease-out' }
            );
          },
        }}
        className="cursor-grabbing"
      >
        {activeTask ? (
          <DragPreview task={activeTask} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

// Floating drag preview component with enhanced styling
const DragPreview = memo(function DragPreview({ task }: { task: Task }) {
  return (
    <div
      className="drag-preview rounded-lg bg-[var(--color-bg-card)] p-3"
      style={{
        boxShadow: '0 20px 40px -12px rgba(0,0,0,0.25), 0 0 0 1px var(--color-primary)',
        transform: 'rotate(1deg) scale(1.02)',
        width: '240px',
      }}
    >
      <div className="flex items-center gap-2">
        <div className="text-[var(--color-primary)]">
          <GripVertical size={14} />
        </div>
        <div
          className={`flex h-4 w-4 items-center justify-center rounded border-2 ${
            task.isCompleted
              ? "border-[var(--color-success)] bg-[var(--color-success)]"
              : "border-[var(--color-primary)]"
          }`}
        >
          {task.isCompleted && <Check size={10} className="text-white" strokeWidth={3} />}
        </div>
        <span className="flex-1 text-caption font-medium text-[var(--color-text-primary)] truncate">
          {task.title}
        </span>
      </div>
    </div>
  );
});

// Kanban Column Component - Compact horizontal layout
interface KanbanColumnProps {
  section: { id: TaskStatus; label: string };
  sectionTasks: Task[];
  expandedTask: string | null;
  activeId: string | null;
  onToggleExpand: (taskId: string) => void;
  onToggleComplete: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onDescriptionChange: (taskId: string, description: string) => void;
  onTitleChange: (taskId: string, title: string) => void;
  onArchive: (taskId: string) => void;
  isLongTerm?: boolean;
}

const KanbanColumn = memo(function KanbanColumn({
  section,
  sectionTasks,
  expandedTask,
  activeId,
  onToggleExpand,
  onToggleComplete,
  onDelete,
  onStatusChange,
  onDescriptionChange,
  onTitleChange,
  onArchive,
  isLongTerm,
}: KanbanColumnProps) {
  const sectionDropId = getSectionDropId(section.id);
  const { isOver, setNodeRef } = useDroppable({ id: sectionDropId });

  const completedCount = useMemo(() => 
    sectionTasks.filter((t) => t.isCompleted).length,
    [sectionTasks]
  );

  const isDragging = activeId !== null;
  const accentColor = sectionAccentColors[section.id];

  return (
    <div
      ref={setNodeRef}
      className={`kanban-column flex-shrink-0 w-64 flex flex-col rounded-xl border transition-all duration-200 ${
        isOver 
          ? "border-[var(--color-primary)] bg-[var(--color-primary-subtle)]/50 ring-2 ring-[var(--color-primary)]/20" 
          : isDragging 
            ? "border-dashed border-[var(--color-primary)]/30 bg-[var(--color-bg-card)]" 
            : "border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]"
      } ${isLongTerm ? "border-dashed w-56" : ""}`}
    >
      {/* Column Header */}
      <div className="flex-shrink-0 px-3 py-2.5 border-b border-[var(--color-border-subtle)]">
        <div className="flex items-center gap-2">
          <div 
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: accentColor }}
          />
          <h3 className="text-caption font-semibold text-[var(--color-text-primary)] uppercase tracking-wide flex-1">
            {section.label}
          </h3>
          <span className="text-[11px] text-[var(--color-text-muted)] tabular-nums bg-[var(--color-bg-hover)] px-1.5 py-0.5 rounded">
            {completedCount}/{sectionTasks.length}
          </span>
        </div>
        {/* Mini progress bar */}
        {sectionTasks.length > 0 && (
          <div className="mt-2 h-1 bg-[var(--color-bg-active)] rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-300"
              style={{ 
                width: `${sectionTasks.length > 0 ? (completedCount / sectionTasks.length) * 100 : 0}%`,
                backgroundColor: completedCount === sectionTasks.length ? 'var(--color-success)' : accentColor,
              }}
            />
          </div>
        )}
      </div>

      {/* Scrollable Task List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 min-h-[100px]">
        {sectionTasks.length === 0 ? (
          <div className={`flex items-center justify-center h-20 rounded-lg border border-dashed transition-all ${
            isOver 
              ? "border-[var(--color-primary)] bg-[var(--color-primary-subtle)]/30" 
              : "border-[var(--color-border-subtle)]"
          }`}>
            <p className={`text-caption ${
              isOver ? "text-[var(--color-primary)] font-medium" : "text-[var(--color-text-muted)]"
            }`}>
              {isOver ? "Drop here" : isLongTerm ? "No items" : "Empty"}
            </p>
          </div>
        ) : (
          sectionTasks.map((task) => (
            <CompactTaskItem
              key={task._id}
              task={task}
              isExpanded={expandedTask === task._id}
              onToggleExpand={() => onToggleExpand(task._id)}
              onToggleComplete={() => onToggleComplete(task._id)}
              onDelete={() => onDelete(task._id)}
              onStatusChange={(status) => onStatusChange(task._id, status)}
              onDescriptionChange={(desc) => onDescriptionChange(task._id, desc)}
              onTitleChange={(title) => onTitleChange(task._id, title)}
              onArchive={() => onArchive(task._id)}
            />
          ))
        )}
      </div>
    </div>
  );
});

// Compact Task Item for Kanban columns
const CompactTaskItem = memo(function CompactTaskItem({
  task,
  isExpanded,
  onToggleExpand,
  onToggleComplete,
  onDelete,
  onStatusChange,
  onDescriptionChange,
  onTitleChange,
  onArchive,
}: {
  task: Task;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onToggleComplete: () => void;
  onDelete: () => void;
  onStatusChange: (status: TaskStatus) => void;
  onDescriptionChange: (description: string) => void;
  onTitleChange: (title: string) => void;
  onArchive: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task._id,
  });
  const style = useMemo(() => ({
    transform: CSS.Transform.toString(transform),
  }), [transform]);
  
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  useEffect(() => {
    setEditedTitle(task.title);
  }, [task.title]);

  useEffect(() => {
    setDescription(task.description || "");
  }, [task.description]);

  const handleTitleSave = useCallback(() => {
    const trimmed = editedTitle.trim();
    if (trimmed && trimmed !== task.title) {
      onTitleChange(trimmed);
    } else {
      setEditedTitle(task.title);
    }
    setIsEditingTitle(false);
  }, [editedTitle, task.title, onTitleChange]);

  const handleTitleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleTitleSave();
    else if (e.key === "Escape") {
      setEditedTitle(task.title);
      setIsEditingTitle(false);
    }
  }, [handleTitleSave, task.title]);

  const handleDescriptionBlur = useCallback(() => {
    if (description !== (task.description || "")) {
      onDescriptionChange(description);
    }
  }, [description, task.description, onDescriptionChange]);

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="rounded-lg border border-dashed border-[var(--color-primary)]/30 bg-[var(--color-primary-subtle)]/30 p-2 h-10"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`compact-task group rounded-lg border p-2 transition-all duration-150 ${
        task.isCompleted 
          ? "bg-[var(--color-bg-hover)]/50 border-transparent opacity-60" 
          : "bg-[var(--color-bg-card)] border-[var(--color-border-subtle)] hover:border-[var(--color-primary)]/30 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start gap-2">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 opacity-0 group-hover:opacity-100 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] cursor-grab active:cursor-grabbing transition-opacity"
        >
          <GripVertical size={12} />
        </button>
        
        {/* Checkbox */}
        <button
          onClick={onToggleComplete}
          className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border-2 transition-all ${
            task.isCompleted
              ? "border-[var(--color-success)] bg-[var(--color-success)]"
              : "border-[var(--color-border)] hover:border-[var(--color-primary)]"
          }`}
        >
          {task.isCompleted && <Check size={10} className="text-white" strokeWidth={3} />}
        </button>

        {/* Title */}
        <div className="flex-1 min-w-0">
          {isEditingTitle ? (
            <input
              ref={titleInputRef}
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={handleTitleKeyDown}
              className="w-full bg-transparent border-none outline-none text-caption text-[var(--color-text-primary)]"
            />
          ) : (
            <button
              onClick={onToggleExpand}
              onDoubleClick={() => setIsEditingTitle(true)}
              className={`w-full text-left text-caption leading-tight ${
                task.isCompleted
                  ? "text-[var(--color-text-muted)] line-through"
                  : "text-[var(--color-text-primary)]"
              }`}
            >
              {task.title}
            </button>
          )}
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {task.isCompleted && (
            <button
              onClick={onArchive}
              className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-subtle)]"
            >
              <Archive size={12} />
            </button>
          )}
          <button
            onClick={onDelete}
            className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-urgent)] hover:bg-[var(--color-urgent-subtle)]"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="mt-2 pl-6 space-y-2 animate-slideDown">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleDescriptionBlur}
            placeholder="Add notes..."
            className="w-full text-[11px] bg-[var(--color-bg-hover)] border border-[var(--color-border-subtle)] rounded p-1.5 resize-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]/20"
            rows={2}
          />
          <select
            value={task.status}
            onChange={(e) => onStatusChange(e.target.value as TaskStatus)}
            className="w-full text-[11px] bg-[var(--color-bg-hover)] border border-[var(--color-border-subtle)] rounded p-1.5 cursor-pointer"
          >
            {ALL_SECTIONS.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
});

const TaskItem = memo(function TaskItem({
  task,
  isExpanded,
  isDraggedOver,
  onToggleExpand,
  onToggleComplete,
  onDelete,
  onStatusChange,
  onDescriptionChange,
  onTitleChange,
  onArchive,
  animationDelay = 0,
}: TaskItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task._id,
  });
  const style = useMemo(() => ({
    transform: CSS.Transform.toString(transform),
    animationDelay: `${animationDelay}ms`,
  }), [transform, animationDelay]);
  
  const [description, setDescription] = useState(task.description || "");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [justCompleted, setJustCompleted] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  // Sync edited title with task title when it changes externally
  useEffect(() => {
    setEditedTitle(task.title);
  }, [task.title]);

  // Sync description when task changes
  useEffect(() => {
    setDescription(task.description || "");
  }, [task.description]);

  // Completion celebration animation
  const handleToggleCompleteWithAnimation = useCallback(() => {
    if (!task.isCompleted) {
      setJustCompleted(true);
      setTimeout(() => setJustCompleted(false), 600);
    }
    onToggleComplete();
  }, [task.isCompleted, onToggleComplete]);

  const handleDescriptionBlur = useCallback(() => {
    if (description !== (task.description || "")) {
      onDescriptionChange(description);
    }
  }, [description, task.description, onDescriptionChange]);

  const handleTitleSave = useCallback(() => {
    const trimmed = editedTitle.trim();
    if (trimmed && trimmed !== task.title) {
      onTitleChange(trimmed);
    } else {
      setEditedTitle(task.title);
    }
    setIsEditingTitle(false);
  }, [editedTitle, task.title, onTitleChange]);

  const handleTitleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTitleSave();
    } else if (e.key === "Escape") {
      setEditedTitle(task.title);
      setIsEditingTitle(false);
    }
  }, [handleTitleSave, task.title]);

  const handleStatusSelectChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onStatusChange(e.target.value as TaskStatus);
  }, [onStatusChange]);

  // When dragging, show a ghost placeholder
  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="task-ghost rounded-xl border-2 border-dashed border-[var(--color-primary)]/30 bg-[var(--color-primary-subtle)]/50 p-3.5"
      >
        <div className="flex items-center gap-3">
          <div className="w-6" />
          <div className="h-5 w-5 rounded-md border-2 border-[var(--color-border)]/20" />
          <span className="flex-1 text-body text-[var(--color-text-muted)]/50">{task.title}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`task-item group rounded-xl border p-3.5 transition-all duration-200 animate-fadeSlideIn ${
        task.isCompleted 
          ? "bg-[var(--color-bg-hover)]/70 border-[var(--color-border-subtle)]" 
          : "bg-[var(--color-bg-card)] border-[var(--color-border)] hover:border-[var(--color-primary)]/30 hover:shadow-md"
      } ${isDraggedOver ? "ring-2 ring-[var(--color-primary)]/30" : ""} ${
        justCompleted ? "animate-celebrate" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Drag handle - more prominent on hover */}
        <button
          {...attributes}
          {...listeners}
          className="drag-handle opacity-0 group-hover:opacity-100 rounded-md p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-subtle)] cursor-grab active:cursor-grabbing transition-all duration-150"
          aria-label="Drag task"
          type="button"
        >
          <GripVertical size={16} />
        </button>
        
        {/* Checkbox with animation */}
        <button
          onClick={handleToggleCompleteWithAnimation}
          className={`checkbox-btn relative flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 transition-all duration-200 ${
            task.isCompleted
              ? "border-[var(--color-success)] bg-[var(--color-success)] scale-100"
              : "border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-subtle)] hover:scale-110"
          }`}
        >
          {task.isCompleted && (
            <Check size={13} className="text-white animate-checkPop" strokeWidth={3} />
          )}
        </button>

        {/* Title - Editable */}
        {isEditingTitle ? (
          <input
            ref={titleInputRef}
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={handleTitleKeyDown}
            className="input flex-1 py-1 text-body font-medium"
          />
        ) : (
          <button
            onClick={onToggleExpand}
            className={`flex-1 text-left text-body transition-all duration-200 ${
              task.isCompleted
                ? "text-[var(--color-text-muted)] line-through decoration-[var(--color-text-muted)]/50"
                : "text-[var(--color-text-primary)] font-medium"
            }`}
          >
            {task.title}
          </button>
        )}

        {/* Action buttons - appear on hover */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          {/* Edit button */}
          {!isEditingTitle && (
            <button
              onClick={() => setIsEditingTitle(true)}
              className="rounded-md p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-subtle)] transition-colors"
              title="Edit title"
            >
              <Pencil size={14} />
            </button>
          )}

          {/* Archive button - only show for completed tasks */}
          {task.isCompleted && onArchive && (
            <button
              onClick={onArchive}
              className="rounded-md p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-subtle)] transition-colors"
              title="Archive task"
            >
              <Archive size={14} />
            </button>
          )}

          {/* Delete */}
          <button
            onClick={onDelete}
            className="rounded-md p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-urgent)] hover:bg-[var(--color-urgent-subtle)] transition-colors"
            title="Delete task"
          >
            <Trash2 size={14} />
          </button>
        </div>

        {/* Status Dropdown - more subtle */}
        <select
          value={task.status}
          onChange={handleStatusSelectChange}
          className="status-select rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-hover)] px-2 py-1.5 text-caption text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]/50 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all cursor-pointer"
        >
          {ALL_SECTIONS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Expanded Description with smooth animation */}
      {isExpanded && !isDragging && (
        <div className="mt-3 ml-10 animate-slideDown">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleDescriptionBlur}
            placeholder="Add notes or details..."
            className="w-full resize-none rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-hover)] px-3 py-2 text-body text-[var(--color-text-secondary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
            rows={2}
          />
        </div>
      )}
    </div>
  );
});

// Section accent colors for visual differentiation
const sectionAccentColors: Record<TaskStatus, string> = {
  today: 'var(--color-today)',
  tomorrow: 'var(--color-tomorrow)',
  this_week: 'var(--color-this-week)',
  next_week: 'var(--color-secondary)',
  backlog: 'var(--color-backlog)',
  long_term: 'var(--color-reminder)',
  archived: 'var(--color-text-muted)',
};

const TaskSection = memo(function TaskSection({
  section,
  sectionTasks,
  isCollapsed,
  expandedTask,
  activeId,
  onToggleSection,
  onToggleExpand,
  onToggleComplete,
  onDelete,
  onStatusChange,
  onDescriptionChange,
  onTitleChange,
  onArchive,
  isLongTerm,
}: TaskSectionProps) {
  const sectionDropId = getSectionDropId(section.id);
  const { isOver, setNodeRef } = useDroppable({ id: sectionDropId });

  const completedCount = useMemo(() => 
    sectionTasks.filter((t) => t.isCompleted).length,
    [sectionTasks]
  );

  const progressPercent = useMemo(() => 
    sectionTasks.length > 0 ? Math.round((completedCount / sectionTasks.length) * 100) : 0,
    [completedCount, sectionTasks.length]
  );

  const handleToggleSectionClick = useCallback(() => {
    onToggleSection(section.id);
  }, [onToggleSection, section.id]);

  // Check if any task is being dragged
  const isDragging = activeId !== null;
  const accentColor = sectionAccentColors[section.id];

  return (
    <div
      ref={setNodeRef}
      className={`section-card relative overflow-hidden rounded-xl border transition-all duration-300 ${
        isOver 
          ? "border-[var(--color-primary)] bg-[var(--color-primary-subtle)] shadow-lg scale-[1.01] ring-4 ring-[var(--color-primary)]/20" 
          : isDragging 
            ? "border-dashed border-[var(--color-primary)]/40 bg-[var(--color-bg-card)]" 
            : "border-[var(--color-border)] bg-[var(--color-bg-card)]"
      } ${isLongTerm ? "border-dashed" : ""}`}
    >
      {/* Accent bar */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-1 transition-all duration-300"
        style={{ 
          backgroundColor: accentColor,
          opacity: isOver ? 1 : 0.7,
          width: isOver ? '4px' : '3px',
        }}
      />
      
      <div className="p-4 pl-5">
        <button onClick={handleToggleSectionClick} className="flex w-full items-center gap-3 text-left group">
          <div className={`transition-transform duration-200 ${isCollapsed ? "" : "rotate-0"}`}>
            {isCollapsed ? (
              <ChevronRight size={18} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-text-primary)] transition-colors" />
            ) : (
              <ChevronDown size={18} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-text-primary)] transition-colors" />
            )}
          </div>
          <h2 className="text-heading text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)] transition-colors">
            {section.label}
          </h2>
          {isLongTerm && (
            <span className="text-caption text-[var(--color-text-muted)] italic hidden sm:inline">
              — important reminders
            </span>
          )}
          
          {/* Progress indicator */}
          <div className="ml-auto flex items-center gap-3">
            {sectionTasks.length > 0 && (
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-16 h-1.5 bg-[var(--color-bg-active)] rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{ 
                      width: `${progressPercent}%`,
                      backgroundColor: progressPercent === 100 ? 'var(--color-success)' : accentColor,
                    }}
                  />
                </div>
              </div>
            )}
            <span className="text-caption text-[var(--color-text-muted)] tabular-nums font-medium">
              {completedCount}/{sectionTasks.length}
            </span>
          </div>
        </button>

        {!isCollapsed && (
          <div className={`mt-4 space-y-2 transition-all duration-300 ${isOver ? "min-h-[80px]" : ""}`}>
            {sectionTasks.length === 0 ? (
              <div className={`flex items-center justify-center py-6 rounded-lg border-2 border-dashed transition-all duration-200 ${
                isOver 
                  ? "border-[var(--color-primary)] bg-[var(--color-primary-subtle)]/50" 
                  : "border-[var(--color-border-subtle)]"
              }`}>
                <p className={`text-body transition-colors ${
                  isOver 
                    ? "text-[var(--color-primary)] font-semibold" 
                    : "text-[var(--color-text-muted)]"
                }`}>
                  {isOver ? "✨ Drop here!" : isLongTerm ? "No long term items yet" : "No tasks yet"}
                </p>
              </div>
            ) : (
              sectionTasks.map((task, index) => (
                <MemoizedTaskItemWrapper
                  key={task._id}
                  task={task}
                  isExpanded={expandedTask === task._id}
                  onToggleExpand={onToggleExpand}
                  onToggleComplete={onToggleComplete}
                  onDelete={onDelete}
                  onStatusChange={onStatusChange}
                  onDescriptionChange={onDescriptionChange}
                  onTitleChange={onTitleChange}
                  onArchive={onArchive}
                  animationDelay={index * 30}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
});

// Wrapper to avoid creating new callbacks for each task
const MemoizedTaskItemWrapper = memo(function MemoizedTaskItemWrapper({
  task,
  isExpanded,
  onToggleExpand,
  onToggleComplete,
  onDelete,
  onStatusChange,
  onDescriptionChange,
  onTitleChange,
  onArchive,
  animationDelay = 0,
}: {
  task: Task;
  isExpanded: boolean;
  onToggleExpand: (taskId: string) => void;
  onToggleComplete: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onDescriptionChange: (taskId: string, description: string) => void;
  onTitleChange: (taskId: string, title: string) => void;
  onArchive: (taskId: string) => void;
  animationDelay?: number;
}) {
  const handleToggleExpand = useCallback(() => onToggleExpand(task._id), [onToggleExpand, task._id]);
  const handleToggleComplete = useCallback(() => onToggleComplete(task._id), [onToggleComplete, task._id]);
  const handleDelete = useCallback(() => onDelete(task._id), [onDelete, task._id]);
  const handleStatusChange = useCallback((status: TaskStatus) => onStatusChange(task._id, status), [onStatusChange, task._id]);
  const handleDescriptionChange = useCallback((desc: string) => onDescriptionChange(task._id, desc), [onDescriptionChange, task._id]);
  const handleTitleChange = useCallback((title: string) => onTitleChange(task._id, title), [onTitleChange, task._id]);
  const handleArchive = useCallback(() => onArchive(task._id), [onArchive, task._id]);

  return (
    <TaskItem
      task={task}
      isExpanded={isExpanded}
      onToggleExpand={handleToggleExpand}
      onToggleComplete={handleToggleComplete}
      onDelete={handleDelete}
      onStatusChange={handleStatusChange}
      onDescriptionChange={handleDescriptionChange}
      onTitleChange={handleTitleChange}
      onArchive={handleArchive}
      animationDelay={animationDelay}
    />
  );
});

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

const ArchivedSection = memo(function ArchivedSection({
  tasks,
  expandedTask,
  onToggleExpand,
  onToggleComplete,
  onDelete,
  onUnarchive,
  onDescriptionChange,
  onTitleChange,
}: ArchivedSectionProps) {
  const [unarchiveStatus, setUnarchiveStatus] = useState<Record<string, ActiveTaskStatus>>({});

  const handleUnarchiveStatusChange = useCallback((taskId: string, status: ActiveTaskStatus) => {
    setUnarchiveStatus((prev) => ({ ...prev, [taskId]: status }));
  }, []);

  if (tasks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/50 p-6 text-center">
        <Archive size={24} className="mx-auto text-[var(--color-text-muted)] mb-2 opacity-50" />
        <p className="text-body text-[var(--color-text-muted)]">No archived tasks</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/80 p-5">
      <h2 className="text-heading text-[var(--color-text-secondary)] mb-4 flex items-center gap-2">
        <Archive size={16} className="text-[var(--color-text-muted)]" />
        Archived Tasks
      </h2>
      <div className="space-y-2">
        {tasks.map((task, index) => (
          <MemoizedArchivedTaskItemWrapper
            key={task._id}
            task={task}
            isExpanded={expandedTask === task._id}
            onToggleExpand={onToggleExpand}
            onToggleComplete={onToggleComplete}
            onDelete={onDelete}
            unarchiveStatus={unarchiveStatus[task._id] || "backlog"}
            onUnarchiveStatusChange={handleUnarchiveStatusChange}
            onUnarchive={onUnarchive}
            onDescriptionChange={onDescriptionChange}
            onTitleChange={onTitleChange}
            animationDelay={index * 30}
          />
        ))}
      </div>
    </div>
  );
});

const MemoizedArchivedTaskItemWrapper = memo(function MemoizedArchivedTaskItemWrapper({
  task,
  isExpanded,
  onToggleExpand,
  onToggleComplete,
  onDelete,
  unarchiveStatus,
  onUnarchiveStatusChange,
  onUnarchive,
  onDescriptionChange,
  onTitleChange,
  animationDelay = 0,
}: {
  task: Task;
  isExpanded: boolean;
  onToggleExpand: (taskId: string) => void;
  onToggleComplete: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  unarchiveStatus: ActiveTaskStatus;
  onUnarchiveStatusChange: (taskId: string, status: ActiveTaskStatus) => void;
  onUnarchive: (taskId: string, status: ActiveTaskStatus) => void;
  onDescriptionChange: (taskId: string, description: string) => void;
  onTitleChange: (taskId: string, title: string) => void;
  animationDelay?: number;
}) {
  const handleToggleExpand = useCallback(() => onToggleExpand(task._id), [onToggleExpand, task._id]);
  const handleToggleComplete = useCallback(() => onToggleComplete(task._id), [onToggleComplete, task._id]);
  const handleDelete = useCallback(() => onDelete(task._id), [onDelete, task._id]);
  const handleUnarchiveStatusChange = useCallback((status: ActiveTaskStatus) => onUnarchiveStatusChange(task._id, status), [onUnarchiveStatusChange, task._id]);
  const handleUnarchive = useCallback(() => onUnarchive(task._id, unarchiveStatus), [onUnarchive, task._id, unarchiveStatus]);
  const handleDescriptionChange = useCallback((desc: string) => onDescriptionChange(task._id, desc), [onDescriptionChange, task._id]);
  const handleTitleChange = useCallback((title: string) => onTitleChange(task._id, title), [onTitleChange, task._id]);

  return (
    <ArchivedTaskItem
      task={task}
      isExpanded={isExpanded}
      onToggleExpand={handleToggleExpand}
      onToggleComplete={handleToggleComplete}
      onDelete={handleDelete}
      unarchiveStatus={unarchiveStatus}
      onUnarchiveStatusChange={handleUnarchiveStatusChange}
      onUnarchive={handleUnarchive}
      onDescriptionChange={handleDescriptionChange}
      onTitleChange={handleTitleChange}
      animationDelay={animationDelay}
    />
  );
});

const ArchivedTaskItem = memo(function ArchivedTaskItem({
  task,
  isExpanded,
  onToggleExpand,
  onToggleComplete,
  onDelete,
  unarchiveStatus,
  onUnarchiveStatusChange,
  onUnarchive,
  onDescriptionChange,
  onTitleChange,
  animationDelay = 0,
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
  onTitleChange: (title: string) => void;
  animationDelay?: number;
}) {
  const [description, setDescription] = useState(task.description || "");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  // Sync edited title with task title when it changes externally
  useEffect(() => {
    setEditedTitle(task.title);
  }, [task.title]);

  // Sync description when task changes
  useEffect(() => {
    setDescription(task.description || "");
  }, [task.description]);

  const handleDescriptionBlur = useCallback(() => {
    if (description !== (task.description || "")) {
      onDescriptionChange(description);
    }
  }, [description, task.description, onDescriptionChange]);

  const handleTitleSave = useCallback(() => {
    const trimmed = editedTitle.trim();
    if (trimmed && trimmed !== task.title) {
      onTitleChange(trimmed);
    } else {
      setEditedTitle(task.title);
    }
    setIsEditingTitle(false);
  }, [editedTitle, task.title, onTitleChange]);

  const handleTitleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTitleSave();
    } else if (e.key === "Escape") {
      setEditedTitle(task.title);
      setIsEditingTitle(false);
    }
  }, [handleTitleSave, task.title]);

  const handleUnarchiveStatusSelectChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onUnarchiveStatusChange(e.target.value as ActiveTaskStatus);
  }, [onUnarchiveStatusChange]);

  return (
    <div
      className={`group rounded-xl border p-3.5 transition-all duration-200 animate-fadeSlideIn ${
        task.isCompleted 
          ? "bg-[var(--color-bg-hover)]/50 border-[var(--color-border-subtle)] opacity-70" 
          : "bg-[var(--color-bg-card)] border-[var(--color-border)]"
      }`}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div className="flex items-center gap-3">
        {/* Checkbox */}
        <button
          onClick={onToggleComplete}
          className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 transition-all duration-200 ${
            task.isCompleted
              ? "border-[var(--color-success)] bg-[var(--color-success)]"
              : "border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-subtle)]"
          }`}
        >
          {task.isCompleted && <Check size={13} className="text-white" strokeWidth={3} />}
        </button>

        {/* Title - Editable */}
        {isEditingTitle ? (
          <input
            ref={titleInputRef}
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={handleTitleKeyDown}
            className="input flex-1 py-1 text-body"
          />
        ) : (
          <button
            onClick={onToggleExpand}
            className={`flex-1 text-left text-body transition-colors ${
              task.isCompleted
                ? "text-[var(--color-text-muted)] line-through decoration-[var(--color-text-muted)]/50"
                : "text-[var(--color-text-primary)]"
            }`}
          >
            {task.title}
          </button>
        )}

        {/* Action buttons - appear on hover */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          {/* Edit button */}
          {!isEditingTitle && (
            <button
              onClick={() => setIsEditingTitle(true)}
              className="rounded-md p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-subtle)] transition-colors"
              title="Edit title"
            >
              <Pencil size={14} />
            </button>
          )}

          {/* Delete */}
          <button
            onClick={onDelete}
            className="rounded-md p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-urgent)] hover:bg-[var(--color-urgent-subtle)] transition-colors"
            title="Delete task"
          >
            <Trash2 size={14} />
          </button>
        </div>

        {/* Restore dropdown */}
        <select
          value={unarchiveStatus}
          onChange={handleUnarchiveStatusSelectChange}
          className="status-select rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-hover)] px-2 py-1.5 text-caption text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]/50 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all cursor-pointer"
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
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-primary-subtle)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white transition-all duration-200 text-caption font-medium"
          title="Restore task"
        >
          <ArchiveRestore size={14} />
          <span className="hidden sm:inline">Restore</span>
        </button>
      </div>

      {/* Expanded Description */}
      {isExpanded && (
        <div className="mt-3 ml-8 animate-slideDown">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleDescriptionBlur}
            placeholder="Add notes or details..."
            className="w-full resize-none rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-hover)] px-3 py-2 text-body text-[var(--color-text-secondary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
            rows={2}
          />
        </div>
      )}
    </div>
  );
});

interface TaskItemProps {
  task: Task;
  isExpanded: boolean;
  isDraggedOver?: boolean;
  onToggleExpand: () => void;
  onToggleComplete: () => void;
  onDelete: () => void;
  onStatusChange: (status: TaskStatus) => void;
  onDescriptionChange: (description: string) => void;
  onTitleChange: (title: string) => void;
  onArchive?: () => void;
  animationDelay?: number;
}

interface TaskSectionProps {
  section: { id: TaskStatus; label: string };
  sectionTasks: Task[];
  isCollapsed: boolean;
  expandedTask: string | null;
  activeId: string | null;
  onToggleSection: (sectionId: TaskStatus) => void;
  onToggleExpand: (taskId: string) => void;
  onToggleComplete: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onDescriptionChange: (taskId: string, description: string) => void;
  onTitleChange: (taskId: string, title: string) => void;
  onArchive: (taskId: string) => void;
  isLongTerm?: boolean;
}

interface ArchivedSectionProps {
  tasks: Task[];
  expandedTask: string | null;
  onToggleExpand: (taskId: string) => void;
  onToggleComplete: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onUnarchive: (taskId: string, status: ActiveTaskStatus) => void;
  onDescriptionChange: (taskId: string, description: string) => void;
  onTitleChange: (taskId: string, title: string) => void;
}
