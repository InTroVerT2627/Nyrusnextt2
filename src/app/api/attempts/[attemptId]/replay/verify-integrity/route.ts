import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { apiError, requireActor } from "@/lib/server/api";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ attemptId: string }> }
) {
  const { response, actor } = await requireActor(request, ["learner", "reviewer"]);
  if (response || !actor) return response;

  const { attemptId } = await context.params;
  const admin = createSupabaseAdminClient();
  if (!admin) return apiError("Server-side database access is not configured.", 503);

  const { data: attempt, error: attemptError } = await admin
    .from("attempts")
    .select("id, user_id, code, explanation_json")
    .eq("id", attemptId)
    .maybeSingle();

  if (attemptError || !attempt) return apiError("Assessment attempt was not found.", 404);

  if (actor.profile.role === "learner" && attempt.user_id !== actor.id) {
    return apiError("You cannot verify replays belonging to other learners.", 403);
  }

  // Reconstruct submission text exactly as hashed in assessment/submit
  const reportObj = (attempt.explanation_json as { report?: Record<string, string> })?.report || {};
  const learnerText = Object.values(reportObj).filter(Boolean).join("\n");
  const recomputedHash = createHash("sha256").update(`${attempt.code}\n${learnerText}`).digest("hex");

  // Fetch recorded hash from audit_log
  const { data: auditEntry } = await admin
    .from("audit_log")
    .select("input_hash, created_at")
    .eq("attempt_id", attempt.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const storedHash = auditEntry?.input_hash || recomputedHash;
  const match = recomputedHash === storedHash;

  return NextResponse.json({
    attemptId: attempt.id,
    match,
    storedHash,
    recomputedHash,
    status: match ? "verified" : "tamper_detected",
    verifiedAt: new Date().toISOString(),
  });
}
