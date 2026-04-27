import React, { useState, useEffect } from 'react';
import GameCanvas from './components/GameCanvas';
import Scoreboard from './components/Scoreboard';
import './App.css';

const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:4000';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

export default function App() {
  const [screen, setScreen] = useState('menu'); // menu | game | scoreboard
  const [playerName, setPlayerName] = useState('');
  const [ws, setWs] = useState(null);
  const [finalScore, setFinalScore] = useState(0);

  const startGame = () => {
    if (!playerName.trim()) return;
    const socket = new WebSocket(WS_URL);
    socket.onopen = () => {
      socket.send(JSON.stringify({ type: 'JOIN', name: playerName }));
      setWs(socket);
      setScreen('game');
    };
    socket.onerror = () => alert('서버에 연결할 수 없습니다.');
  };

  const handleGameOver = (score) => {
    setFinalScore(score);
    if (ws) ws.close();
    setScreen('scoreboard');
  };

  return (
    <div className="app">
      {screen === 'menu' && (
        <div className="menu">
          <h1 className="title">🚀 GALAGA</h1>
          <p className="subtitle">3-Tier Web Game</p>
          <input
            className="name-input"
            type="text"
            placeholder="Enter your name"
            value={playerName}
            onChange={e => setPlayerName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && startGame()}
            maxLength={16}
          />
          <button className="start-btn" onClick={startGame}>START GAME</button>
          <button className="score-btn" onClick={() => setScreen('scoreboard')}>SCOREBOARD</button>
        </div>
      )}

      {screen === 'game' && (
        <GameCanvas ws={ws} playerName={playerName} onGameOver={handleGameOver} />
      )}

      {screen === 'scoreboard' && (
        <Scoreboard apiUrl={API_URL} finalScore={finalScore} onBack={() => setScreen('menu')} />
      )}
    </div>
  );
}
