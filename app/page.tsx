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
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
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
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

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

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="min-h-screen bg-[var(--color-bg-main)] p-4 md:p-8">
        <div className="mx-auto max-w-4xl flex gap-6">
          {/* Sidebar with Category Tabs */}
          <div className="w-48 flex-shrink-0">
            <h1 className="text-display mb-6 text-[var(--color-text-primary)]">Todo List</h1>
            <nav className="space-y-1">
              {CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                    selectedCategory === category.id
                      ? "bg-[var(--color-primary)] text-white font-medium shadow-md"
                      : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]"
                  }`}
                >
                  <span className="text-lg">{category.icon}</span>
                  <span className="text-body">{category.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Add Task Form */}
            <form onSubmit={handleAddTask} className="mb-8">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder={`Add a new ${selectedCategory === "coding" ? "coding " : ""}task...`}
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
              {SECTIONS.map((section) => (
                <TaskSection
                  key={section.id}
                  section={section}
                  sectionTasks={tasksBySection[section.id]}
                  isCollapsed={collapsedSections.has(section.id)}
                  expandedTask={expandedTask}
                  activeId={activeId}
                  onToggleSection={toggleSection}
                  onToggleExpand={handleToggleExpand}
                  onToggleComplete={handleToggleComplete}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                  onDescriptionChange={handleDescriptionChange}
                  onTitleChange={handleTitleChange}
                  onArchive={handleArchive}
                />
              ))}
            </div>

            {/* Long Term Section */}
            <div className="mt-8">
              <TaskSection
                section={LONG_TERM_SECTION}
                sectionTasks={tasksBySection.long_term}
                isCollapsed={collapsedSections.has("long_term")}
                expandedTask={expandedTask}
                activeId={activeId}
                onToggleSection={toggleSection}
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

            {/* Archived Section Toggle */}
            <div className="mt-8 border-t border-[var(--color-border)] pt-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowArchived(!showArchived)}
                  className="flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  <Archive size={18} />
                  <span className="text-body">
                    {showArchived ? "Hide Archived" : "Show Archived"}
                  </span>
                  <span className="text-caption">
                    ({tasksBySection.archived.length})
                  </span>
                </button>

                {completedNotArchivedCount > 0 && (
                  <button
                    onClick={handleArchiveAllCompleted}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-active)] transition-colors text-body"
                  >
                    <Archive size={16} />
                    Archive All Done ({completedNotArchivedCount})
                  </button>
                )}
              </div>

              {showArchived && (
                <div className="mt-4">
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
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Drag Overlay - renders floating preview */}
      <DragOverlay dropAnimation={{
        duration: 200,
        easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
      }}>
        {activeTask ? (
          <DragPreview task={activeTask} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

// Floating drag preview component
const DragPreview = memo(function DragPreview({ task }: { task: Task }) {
  return (
    <div
      className="rounded-lg border-2 border-[var(--color-primary)] bg-[var(--color-bg-card)] p-3 shadow-lg"
      style={{
        boxShadow: '0 20px 40px rgba(0,0,0,0.15), 0 0 0 2px var(--color-primary)',
        transform: 'rotate(2deg) scale(1.02)',
        width: '100%',
        maxWidth: '500px',
      }}
    >
      <div className="flex items-center gap-3">
        <div className="text-[var(--color-primary)]">
          <GripVertical size={16} />
        </div>
        <div
          className={`flex h-5 w-5 items-center justify-center rounded border ${
            task.isCompleted
              ? "border-[var(--color-success)] bg-[var(--color-success)]"
              : "border-[var(--color-border)]"
          }`}
        >
          {task.isCompleted && <Check size={14} className="text-white" />}
        </div>
        <span
          className={`flex-1 text-body font-medium ${
            task.isCompleted
              ? "text-[var(--color-text-muted)] line-through"
              : "text-[var(--color-text-primary)]"
          }`}
        >
          {task.title}
        </span>
      </div>
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
}: TaskItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task._id,
  });
  const style = useMemo(() => ({
    transform: CSS.Transform.toString(transform),
  }), [transform]);
  
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

  const handleStatusSelectChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onStatusChange(e.target.value as TaskStatus);
  }, [onStatusChange]);

  // When dragging, show a ghost placeholder
  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="rounded-lg border-2 border-dashed border-[var(--color-primary)]/40 bg-[var(--color-primary-subtle)] p-3 opacity-50"
      >
        <div className="flex items-center gap-3">
          <div className="w-6" />
          <div className="h-5 w-5 rounded border border-[var(--color-border)]/30" />
          <span className="flex-1 text-body text-[var(--color-text-muted)]">{task.title}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border border-[var(--color-border)] p-3 transition-shadow duration-150 hover:shadow-md ${
        task.isCompleted ? "bg-[var(--color-bg-hover)] opacity-60" : "bg-[var(--color-bg-card)]"
      } ${isDraggedOver ? "ring-2 ring-[var(--color-primary)]/30" : ""}`}
    >
      <div className="flex items-center gap-3">
        <button
          {...attributes}
          {...listeners}
          className="btn-ghost rounded p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-grab active:cursor-grabbing"
          aria-label="Drag task"
          type="button"
        >
          <GripVertical size={16} />
        </button>
        {/* Checkbox */}
        <button
          onClick={onToggleComplete}
          className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
            task.isCompleted
              ? "border-[var(--color-success)] bg-[var(--color-success)]"
              : "border-[var(--color-border)] hover:border-[var(--color-primary)]"
          }`}
        >
          {task.isCompleted && <Check size={14} className="text-white" />}
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
            className="input flex-1 py-0 text-body"
          />
        ) : (
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
        )}

        {/* Edit button */}
        {!isEditingTitle && (
          <button
            onClick={() => setIsEditingTitle(true)}
            className="btn-ghost rounded p-1 text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
            title="Edit title"
          >
            <Pencil size={16} />
          </button>
        )}

        {/* Status Dropdown */}
        <select
          value={task.status}
          onChange={handleStatusSelectChange}
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
      {isExpanded && !isDragging && (
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
});

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

  const handleToggleSectionClick = useCallback(() => {
    onToggleSection(section.id);
  }, [onToggleSection, section.id]);

  // Check if any task is being dragged
  const isDragging = activeId !== null;

  return (
    <div
      ref={setNodeRef}
      className={`card p-4 transition-all duration-200 ${
        isOver 
          ? "ring-2 ring-[var(--color-primary)] bg-[var(--color-primary-subtle)] shadow-lg scale-[1.01]" 
          : isDragging 
            ? "ring-1 ring-[var(--color-border)] ring-dashed" 
            : ""
      } ${isLongTerm ? "border-dashed border-[var(--color-border)]" : ""}`}
    >
      <button onClick={handleToggleSectionClick} className="flex w-full items-center gap-2 text-left">
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
        <div className={`mt-4 space-y-2 transition-all duration-200 ${isOver ? "min-h-[60px]" : ""}`}>
          {sectionTasks.length === 0 ? (
            <p className={`text-body py-2 transition-colors ${
              isOver 
                ? "text-[var(--color-primary)] font-medium" 
                : "text-[var(--color-text-muted)]"
            }`}>
              {isOver ? "Drop here!" : isLongTerm ? "No long term items" : "No tasks"}
            </p>
          ) : (
            sectionTasks.map((task) => (
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
              />
            ))
          )}
        </div>
      )}
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
      className={`rounded-lg border border-[var(--color-border)] p-3 transition-colors ${
        task.isCompleted ? "bg-[var(--color-bg-hover)] opacity-60" : "bg-[var(--color-bg-card)]"
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Checkbox */}
        <button
          onClick={onToggleComplete}
          className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
            task.isCompleted
              ? "border-[var(--color-success)] bg-[var(--color-success)]"
              : "border-[var(--color-border)] hover:border-[var(--color-primary)]"
          }`}
        >
          {task.isCompleted && <Check size={14} className="text-white" />}
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
            className="input flex-1 py-0 text-body"
          />
        ) : (
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
        )}

        {/* Edit button */}
        {!isEditingTitle && (
          <button
            onClick={() => setIsEditingTitle(true)}
            className="btn-ghost rounded p-1 text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
            title="Edit title"
          >
            <Pencil size={16} />
          </button>
        )}

        {/* Restore dropdown */}
        <select
          value={unarchiveStatus}
          onChange={handleUnarchiveStatusSelectChange}
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
