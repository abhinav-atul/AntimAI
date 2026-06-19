// ============================================================
// AntimAI — Letter Generation API Route
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { tasks, cases } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { generateOpenRouterCompletion } from "@/lib/openrouter";
import { LETTER_SYSTEM_PROMPT, buildLetterUserPrompt } from "@/lib/prompts";
import { generateLetterPdf } from "@/lib/pdf";

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskId, caseId } = await req.json();
    if (!taskId || !caseId) {
      return NextResponse.json(
        { error: "taskId and caseId are required" },
        { status: 400 }
      );
    }

    // Fetch case and task
    const [caseRecord] = await db
      .select()
      .from(cases)
      .where(and(eq(cases.id, caseId), eq(cases.userId, userId)));

    if (!caseRecord) {
      return NextResponse.json(
        { error: "Case not found or unauthorized" },
        { status: 404 }
      );
    }

    const [task] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.caseId, caseId)));

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Call OpenRouter to generate letter text
    const userPrompt = buildLetterUserPrompt(
      task.institution,
      task.title,
      task.description,
      caseRecord.deceasedName,
      caseRecord.deceasedDod,
      caseRecord.state,
      caseRecord.heirsName,
      caseRecord.heirsRelationship,
      task.documentsRequiredJson as string[]
    );

    let letterText;
    try {
      letterText = await generateOpenRouterCompletion(
        LETTER_SYSTEM_PROMPT,
        userPrompt,
        "openai/gpt-oss-120b:free"
      );
    } catch (primaryError) {
      console.warn("OpenRouter API failed:", primaryError);
      return NextResponse.json(
        { error: "Failed to generate letter text via OpenRouter" },
        { status: 500 }
      );
    }

    if (!letterText) {
      return NextResponse.json(
        { error: "Failed to generate letter text" },
        { status: 500 }
      );
    }

    // Generate PDF
    const pdfBytes = await generateLetterPdf(
      letterText,
      task.institution,
      caseRecord.heirsName
    );

    // Return PDF as downloadable response
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="AntimAI_Letter_${task.institution.replace(/\s+/g, "_")}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating letter:", error);
    return NextResponse.json(
      { error: "Failed to generate letter" },
      { status: 500 }
    );
  }
}
