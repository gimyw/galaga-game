import React, { useEffect, useRef, useCallback } from 'react';
import { playerSprite, enemy1Sprite, enemy2Sprite, enemy3Sprite, explosionSprite } from '../sprites';

const W = 480;
const H = 640;
const PLAYER_SPEED = 5;
const BULLET_SPEED = 9;
const ENEMY_BULLET_SPEED = 4;
const ENEMY_ROWS = 3;
const ENEMY_COLS = 8;

const ENEMY_SPRITES = [enemy3Sprite, enemy2Sprite, enemy1Sprite]; // row 0=노랑, 1=주황, 2=빨강

function createEnemies() {
  const enemies = [];
  for (let r = 0; r < ENEMY_ROWS; r++) {
    for (let c = 0; c < ENEMY_COLS; c++) {
      enemies.push({ x: 55 + c * 52, y: 55 + r * 52, alive: true, row: r, hitFlash: 0 });
    }
  }
  return enemies;
}

export default function GameCanvas({ ws, playerName, onGameOver }) {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    player: { x: W / 2 - 24, y: H - 90, w: 48, h: 56 },
    bullets: [],
    enemyBullets: [],
    enemies: createEnemies(),
    explosions: [],
    keys: {},
    score: 0,
    lives: 3,
    enemyDir: 1,
    enemyMoveTimer: 0,
    enemyShootTimer: 0,
    gameOver: false,
    level: 1,
    stars: Array.from({ length: 100 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      s: Math.random() * 2 + 0.5,
      speed: Math.random() * 0.8 + 0.2,
    })),
    playerFlash: 0,
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
    const onKeyDown = (e) => {
      stateRef.current.keys[e.code] = true;
      if (e.code === 'Space') {
        e.preventDefault();
        const { player, bullets } = stateRef.current;
        if (bullets.filter(b => b.active).length < 3) {
          bullets.push({ x: player.x + 22, y: player.y, active: true });
        }
      }
    };
    const onKeyUp = (e) => { stateRef.current.keys[e.code] = false; };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const drawImage = (img, x, y, w, h, alpha = 1) => {
      if (!img.complete || img.naturalWidth === 0) return;
      ctx.globalAlpha = alpha;
      ctx.drawImage(img, x, y, w, h);
      ctx.globalAlpha = 1;
    };

    const loop = () => {
      const s = stateRef.current;
      if (s.gameOver) return;

      // 플레이어 이동
      if (s.keys['ArrowLeft'] || s.keys['KeyA']) s.player.x = Math.max(0, s.player.x - PLAYER_SPEED);
      if (s.keys['ArrowRight'] || s.keys['KeyD']) s.player.x = Math.min(W - s.player.w, s.player.x + PLAYER_SPEED);

      // 총알 이동
      s.bullets.forEach(b => { if (b.active) b.y -= BULLET_SPEED; });
      s.bullets = s.bullets.filter(b => b.active && b.y > -10);

      // 적 총알 이동
      s.enemyBullets.forEach(b => { if (b.active) b.y += ENEMY_BULLET_SPEED; });
      s.enemyBullets = s.enemyBullets.filter(b => b.active && b.y < H + 10);

      // 적 이동
      s.enemyMoveTimer++;
      const speed = Math.max(4, 20 - s.level * 2);
      if (s.enemyMoveTimer >= speed) {
        s.enemyMoveTimer = 0;
        const alive = s.enemies.filter(e => e.alive);
        if (alive.length > 0) {
          const minX = Math.min(...alive.map(e => e.x));
          const maxX = Math.max(...alive.map(e => e.x + 40));
          if (maxX >= W - 5 || minX <= 5) s.enemyDir *= -1;
          s.enemies.forEach(e => { if (e.alive) e.x += s.enemyDir * 8; });
        }
      }

      // 적 발사
      s.enemyShootTimer++;
      if (s.enemyShootTimer >= Math.max(30, 60 - s.level * 5)) {
        s.enemyShootTimer = 0;
        const alive = s.enemies.filter(e => e.alive);
        if (alive.length > 0) {
          const shooter = alive[Math.floor(Math.random() * alive.length)];
          s.enemyBullets.push({ x: shooter.x + 18, y: shooter.y + 30, active: true });
        }
      }

      // 총알-적 충돌
      s.bullets.forEach(b => {
        if (!b.active) return;
        s.enemies.forEach(e => {
          if (!e.alive) return;
          if (b.x > e.x && b.x < e.x + 40 && b.y > e.y && b.y < e.y + 36) {
            b.active = false;
            e.alive = false;
            s.explosions.push({ x: e.x, y: e.y, timer: 12 });
            s.score += (3 - e.row) * 10;
            sendScore(s.score);
          }
        });
      });

      // 적 총알-플레이어 충돌
      if (s.playerFlash <= 0) {
        s.enemyBullets.forEach(b => {
          if (!b.active) return;
          const p = s.player;
          if (b.x > p.x + 8 && b.x < p.x + p.w - 8 && b.y > p.y + 8 && b.y < p.y + p.h) {
            b.active = false;
            s.lives--;
            s.playerFlash = 60;
            s.explosions.push({ x: p.x, y: p.y, timer: 15 });
            if (s.lives <= 0) {
              s.gameOver = true;
              if (ws) ws.send(JSON.stringify({ type: 'GAME_OVER', score: s.score, name: playerName }));
              onGameOver(s.score);
            }
          }
        });
      }
      if (s.playerFlash > 0) s.playerFlash--;

      // 적이 바닥 도달
      s.enemies.forEach(e => {
        if (e.alive && e.y + 36 >= H - 70) {
          s.gameOver = true;
          onGameOver(s.score);
        }
      });

      // 전부 처치 → 다음 레벨
      if (s.enemies.every(e => !e.alive)) {
        s.level++;
        s.enemies = createEnemies();
        s.enemyDir = 1;
      }

      // 폭발 타이머
      s.explosions = s.explosions.filter(ex => ex.timer > 0);
      s.explosions.forEach(ex => ex.timer--);

      // ── 렌더링 ──
      ctx.fillStyle = '#000010';
      ctx.fillRect(0, 0, W, H);

      // 별
      s.stars.forEach(st => {
        st.y += st.speed;
        if (st.y > H) { st.y = 0; st.x = Math.random() * W; }
        ctx.fillStyle = `rgba(255,255,255,${0.3 + st.s * 0.3})`;
        ctx.fillRect(st.x, st.y, st.s, st.s);
      });

      // 적
      s.enemies.forEach(e => {
        if (!e.alive) return;
        const sprite = ENEMY_SPRITES[e.row] || enemy1Sprite;
        drawImage(sprite, e.x, e.y, 40, 36);
      });

      // 폭발
      s.explosions.forEach(ex => {
        const alpha = ex.timer / 15;
        const scale = 1 + (1 - alpha) * 0.5;
        const size = 40 * scale;
        drawImage(explosionSprite, ex.x - (size - 40) / 2, ex.y - (size - 40) / 2, size, size, alpha);
      });

      // 플레이어 총알 (레이저 스타일)
      s.bullets.forEach(b => {
        if (!b.active) return;
        const grad = ctx.createLinearGradient(b.x + 2, b.y, b.x + 2, b.y + 16);
        grad.addColorStop(0, '#FFFFFF');
        grad.addColorStop(0.3, '#00FFFF');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(b.x, b.y, 4, 16);
        // 글로우
        ctx.shadowColor = '#00FFFF';
        ctx.shadowBlur = 8;
        ctx.fillRect(b.x + 1, b.y, 2, 14);
        ctx.shadowBlur = 0;
      });

      // 적 총알 (빨간 레이저)
      s.enemyBullets.forEach(b => {
        if (!b.active) return;
        const grad = ctx.createLinearGradient(b.x + 2, b.y, b.x + 2, b.y + 14);
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(0.7, '#FF4444');
        grad.addColorStop(1, '#FFFFFF');
        ctx.fillStyle = grad;
        ctx.fillRect(b.x, b.y, 4, 14);
        ctx.shadowColor = '#FF0000';
        ctx.shadowBlur = 6;
        ctx.fillRect(b.x + 1, b.y + 2, 2, 12);
        ctx.shadowBlur = 0;
      });

      // 플레이어 (무적 시 깜빡임)
      if (s.playerFlash <= 0 || Math.floor(s.playerFlash / 6) % 2 === 0) {
        drawImage(playerSprite, s.player.x, s.player.y, 48, 56);
      }

      // HUD
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 16px "Courier New"';
      ctx.fillText(`SCORE: ${s.score}`, 10, 26);
      ctx.fillText(`LEVEL: ${s.level}`, W / 2 - 42, 26);

      // 목숨 (하트 대신 미니 전투기)
      for (let i = 0; i < s.lives; i++) {
        if (playerSprite.complete) {
          ctx.drawImage(playerSprite, W - 30 - i * 28, 8, 20, 24);
        }
      }

      // 플레이어 이름
      ctx.fillStyle = '#88FFCC';
      ctx.font = '11px "Courier New"';
      ctx.fillText(playerName, s.player.x + 4, s.player.y - 6);

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
      style={{ border: '1px solid #1a1a3a', display: 'block', boxShadow: '0 0 30px #001133' }}
    />
  );
}
