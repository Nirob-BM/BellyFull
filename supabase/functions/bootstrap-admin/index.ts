import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const body = await req.json().catch(() => ({}))
  const email = String(body.email ?? '')
  const password = String(body.password ?? '')
  if (!email || password.length < 6) {
    return new Response(JSON.stringify({ error: 'invalid input' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let userId: string | null = null
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (created.error) {
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    const found = list?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
    if (!found) {
      return new Response(JSON.stringify({ error: created.error.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    userId = found.id
    await admin.auth.admin.updateUserById(userId, { password, email_confirm: true })
  } else {
    userId = created.data.user!.id
  }

  const { error: roleError } = await admin
    .from('user_roles')
    .upsert({ user_id: userId, role: 'admin' }, { onConflict: 'user_id,role' })

  return new Response(JSON.stringify({ userId, roleError: roleError?.message ?? null }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
