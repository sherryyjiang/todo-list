"use client";

import { useState, useCallback, useEffect } from "react";
import { Sparkles, Loader2, Check, X, Calendar, Clock, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { ParsedTask, TaskStatus } from "@/types";

interface AIInputBarProps {
  onCreateTask: (task: {
    title: string;
    scheduledDate?: string;
    scheduledTime?: string;
    estimatedMinutes?: number;
    tags: string[];
    status: TaskStatus;
  }) => void;
}

export function AIInputBar({ onCreateTask }: AIInputBarProps) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [parsedTask, setParsedTask] = useState<ParsedTask | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Debounced parsing
  useEffect(() => {
    if (!input.trim() || input.length < 5) {
      setParsedTask(null);
      setShowPreview(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        // For now, do simple client-side parsing
        // Will be replaced with Gemini API call
        const parsed = simpleParseTask(input);
        setParsedTask(parsed);
        setShowPreview(true);
      } catch (error) {
        console.error("Parse error:", error);
      } finally {
        setIsLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [input]);

  // Simple client-side parser (placeholder for Gemini)
  const simpleParseTask = (text: string): ParsedTask => {
    const lowerText = text.toLowerCase();
    
    // Extract tags (words starting with #)
    const tagMatches = text.match(/#\w+/g) ?? [];
    const tags = tagMatches.map((t) => t.slice(1));
    
    // Remove tags from title
    let title = text;
    for (const tag of tagMatches) {
      title = title.replace(tag, "").trim();
    }

    // Parse time estimates (e.g., "for 1 hour", "30 minutes", "2h")
    let estimatedMinutes: number | null = null;
    const timePatterns = [
      /for\s+(\d+)\s*h(?:our)?s?/i,
      /for\s+(\d+)\s*m(?:in(?:ute)?s?)?/i,
      /(\d+)\s*h(?:our)?s?\s+(\d+)\s*m/i,
      /(\d+)h/i,
      /(\d+)m(?:in)?/i,
    ];

    for (const pattern of timePatterns) {
      const match = title.match(pattern);
      if (match) {
        if (pattern.toString().includes("h") && pattern.toString().includes("m")) {
          estimatedMinutes = parseInt(match[1]) * 60 + parseInt(match[2]);
        } else if (pattern.toString().includes("hour") || pattern.toString().includes("h")) {
          estimatedMinutes = parseInt(match[1]) * 60;
        } else {
          estimatedMinutes = parseInt(match[1]);
        }
        title = title.replace(match[0], "").trim();
        break;
      }
    }

    // Parse dates
    let scheduledDate: string | null = null;
    const today = new Date();
    
    if (lowerText.includes("today")) {
      scheduledDate = today.toISOString().split("T")[0];
      title = title.replace(/today/i, "").trim();
    } else if (lowerText.includes("tomorrow")) {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      scheduledDate = tomorrow.toISOString().split("T")[0];
      title = title.replace(/tomorrow/i, "").trim();
    } else if (lowerText.includes("this week")) {
      scheduledDate = null; // Will use this_week status
      title = title.replace(/this week/i, "").trim();
    }

    // Parse time (e.g., "at 2pm", "at 14:00")
    let scheduledTime: string | null = null;
    const timeMatch = title.match(/(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      const period = timeMatch[3]?.toLowerCase();

      if (period === "pm" && hours < 12) hours += 12;
      if (period === "am" && hours === 12) hours = 0;

      scheduledTime = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
      title = title.replace(timeMatch[0], "").trim();
    }

    // Clean up title
    title = title
      .replace(/\s+/g, " ")
      .replace(/^[\s,.-]+|[\s,.-]+$/g, "")
      .trim();

    // Infer category from context
    const workKeywords = ["meeting", "client", "project", "work", "review", "code", "design"];
    const lifeKeywords = ["gym", "doctor", "grocery", "home", "personal", "family"];
    
    const isWork = workKeywords.some((k) => lowerText.includes(k));
    const isLife = lifeKeywords.some((k) => lowerText.includes(k));

    return {
      title: title || text,
      scheduledDate,
      scheduledTime,
      estimatedMinutes,
      tags,
      category: isWork ? "work" : isLife ? "life" : null,
      suggestedCategoryName: null,
    };
  };

  const determineStatus = (parsed: ParsedTask): TaskStatus => {
    if (parsed.scheduledDate) {
      const today = new Date().toISOString().split("T")[0];
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split("T")[0];

      if (parsed.scheduledDate === today) return "today";
      if (parsed.scheduledDate === tomorrowStr) return "tomorrow";
      return "this_week";
    }
    return "backlog";
  };

  const handleConfirm = () => {
    if (!parsedTask) return;

    const status = determineStatus(parsedTask);

    onCreateTask({
      title: parsedTask.title,
      scheduledDate: parsedTask.scheduledDate ?? undefined,
      scheduledTime: parsedTask.scheduledTime ?? undefined,
      estimatedMinutes: parsedTask.estimatedMinutes ?? undefined,
      tags: parsedTask.tags,
      status,
    });

    setInput("");
    setParsedTask(null);
    setShowPreview(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (parsedTask) {
        handleConfirm();
      }
    }
    if (e.key === "Escape") {
      setShowPreview(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours} hour${hours > 1 ? "s" : ""}`;
  };

  return (
    <div className="relative px-4 pt-4 lg:pt-6">
      {/* Input field */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-[var(--color-primary)]" />
          ) : (
            <Sparkles className="ai-indicator h-5 w-5 text-[var(--color-primary)]" />
          )}
        </div>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='Add task: "Review budget tomorrow at 2pm for 1 hour #finance"'
          className="input w-full py-3 pl-12 pr-4 text-body"
        />
      </div>

      {/* Preview card */}
      {showPreview && parsedTask && (
        <div className="absolute left-4 right-4 top-full z-10 mt-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4 shadow-lg">
          <div className="mb-3 flex items-start justify-between">
            <h3 className="text-heading text-[var(--color-text-primary)]">{parsedTask.title}</h3>
            <button
              onClick={() => setShowPreview(false)}
              className="rounded p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-2 text-body text-[var(--color-text-secondary)]">
            {parsedTask.scheduledDate && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[var(--color-text-muted)]" />
                <span>{formatDate(parsedTask.scheduledDate)}</span>
                {parsedTask.scheduledTime && <span>at {parsedTask.scheduledTime}</span>}
              </div>
            )}

            {parsedTask.estimatedMinutes && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[var(--color-text-muted)]" />
                <span>{formatTime(parsedTask.estimatedMinutes)}</span>
              </div>
            )}

            {parsedTask.tags.length > 0 && (
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-[var(--color-text-muted)]" />
                <div className="flex gap-1">
                  {parsedTask.tags.map((tag) => (
                    <span key={tag} className="tag">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {parsedTask.category && (
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "h-2 w-2 rounded-full",
                    parsedTask.category === "work"
                      ? "bg-[var(--color-work)]"
                      : "bg-[var(--color-life)]"
                  )}
                />
                <span className="capitalize">{parsedTask.category}</span>
              </div>
            )}
          </div>

          <div className="mt-4 flex gap-2">
            <button onClick={handleConfirm} className="btn btn-primary flex-1">
              <Check className="h-4 w-4" />
              Confirm
            </button>
            <button
              onClick={() => setShowPreview(false)}
              className="btn btn-secondary"
            >
              Edit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}



