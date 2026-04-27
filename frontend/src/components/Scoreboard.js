import React, { useEffect, useState } from 'react';
import './Scoreboard.css';

export default function Scoreboard({ apiUrl, finalScore, onBack }) {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${apiUrl}/api/scores`)
      .then(r => r.json())
      .then(data => { setScores(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [apiUrl]);

  return (
    <div className="scoreboard">
      <h2 className="sb-title">🏆 SCOREBOARD</h2>
      {finalScore > 0 && (
        <p className="your-score">Your Score: <span>{finalScore}</span></p>
      )}
      {loading ? (
        <p className="loading">Loading...</p>
      ) : (
        <table className="score-table">
          <thead>
            <tr><th>#</th><th>Player</th><th>Score</th><th>Date</th></tr>
          </thead>
          <tbody>
            {scores.map((s, i) => (
              <tr key={s.id} className={i === 0 ? 'top' : ''}>
                <td>{i + 1}</td>
                <td>{s.name}</td>
                <td>{s.score}</td>
                <td>{new Date(s.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {scores.length === 0 && (
              <tr><td colSpan="4" style={{ textAlign: 'center', color: '#555' }}>No scores yet</td></tr>
            )}
          </tbody>
        </table>
      )}
      <button className="back-btn" onClick={onBack}>← BACK</button>
    </div>
  );
}
