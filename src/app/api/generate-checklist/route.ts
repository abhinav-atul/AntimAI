// ============================================================
// AntimAI — AI Checklist Generation API Route
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { cases, tasks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateOpenRouterCompletion } from "@/lib/openrouter";
import {
  CHECKLIST_SYSTEM_PROMPT,
  buildChecklistUserPrompt,
} from "@/lib/prompts";
import { ASSET_OPTIONS } from "@/lib/constants";
import { GeneratedTask } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { caseId } = await req.json();
    if (!caseId) {
      return NextResponse.json(
        { error: "caseId is required" },
        { status: 400 }
      );
    }

    // Fetch the case
    const [caseRecord] = await db
      .select()
      .from(cases)
      .where(eq(cases.id, caseId));

    if (!caseRecord) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    if (caseRecord.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Map asset codes to readable labels
    const assetLabels = (caseRecord.assetsJson as string[]).map((code) => {
      const option = ASSET_OPTIONS.find((o) => o.value === code);
      return option ? option.label : code;
    });

    // Call OpenRouter API
    const userPrompt = buildChecklistUserPrompt(
      caseRecord.deceasedName,
      caseRecord.deceasedDod,
      caseRecord.state,
      assetLabels
    );

    let parsedTasks: GeneratedTask[] = [];
    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        const responseText = await generateOpenRouterCompletion(
          CHECKLIST_SYSTEM_PROMPT,
          userPrompt,
          "openai/gpt-oss-120b:free"
        );

        // Try to parse JSON — handle potential markdown wrapping
        let jsonStr = responseText.trim();
        if (jsonStr.startsWith("```")) {
          jsonStr = jsonStr
            .replace(/^```(?:json)?\n?/, "")
            .replace(/\n?```$/, "");
        }

        parsedTasks = JSON.parse(jsonStr) as GeneratedTask[];
        break; // Success, exit retry loop
      } catch (parseError) {
        console.error(`Attempt ${attempts} failed:`, parseError);
        if (attempts >= maxAttempts) {
          return NextResponse.json(
            { error: "Failed to generate checklist — AI response was invalid" },
            { status: 500 }
          );
        }
      }
    }

    // Store tasks in database
    const taskValues = parsedTasks.map((task) => ({
      id: `${caseId}_${task.id}`,
      caseId,
      institution: task.institution,
      category: task.category,
      title: task.title,
      description: task.description,
      urgency: task.urgency,
      documentsRequiredJson: task.documents_required,
      officialPortalUrl: task.official_portal_url,
      estimatedDays: task.estimated_days,
      stateSpecificNote: task.state_specific_note,
      status: "pending" as const,
    }));

    if (taskValues.length > 0) {
      await db.insert(tasks).values(taskValues);
    }

    return NextResponse.json({
      success: true,
      taskCount: taskValues.length,
    });
  } catch (error) {
    console.error("Error generating checklist:", error);
    return NextResponse.json(
      { error: "Failed to generate checklist" },
      { status: 500 }
    );
  }
}
