import { NextRequest, NextResponse } from "next/server";
import { requireActor } from "@/lib/server/api";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { executeFairnessEvaluation, generateMarkdownReport } from "@/lib/server/fairness-engine";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { response, actor } = await requireActor(request, ["reviewer"]);
  if (response || !actor) return response;

  const admin = createSupabaseAdminClient();
  const summary = await executeFairnessEvaluation(admin, { forceLiveRefresh: false });
  const markdown = generateMarkdownReport(summary);

  return new NextResponse(markdown, {
    status: 200,
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "content-disposition": `attachment; filename="nextlearn-fairness-report-${new Date().toISOString().slice(0, 10)}.md"`,
    },
  });
}
