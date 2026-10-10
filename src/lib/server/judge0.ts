import "server-only";

export type CodeLanguage = "Java" | "JavaScript";
export type JudgeResult = { stdout: string; stderr: string; compileOutput: string; exitCode: number | null; statusId: number; status: string };

function endpoint() {
  const base = process.env.JUDGE0_BASE_URL?.trim();
  if (!base) throw new Error("Code runner is not configured. Set JUDGE0_BASE_URL.");
  const url = new URL(base);
  if (url.protocol !== "https:" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") throw new Error("Code runner URL must use HTTPS.");
  return url.toString().replace(/\/$/, "");
}

function headers() {
  const token = process.env.JUDGE0_AUTH_TOKEN;
  return { "content-type": "application/json", ...(token ? { "X-Auth-Token": token } : {}) };
}

type LanguageInfo = { id: number; name: string };
let cachedLanguages: LanguageInfo[] | null = null;
async function languageId(language: CodeLanguage) {
  if (!cachedLanguages) {
    const response = await fetch(`${endpoint()}/languages`, { headers: headers(), signal: AbortSignal.timeout(5000), cache: "no-store" });
    if (!response.ok) throw new Error("Code runner could not list languages.");
    cachedLanguages = await response.json() as LanguageInfo[];
  }
  const matcher = language === "Java" ? /^Java \(OpenJDK/ : /^JavaScript \(Node\.js/;
  const selected = cachedLanguages.find((candidate) => matcher.test(candidate.name));
  if (!selected) throw new Error(`The configured code runner does not provide ${language}.`);
  return selected.id;
}

export async function executeSource(language: CodeLanguage, source: string, stdin: string): Promise<JudgeResult> {
  const base = endpoint();
  const language_id = await languageId(language);
  const create = await fetch(`${base}/submissions?base64_encoded=false&wait=false`, {
    method: "POST", headers: headers(), signal: AbortSignal.timeout(8000), cache: "no-store",
    body: JSON.stringify({
      source_code: source, language_id, stdin,
      cpu_time_limit: 2, cpu_extra_time: 1, wall_time_limit: 5, memory_limit: 131072,
      stack_limit: 16384, max_processes_and_or_threads: 10, max_file_size: 1024,
      enable_network: false, enable_per_process_and_thread_time_limit: true,
      enable_per_process_and_thread_memory_limit: true,
    }),
  });
  if (!create.ok) throw new Error(`Code runner rejected a submission (${create.status}).`);
  const created = await create.json() as { token?: string };
  if (!created.token) throw new Error("Code runner did not return a submission token.");

  for (let poll = 0; poll < 24; poll++) {
    if (poll > 0) await new Promise((resolve) => setTimeout(resolve, 500));
    const response = await fetch(`${base}/submissions/${encodeURIComponent(created.token)}?base64_encoded=false`, {
      headers: headers(), signal: AbortSignal.timeout(5000), cache: "no-store",
    });
    if (!response.ok) throw new Error(`Code runner could not read a result (${response.status}).`);
    const result = await response.json() as {
      stdout?: string | null; stderr?: string | null; compile_output?: string | null;
      exit_code?: number | null; status?: { id?: number; description?: string };
    };
    const statusId = result.status?.id ?? 0;
    if (statusId > 2) return {
      stdout: result.stdout ?? "", stderr: result.stderr ?? "", compileOutput: result.compile_output ?? "",
      exitCode: result.exit_code ?? null, statusId, status: result.status?.description ?? "Unknown",
    };
  }
  throw new Error("Code runner timed out while waiting for an isolated result.");
}

export function buildProgram(language: CodeLanguage, taskSlug: string, learnerCode: string) {
  if (language === "JavaScript") {
    const invoke = taskSlug === "find-max"
      ? "findMax(__input)"
      : "loadOrders(__callInput, async (id) => { if (id === 'fail') throw new Error('request failed'); await new Promise((resolve) => setTimeout(resolve, id === 'slow' ? 25 : 1)); return String(id).toUpperCase(); })";
    return `
const vm = require('node:vm');
const fs = require('node:fs');
(async () => {
  const __input = JSON.parse(fs.readFileSync(0, 'utf8'));
  const __callInput = __input && Object.prototype.hasOwnProperty.call(__input, '__nextlearn_input') ? __input.__nextlearn_input : __input;
  const __expectRejection = Boolean(__input && __input.__nextlearn_expect_rejection);
  const __sandbox = vm.createContext({});
  vm.runInContext(${JSON.stringify(learnerCode)}, __sandbox, { timeout: 1000 });
  __sandbox.__input = __callInput;
  if (__expectRejection) {
    try {
      await vm.runInContext(${JSON.stringify(invoke)}, __sandbox, { timeout: 2000 });
      process.stdout.write('__unexpected_resolution__');
    } catch {
      process.stdout.write('__expected_rejection__');
    }
  } else {
    const __actual = await vm.runInContext(${JSON.stringify(invoke)}, __sandbox, { timeout: 2000 });
    process.stdout.write(__actual === undefined ? '__undefined__' : JSON.stringify(__actual));
  }
})().catch(() => { process.stderr.write('TEST_EXECUTION_FAILED'); process.exitCode = 1; });
`;
  }

  if (taskSlug === "remove-duplicates") return `
import java.io.*;
import java.util.*;
${learnerCode}
public class Main {
  public static void main(String[] args) throws Exception {
    String line = new BufferedReader(new InputStreamReader(System.in)).readLine();
    List<String> values = line == null || line.equals("__EMPTY__") ? new ArrayList<>() : new ArrayList<>(Arrays.asList(line.split(",", -1)));
    List<String> result = Solution.removeDuplicates(values);
    System.out.print(String.join(",", result));
  }
}`;

  return `
import java.io.*;
import java.util.*;
${learnerCode}
public class Main {
  public static void main(String[] args) throws Exception {
    BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
    String first = reader.readLine(); String second = reader.readLine();
    CustomerKey a = new CustomerKey(first); CustomerKey b = new CustomerKey(second);
    Map<CustomerKey,String> map = new HashMap<>(); map.put(a, "found");
    boolean equality = a.equals(b); boolean hashContract = !equality || a.hashCode() == b.hashCode();
    boolean retrieval = "found".equals(map.get(b));
    System.out.print(equality + "," + hashContract + "," + retrieval);
  }
}`;
}

export async function runCase(language: CodeLanguage, taskSlug: string, learnerCode: string, input: unknown, expected: unknown) {
  let stdin: string;
  let normalizedExpected: string;
  if (taskSlug === "remove-duplicates") {
    const values = input as string[];
    const output = expected as string[];
    stdin = values.length ? values.join(",") : "__EMPTY__";
    normalizedExpected = output.join(",");
  } else if (taskSlug === "customer-key") {
    const value = input as { email_a: string; email_b: string };
    const expectation = expected as { equals: boolean; same_hash: boolean; retrieves: boolean };
    stdin = `${value.email_a}\n${value.email_b}`;
    normalizedExpected = `${expectation.equals},${expectation.same_hash},${expectation.retrieves}`;
  } else {
    const expectedRejection = Boolean(expected && typeof expected === "object" && "$expect_rejection" in expected);
    stdin = JSON.stringify(taskSlug === "async-results" && expectedRejection
      ? { __nextlearn_input: input, __nextlearn_expect_rejection: true }
      : input);
    normalizedExpected = expectedRejection ? "__expected_rejection__" : JSON.stringify(expected);
  }
  const result = await executeSource(language, buildProgram(language, taskSlug, learnerCode), stdin);
  const passed = result.statusId === 3 && result.exitCode === 0 && result.stdout.trim() === normalizedExpected;
  return { passed, status: result.status, statusId: result.statusId, compileError: result.statusId === 6 ? result.compileOutput.slice(0, 800) : undefined };
}
