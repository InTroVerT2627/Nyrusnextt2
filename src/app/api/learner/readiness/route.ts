import { NextRequest, NextResponse } from "next/server";
import { apiError, requireActor } from "@/lib/server/api";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import {
  evaluateCandidateForRole,
  type RoleRequirement,
  type RequirementEvaluation,
} from "@/lib/server/requirement-matcher";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { response, actor } = await requireActor(request, ["learner"]);
  if (response || !actor) return response;

  const admin = createSupabaseAdminClient();
  if (!admin) return apiError("Server-side database access is not configured.", 503);

  // 1. Fetch all available seeded roles
  const { data: allRoles, error: rolesError } = await admin
    .from("roles")
    .select("id, slug, title, requirements_json")
    .eq("active", true);

  if (rolesError || !allRoles?.length) {
    return apiError("Role definitions could not be loaded.", 503);
  }

  // 2. Fetch learner's pinned targets
  const { data: targets } = await admin
    .from("learner_targets")
    .select("role_id")
    .eq("learner_id", actor.id);

  const pinnedRoleIds = new Set((targets ?? []).map((t) => t.role_id));

  // If learner has no pinned roles yet, default to Junior Data Analyst & Junior Java Developer
  const activeRoles = allRoles.filter((r) =>
    pinnedRoleIds.size > 0
      ? pinnedRoleIds.has(r.id)
      : r.slug === "junior-data-analyst" || r.slug === "junior-java-developer"
  );

  // 3. Fetch gap resources catalog
  const { data: gapResources } = await admin
    .from("gap_resources")
    .select("skill, language, from_level, to_level, resource_type, resource_id, title, path_url, rationale");

  const gapCatalog = gapResources ?? [];

  // 4. Evaluate each active role using the unified matcher
  const evaluatedRoles = await Promise.all(
    activeRoles.map(async (role) => {
      const requirements = ((role.requirements_json as { skills?: RoleRequirement[] })?.skills ?? []) as RoleRequirement[];
      const evalResult = await evaluateCandidateForRole(admin, actor.id, requirements);

      // Attach gap resources for any requirement not fully met
      const requirementsWithResources = evalResult.evaluations.map((reqEval) => {
        let matchingResource = null;
        if (reqEval.status !== "met") {
          const fromLevel = reqEval.actual_level || "insufficient";
          matchingResource = gapCatalog.find(
            (res) =>
              res.skill.toLowerCase() === reqEval.skill.toLowerCase() &&
              (res.from_level.toLowerCase() === fromLevel.toLowerCase() ||
                res.to_level.toLowerCase() === reqEval.minimum_level.toLowerCase())
          ) || gapCatalog.find((res) => res.skill.toLowerCase() === reqEval.skill.toLowerCase());
        }

        return {
          ...reqEval,
          gapResource: matchingResource
            ? {
                title: matchingResource.title,
                pathUrl: matchingResource.path_url,
                resourceType: matchingResource.resource_type,
                rationale: matchingResource.rationale,
              }
            : null,
        };
      });

      const summarySentence = `${evalResult.mustHavesMetCount} of ${evalResult.mustHavesTotalCount} must-haves met`;

      return {
        id: role.id,
        slug: role.slug,
        title: role.title,
        isPinned: pinnedRoleIds.has(role.id),
        summarySentence,
        allMet: evalResult.allMet,
        hasConsent: evalResult.hasConsent,
        requirements: requirementsWithResources,
      };
    })
  );

  return NextResponse.json({
    roles: evaluatedRoles,
    availableRoles: allRoles.map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      isPinned: pinnedRoleIds.has(r.id),
    })),
  });
}

export async function POST(request: NextRequest) {
  const { response, actor } = await requireActor(request, ["learner"]);
  if (response || !actor) return response;

  const admin = createSupabaseAdminClient();
  if (!admin) return apiError("Server-side database access is not configured.", 503);

  let body: { roleId?: string; roleSlug?: string; action: "pin" | "unpin" };
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid request body.", 400);
  }

  let roleId = body.roleId;
  if (!roleId && body.roleSlug) {
    const { data: role } = await admin.from("roles").select("id").eq("slug", body.roleSlug).maybeSingle();
    roleId = role?.id;
  }

  if (!roleId) return apiError("Role was not found.", 404);

  if (body.action === "pin") {
    await admin.from("learner_targets").upsert(
      { learner_id: actor.id, role_id: roleId },
      { onConflict: "learner_id,role_id" }
    );
  } else if (body.action === "unpin") {
    await admin
      .from("learner_targets")
      .delete()
      .eq("learner_id", actor.id)
      .eq("role_id", roleId);
  }

  return NextResponse.json({ success: true, action: body.action, roleId });
}
