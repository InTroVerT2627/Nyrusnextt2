import "server-only";
import type { createSupabaseAdminClient } from "@/lib/supabase/server";

export type SimilarSubmission = { code: string; similarity: number };

function solutionDelta(code: string, starterCode: string) {
  const normalizeLine = (line: string) => line.replace(/\/\*.*?\*\//g, "").replace(/\/\/.*$/, "").replace(/\s+/g, "").toLowerCase();
  const starterLines = new Map<string, number>();
  for (const line of starterCode.split(/\r?\n/).map(normalizeLine).filter(Boolean)) starterLines.set(line, (starterLines.get(line) ?? 0) + 1);
  const changed: string[] = [];
  for (const line of code.split(/\r?\n/).map(normalizeLine).filter(Boolean)) {
    const remaining = starterLines.get(line) ?? 0;
    if (remaining > 0) starterLines.set(line, remaining - 1);
    else changed.push(line);
  }
  return changed.join(" ");
}

function codeShingles(code: string) {
  const tokens = code.match(/[a-z_$][\w$]*|\d+(?:\.\d+)?|===|!==|=>|==|!=|<=|>=|&&|\|\||[^\s]/gi) ?? [];
  if (tokens.length < 3) return new Set(tokens.length ? [tokens.join("").toLowerCase()] : []);
  const shingles = new Set<string>();
  for (let index = 0; index < tokens.length - 1; index++) shingles.add(`${tokens[index].toLowerCase()} ${tokens[index + 1].toLowerCase()}`);
  return shingles;
}

function codeSimilarity(left: string, right: string) {
  if (left === right) return 1;
  const a = codeShingles(left);
  const b = codeShingles(right);
  if (!a.size || !b.size) return 0;
  let shared = 0;
  for (const token of a) if (b.has(token)) shared++;
  return shared / (a.size + b.size - shared);
}

export async function findNearIdenticalSubmission(
  admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  taskVersionId: string,
  userId: string,
  code: string,
  starterCode: string,
): Promise<SimilarSubmission | null> {
  const submittedDelta = solutionDelta(code, starterCode);
  if (submittedDelta.length < 8) return null;
  const { data: peers, error } = await admin.from("attempts").select("user_id, code")
    .eq("task_version_id", taskVersionId).neq("user_id", userId).order("submitted_at", { ascending: false }).limit(100);
  if (error) return null;
  let best: SimilarSubmission | null = null;
  for (const peer of peers ?? []) {
    const peerDelta = solutionDelta(peer.code, starterCode);
    if (peerDelta.length < 8) continue;
    const similarity = codeSimilarity(submittedDelta, peerDelta);
    if (similarity >= 0.88 && (!best || similarity > best.similarity)) best = { code: peer.code, similarity };
  }
  return best;
}
