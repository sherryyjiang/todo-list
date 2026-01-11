import { NextRequest, NextResponse } from "next/server";
import { parseTaskWithAI } from "@/lib/ai/task-parser";
import { z } from "zod";

const RequestSchema = z.object({
  input: z.string().min(1),
  currentDate: z.string().optional(),
  categories: z
    .array(
      z.object({
        name: z.string(),
        type: z.enum(["work", "life"]),
      })
    )
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = RequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { input, currentDate, categories } = parsed.data;

    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY) {
      // Return a simple fallback parse without AI
      return NextResponse.json({
        title: input,
        scheduledDate: null,
        scheduledTime: null,
        estimatedMinutes: null,
        tags: [],
        category: null,
        suggestedCategoryName: null,
        _aiEnabled: false,
      });
    }

    const result = await parseTaskWithAI(input, {
      currentDate: currentDate ?? new Date().toISOString().split("T")[0],
      userCategories: categories ?? [],
    });

    return NextResponse.json({ ...result, _aiEnabled: true });
  } catch (error) {
    console.error("Parse task error:", error);
    return NextResponse.json(
      { error: "Failed to parse task" },
      { status: 500 }
    );
  }
}



