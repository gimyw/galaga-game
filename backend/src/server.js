require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const { initDB } = require('./db');
const scoresRouter = require('./routes/scores');
const { setupWebSocket } = require('./wsHandler');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // 같은 서버 요청(origin 없음) 또는 허용된 origin만 통과
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy violation'));
    }
  }
}));
app.use(express.json({ limit: '10kb' })); // 요청 바디 크기 제한

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// REST API
app.use('/api/scores', scoresRouter);

// WebSocket
setupWebSocket(wss);

const PORT = process.env.PORT || 4000;

initDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Galaga server running on port ${PORT}`);
      console.log(`WebSocket: ws://localhost:${PORT}`);
      console.log(`REST API:  http://localhost:${PORT}/api/scores`);
    });
  })
  .catch(err => {
    console.error('Failed to init DB:', err.message);
    process.exit(1);
  });
