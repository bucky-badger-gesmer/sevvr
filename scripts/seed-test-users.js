require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://jgtzolsriegovsobluek.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TEST_USERS = [
  { email: 'alice.sevvrtest1@gmail.com', password: 'testpass123', username: 'alice_test' },
  { email: 'bob.sevvrtest2@gmail.com', password: 'testpass123', username: 'bob_test' },
  { email: 'charlie.sevvrtest3@gmail.com', password: 'testpass123', username: 'charlie_test' },
  { email: 'diana.sevvrtest4@gmail.com', password: 'testpass123', username: 'diana_test' },
  { email: 'eve.sevvrtest5@gmail.com', password: 'testpass123', username: 'eve_test' },
];

async function seedUsers() {
  console.log('Ensuring test users exist...\n');

  const users = [];

  for (const user of TEST_USERS) {
    // Check profiles table — service role bypasses RLS
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', user.username)
      .maybeSingle();

    if (profile) {
      console.log(`  ~ ${user.username} already exists (${profile.id})`);
      users.push({ ...user, id: profile.id });
      continue;
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { username: user.username },
    });

    if (error) {
      console.log(`  ✗ ${user.username}: ${error.message}`);
    } else {
      console.log(`  ✓ ${user.username} created (${data.user.id})`);
      users.push({ ...user, id: data.user.id });
    }
  }

  return users;
}

async function seedFriendships(users) {
  console.log('\nEnsuring friendships exist...\n');

  for (let i = 0; i < users.length - 1; i++) {
    for (let j = i + 1; j < users.length; j++) {
      const a = users[i];
      const b = users[j];

      const { data: existing } = await supabase
        .from('friendships')
        .select('id')
        .or(
          `and(requester_id.eq.${a.id},addressee_id.eq.${b.id}),and(requester_id.eq.${b.id},addressee_id.eq.${a.id})`
        )
        .maybeSingle();

      if (existing) {
        console.log(`  ~ ${a.username} ↔ ${b.username} already friends`);
        continue;
      }

      const { error } = await supabase
        .from('friendships')
        .insert({ requester_id: a.id, addressee_id: b.id, status: 'accepted' });

      if (error) {
        console.log(`  ✗ ${a.username} ↔ ${b.username}: ${error.message}`);
      } else {
        console.log(`  ✓ ${a.username} ↔ ${b.username}`);
      }
    }
  }
}

async function main() {
  const users = await seedUsers();

  const usersWithIds = users.filter(u => u.id);
  if (usersWithIds.length >= 2) {
    await seedFriendships(usersWithIds);
  } else {
    console.log('\nNot enough users with IDs to create friendships.');
  }

  console.log('\nDone! Login with any test user using password: testpass123');
  console.log('Emails:');
  TEST_USERS.forEach(u => console.log(`  ${u.email}`));
}

main().catch(console.error);
