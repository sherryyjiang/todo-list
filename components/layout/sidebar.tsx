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
  LayoutGrid,
  Calendar,
  Layers,
} from "lucide-react";
import { useTheme } from "@/providers/theme-provider";
import { cn } from "@/lib/utils";

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
  count?: number;
}

function NavItem({ icon, label, active, onClick, count }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex w-full items-center justify-between rounded-xl px-3 py-2.5 transition-all duration-200",
        active
          ? "bg-[var(--color-primary)] text-white shadow-md shadow-[var(--color-primary)]/20"
          : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]"
      )}
    >
      <div className="flex items-center gap-3">
        <span className={cn("transition-transform duration-200 group-hover:scale-110", active ? "text-white" : "text-[var(--color-text-muted)]")}>
          {icon}
        </span>
        <span className="text-body font-medium">{label}</span>
      </div>
      {count !== undefined && count > 0 && (
        <span className={cn(
          "flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
          active ? "bg-white/20 text-white" : "bg-[var(--color-bg-active)] text-[var(--color-text-muted)]"
        )}>
          {count}
        </span>
      )}
    </button>
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [categoriesExpanded, setCategoriesExpanded] = useState(true);

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const allCategories = [...workCategories, ...lifeCategories];

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-8">
        <div className="grad-primary flex h-9 w-9 items-center justify-center rounded-xl shadow-lg ring-4 ring-[var(--color-primary-subtle)]">
          <Sun className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-title leading-none text-[var(--color-text-primary)]">TaskFlow</h1>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mt-1">Personal Assistant</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-2">
        <div className="space-y-1">
          <NavItem
            label="All Tasks"
            icon={<LayoutGrid className="h-5 w-5" />}
            active={selectedCategory === null}
            onClick={() => onSelectCategory(null)}
          />
          <NavItem
            label="Reminders"
            icon={<Bell className="h-5 w-5" />}
            onClick={onOpenReminders}
            count={reminderCount}
          />
          <NavItem
            label="Weekly Review"
            icon={<BarChart3 className="h-5 w-5" />}
            onClick={onOpenWeeklyReview}
          />
        </div>

        <div>
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-label">Categories</span>
            <button
              onClick={() => onAddCategory("work")}
              className="p-1 rounded-md hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-0.5">
            {allCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={cn(
                  "group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-body transition-all duration-200",
                  selectedCategory === cat.id
                    ? "bg-[var(--color-bg-active)] text-[var(--color-text-primary)]"
                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]"
                )}
              >
                <div className={cn(
                  "h-2 w-2 rounded-full transition-transform duration-200 group-hover:scale-125",
                  workCategories.some(wc => wc.id === cat.id) ? "bg-[var(--color-work)]" : "bg-[var(--color-life)]"
                )} />
                <span className="font-medium">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="mt-auto border-t border-[var(--color-border-subtle)] px-4 py-4 space-y-2">
        <button
          onClick={toggleTheme}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200 hover:bg-[var(--color-bg-hover)]"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-bg-active)] text-[var(--color-text-muted)]">
            {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </div>
          <span className="text-body font-medium text-[var(--color-text-secondary)]">
            {resolvedTheme === "dark" ? "Light Appearance" : "Dark Appearance"}
          </span>
        </button>

        <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200 hover:bg-[var(--color-bg-hover)]">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-bg-active)] text-[var(--color-text-muted)]">
            <Settings className="h-4 w-4" />
          </div>
          <span className="text-body font-medium text-[var(--color-text-secondary)]">Settings</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-40 rounded-xl glass p-2.5 shadow-lg lg:hidden"
      >
        <Menu className="h-5 w-5 text-[var(--color-text-primary)]" />
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full w-[280px] flex-shrink-0 flex-col grad-sidebar border-r border-[var(--color-border-subtle)] transition-transform duration-300 lg:relative lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {mobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            className="absolute right-4 top-4 rounded-lg p-2 transition-colors hover:bg-[var(--color-bg-hover)] lg:hidden"
          >
            <X className="h-5 w-5 text-[var(--color-text-muted)]" />
          </button>
        )}

        {sidebarContent}
      </aside>
    </>
  );
}

