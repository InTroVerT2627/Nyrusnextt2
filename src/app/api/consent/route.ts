import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { appendAudit, apiError, consumeRateLimit, requireActor } from "@/lib/server/api";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { deliverNxtMoveProfile } from "@/lib/server/nxtmove";

const schema = z.object({
  skill: z.enum(["debugging", "reviewing-ai-written-code", "data-analytics", "business-analytics", "workplace-communication"]),
  shared: z.boolean(),
  includeSubmissions: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  const { response, actor } = await requireActor(request, ["learner"]);
  if (response || !actor) return response;
  const admin = createSupabaseAdminClient();
  if (!admin) return apiError("Server-side database access is not configured.", 503);
  try { if (!await consumeRateLimit(actor.id, "consent-change", 30, 3600)) return apiError("You have reached the consent update limit.", 429); }
  catch { return apiError("Consent service is temporarily unavailable.", 503); }
  let body: z.infer<typeof schema>;
  try { body = schema.parse(await request.json()); }
  catch { return apiError("Choose a skill and whether to share its evidence."); }
  const now = new Date().toISOString();
  const { data: consent, error } = await admin.from("consents").upsert({
    user_id: actor.id, skill: body.skill, scope: body.includeSubmissions ? "full_evidence" : "evidence_and_scores", include_submissions: body.shared && body.includeSubmissions, shared: body.shared,
    granted_at: body.shared ? now : null, revoked_at: body.shared ? null : now, updated_at: now,
  }, { onConflict: "user_id,skill" }).select("shared, scope, granted_at, revoked_at").single();
  if (error || !consent) return apiError("Consent could not be saved.", 503);
  let handoff;
  try { handoff = await deliverNxtMoveProfile(actor.id, body.skill); }
  catch { handoff = { mode: "queued", delivered: false }; }
  await appendAudit({ actor: actor.id, action: body.shared ? "consent_granted" : "consent_revoked", flags: [], output: { skill: body.skill, shared: body.shared, include_submissions: body.includeSubmissions, handoff_mode: handoff.mode, handoff_delivered: handoff.delivered } });
  return NextResponse.json({ consent, handoff }, { headers: { "cache-control": "private, no-store" } });
}
