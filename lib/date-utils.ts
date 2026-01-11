import {
  format,
  formatDistanceToNow,
  isToday,
  isTomorrow,
  isThisWeek,
  parseISO,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addDays,
  subDays,
} from "date-fns";

/**
 * Format a date for display
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;

  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  if (isThisWeek(d)) return format(d, "EEEE"); // Day name
  return format(d, "MMM d");
}

/**
 * Format a time string (HH:mm) for display
 */
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes);
  return format(date, "h:mm a");
}

/**
 * Format minutes as duration string
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

/**
 * Format duration in long form
 */
export function formatDurationLong(minutes: number): string {
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours} hour${hours !== 1 ? "s" : ""}`;
  return `${hours}h ${mins}m`;
}

/**
 * Get relative time (e.g., "2 days ago")
 */
export function getRelativeTime(date: string | Date | number): string {
  const d = typeof date === "string" ? parseISO(date) : new Date(date);
  return formatDistanceToNow(d, { addSuffix: true });
}

/**
 * Get date range for current week
 */
export function getCurrentWeekRange(): { start: Date; end: Date } {
  const now = new Date();
  return {
    start: startOfWeek(now, { weekStartsOn: 1 }), // Monday
    end: endOfWeek(now, { weekStartsOn: 1 }), // Sunday
  };
}

/**
 * Get date range for previous week
 */
export function getPreviousWeekRange(): { start: Date; end: Date } {
  const now = new Date();
  const lastWeek = subDays(now, 7);
  return {
    start: startOfWeek(lastWeek, { weekStartsOn: 1 }),
    end: endOfWeek(lastWeek, { weekStartsOn: 1 }),
  };
}

/**
 * Get all days in a week range
 */
export function getDaysInRange(start: Date, end: Date): Date[] {
  return eachDayOfInterval({ start, end });
}

/**
 * Format date range for display
 */
export function formatDateRange(start: Date, end: Date): string {
  const startStr = format(start, "MMM d");
  const endStr = format(end, "MMM d, yyyy");
  return `${startStr} - ${endStr}`;
}

/**
 * Get ISO date string for today
 */
export function getTodayISO(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Get ISO date string for tomorrow
 */
export function getTomorrowISO(): string {
  return addDays(new Date(), 1).toISOString().split("T")[0];
}

/**
 * Check which column a date belongs to
 */
export function getStatusForDate(dateStr: string): "today" | "tomorrow" | "this_week" | "backlog" {
  const date = parseISO(dateStr);
  if (isToday(date)) return "today";
  if (isTomorrow(date)) return "tomorrow";
  if (isThisWeek(date, { weekStartsOn: 1 })) return "this_week";
  return "backlog";
}



