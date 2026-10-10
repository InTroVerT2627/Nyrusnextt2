import { NextRequest, NextResponse } from "next/server";
import { apiError, requireActor } from "@/lib/server/api";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { response, actor } = await requireActor(request, ["learner", "recruiter", "reviewer"]);
  if (response || !actor) return response;
  const admin = createSupabaseAdminClient();
  if (!admin) return apiError("Server-side database access is not configured.", 503);
  const { data, error } = await admin.from("audit_log").select("id, ts, actor, action, attempt_id, task_version, rubric_version, bank_version, model_name, prompt_version, input_hash, output_json, flags").eq("actor", actor.id).order("ts", { ascending: false }).limit(200);
  if (error) return apiError("Could not load your audit events.", 503);
  return NextResponse.json({ events: data ?? [] }, { headers: { "cache-control": "private, no-store" } });
}
