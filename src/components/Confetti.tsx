import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  angularVelocity: number;
  color: string;
  width: number;
  height: number;
  shape: 'rect' | 'circle' | 'star';
  opacity: number;
}

const COLORS = [
  '#F9C5D1', '#E8849A', '#C8A8D8', '#A480C4',
  '#FFD6E7', '#FFECF0', '#D4A4E8', '#FFB3C6',
  '#87CEEB', '#98FB98', '#FFD700', '#FFA07A',
];

function createParticle(canvasWidth: number): Particle {
  const shape = (['rect', 'circle', 'star'] as const)[Math.floor(Math.random() * 3)];
  return {
    x: Math.random() * canvasWidth,
    y: -20,
    vx: (Math.random() - 0.5) * 3,
    vy: Math.random() * 2 + 1.5,
    angle: Math.random() * Math.PI * 2,
    angularVelocity: (Math.random() - 0.5) * 0.15,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    width: Math.random() * 10 + 6,
    height: Math.random() * 6 + 4,
    shape,
    opacity: 1,
  };
}

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const spikes = 5;
  const outerR = r;
  const innerR = r * 0.4;
  let rot = (Math.PI / 2) * 3;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerR);
  for (let i = 0; i < spikes; i++) {
    ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
    rot += step;
    ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerR);
  ctx.closePath();
}

interface ConfettiProps {
  active?: boolean;
  particleCount?: number;
}

export function Confetti({ active = true, particleCount = 120 }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const spawnedRef = useRef(0);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d')!;

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    resize();
    window.addEventListener('resize', resize);

    let spawnInterval: ReturnType<typeof setInterval>;

    // Spawn particles over time
    spawnInterval = setInterval(() => {
      if (spawnedRef.current >= particleCount) {
        clearInterval(spawnInterval);
        return;
      }
      const batch = Math.min(5, particleCount - spawnedRef.current);
      for (let i = 0; i < batch; i++) {
        particlesRef.current.push(createParticle(canvas.width));
      }
      spawnedRef.current += batch;
    }, 80);

    function animate() {
      if (!canvas || !ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current = particlesRef.current.filter((p) => p.opacity > 0.01);

      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.04; // gravity
        p.vx *= 0.99;  // air resistance
        p.angle += p.angularVelocity;

        // Fade out near bottom
        if (p.y > canvas.height * 0.75) {
          p.opacity -= 0.012;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;

        if (p.shape === 'rect') {
          ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
        } else if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.width / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          drawStar(ctx, 0, 0, p.width / 2);
          ctx.fill();
        }

        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(animate);
    }

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearInterval(spawnInterval);
      window.removeEventListener('resize', resize);
      particlesRef.current = [];
      spawnedRef.current = 0;
    };
  }, [active, particleCount]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="confetti-canvas"
      aria-hidden="true"
    />
  );
}
