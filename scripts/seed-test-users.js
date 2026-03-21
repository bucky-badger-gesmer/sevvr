const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://jgtzolsriegovsobluek.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_T-ClqtHUCrs88mpavvg2nw_StSvpsuI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TEST_USERS = [
  { email: 'alice.sevvrtest1@gmail.com', password: 'testpass123', username: 'alice_test' },
  { email: 'bob.sevvrtest2@gmail.com', password: 'testpass123', username: 'bob_test' },
  { email: 'charlie.sevvrtest3@gmail.com', password: 'testpass123', username: 'charlie_test' },
  { email: 'diana.sevvrtest4@gmail.com', password: 'testpass123', username: 'diana_test' },
  { email: 'eve.sevvrtest5@gmail.com', password: 'testpass123', username: 'eve_test' },
];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function seedUsers() {
  console.log('Creating test users (with delays to avoid rate limiting)...\n');

  for (const user of TEST_USERS) {
    const { data, error } = await supabase.auth.signUp({
      email: user.email,
      password: user.password,
      options: {
        data: { username: user.username },
      },
    });

    if (error) {
      console.log(`  ✗ ${user.username}: ${error.message}`);
    } else {
      console.log(`  ✓ ${user.username} (${data.user?.id})`);
    }

    // Wait 5 seconds between signups to avoid rate limiting
    await sleep(5000);
  }

  console.log('\nDone! You can login with any test user using password: testpass123');
  console.log('Emails:');
  TEST_USERS.forEach(u => console.log(`  ${u.email}`));
}

seedUsers().catch(console.error);
