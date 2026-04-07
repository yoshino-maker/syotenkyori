import { Router } from 'express'
import { supabaseAnon } from '../supabase.js'

const router = Router()

// GET /api/share/:slug — 共有URLから設定を取得（ログイン不要・公開）
router.get('/:slug', async (req, res) => {
  const { data, error } = await supabaseAnon
    .from('lens_saves')
    .select('id, title, camera, focal_mm, aperture, shutter_speed, iso, distance_m, frame_type, orientation, notes, view_count, created_at')
    .eq('share_slug', req.params.slug)
    .eq('is_public', true)
    .single()

  if (error || !data) return res.status(404).json({ error: '共有設定が見つかりません' })

  res.json(data)
})

export default router
