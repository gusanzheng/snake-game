import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

config(); // 加载 .env

const { MONGODB_HOST, MONGODB_PORT, MONGODB_USER, MONGODB_PASS, MONGODB_DB } = process.env;

const client = new MongoClient(`mongodb://${MONGODB_HOST}:${MONGODB_PORT}`, {
  auth: { username: MONGODB_USER, password: MONGODB_PASS },
  authSource: 'admin',
});
let collection;

async function connectDB() {
  await client.connect();
  collection = client.db(MONGODB_DB).collection('scores');
  // 确保 score 字段有降序索引，查询更快
  await collection.createIndex({ score: -1 });
  console.log('✅ MongoDB connected');
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === 'production';

const app = express();
if (!isProd) app.use(cors()); // 生产环境由同源提供，无需 CORS
app.use(express.json());

// 生产环境：托管前端静态文件
if (isProd) {
  const distPath = join(__dirname, '../dist');
  app.use(express.static(distPath));
}

/** GET /api/leaderboard — 返回 Top 10 */
app.get('/api/leaderboard', async (req, res) => {
  try {
    const entries = await collection
      .find({}, { projection: { _id: 1, name: 1, score: 1, createdAt: 1 } })
      .sort({ score: -1 })
      .limit(10)
      .toArray();
    res.json(entries);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器错误' });
  }
});

/** POST /api/leaderboard — 提交一条分数 */
app.post('/api/leaderboard', async (req, res) => {
  try {
    const { name, score } = req.body;

    // 输入校验
    if (typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: '昵称不能为空' });
    }
    if (!Number.isInteger(score) || score < 0) {
      return res.status(400).json({ error: '分数无效' });
    }

    await collection.insertOne({
      name: name.trim().slice(0, 20),
      score,
      createdAt: new Date(),
    });

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 生产环境：所有非 API 路由返回 index.html（前端路由支持）
if (isProd) {
  app.get('/{*splat}', (_req, res) => {
    res.sendFile(join(__dirname, '../dist/index.html'));
  });
}

const PORT = process.env.PORT || (isProd ? 3000 : 3001);

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
