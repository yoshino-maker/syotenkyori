import { createClient } from '@supabase/supabase-js'

// リクエストのAuthorizationヘッダーからJWTを検証してreq.userにセット
export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: '認証が必要です' })
  }

  const token = authHeader.replace('Bearer ', '')

  // anonキーでクライアントを作りgetUser()でサーバー側検証
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  )
  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    return res.status(401).json({ error: 'トークンが無効または期限切れです' })
  }

  req.user  = user
  req.token = token
  next()
}
