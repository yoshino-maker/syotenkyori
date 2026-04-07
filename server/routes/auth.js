import { Router } from 'express'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

function anonClient() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
}

// メールアドレスの簡易検証
function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, password } = req.body

  if (!isValidEmail(email)) return res.status(400).json({ error: '有効なメールアドレスを入力してください' })
  if (!password || password.length < 8) return res.status(400).json({ error: 'パスワードは8文字以上で入力してください' })

  const { data, error } = await anonClient().auth.signUp({ email, password })
  if (error) return res.status(400).json({ error: '登録に失敗しました。メールアドレスが既に使用されている可能性があります。' })

  res.json({
    message: '登録完了。確認メールをご確認ください。',
    user: { id: data.user.id, email: data.user.email }
  })
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body

  if (!isValidEmail(email) || !password) {
    return res.status(400).json({ error: 'メールアドレスとパスワードを入力してください' })
  }

  const { data, error } = await anonClient().auth.signInWithPassword({ email, password })
  if (error) return res.status(401).json({ error: 'メールアドレスまたはパスワードが正しくありません' })

  res.json({
    access_token:  data.session.access_token,
    refresh_token: data.session.refresh_token,
    user: { id: data.user.id, email: data.user.email }
  })
})

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  const { refresh_token } = req.body
  if (!refresh_token) return res.status(400).json({ error: 'refresh_tokenが必要です' })

  const { data, error } = await anonClient().auth.refreshSession({ refresh_token })
  if (error) return res.status(401).json({ error: 'トークンの更新に失敗しました' })

  res.json({
    access_token:  data.session.access_token,
    refresh_token: data.session.refresh_token
  })
})

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json({ id: req.user.id, email: req.user.email })
})

// POST /api/auth/logout
router.post('/logout', requireAuth, async (req, res) => {
  await createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${req.token}` } } }
  ).auth.signOut()
  res.json({ message: 'ログアウトしました' })
})

export default router
