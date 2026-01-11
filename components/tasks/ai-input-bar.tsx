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
    <div className="relative w-full max-w-3xl mx-auto px-4 pb-6">
      {/* Preview card */}
      {showPreview && parsedTask && (
        <div className="absolute left-4 right-4 bottom-full z-20 mb-4 rounded-2xl glass p-5 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h3 className="text-heading font-bold text-[var(--color-text-primary)]">{parsedTask.title}</h3>
              <p className="text-caption text-[var(--color-text-muted)] mt-0.5">Ready to schedule</p>
            </div>
            <button
              onClick={() => setShowPreview(false)}
              className="rounded-full p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 text-body text-[var(--color-text-secondary)]">
            {parsedTask.scheduledDate && (
              <div className="flex items-center gap-2.5 bg-white/40 dark:bg-black/20 rounded-xl px-3 py-2">
                <Calendar className="h-4 w-4 text-[var(--color-primary)]" />
                <span className="font-medium">{formatDate(parsedTask.scheduledDate)}</span>
                {parsedTask.scheduledTime && <span className="text-[var(--color-text-muted)]">at {parsedTask.scheduledTime}</span>}
              </div>
            )}

            {parsedTask.estimatedMinutes && (
              <div className="flex items-center gap-2.5 bg-white/40 dark:bg-black/20 rounded-xl px-3 py-2">
                <Clock className="h-4 w-4 text-[var(--color-secondary)]" />
                <span className="font-medium">{formatTime(parsedTask.estimatedMinutes)}</span>
              </div>
            )}

            {parsedTask.tags.length > 0 && (
              <div className="flex items-center gap-2.5 bg-white/40 dark:bg-black/20 rounded-xl px-3 py-2 col-span-2">
                <Tag className="h-4 w-4 text-[var(--color-text-muted)]" />
                <div className="flex flex-wrap gap-1.5">
                  {parsedTask.tags.map((tag) => (
                    <span key={tag} className="tag tag-work text-[10px] py-0.5">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 flex gap-3">
            <button onClick={handleConfirm} className="btn grad-primary flex-1 shadow-lg shadow-[var(--color-primary)]/20 py-2.5">
              <Check className="h-4 w-4" />
              Confirm Task
            </button>
            <button
              onClick={() => setShowPreview(false)}
              className="btn btn-secondary py-2.5"
            >
              Edit
            </button>
          </div>
        </div>
      )}

      {/* Input field */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] rounded-2xl opacity-20 blur group-focus-within:opacity-40 transition duration-500"></div>
        <div className="relative glass rounded-2xl shadow-xl overflow-hidden">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-5">
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
            className="w-full bg-transparent border-none py-4 pl-14 pr-6 text-body focus:ring-0 placeholder:text-[var(--color-text-muted)]"
          />
        </div>
      </div>
    </div>
  );
}



