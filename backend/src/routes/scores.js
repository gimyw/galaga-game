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

  try {
    const [result] = await pool.execute(
      'INSERT INTO scores (name, score) VALUES (?, ?)',
      [name.slice(0, 32), parseInt(score)]
    );

    // Upsert user best score
    await pool.execute(`
      INSERT INTO users (name, best_score, play_count)
      VALUES (?, ?, 1)
      ON DUPLICATE KEY UPDATE
        best_score = GREATEST(best_score, VALUES(best_score)),
        play_count = play_count + 1
    `, [name.slice(0, 32), parseInt(score)]);

    res.status(201).json({ id: result.insertId, name, score });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

module.exports = router;
