"use client";

import { useState } from "react";
import {
  Briefcase,
  Heart,
  Bell,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  Plus,
  Sun,
  Moon,
  Menu,
  X,
} from "lucide-react";
import { useTheme } from "@/providers/theme-provider";
import { cn } from "@/lib/utils";

interface SidebarSectionProps {
  title: string;
  icon: React.ReactNode;
  colorDot: string;
  items: { id: string; name: string }[];
  isExpanded: boolean;
  onToggle: () => void;
  onAddItem: () => void;
  selectedItem: string | null;
  onSelectItem: (id: string | null) => void;
}

function SidebarSection({
  title,
  icon,
  colorDot,
  items,
  isExpanded,
  onToggle,
  onAddItem,
  selectedItem,
  onSelectItem,
}: SidebarSectionProps) {
  return (
    <div className="mb-2">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors hover:bg-[var(--color-bg-hover)]"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-[var(--color-text-muted)]" />
          ) : (
            <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />
          )}
          <span className="text-[var(--color-text-secondary)]">{icon}</span>
          <span className="text-heading text-[var(--color-text-primary)]">{title}</span>
        </div>
        <div className={cn("h-2 w-2 rounded-full", colorDot)} />
      </button>

      {isExpanded && (
        <div className="ml-4 mt-1 space-y-0.5 border-l border-[var(--color-border-subtle)] pl-4">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectItem(selectedItem === item.id ? null : item.id)}
              className={cn(
                "flex w-full items-center rounded-md px-3 py-1.5 text-body transition-colors",
                selectedItem === item.id
                  ? "bg-[var(--color-bg-active)] text-[var(--color-text-primary)]"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]"
              )}
            >
              {item.name}
            </button>
          ))}
          <button
            onClick={onAddItem}
            className="flex w-full items-center gap-1.5 rounded-md px-3 py-1.5 text-caption text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-secondary)]"
          >
            <Plus className="h-3 w-3" />
            Add category
          </button>
        </div>
      )}
    </div>
  );
}

interface SidebarProps {
  reminderCount: number;
  workCategories: { id: string; name: string }[];
  lifeCategories: { id: string; name: string }[];
  selectedCategory: string | null;
  onSelectCategory: (id: string | null) => void;
  onAddCategory: (type: "work" | "life") => void;
  onOpenReminders: () => void;
  onOpenWeeklyReview: () => void;
}

export function Sidebar({
  reminderCount,
  workCategories,
  lifeCategories,
  selectedCategory,
  onSelectCategory,
  onAddCategory,
  onOpenReminders,
  onOpenWeeklyReview,
}: SidebarProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [workExpanded, setWorkExpanded] = useState(true);
  const [lifeExpanded, setLifeExpanded] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary)]">
          <Sun className="h-4 w-4 text-white" />
        </div>
        <span className="text-title text-[var(--color-text-primary)]">TaskFlow</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        <SidebarSection
          title="Work"
          icon={<Briefcase className="h-4 w-4" />}
          colorDot="bg-[var(--color-work)]"
          items={workCategories}
          isExpanded={workExpanded}
          onToggle={() => setWorkExpanded(!workExpanded)}
          onAddItem={() => onAddCategory("work")}
          selectedItem={selectedCategory}
          onSelectItem={onSelectCategory}
        />

        <SidebarSection
          title="Life"
          icon={<Heart className="h-4 w-4" />}
          colorDot="bg-[var(--color-life)]"
          items={lifeCategories}
          isExpanded={lifeExpanded}
          onToggle={() => setLifeExpanded(!lifeExpanded)}
          onAddItem={() => onAddCategory("life")}
          selectedItem={selectedCategory}
          onSelectItem={onSelectCategory}
        />

        <div className="my-4 h-px bg-[var(--color-border-subtle)]" />

        {/* Reminders */}
        <button
          onClick={onOpenReminders}
          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors hover:bg-[var(--color-bg-hover)]"
        >
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-[var(--color-reminder)]" />
            <span className="text-body text-[var(--color-text-primary)]">Reminders for You</span>
          </div>
          {reminderCount > 0 && <span className="reminder-badge">{reminderCount}</span>}
        </button>

        {/* Weekly Review */}
        <button
          onClick={onOpenWeeklyReview}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors hover:bg-[var(--color-bg-hover)]"
        >
          <BarChart3 className="h-4 w-4 text-[var(--color-text-muted)]" />
          <span className="text-body text-[var(--color-text-primary)]">Weekly Review</span>
        </button>
      </nav>

      {/* Footer */}
      <div className="border-t border-[var(--color-border-subtle)] px-2 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors hover:bg-[var(--color-bg-hover)]"
          >
            {resolvedTheme === "dark" ? (
              <Sun className="h-4 w-4 text-[var(--color-text-muted)]" />
            ) : (
              <Moon className="h-4 w-4 text-[var(--color-text-muted)]" />
            )}
            <span className="text-caption text-[var(--color-text-secondary)]">
              {resolvedTheme === "dark" ? "Light" : "Dark"} mode
            </span>
          </button>

          <button className="rounded-lg p-2 transition-colors hover:bg-[var(--color-bg-hover)]">
            <Settings className="h-4 w-4 text-[var(--color-text-muted)]" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-40 rounded-lg bg-[var(--color-bg-card)] p-2 shadow-md lg:hidden"
      >
        <Menu className="h-5 w-5 text-[var(--color-text-primary)]" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full w-[260px] flex-shrink-0 flex-col bg-[var(--color-bg-sidebar)] transition-transform duration-300 lg:relative lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Mobile close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute right-3 top-4 rounded-lg p-1 transition-colors hover:bg-[var(--color-bg-hover)] lg:hidden"
        >
          <X className="h-5 w-5 text-[var(--color-text-muted)]" />
        </button>

        {sidebarContent}
      </aside>
    </>
  );
}

