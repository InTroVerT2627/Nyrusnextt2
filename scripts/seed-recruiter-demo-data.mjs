import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const dotenv = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(
  dotenv.split('\n')
    .filter(l => l.includes('='))
    .map(l => {
      const idx = l.indexOf('=');
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    })
);

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function seedRecruiterData() {
  console.log('Seeding recruiter demo candidates and consented evidence...');

  // 1. Get or create Rohan Mehta
  const rohanEmail = 'rohan.mehta.learner@nextlearn.synthetic';
  const { data: users } = await admin.auth.admin.listUsers();
  let rohan = users.users.find(u => u.email === rohanEmail);
  if (!rohan) {
    const res = await admin.auth.admin.createUser({
      email: rohanEmail,
      password: 'DemoPassword2026!',
      email_confirm: true,
      user_metadata: { display_name: 'Rohan Mehta' }
    });
    if (res.error) throw res.error;
    rohan = res.data.user;
  }

  await admin.from('profiles').upsert({
    id: rohan.id,
    display_name: 'Rohan Mehta',
    role: 'learner',
    synthetic_candidate_id: 'cand_0981'
  });

  // Get Alex Morgan's user ID
  const alex = users.users.find(u => u.email === 'alex.morgan.learner@nextlearn.synthetic');
  if (!alex) throw new Error('Alex Morgan not found');

  // 2. Fetch Tasks and Versions
  const { data: tasks } = await admin.from('tasks').select('id, slug, language');
  const remDup = tasks.find(t => t.slug === 'remove-duplicates');
  const custKey = tasks.find(t => t.slug === 'customer-key');
  const sqlTask = tasks.find(t => t.slug === 'sql-cohort-revenue');

  const { data: versions } = await admin.from('task_versions').select('id, task_id');
  const remDupVer = versions.find(v => v.task_id === remDup.id);
  const custKeyVer = versions.find(v => v.task_id === custKey.id);
  const sqlVer = versions.find(v => v.task_id === sqlTask?.id);

  const { data: rubrics } = await admin.from('rubrics').select('id, task_id');
  const remDupRub = rubrics.find(r => r.task_id === remDup.id);
  const custKeyRub = rubrics.find(r => r.task_id === custKey.id);
  const sqlRub = rubrics.find(r => r.task_id === sqlTask?.id);

  // 3. Seed Java Attempts for Alex Morgan
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
  const twoWeeksAgo = new Date(now.getTime() - 14 * 86400000).toISOString();

  // Attempt A: remove-duplicates (Java)
  const { data: attA } = await admin.from('attempts').insert({
    user_id: alex.id,
    task_version_id: remDupVer.id,
    rubric_id: remDupRub.id,
    attempt_type: 'mission',
    code: `class Solution { static List<String> removeDuplicates(List<String> list) { return new ArrayList<>(new LinkedHashSet<>(list)); } }`,
    explanation_json: {
      report: {
        what_broke: "Elements skipped when mutating during loop",
        why_it_broke: "Indices shift left upon removal while loop counter advances",
        the_fix: "Use order-preserving LinkedHashSet collection",
        how_to_prevent: "Avoid in-place structural mutation during standard indexed traversal"
      }
    },
    ai_disclosure: false,
    submitted_at: twoWeeksAgo
  }).select('id').single();

  if (attA) {
    await admin.from('criterion_scores').insert([
      { attempt_id: attA.id, criterion: 'fix_correctness', score: 100, max_score: 100, source: 'test', confidence: 'high' },
      { attempt_id: attA.id, criterion: 'edge_cases', score: 100, max_score: 100, source: 'test', confidence: 'high' },
      { attempt_id: attA.id, criterion: 'root_cause', score: 3, max_score: 3, source: 'ai', confidence: 'high' },
      { attempt_id: attA.id, criterion: 'explanation', score: 2, max_score: 2, source: 'ai', confidence: 'high' }
    ]);
    await admin.from('evidence').upsert({
      attempt_id: attA.id,
      user_id: alex.id,
      skill: 'debugging',
      language: 'Java',
      level: 'proficient',
      confidence: 'high',
      assessed_at: twoWeeksAgo
    }, { onConflict: 'attempt_id' });
  }

  // Attempt B: customer-key (Java)
  const { data: attB } = await admin.from('attempts').insert({
    user_id: alex.id,
    task_version_id: custKeyVer.id,
    rubric_id: custKeyRub.id,
    attempt_type: 'mission',
    code: `class CustomerKey { private final String email; CustomerKey(String email) { this.email = email; } @Override public boolean equals(Object o) { if (this == o) return true; if (!(o instanceof CustomerKey)) return false; return email.equalsIgnoreCase(((CustomerKey)o).email); } @Override public int hashCode() { return email.toLowerCase().hashCode(); } }`,
    explanation_json: {
      report: {
        what_broke: "Cache misses despite equal customer identities",
        why_it_broke: "Overriding equals without hashCode violates general contract",
        the_fix: "Implement consistent case-insensitive hashCode matching equals",
        how_to_prevent: "Enforce value-object records or linter rules requiring equals and hashCode pair"
      }
    },
    ai_disclosure: false,
    submitted_at: weekAgo
  }).select('id').single();

  if (attB) {
    await admin.from('criterion_scores').insert([
      { attempt_id: attB.id, criterion: 'fix_correctness', score: 100, max_score: 100, source: 'test', confidence: 'high' },
      { attempt_id: attB.id, criterion: 'edge_cases', score: 100, max_score: 100, source: 'test', confidence: 'high' },
      { attempt_id: attB.id, criterion: 'root_cause', score: 3, max_score: 3, source: 'ai', confidence: 'high' },
      { attempt_id: attB.id, criterion: 'explanation', score: 2, max_score: 2, source: 'ai', confidence: 'high' }
    ]);
    await admin.from('evidence').upsert({
      attempt_id: attB.id,
      user_id: alex.id,
      skill: 'debugging',
      language: 'Java',
      level: 'proficient',
      confidence: 'high',
      assessed_at: weekAgo
    }, { onConflict: 'attempt_id' });
  }

  // 4. Grant Consent for Alex Morgan (debugging: shared=true, include_submissions=true)
  await admin.from('consents').upsert({
    user_id: alex.id,
    skill: 'debugging',
    scope: 'evidence_and_scores',
    shared: true,
    include_submissions: true,
    granted_at: new Date().toISOString(),
    revoked_at: null,
    updated_at: new Date().toISOString()
  }, { onConflict: 'user_id,skill' });

  // 5. Seed SQL Data Analytics Evidence for Rohan Mehta
  if (sqlVer && sqlRub) {
    const { data: attSql } = await admin.from('attempts').insert({
      user_id: rohan.id,
      task_version_id: sqlVer.id,
      rubric_id: sqlRub.id,
      attempt_type: 'mission',
      code: `SELECT c.segment, ROUND(SUM(o.amount), 2) AS completed_revenue, COUNT(o.id) AS completed_orders, ROUND(AVG(o.amount), 2) AS avg_order_value FROM customers c JOIN orders o ON c.id = o.customer_id WHERE o.status = 'completed' AND o.order_date BETWEEN '2026-07-01' AND '2026-09-30' GROUP BY c.segment ORDER BY completed_revenue DESC;`,
      explanation_json: {
        report: {
          "Query findings summary": "Enterprise drove $32,500 with $10,833.33 AOV; SMB drove $4,800 across 6 orders.",
          "Operational implications": "Allocate dedicated enterprise sales engineers.",
          "Data caveats & limitations": "Pending and refunded orders were properly excluded.",
          "Next steps recommendation": "Monitor 60-day expansion."
        }
      },
      ai_disclosure: false,
      submitted_at: weekAgo
    }).select('id').single();

    if (attSql) {
      await admin.from('criterion_scores').insert([
        { attempt_id: attSql.id, criterion: 'query_correctness', score: 100, max_score: 100, source: 'test', confidence: 'high' },
        { attempt_id: attSql.id, criterion: 'metric_interpretation', score: 3, max_score: 3, source: 'ai', confidence: 'high' },
        { attempt_id: attSql.id, criterion: 'business_caveats', score: 2, max_score: 2, source: 'ai', confidence: 'high' }
      ]);
      await admin.from('evidence').upsert({
        attempt_id: attSql.id,
        user_id: rohan.id,
        skill: 'data-analytics',
        language: 'JavaScript',
        level: 'proficient',
        confidence: 'high',
        assessed_at: weekAgo
      }, { onConflict: 'attempt_id' });
    }

    // Grant Consent for Rohan Mehta (data-analytics: shared=true, include_submissions=true)
    await admin.from('consents').upsert({
      user_id: rohan.id,
      skill: 'data-analytics',
      scope: 'evidence_and_scores',
      shared: true,
      include_submissions: true,
      granted_at: new Date().toISOString(),
      revoked_at: null,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,skill' });
  }

  console.log('Recruiter demo candidates successfully seeded and consented!');
}

seedRecruiterData().catch(console.error);
