import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

serve(async (_req) => {
  const currentHour = new Date().getUTCHours();

  const { data: users, error } = await supabase.rpc('get_streak_reminder_users', {
    p_hour: currentHour,
  });

  if (error) {
    console.error('Error fetching reminder users:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const results: unknown[] = [];

  for (const user of users ?? []) {
    const response = await fetch(`${supabaseUrl}/functions/v1/send-push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceRoleKey}`,
      },
      body: JSON.stringify({
        pushToken: user.push_token,
        title: 'Your streak is at risk!',
        body: `Your ${user.current_streak}-day streak ends tonight. Sever now to keep it alive!`,
        data: { type: 'streak_reminder' },
      }),
    });

    const result = await response.json();
    results.push({ user_id: user.user_id, result });
  }

  return new Response(JSON.stringify({ sent: results.length, results }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
