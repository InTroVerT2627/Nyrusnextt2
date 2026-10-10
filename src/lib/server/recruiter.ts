import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { evaluateCandidateForRole, type RoleRequirement } from "./requirement-matcher";

export type { RoleRequirement } from "./requirement-matcher";

export async function candidateMeetsRole(
  admin: SupabaseClient,
  candidateId: string,
  requirement: RoleRequirement
): Promise<boolean> {
  const result = await evaluateCandidateForRole(admin, candidateId, [requirement]);
  return result.hasConsent && result.allMet;
}
