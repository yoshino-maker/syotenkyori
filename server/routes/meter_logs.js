import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { supabaseAsUser } from '../supabase.js'

const router = Router()

// GET /api/meter_logs — 自分の露出記録一覧
router.get('/', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAsUser(req.token)
    .from('meter_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return res.status(500).json({ error: 'データの取得に失敗しました' })
  res.json(data)
})

// POST /api/meter_logs — 記録を保存
router.post('/', requireAuth, async (req, res) => {
  const { ev, mode, cct, ss, fval, iso, location, note } = req.body

  if (ev === undefined || isNaN(parseFloat(ev))) {
    return res.status(400).json({ error: 'EV値が不正です' })
  }
  if (parseFloat(ev) < -6 || parseFloat(ev) > 24) {
    return res.status(400).json({ error: 'EV値が範囲外です' })
  }

  const { data, error } = await supabaseAsUser(req.token)
    .from('meter_logs')
    .insert({
      user_id:  req.user.id,
      ev:       parseFloat(ev),
      mode:     mode || '平均測光',
      cct:      cct ? parseInt(cct) : null,
      ss:       ss       ? String(ss).slice(0, 20)       : null,
      fval:     fval     ? String(fval).slice(0, 10)     : null,
      iso:      iso      ? parseInt(iso)                 : null,
      location: location ? String(location).slice(0, 60) : null,
      note:     note     ? String(note).slice(0, 200)    : null
    })
    .select()
    .single()

  if (error) return res.status(500).json({ error: '保存に失敗しました' })
  res.status(201).json(data)
})

// DELETE /api/meter_logs/:id — 削除
router.delete('/:id', requireAuth, async (req, res) => {
  const { error } = await supabaseAsUser(req.token)
    .from('meter_logs')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)

  if (error) return res.status(500).json({ error: '削除に失敗しました' })
  res.json({ message: '削除しました' })
})

export default router
