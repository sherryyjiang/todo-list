"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "./sidebar";

// Mock data for initial development - will be replaced with Convex queries
const MOCK_WORK_CATEGORIES = [
  { id: "1", name: "Meetings" },
  { id: "2", name: "Projects" },
  { id: "3", name: "Admin" },
];

const MOCK_LIFE_CATEGORIES = [
  { id: "4", name: "Health" },
  { id: "5", name: "Finance" },
  { id: "6", name: "Home" },
  { id: "7", name: "Personal" },
];

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [reminderCount] = useState(3); // Mock count
  const [isClient, setIsClient] = useState(false);

  // Hydration fix
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleAddCategory = (type: "work" | "life") => {
    // TODO: Open add category modal
    console.log("Add category:", type);
  };

  const handleOpenReminders = () => {
    // TODO: Open reminders panel/modal
    console.log("Open reminders");
  };

  const handleOpenWeeklyReview = () => {
    // TODO: Open weekly review modal
    console.log("Open weekly review");
  };

  if (!isClient) {
    return null; // Prevent hydration mismatch
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        reminderCount={reminderCount}
        workCategories={MOCK_WORK_CATEGORIES}
        lifeCategories={MOCK_LIFE_CATEGORIES}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        onAddCategory={handleAddCategory}
        onOpenReminders={handleOpenReminders}
        onOpenWeeklyReview={handleOpenWeeklyReview}
      />

      <main className="relative flex-1 overflow-hidden bg-[var(--color-bg-main)]">
        {/* Subtle background details */}
        <div className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-20">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[var(--color-primary)] blur-[120px] opacity-20" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[var(--color-secondary)] blur-[120px] opacity-20" />
        </div>

        <div className="relative h-full">
          {children}
        </div>
      </main>
    </div>
  );
}



