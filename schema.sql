-- ================================================
-- 焦点距離 Pro — Supabase データベーススキーマ
-- Supabase の SQL Editor にこのファイルをそのまま貼り付けて実行する
-- ================================================

-- ① lens_saves テーブル（レンズ設定の保存・共有）
CREATE TABLE IF NOT EXISTS lens_saves (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title          TEXT        NOT NULL,
  camera         TEXT,
  focal_mm       NUMERIC(6,1),
  aperture       TEXT,
  shutter_speed  TEXT,
  iso            TEXT,
  distance_m     NUMERIC(6,2),
  frame_type     TEXT,
  orientation    TEXT,
  notes          TEXT,
  is_public      BOOLEAN     DEFAULT false,
  share_slug     TEXT        UNIQUE,
  view_count     INTEGER     DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ② memos テーブル（撮影メモ）
CREATE TABLE IF NOT EXISTS memos (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title          TEXT        NOT NULL,
  camera         TEXT,
  focal_mm       NUMERIC(6,1),
  aperture       TEXT,
  shutter_speed  TEXT,
  iso            TEXT,
  distance       TEXT,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- Row Level Security（RLS）を有効化
-- ================================================
ALTER TABLE lens_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE memos      ENABLE ROW LEVEL SECURITY;

-- ================================================
-- lens_saves のポリシー
-- ================================================

-- 自分のデータ＋公開データは読める
CREATE POLICY "lens_saves_select" ON lens_saves
  FOR SELECT USING (auth.uid() = user_id OR is_public = true);

-- 自分のデータだけ作成できる
CREATE POLICY "lens_saves_insert" ON lens_saves
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 自分のデータだけ更新できる
CREATE POLICY "lens_saves_update" ON lens_saves
  FOR UPDATE USING (auth.uid() = user_id);

-- 自分のデータだけ削除できる
CREATE POLICY "lens_saves_delete" ON lens_saves
  FOR DELETE USING (auth.uid() = user_id);

-- ================================================
-- memos のポリシー
-- ================================================

-- 自分のデータのみ全操作可
CREATE POLICY "memos_all_own" ON memos
  FOR ALL USING (auth.uid() = user_id);

-- ================================================
-- updated_at を自動更新するトリガー
-- ================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lens_saves_updated_at
  BEFORE UPDATE ON lens_saves
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ③ meter_logs テーブル（露出記録）
CREATE TABLE IF NOT EXISTS meter_logs (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ev         NUMERIC(5,2) NOT NULL,
  mode       TEXT,
  cct        INTEGER,
  ss         TEXT,
  fval       TEXT,
  iso        INTEGER,
  location   TEXT,
  note       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE meter_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meter_logs_all_own" ON meter_logs
  FOR ALL USING (auth.uid() = user_id);
