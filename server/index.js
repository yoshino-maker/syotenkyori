import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import rateLimit from 'express-rate-limit'
import authRoutes      from './routes/auth.js'
import lensRoutes      from './routes/lenses.js'
import memoRoutes      from './routes/memos.js'
import shareRoutes     from './routes/share.js'
import meterLogRoutes  from './routes/meter_logs.js'

const app  = express()
const PORT = process.env.PORT || 3001
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// フロントエンドのファイルを配信
app.use(express.static(path.join(__dirname, '..')))

// CORS設定
app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      'http://localhost:3001',
      'http://127.0.0.1:3001',
      'null',
      'https://syotenkyori.onrender.com',
      ...(process.env.ALLOWED_ORIGIN ? [process.env.ALLOWED_ORIGIN] : [])
    ];
    if (!origin || allowed.includes(origin)) callback(null, true);
    else callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}))

app.use(express.json({ limit: '50kb' })) // リクエストサイズ制限

// ---- レート制限 ----
// 認証エンドポイント：1分間に10回まで
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'リクエストが多すぎます。しばらくしてから再試行してください。' },
  standardHeaders: true,
  legacyHeaders: false
})
// 一般API：1分間に120回まで
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: { error: 'リクエストが多すぎます。しばらくしてから再試行してください。' }
})

// ルーティング
app.use('/api/auth',       authLimiter, authRoutes)
app.use('/api/lenses',    apiLimiter,  lensRoutes)
app.use('/api/memos',     apiLimiter,  memoRoutes)
app.use('/api/share',     apiLimiter,  shareRoutes)
app.use('/api/meter_logs',apiLimiter,  meterLogRoutes)

// ヘルスチェック
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '焦点距離 Pro APIサーバー稼働中' })
})

// エラーハンドラー（内部情報を隠蔽）
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'サーバーエラーが発生しました' })
})

app.listen(PORT, () => {
  console.log(`✅ サーバー起動中: http://localhost:${PORT}`)
})
