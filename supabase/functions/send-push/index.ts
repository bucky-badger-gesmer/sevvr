import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

interface PushPayload {
  pushToken: string;
  title: string;
  body: string;
  data?: {
    type: string;
    challengeId?: string;
  };
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let payload: PushPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { pushToken, title, body, data } = payload;

  if (!pushToken || !title || !body) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip, deflate',
    },
    body: JSON.stringify({
      to: pushToken,
      title,
      body,
      data: data ?? {},
      sound: 'default',
      priority: 'high',
    }),
  });

  const result = await response.json();

  return new Response(JSON.stringify(result), {
    status: response.status,
    headers: { 'Content-Type': 'application/json' },
  });
});
