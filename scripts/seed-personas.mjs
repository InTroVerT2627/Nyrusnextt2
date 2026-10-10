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

export const DEMO_PERSONAS = [
  {
    email: 'alex.morgan.learner@nextlearn.synthetic',
    password: 'DemoPassword2026!',
    displayName: 'Alex Morgan',
    role: 'learner',
    candidateId: 'cand_0142'
  },
  {
    email: 'priya.sharma.recruiter@nextlearn.synthetic',
    password: 'DemoPassword2026!',
    displayName: 'Priya Sharma',
    role: 'recruiter',
    candidateId: 'rec_priya'
  },
  {
    email: 'sarah.chen.reviewer@nextlearn.synthetic',
    password: 'DemoPassword2026!',
    displayName: 'Dr. Sarah Chen',
    role: 'reviewer',
    candidateId: 'rev_sarah'
  }
];

async function seedPersonas() {
  console.log('Seeding synthetic demo personas in Supabase...');
  const { data: existing, error: listError } = await admin.auth.admin.listUsers();
  if (listError) {
    console.error('Failed to list users:', listError.message);
    return;
  }
  const existingMap = new Map((existing?.users || []).map(u => [u.email, u]));

  for (const persona of DEMO_PERSONAS) {
    let user = existingMap.get(persona.email);
    if (!user) {
      console.log(`Creating user: ${persona.email}`);
      const res = await admin.auth.admin.createUser({
        email: persona.email,
        password: persona.password,
        email_confirm: true,
        user_metadata: { display_name: persona.displayName }
      });
      if (res.error) {
        console.error(`Error creating ${persona.email}:`, res.error.message);
        continue;
      }
      user = res.data.user;
    }

    if (user) {
      const { error: pError } = await admin.from('profiles').upsert({
        id: user.id,
        display_name: persona.displayName,
        role: persona.role,
        synthetic_candidate_id: persona.candidateId
      });
      console.log(`Synced profile for ${persona.displayName} (${persona.role}):`, pError ? pError.message : 'OK');
    }
  }

  const { data: allProfiles } = await admin.from('profiles').select('*');
  console.log('All profiles in database:');
  console.dir(allProfiles, { depth: null });
}

seedPersonas().catch(err => {
  console.error(err);
  process.exit(1);
});
