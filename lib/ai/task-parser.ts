/**
 * AI Task Parser
 * 
 * Uses Gemini to parse natural language task input into structured data.
 */

import { parseJSON } from "./llm-client";

export interface ParsedTaskResult {
  title: string;
  scheduledDate: string | null;
  scheduledTime: string | null;
  estimatedMinutes: number | null;
  tags: string[];
  category: "work" | "life" | null;
  suggestedCategoryName: string | null;
}

interface ParserContext {
  currentDate: string;
  userCategories: { name: string; type: "work" | "life" }[];
}

const SYSTEM_PROMPT = `You are a task parsing assistant. Given natural language input, extract structured task data.

Rules:
1. Extract the core task title, removing date/time/duration modifiers
2. Parse relative dates ("today", "tomorrow", "next Monday") to ISO format (YYYY-MM-DD)
3. Parse times to 24-hour format (HH:mm)
4. Convert duration expressions to minutes ("1 hour" = 60, "30 mins" = 30, "1.5h" = 90)
5. Extract hashtags as tags (without the # symbol)
6. Infer work/life category from context keywords
7. If a category name matches the user's existing categories, suggest it

Return a JSON object with these fields:
- title: string (the cleaned task title)
- scheduledDate: string | null (ISO date YYYY-MM-DD)
- scheduledTime: string | null (HH:mm format)
- estimatedMinutes: number | null
- tags: string[] (without # symbols)
- category: "work" | "life" | null
- suggestedCategoryName: string | null`;

export async function parseTaskWithAI(
  input: string,
  context: ParserContext
): Promise<ParsedTaskResult> {
  const userPrompt = `Today's date: ${context.currentDate}
User's categories: ${context.userCategories.map((c) => `${c.name} (${c.type})`).join(", ")}

Parse this task input:
"${input}"`;

  try {
    const result = await parseJSON<ParsedTaskResult>(userPrompt, SYSTEM_PROMPT, {
      temperature: 0.1,
    });

    return result;
  } catch (error) {
    console.error("AI parsing failed, falling back to basic parsing:", error);
    
    // Return a basic parsed result
    return {
      title: input,
      scheduledDate: null,
      scheduledTime: null,
      estimatedMinutes: null,
      tags: [],
      category: null,
      suggestedCategoryName: null,
    };
  }
}



