import { createClient } from '@supabase/supabase-js'

// ユーザーのJWTを使って認証済みクライアントを作成（RLSが適用される）
export function supabaseAsUser(accessToken) {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
  )
}

// 公開データ取得用（anonキー、RLS適用）
export const supabaseAnon = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)
