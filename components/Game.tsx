
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, 
  CITY_COUNT, BATTERY_COUNT,
  PLAYER_MISSILE_SPEED, EXPLOSION_MAX_RADIUS, EXPLOSION_GROWTH_RATE,
  MISSILE_SPEED_MIN, MISSILE_SPEED_MAX
} from '../constants';
import { EnemyMissile, PlayerMissile, Explosion, City, Battery, Point } from '../types';

interface GameProps {
  score: number;
  onGameOver: (score: number) => void;
  onVictory: (score: number) => void;
}

const Game: React.FC<GameProps> = ({ score, onGameOver, onVictory }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | undefined>(undefined);
  const lastMousePos = useRef<Point>({ x: CANVAS_WIDTH / 2, y: 0 });
  const isInitialized = useRef(false);
  
  const enemyMissiles = useRef<EnemyMissile[]>([]);
  const playerMissiles = useRef<PlayerMissile[]>([]);
  const explosions = useRef<Explosion[]>([]);
  const cities = useRef<City[]>([]);
  const batteries = useRef<Battery[]>([]);
  
  const [currentScore, setCurrentScore] = useState(score);
  const [totalAmmo, setTotalAmmo] = useState(0);

  const getCanvasCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const canvasAspect = CANVAS_WIDTH / CANVAS_HEIGHT;
    const rectAspect = rect.width / rect.height;
    
    let renderWidth, renderHeight, xOffset = 0, yOffset = 0;
    if (rectAspect > canvasAspect) {
      renderHeight = rect.height;
      renderWidth = renderHeight * canvasAspect;
      xOffset = (rect.width - renderWidth) / 2;
    } else {
      renderWidth = rect.width;
      renderHeight = renderWidth / canvasAspect;
      yOffset = (rect.height - renderHeight) / 2;
    }
    const x = (clientX - rect.left - xOffset) * (CANVAS_WIDTH / renderWidth);
    const y = (clientY - rect.top - yOffset) * (CANVAS_HEIGHT / renderHeight);
    return { x, y };
  };

  const initGame = useCallback(() => {
    isInitialized.current = false;
    
    const citySpacing = CANVAS_WIDTH / (CITY_COUNT + BATTERY_COUNT + 1);
    const positions = [
      { type: 'B', x: citySpacing }, { type: 'C', x: citySpacing * 2 },
      { type: 'C', x: citySpacing * 3 }, { type: 'C', x: citySpacing * 4 },
      { type: 'B', x: citySpacing * 5 }, { type: 'C', x: citySpacing * 6 },
      { type: 'C', x: citySpacing * 7 }, { type: 'C', x: citySpacing * 8 },
      { type: 'B', x: citySpacing * 9 },
    ];

    let cityIdx = 0;
    let batteryIdx = 0;
    cities.current = [];
    batteries.current = [];
    positions.forEach(p => {
      if (p.type === 'C') {
        cities.current.push({ id: `city-${cityIdx++}`, pos: { x: p.x, y: CANVAS_HEIGHT - 45 }, isDestroyed: false });
      } else {
        let ammo = 50; 
        batteries.current.push({ id: `battery-${batteryIdx++}`, pos: { x: p.x, y: CANVAS_HEIGHT - 35 }, ammo, maxAmmo: ammo, isDestroyed: false });
      }
    });

    enemyMissiles.current = [];
    playerMissiles.current = [];
    explosions.current = [];
    updateTotalAmmo();
    setTimeout(() => { isInitialized.current = true; }, 100);
  }, []);

  useEffect(() => { initGame(); }, [initGame]);

  const updateTotalAmmo = () => {
    const ammoCount = batteries.current.reduce((acc, b) => acc + (b.isDestroyed ? 0 : b.ammo), 0);
    setTotalAmmo(ammoCount);
  };

  const spawnEnemyMissile = () => {
    const startX = Math.random() * CANVAS_WIDTH;
    const targets = [...cities.current.filter(c => !c.isDestroyed), ...batteries.current.filter(b => !b.isDestroyed)];
    if (targets.length === 0) return;
    
    const difficultyScale = 1 + (currentScore / 2000);
    const speed = (MISSILE_SPEED_MIN + Math.random() * (MISSILE_SPEED_MAX - MISSILE_SPEED_MIN)) * Math.min(difficultyScale, 4);
    
    const target = targets[Math.floor(Math.random() * targets.length)];
    enemyMissiles.current.push({
      id: Math.random().toString(36).substr(2, 9),
      startPos: { x: startX, y: 0 },
      pos: { x: startX, y: 0 },
      targetPos: { x: target.pos.x, y: target.pos.y },
      progress: 0,
      speed: speed / 1000,
      isDestroyed: false
    });
  };

  const update = () => {
    if (!isInitialized.current) return;

    if (currentScore >= 1000) {
      onVictory(currentScore);
      isInitialized.current = false;
      return;
    }

    const spawnChance = 0.01 + (currentScore / 10000);
    if (Math.random() < Math.min(spawnChance, 0.08)) {
      spawnEnemyMissile();
    }

    if (currentScore > 0 && currentScore % 1000 === 0) {
        batteries.current.forEach(b => { if(!b.isDestroyed) b.ammo += 1; });
        updateTotalAmmo();
    }

    enemyMissiles.current.forEach(m => {
      m.progress += m.speed;
      m.pos.x = m.startPos.x + (m.targetPos.x - m.startPos.x) * m.progress;
      m.pos.y = m.startPos.y + (m.targetPos.y - m.startPos.y) * m.progress;
      if (m.progress >= 1) {
        m.isDestroyed = true;
        explosions.current.push({ id: Math.random().toString(36).substr(2, 9), pos: m.targetPos, radius: 0, maxRadius: EXPLOSION_MAX_RADIUS, expanding: true, isFinished: false });
        cities.current.forEach(c => { if (Math.hypot(c.pos.x - m.targetPos.x, c.pos.y - m.targetPos.y) < 30) c.isDestroyed = true; });
        batteries.current.forEach(b => { if (Math.hypot(b.pos.x - m.targetPos.x, b.pos.y - m.targetPos.y) < 35) { b.isDestroyed = true; updateTotalAmmo(); } });
      }
    });
    enemyMissiles.current = enemyMissiles.current.filter(m => !m.isDestroyed);

    playerMissiles.current.forEach(m => {
      m.progress += m.speed;
      m.pos.x = m.startPos.x + (m.targetPos.x - m.startPos.x) * m.progress;
      m.pos.y = m.startPos.y + (m.targetPos.y - m.startPos.y) * m.progress;
      if (m.progress >= 1) {
        m.isExploding = true;
        explosions.current.push({ id: Math.random().toString(36).substr(2, 9), pos: m.targetPos, radius: 0, maxRadius: EXPLOSION_MAX_RADIUS * 1.2, expanding: true, isFinished: false });
      }
    });
    playerMissiles.current = playerMissiles.current.filter(m => !m.isExploding);

    explosions.current.forEach(ex => {
      if (ex.expanding) { ex.radius += EXPLOSION_GROWTH_RATE; if (ex.radius >= ex.maxRadius) ex.expanding = false; }
      else { ex.radius -= EXPLOSION_GROWTH_RATE * 0.4; if (ex.radius <= 0) { ex.isFinished = true; } }
      enemyMissiles.current.forEach(m => {
        if (Math.hypot(m.pos.x - ex.pos.x, m.pos.y - ex.pos.y) < ex.radius) {
          m.isDestroyed = true; setCurrentScore(s => s + 25);
          explosions.current.push({ id: Math.random().toString(36).substr(2, 9), pos: m.pos, radius: 0, maxRadius: EXPLOSION_MAX_RADIUS * 0.9, expanding: true, isFinished: false });
        }
      });
    });
    explosions.current = explosions.current.filter(ex => !ex.isFinished);

    if (batteries.current.filter(b => !b.isDestroyed).length === 0) { 
      onGameOver(currentScore); 
      isInitialized.current = false;
      return; 
    }
  };

  const drawEnvironment = (ctx: CanvasRenderingContext2D) => {
    // Space Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    bgGrad.addColorStop(0, '#000000');
    bgGrad.addColorStop(0.8, '#0a0a20');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Stars
    ctx.fillStyle = '#ffffff';
    for(let i=0; i<50; i++) {
        const x = (i * 137.5) % CANVAS_WIDTH;
        const y = (i * 181.1) % (CANVAS_HEIGHT * 0.7);
        const size = Math.random() * 1.5;
        ctx.globalAlpha = 0.3 + Math.random() * 0.7;
        ctx.fillRect(x, y, size, size);
    }
    ctx.globalAlpha = 1.0;

    // Distant Cyber City Silhouettes
    ctx.fillStyle = '#050510';
    const cityPoints = [0, 100, 180, 250, 400, 520, 600, 720, 800];
    const cityHeights = [20, 60, 40, 90, 30, 70, 50, 80, 20];
    ctx.beginPath();
    ctx.moveTo(0, CANVAS_HEIGHT - 60);
    for(let i=0; i<cityPoints.length; i++) {
        ctx.lineTo(cityPoints[i], CANVAS_HEIGHT - 60 - cityHeights[i]);
    }
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT - 60);
    ctx.fill();

    // Ground / Horizon
    const groundHeight = 60;
    const horizonY = CANVAS_HEIGHT - groundHeight;

    // Ground Surface
    const groundGrad = ctx.createLinearGradient(0, horizonY, 0, CANVAS_HEIGHT);
    groundGrad.addColorStop(0, '#101025');
    groundGrad.addColorStop(1, '#000000');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, horizonY, CANVAS_WIDTH, groundHeight);

    // Grid on Ground
    ctx.strokeStyle = '#00f2ff22';
    ctx.lineWidth = 1;
    // Horizontal lines
    for(let i=0; i<=groundHeight; i+=15) {
        ctx.beginPath();
        ctx.moveTo(0, horizonY + i);
        ctx.lineTo(CANVAS_WIDTH, horizonY + i);
        ctx.stroke();
    }
    // Vertical perspective lines
    for(let i=0; i<=CANVAS_WIDTH; i+=80) {
        ctx.beginPath();
        ctx.moveTo(i, horizonY);
        ctx.lineTo(i + (i - CANVAS_WIDTH/2) * 0.5, CANVAS_HEIGHT);
        ctx.stroke();
    }

    // Glowing Horizon Line
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00f2ff';
    ctx.strokeStyle = '#00f2ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    ctx.lineTo(CANVAS_WIDTH, horizonY);
    ctx.stroke();
    ctx.shadowBlur = 0;
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    drawEnvironment(ctx);

    // Scanlines effect
    ctx.fillStyle = 'rgba(18, 16, 16, 0.1)';
    for(let i = 0; i < CANVAS_HEIGHT; i += 4) {
      ctx.fillRect(0, i, CANVAS_WIDTH, 1);
    }

    cities.current.forEach(c => {
      if (c.isDestroyed) {
          // Draw ruins
          ctx.fillStyle = '#1a1a1a';
          ctx.fillRect(c.pos.x - 12, c.pos.y + 5, 24, 10);
          return;
      }
      // Futuristic City Modules
      ctx.fillStyle = '#00b894';
      ctx.beginPath();
      ctx.moveTo(c.pos.x - 15, c.pos.y + 15);
      ctx.lineTo(c.pos.x - 12, c.pos.y - 5);
      ctx.lineTo(c.pos.x + 12, c.pos.y - 5);
      ctx.lineTo(c.pos.x + 15, c.pos.y + 15);
      ctx.fill();
      
      // Neon highlights
      ctx.fillStyle = '#55efc4';
      ctx.fillRect(c.pos.x - 4, c.pos.y - 15, 8, 15);
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#55efc4';
      ctx.fillRect(c.pos.x - 2, c.pos.y - 20, 4, 10);
      ctx.shadowBlur = 0;
    });

    batteries.current.forEach(b => {
      const { pos, ammo, isDestroyed } = b;
      const time = Date.now();
      
      // Base Platform
      ctx.fillStyle = '#1e272e';
      ctx.beginPath();
      ctx.moveTo(pos.x - 30, pos.y + 20);
      ctx.lineTo(pos.x - 20, pos.y - 10);
      ctx.lineTo(pos.x + 20, pos.y - 10);
      ctx.lineTo(pos.x + 30, pos.y + 20);
      ctx.fill();
      
      // Platform trim
      ctx.strokeStyle = isDestroyed ? '#333' : '#00f2ff';
      ctx.lineWidth = 2;
      ctx.stroke();

      if (isDestroyed) {
          ctx.fillStyle = '#111';
          ctx.beginPath(); ctx.arc(pos.x, pos.y - 5, 15, 0, Math.PI * 2); ctx.fill();
          return;
      }

      // Turret Head
      const angle = Math.atan2(lastMousePos.current.y - pos.y, lastMousePos.current.x - pos.x);
      ctx.save();
      ctx.translate(pos.x, pos.y - 5);
      ctx.rotate(angle);

      // Barrels
      ctx.fillStyle = '#485460';
      ctx.fillRect(5, -8, 25, 6);
      ctx.fillRect(5, 2, 25, 6);
      
      // Barrel glow
      if (ammo > 0) {
          const intensity = Math.abs(Math.sin(time / 200));
          ctx.fillStyle = `rgba(0, 242, 255, ${0.3 + intensity * 0.4})`;
          ctx.fillRect(25, -7, 6, 4);
          ctx.fillRect(25, 3, 6, 4);
      }

      // Rotating head body
      ctx.fillStyle = '#2f3542';
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI * 2);
      ctx.fill();
      
      // Head Detail
      ctx.strokeStyle = '#00f2ff44';
      ctx.beginPath(); ctx.arc(0,0, 10, 0, Math.PI); ctx.stroke();

      ctx.restore();

      // UI Text for Battery
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.shadowBlur = 5;
      ctx.shadowColor = ammo > 10 ? '#00f2ff' : '#ff4757';
      ctx.fillText(ammo.toString(), pos.x, pos.y + 35);
      ctx.shadowBlur = 0;
    });

    enemyMissiles.current.forEach(m => {
      const time = Date.now();
      const pulse = Math.sin(time / 100) * 3;
      const trailGradient = ctx.createLinearGradient(m.startPos.x, m.startPos.y, m.pos.x, m.pos.y);
      trailGradient.addColorStop(0, 'rgba(255, 0, 0, 0)');
      trailGradient.addColorStop(1, 'rgba(255, 63, 52, 0.8)');
      
      ctx.strokeStyle = trailGradient;
      ctx.lineWidth = 4; // Increased from 2 to 4
      ctx.beginPath(); ctx.moveTo(m.startPos.x, m.startPos.y); ctx.lineTo(m.pos.x, m.pos.y); ctx.stroke();

      const glow = ctx.createRadialGradient(m.pos.x, m.pos.y, 0, m.pos.x, m.pos.y, 10 + pulse);
      glow.addColorStop(0, '#ffffff');
      glow.addColorStop(0.2, '#ff3f34');
      glow.addColorStop(1, 'rgba(255, 0, 0, 0)');
      
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(m.pos.x, m.pos.y, 10 + pulse, 0, Math.PI * 2); ctx.fill();
    });

    playerMissiles.current.forEach(m => {
      ctx.strokeStyle = '#00f2ff'; 
      ctx.lineWidth = 4; // Increased from 2 to 4
      ctx.beginPath(); ctx.moveTo(m.startPos.x, m.startPos.y); ctx.lineTo(m.pos.x, m.pos.y); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.fillRect(m.pos.x - 3, m.pos.y - 3, 6, 6); // Slightly bigger head too
    });

    explosions.current.forEach(ex => {
      const grad = ctx.createRadialGradient(ex.pos.x, ex.pos.y, 0, ex.pos.x, ex.pos.y, ex.radius);
      grad.addColorStop(0, '#fff'); 
      grad.addColorStop(0.3, '#00f2ff'); 
      grad.addColorStop(0.6, '#3742fa');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = grad;
      ctx.globalAlpha = 0.8;
      ctx.beginPath(); ctx.arc(ex.pos.x, ex.pos.y, ex.radius, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1.0;
    });
  };

  useEffect(() => {
    const loop = () => {
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) { update(); draw(ctx); }
      requestRef.current = requestAnimationFrame(loop);
    };
    requestRef.current = requestAnimationFrame(loop);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [currentScore]);

  const handlePointer = (e: React.MouseEvent | React.PointerEvent) => {
    if (!isInitialized.current) return;
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    if (y > CANVAS_HEIGHT - 60) return;
    let best = null; let minD = Infinity;
    batteries.current.forEach(b => {
      if (b.ammo > 0 && !b.isDestroyed) { const d = Math.abs(b.pos.x - x); if (d < minD) { minD = d; best = b; } }
    });
    if (best) {
      best.ammo--; updateTotalAmmo();
      playerMissiles.current.push({ id: Math.random().toString(36).substr(2, 9), startPos: { x: best.pos.x, y: best.pos.y - 15 }, pos: { x: best.pos.x, y: best.pos.y - 15 }, targetPos: { x, y }, progress: 0, speed: PLAYER_MISSILE_SPEED / 200, isExploding: false });
    }
  };

  const handleMouseMove = (e: React.MouseEvent | React.PointerEvent) => {
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    lastMousePos.current = { x, y };
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black">
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-10 pointer-events-none">
        <div className="p-3 bg-black/40 border-l-4 border-cyan-400 backdrop-blur-md rounded-r-lg">
          <span className="text-cyan-400 text-[10px] font-bold uppercase tracking-widest block mb-1">DEFENSE SCORE / 战果</span>
          <span className="text-white text-3xl font-black font-mono tracking-tighter">{currentScore.toLocaleString()}</span>
        </div>
        <div className="p-3 bg-black/40 border-b-4 border-cyan-500 text-center backdrop-blur-md rounded-b-lg min-w-[140px]">
          <span className="text-cyan-400 text-[10px] font-bold uppercase tracking-widest block mb-1">ARSENAL / 弹药量</span>
          <span className={`text-white text-3xl font-black font-mono ${totalAmmo < 15 ? 'text-red-500 animate-pulse' : ''}`}>{totalAmmo}</span>
        </div>
        <div className="p-3 bg-black/40 border-r-4 border-cyan-500 text-right backdrop-blur-md rounded-l-lg">
          <span className="text-cyan-400 text-[10px] font-bold uppercase tracking-widest block mb-1">SECTOR STATUS / 扇区状态</span>
          <span className="text-emerald-400 text-2xl font-black font-mono">OPERATIONAL</span>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onMouseDown={handlePointer}
        onPointerMove={handleMouseMove}
        className="w-full h-full object-contain cursor-crosshair shadow-2xl"
      />
    </div>
  );
};

export default Game;
