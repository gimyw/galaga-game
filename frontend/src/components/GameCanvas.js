import React, { useEffect, useRef, useCallback } from 'react';

const W = 480;
const H = 640;
const PLAYER_SPEED = 5;
const BULLET_SPEED = 8;
const ENEMY_BULLET_SPEED = 4;
const ENEMY_ROWS = 3;
const ENEMY_COLS = 8;

function createEnemies() {
  const enemies = [];
  for (let r = 0; r < ENEMY_ROWS; r++) {
    for (let c = 0; c < ENEMY_COLS; c++) {
      enemies.push({
        x: 60 + c * 50,
        y: 60 + r * 50,
        alive: true,
        row: r,
      });
    }
  }
  return enemies;
}

export default function GameCanvas({ ws, playerName, onGameOver }) {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    player: { x: W / 2 - 20, y: H - 80, w: 40, h: 30 },
    bullets: [],
    enemyBullets: [],
    enemies: createEnemies(),
    keys: {},
    score: 0,
    lives: 3,
    enemyDir: 1,
    enemyMoveTimer: 0,
    enemyShootTimer: 0,
    gameOver: false,
    level: 1,
    stars: Array.from({ length: 80 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      s: Math.random() * 2 + 0.5,
    })),
  });
  const rafRef = useRef(null);
  const lastSentScore = useRef(0);

  const sendScore = useCallback((score) => {
    if (ws && ws.readyState === WebSocket.OPEN && score !== lastSentScore.current) {
      ws.send(JSON.stringify({ type: 'SCORE_UPDATE', score }));
      lastSentScore.current = score;
    }
  }, [ws]);

  useEffect(() => {
    const onKey = (e, down) => {
      stateRef.current.keys[e.code] = down;
      if (down && e.code === 'Space') {
        e.preventDefault();
        const { player, bullets } = stateRef.current;
        if (bullets.filter(b => b.active).length < 3) {
          bullets.push({ x: player.x + 18, y: player.y, active: true });
        }
      }
    };
    window.addEventListener('keydown', e => onKey(e, true));
    window.addEventListener('keyup', e => onKey(e, false));
    return () => {
      window.removeEventListener('keydown', e => onKey(e, true));
      window.removeEventListener('keyup', e => onKey(e, false));
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const drawPlayer = (p) => {
      ctx.fillStyle = '#00FF88';
      // body
      ctx.fillRect(p.x + 15, p.y + 5, 10, 20);
      // wings
      ctx.fillRect(p.x, p.y + 15, 40, 8);
      // cockpit
      ctx.fillStyle = '#88FFCC';
      ctx.fillRect(p.x + 17, p.y, 6, 8);
      // engine glow
      ctx.fillStyle = '#FF6600';
      ctx.fillRect(p.x + 16, p.y + 25, 8, 5);
    };

    const drawEnemy = (e) => {
      const colors = ['#FF4444', '#FF8800', '#FFFF00'];
      ctx.fillStyle = colors[e.row] || '#FF4444';
      // body
      ctx.fillRect(e.x + 8, e.y + 5, 14, 14);
      // wings
      ctx.fillRect(e.x, e.y + 10, 30, 6);
      // eyes
      ctx.fillStyle = '#000';
      ctx.fillRect(e.x + 10, e.y + 8, 4, 4);
      ctx.fillRect(e.x + 16, e.y + 8, 4, 4);
    };

    const loop = () => {
      const s = stateRef.current;
      if (s.gameOver) return;

      // Move player
      if (s.keys['ArrowLeft'] || s.keys['KeyA']) s.player.x = Math.max(0, s.player.x - PLAYER_SPEED);
      if (s.keys['ArrowRight'] || s.keys['KeyD']) s.player.x = Math.min(W - s.player.w, s.player.x + PLAYER_SPEED);

      // Move bullets
      s.bullets.forEach(b => { if (b.active) b.y -= BULLET_SPEED; });
      s.bullets = s.bullets.filter(b => b.active && b.y > 0);

      // Move enemy bullets
      s.enemyBullets.forEach(b => { if (b.active) b.y += ENEMY_BULLET_SPEED; });
      s.enemyBullets = s.enemyBullets.filter(b => b.active && b.y < H);

      // Move enemies
      s.enemyMoveTimer++;
      const speed = Math.max(5, 20 - s.level * 2);
      if (s.enemyMoveTimer >= speed) {
        s.enemyMoveTimer = 0;
        const alive = s.enemies.filter(e => e.alive);
        const minX = Math.min(...alive.map(e => e.x));
        const maxX = Math.max(...alive.map(e => e.x + 30));
        if (maxX >= W - 5 || minX <= 5) s.enemyDir *= -1;
        s.enemies.forEach(e => { if (e.alive) e.x += s.enemyDir * 8; });
      }

      // Enemy shoot
      s.enemyShootTimer++;
      if (s.enemyShootTimer >= 60) {
        s.enemyShootTimer = 0;
        const alive = s.enemies.filter(e => e.alive);
        if (alive.length > 0) {
          const shooter = alive[Math.floor(Math.random() * alive.length)];
          s.enemyBullets.push({ x: shooter.x + 13, y: shooter.y + 20, active: true });
        }
      }

      // Bullet-enemy collision
      s.bullets.forEach(b => {
        if (!b.active) return;
        s.enemies.forEach(e => {
          if (!e.alive) return;
          if (b.x > e.x && b.x < e.x + 30 && b.y > e.y && b.y < e.y + 24) {
            b.active = false;
            e.alive = false;
            s.score += (3 - e.row) * 10;
            sendScore(s.score);
          }
        });
      });

      // Enemy bullet-player collision
      s.enemyBullets.forEach(b => {
        if (!b.active) return;
        const p = s.player;
        if (b.x > p.x && b.x < p.x + p.w && b.y > p.y && b.y < p.y + p.h) {
          b.active = false;
          s.lives--;
          if (s.lives <= 0) {
            s.gameOver = true;
            if (ws) ws.send(JSON.stringify({ type: 'GAME_OVER', score: s.score, name: playerName }));
            onGameOver(s.score);
          }
        }
      });

      // Enemy reaches bottom
      s.enemies.forEach(e => {
        if (e.alive && e.y + 24 >= H - 60) {
          s.gameOver = true;
          onGameOver(s.score);
        }
      });

      // All enemies dead → next level
      if (s.enemies.every(e => !e.alive)) {
        s.level++;
        s.enemies = createEnemies();
        s.enemyDir = 1;
      }

      // ---- Draw ----
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);

      // Stars
      ctx.fillStyle = '#fff';
      s.stars.forEach(st => {
        st.y += 0.3;
        if (st.y > H) st.y = 0;
        ctx.fillRect(st.x, st.y, st.s, st.s);
      });

      // Enemies
      s.enemies.forEach(e => { if (e.alive) drawEnemy(e); });

      // Player bullets
      ctx.fillStyle = '#00FFFF';
      s.bullets.forEach(b => { if (b.active) ctx.fillRect(b.x, b.y, 4, 12); });

      // Enemy bullets
      ctx.fillStyle = '#FF4444';
      s.enemyBullets.forEach(b => { if (b.active) ctx.fillRect(b.x, b.y, 4, 10); });

      // Player
      drawPlayer(s.player);

      // HUD
      ctx.fillStyle = '#FFD700';
      ctx.font = '16px Courier New';
      ctx.fillText(`SCORE: ${s.score}`, 10, 24);
      ctx.fillText(`LEVEL: ${s.level}`, W / 2 - 40, 24);
      ctx.fillText(`LIVES: ${'♥ '.repeat(s.lives)}`, W - 120, 24);

      // Player name
      ctx.fillStyle = '#888';
      ctx.font = '12px Courier New';
      ctx.fillText(playerName, s.player.x, s.player.y - 6);

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [ws, playerName, onGameOver, sendScore]);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      style={{ border: '2px solid #333', display: 'block' }}
    />
  );
}
