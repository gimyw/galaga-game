const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// GET /api/scores - top 20 scores
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, name, score, created_at FROM scores ORDER BY score DESC LIMIT 20'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

// POST /api/scores - save a score
router.post('/', async (req, res) => {
  const { name, score } = req.body;
  if (!name || score === undefined) return res.status(400).json({ error: 'name and score required' });

  // 입력값 검증
  const trimmedName = String(name).trim().slice(0, 32);
  const parsedScore = parseInt(score);
  if (!trimmedName) return res.status(400).json({ error: 'name is required' });
  if (isNaN(parsedScore) || parsedScore < 0 || parsedScore > 9999999) {
    return res.status(400).json({ error: 'score must be between 0 and 9999999' });
  }

  try {
    const [result] = await pool.execute(
      'INSERT INTO scores (name, score) VALUES (?, ?)',
      [trimmedName, parsedScore]
    );

    // Upsert user best score
    await pool.execute(`
      INSERT INTO users (name, best_score, play_count)
      VALUES (?, ?, 1)
      ON DUPLICATE KEY UPDATE
        best_score = GREATEST(best_score, VALUES(best_score)),
        play_count = play_count + 1
    `, [trimmedName, parsedScore]);

    res.status(201).json({ id: result.insertId, name: trimmedName, score: parsedScore });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

module.exports = router;
