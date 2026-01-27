"use client";

import type { ReactNode } from "react";
import ImportantLists from "./ImportantLists";
import type { ViewMode } from "./ViewTabs";

interface MainContentProps {
  mode: ViewMode;
  tasksContent: ReactNode;
}

export default function MainContent({ mode, tasksContent }: MainContentProps) {
  return (
    <main className="flex-1 overflow-hidden">
      {mode === "lists" ? (
        <div className="h-full overflow-auto">
          <div className="p-4">
            <ImportantLists />
          </div>
        </div>
      ) : (
        tasksContent
      )}
    </main>
  );
}
