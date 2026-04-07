import { Router } from 'express'
import { nanoid } from 'nanoid'
import { requireAuth } from '../middleware/auth.js'
import { supabaseAsUser } from '../supabase.js'

const router = Router()

// UUIDの簡易検証
function isUUID(v) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)
}

// GET /api/lenses — 自分の保存済みレンズ一覧
router.get('/', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAsUser(req.token)
    .from('lens_saves')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: 'データの取得に失敗しました' })
  res.json(data)
})

// POST /api/lenses — レンズ設定を保存
router.post('/', requireAuth, async (req, res) => {
  const { title, camera, focal_mm, aperture, shutter_speed, iso, distance_m, frame_type, orientation, notes } = req.body

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({ error: 'タイトルは必須です' })
  }
  if (title.length > 100) return res.status(400).json({ error: 'タイトルは100文字以内にしてください' })
  if (notes && notes.length > 500) return res.status(400).json({ error: 'メモは500文字以内にしてください' })
  if (focal_mm !== undefined && (isNaN(focal_mm) || focal_mm < 1 || focal_mm > 2000)) {
    return res.status(400).json({ error: '焦点距離は1〜2000mmの範囲で入力してください' })
  }

  const { data, error } = await supabaseAsUser(req.token)
    .from('lens_saves')
    .insert({
      user_id: req.user.id,
      title: title.trim(), camera, focal_mm, aperture, shutter_speed,
      iso, distance_m, frame_type, orientation, notes
    })
    .select()
    .single()

  if (error) return res.status(500).json({ error: '保存に失敗しました' })
  res.status(201).json(data)
})

// DELETE /api/lenses/:id — 削除
router.delete('/:id', requireAuth, async (req, res) => {
  if (!isUUID(req.params.id)) return res.status(400).json({ error: '無効なIDです' })

  const { error } = await supabaseAsUser(req.token)
    .from('lens_saves')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.user.id) // 明示的な所有者チェック

  if (error) return res.status(500).json({ error: '削除に失敗しました' })
  res.json({ message: '削除しました' })
})

// PATCH /api/lenses/:id/share — 共有ON/OFF
router.patch('/:id/share', requireAuth, async (req, res) => {
  if (!isUUID(req.params.id)) return res.status(400).json({ error: '無効なIDです' })

  const client = supabaseAsUser(req.token)

  const { data: existing, error: fetchErr } = await client
    .from('lens_saves')
    .select('is_public, share_slug')
    .eq('id', req.params.id)
    .eq('user_id', req.user.id) // 明示的な所有者チェック
    .single()

  if (fetchErr || !existing) return res.status(404).json({ error: '見つかりません' })

  const newPublic = !existing.is_public
  const slug = newPublic ? (existing.share_slug || nanoid(8)) : existing.share_slug

  const { data, error } = await client
    .from('lens_saves')
    .update({ is_public: newPublic, share_slug: slug })
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: '更新に失敗しました' })

  res.json({
    is_public: data.is_public,
    share_url: data.is_public ? `/api/share/${data.share_slug}` : null
  })
})

// GET /api/lenses/stats — 利用統計
router.get('/stats', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAsUser(req.token)
    .from('lens_saves')
    .select('focal_mm, aperture, iso')

  if (error) return res.status(500).json({ error: 'データの取得に失敗しました' })

  const focalCount = {}, apertureCount = {}, isoCount = {}
  data.forEach(row => {
    if (row.focal_mm)  focalCount[row.focal_mm]    = (focalCount[row.focal_mm]    || 0) + 1
    if (row.aperture)  apertureCount[row.aperture]  = (apertureCount[row.aperture] || 0) + 1
    if (row.iso)       isoCount[row.iso]            = (isoCount[row.iso]           || 0) + 1
  })

  const rank = obj => Object.entries(obj)
    .sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([value, count]) => ({ value, count }))

  res.json({
    total: data.length,
    focal_ranking:    rank(focalCount),
    aperture_ranking: rank(apertureCount),
    iso_ranking:      rank(isoCount)
  })
})

export default router
