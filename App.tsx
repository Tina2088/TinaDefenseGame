
import React, { useState } from 'react';
import Game from './components/Game';
import { GameState, GameStats } from './types';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    citiesSaved: 6,
    totalMissilesFired: 0
  });

  const startGame = () => {
    setStats({
      score: 0,
      citiesSaved: 6,
      totalMissilesFired: 0
    });
    setGameState(GameState.PLAYING);
  };

  const handleGameOver = (finalScore: number) => {
    setStats(prev => ({ ...prev, score: finalScore }));
    setGameState(GameState.GAME_OVER);
  };

  const handleVictory = (finalScore: number) => {
    setStats(prev => ({ ...prev, score: finalScore }));
    setGameState(GameState.VICTORY);
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center overflow-hidden select-none">
      {gameState === GameState.MENU && (
        <div className="z-20 text-center space-y-6 p-8 bg-black/80 border-4 border-cyan-500 rounded-xl shadow-[0_0_20px_rgba(0,255,255,0.5)] max-w-[90vw] animate-in fade-in zoom-in duration-300">
          <div className="space-y-1">
            <h1 className="text-4xl md:text-6xl font-black text-cyan-400 tracking-tighter italic">TINA DEFENSE</h1>
            <h2 className="text-xl md:text-2xl font-bold text-cyan-600 tracking-widest">Tina新星防御</h2>
          </div>
          <div className="text-white text-sm md:text-lg max-w-md mx-auto opacity-80 leading-relaxed">
            <p>轨道打击即将降临。在敌方弹头撞击城市前，点击屏幕发射拦截导弹。达到 1000 分即可获得阶段性胜利。</p>
          </div>
          <div className="flex flex-col gap-4 items-center pt-4">
            <button
              onClick={startGame}
              className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xl md:text-2xl rounded-full transition-all transform hover:scale-105 active:scale-95 shadow-lg flex flex-col items-center"
            >
              <span>INITIALIZE DEFENSE</span>
              <span className="text-xs opacity-80 font-normal">启动防御程序</span>
            </button>
            <div className="text-[10px] md:text-xs text-cyan-300/50 mt-4 uppercase tracking-widest text-center">
              点击屏幕发射 • 无尽防御模式 • 1000分获胜
            </div>
          </div>
        </div>
      )}

      {gameState === GameState.VICTORY && (
        <div className="z-20 text-center space-y-6 p-10 bg-black/90 border-4 border-emerald-500 rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.5)] animate-in fade-in zoom-in duration-500">
          <div className="space-y-1">
            <h2 className="text-4xl md:text-5xl font-black text-emerald-400 uppercase">MISSION ACCOMPLISHED</h2>
            <h3 className="text-xl md:text-2xl font-bold text-emerald-600">防御任务圆满成功</h3>
          </div>
          <div className="space-y-4 text-white">
            <p className="text-xs text-emerald-400 uppercase tracking-widest">Final Status / 最终得分</p>
            <p className="text-yellow-400 font-bold text-4xl">{stats.score.toLocaleString()}</p>
          </div>
          <button
            onClick={startGame}
            className="px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-2xl rounded-full transition-all transform hover:scale-105"
          >
            再次出征
          </button>
        </div>
      )}

      {gameState === GameState.GAME_OVER && (
        <div className="z-20 text-center space-y-6 p-10 bg-black/90 border-4 border-red-600 rounded-xl shadow-[0_0_30px_rgba(255,0,0,0.5)] animate-pulse">
          <div className="space-y-1">
            <h2 className="text-4xl md:text-5xl font-black text-red-500 uppercase">DEFENSE FAILED</h2>
            <h3 className="text-xl md:text-2xl font-bold text-red-700">城市群已陷落</h3>
          </div>
          <div className="space-y-4 text-white">
            <p className="text-xs text-red-400 uppercase tracking-widest">Strategic Score / 战损评估</p>
            <p className="text-yellow-400 font-bold text-4xl">{stats.score.toLocaleString()}</p>
          </div>
          <button
            onClick={startGame}
            className="px-10 py-4 bg-red-600 hover:bg-red-500 text-white font-bold text-2xl rounded-full transition-all transform hover:scale-105"
          >
            重新尝试
          </button>
        </div>
      )}

      {gameState === GameState.PLAYING && (
        <Game
          score={stats.score}
          onGameOver={handleGameOver}
          onVictory={handleVictory}
        />
      )}
      
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900 via-transparent to-transparent -z-10"></div>
    </div>
  );
};

export default App;
