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

app.use(cors());
app.use(express.json());

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
