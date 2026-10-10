import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseAdminClient, getAuthenticatedUser } from "@/lib/supabase/server";

export type Actor = NonNullable<Awaited<ReturnType<typeof getAuthenticatedUser>>["user"]> & {
  profile: NonNullable<Awaited<ReturnType<typeof getAuthenticatedUser>>["profile"]>;
};

export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function requireActor(request: NextRequest, roles: string[] = ["learner"]) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return { response: apiError("Cross-origin request rejected.", 403), actor: null };
  const session = await getAuthenticatedUser();
  if (!session.client) return { response: apiError("Supabase is not configured. This route requires the remote backend.", 503), actor: null };
  if (!session.user || !session.profile) return { response: apiError("Sign in to continue.", 401), actor: null };
  if (!roles.includes(session.profile.role)) return { response: apiError("Your account cannot perform this action.", 403), actor: null };
  return { response: null, actor: { ...session.user, profile: session.profile } as Actor };
}

export async function consumeRateLimit(userId: string, bucket: string, limit: number, windowSeconds: number) {
  const admin = createSupabaseAdminClient();
  if (!admin) return false;
  const { data, error } = await admin.rpc("consume_api_rate_limit", {
    p_user_id: userId, p_bucket: bucket, p_limit: limit, p_window_seconds: windowSeconds,
  });
  if (error) throw new Error("Rate limiter unavailable.");
  return data === true;
}

export async function appendAudit(input: {
  actor: string; action: string; attemptId?: string | null; taskVersion?: number | null;
  rubricVersion?: number | null; bankVersion?: number | null; modelName?: string | null;
  promptVersion?: string | null; inputHash?: string | null; output?: Record<string, unknown>;
  flags?: string[];
}) {
  const admin = createSupabaseAdminClient();
  if (!admin) throw new Error("Audit storage is not configured.");
  const { error } = await admin.from("audit_log").insert({
    actor: input.actor, action: input.action, attempt_id: input.attemptId ?? null,
    task_version: input.taskVersion ?? null, rubric_version: input.rubricVersion ?? null,
    bank_version: input.bankVersion ?? null, model_name: input.modelName ?? null,
    prompt_version: input.promptVersion ?? null, input_hash: input.inputHash ?? null,
    output_json: input.output ?? {}, flags: input.flags ?? [],
  });
  if (error) throw new Error("Could not write the audit record.");
}
