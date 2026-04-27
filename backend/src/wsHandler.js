const { pool } = require('./db');

const clients = new Map(); // ws -> { name, score }

function setupWebSocket(wss) {
  wss.on('connection', (ws) => {
    console.log('Client connected');
    clients.set(ws, { name: 'Unknown', score: 0 });

    ws.on('message', async (raw) => {
      let msg;
      try { msg = JSON.parse(raw); } catch { return; }

      const client = clients.get(ws);

      switch (msg.type) {
        case 'JOIN':
          client.name = (msg.name || 'Player').slice(0, 32);
          console.log(`Player joined: ${client.name}`);
          break;

        case 'SCORE_UPDATE':
          client.score = parseInt(msg.score) || 0;
          break;

        case 'GAME_OVER':
          client.score = parseInt(msg.score) || 0;
          // 점수 범위 검증
          if (client.score < 0 || client.score > 9999999) {
            console.warn(`Invalid score from ${client.name}: ${client.score}`);
            break;
          }
          client.name = (msg.name || client.name).slice(0, 32);
          try {
            await pool.execute(
              'INSERT INTO scores (name, score) VALUES (?, ?)',
              [client.name, client.score]
            );
            await pool.execute(`
              INSERT INTO users (name, best_score, play_count)
              VALUES (?, ?, 1)
              ON DUPLICATE KEY UPDATE
                best_score = GREATEST(best_score, VALUES(best_score)),
                play_count = play_count + 1
            `, [client.name, client.score]);
            console.log(`Score saved: ${client.name} = ${client.score}`);
          } catch (err) {
            console.error('Score save error:', err.message);
          }
          break;

        default:
          break;
      }
    });

    ws.on('close', () => {
      console.log(`Client disconnected: ${clients.get(ws)?.name}`);
      clients.delete(ws);
    });

    ws.on('error', (err) => console.error('WS error:', err.message));
  });
}

module.exports = { setupWebSocket };
