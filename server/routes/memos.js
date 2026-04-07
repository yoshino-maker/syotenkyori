import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { supabaseAsUser } from '../supabase.js'

const router = Router()

// GET /api/memos
router.get('/', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAsUser(req.token)
    .from('memos')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: 'データの取得に失敗しました' })
  res.json(data)
})

// POST /api/memos
router.post('/', requireAuth, async (req, res) => {
  const { title, camera, focal_mm, aperture, shutter_speed, iso, distance, notes } = req.body

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({ error: 'タイトルは必須です' })
  }
  if (title.length > 100) return res.status(400).json({ error: 'タイトルは100文字以内にしてください' })
  if (notes && notes.length > 500) return res.status(400).json({ error: 'メモは500文字以内にしてください' })

  const { data, error } = await supabaseAsUser(req.token)
    .from('memos')
    .insert({
      user_id: req.user.id,
      title: title.trim(), camera, focal_mm, aperture, shutter_speed, iso, distance, notes
    })
    .select()
    .single()

  if (error) return res.status(500).json({ error: '保存に失敗しました' })
  res.status(201).json(data)
})

// DELETE /api/memos/:id
router.delete('/:id', requireAuth, async (req, res) => {
  const { error } = await supabaseAsUser(req.token)
    .from('memos')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)

  if (error) return res.status(500).json({ error: '削除に失敗しました' })
  res.json({ message: '削除しました' })
})

export default router
