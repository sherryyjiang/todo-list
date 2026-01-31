"use client";

import type { ReactNode } from "react";
import type { Task } from "@/types";
import ImportantLists from "./ImportantLists";
import MemoryLinks from "./MemoryLinks";
import WeeklySummary from "./WeeklySummary";
import type { ViewMode } from "./ViewTabs";

interface MainContentProps {
  mode: ViewMode;
  tasksContent: ReactNode;
  tasks?: Task[];
}

export default function MainContent({ mode, tasksContent, tasks }: MainContentProps) {
  return (
    <main className="flex-1 overflow-hidden">
      {mode === "lists" ? (
        <div className="h-full overflow-auto">
          <div className="p-4">
            <ImportantLists />
          </div>
        </div>
      ) : mode === "links" ? (
        <div className="h-full overflow-auto">
          <div className="p-4">
            <MemoryLinks />
          </div>
        </div>
      ) : mode === "summary" ? (
        <WeeklySummary tasks={tasks} />
      ) : (
        tasksContent
      )}
    </main>
  );
}
