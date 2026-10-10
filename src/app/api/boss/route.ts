import { NextRequest, NextResponse } from "next/server";
import { apiError, requireActor } from "@/lib/server/api";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { evidencedDebuggingSlugs } from "@/lib/server/progression";

export async function GET(request: NextRequest) {
  const { response, actor } = await requireActor(request, ["learner"]);
  if (response || !actor) return response;
  const admin = createSupabaseAdminClient();
  if (!admin) return apiError("Server-side database access is not configured.", 503);
  let nodes: Set<string>;
  try { nodes = await evidencedDebuggingSlugs(admin, actor.id); }
  catch { return apiError("Could not evaluate skill progression.", 503); }
  const unlocked = nodes.size >= 3;
  if (!unlocked) return NextResponse.json({ unlocked, required: 3, evidenced: nodes.size });
  const { data: boss } = await admin.from("boss_rounds").select("id, version, language, title, flawed_code").eq("slug", "catch-the-ai-mistake").maybeSingle();
  if (!boss) return apiError("Boss round is not seeded.", 503);
  return NextResponse.json({ unlocked: true, required: 3, evidenced: nodes.size, boss: { id: boss.id, version: boss.version, language: boss.language, title: boss.title, flawedCode: boss.flawed_code } }, { headers: { "cache-control": "private, no-store" } });
}
