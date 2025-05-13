import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import config from './config/default';
import uploadRoutes from './routes/uploadRoutes';

const app = express();
const port = config.server.port;

// ミドルウェア
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// ルート
app.use('/api/upload', uploadRoutes);

// 基本的なテスト用ルート
app.get('/', (req, res) => {
  res.send('File Chunker API が実行中です');
});

// サーバーの起動
app.listen(port, () => {
  console.log(`サーバーはポート ${port} で実行中です`);
});