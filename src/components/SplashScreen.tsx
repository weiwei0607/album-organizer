import { useEffect, useRef } from 'react';

interface Props {
  onDone: () => void;
  isDark: boolean;
}

export function SplashScreen({ onDone, isDark }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const maybeCtx = canvas.getContext('2d');
    if (!maybeCtx) return;
    const ctx = maybeCtx;

    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;

    const BG    = isDark ? '#0D0C0A' : '#F9F8F6';
    const BLADE = isDark ? 'rgba(16,185,129,0.85)' : 'rgba(16,185,129,0.7)';
    const TEXT  = isDark ? '#F5F2EE' : '#1A1814';

    const DURATION = 2000;
    const startTime = performance.now();
    let frame = 0;
    let raf: number;

    // Shutter blade count
    const BLADES = 8;
    const R = Math.min(W, H) * 0.36;

    function drawShutter(t: number) {
      // t: 0 = closed, 1 = fully open
      // Each blade sweeps from center toward edge

      // Shutter opening animation: blades rotate away
      const openAngle = t * Math.PI * 0.9; // how far blades sweep open

      for (let i = 0; i < BLADES; i++) {
        const baseAngle = (i / BLADES) * Math.PI * 2;
        const sweepAngle = baseAngle + openAngle;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(sweepAngle);

        // Blade shape: a curved triangular wedge
        const bladeW = (Math.PI * 2 / BLADES) * 0.85;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, R, 0, bladeW);
        ctx.closePath();

        // Gradient for depth
        const grd = ctx.createLinearGradient(0, 0, R, 0);
        grd.addColorStop(0, isDark ? 'rgba(24,22,20,0.95)' : 'rgba(240,235,225,0.95)');
        grd.addColorStop(1, isDark ? 'rgba(15,20,16,0.9)'  : 'rgba(227,220,208,0.9)');
        ctx.fillStyle = grd;
        ctx.fill();

        // Edge highlight
        ctx.strokeStyle = BLADE;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.restore();
      }
    }

    function draw(now: number) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / DURATION, 1);

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);

      // Center reveal area (what's visible through open shutter)
      if (t > 0) {
        const revealR = Math.min(t * 1.6, 1) * R * 1.1;
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, revealR, 0, Math.PI * 2);
        ctx.clip();

        // Gradient background visible through the shutter
        const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, revealR);
        grd.addColorStop(0, isDark ? '#1A1814' : '#FFFCF5');
        grd.addColorStop(1, isDark ? '#0D0C0A' : '#F0EDEA');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, W, H);

        // Emerald center glow
        const glowGrd = ctx.createRadialGradient(cx, cy, 0, cx, cy, revealR * 0.7);
        glowGrd.addColorStop(0, 'rgba(16,185,129,0.12)');
        glowGrd.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGrd;
        ctx.fillRect(0, 0, W, H);

        ctx.restore();
      }

      // Draw shutter blades
      const shutterOpen = Math.min(t * 1.3, 1);
      drawShutter(shutterOpen);

      // Camera lens rings overlay
      if (t > 0.15) {
        const lensAlpha = Math.min((t - 0.15) / 0.3, 0.5) * (1 - shutterOpen * 0.8);
        for (let ring = 1; ring <= 3; ring++) {
          ctx.beginPath();
          ctx.arc(cx, cy, (R / 3.5) * ring, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(16,185,129,${lensAlpha * (1.1 - ring * 0.2)})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }

      // Center camera icon dot
      const dotR = 6 + Math.sin(frame * 0.08) * 1;
      ctx.beginPath();
      ctx.arc(cx, cy, dotR, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(16,185,129,${0.8 * Math.min(t * 4, 1)})`;
      ctx.shadowColor = 'rgba(16,185,129,0.5)';
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Title text
      if (t > 0.45) {
        const textT = Math.min((t - 0.45) / 0.3, 1) * (t < 0.78 ? 1 : (1 - t) * 4.5);
        ctx.save();
        ctx.globalAlpha = Math.max(0, textT);
        ctx.font = `bold ${Math.round(W * 0.072)}px 'DM Sans', -apple-system, sans-serif`;
        ctx.fillStyle = TEXT;
        ctx.textAlign = 'center';
        ctx.fillText('相簿整理', cx, cy + R * 0.68);
        ctx.font = `400 ${Math.round(W * 0.03)}px 'DM Sans', sans-serif`;
        ctx.fillStyle = `rgba(16,185,129,0.9)`;
        ctx.fillText('截圖轉筆記 · 回憶標狀態', cx, cy + R * 0.68 + 32);
        ctx.restore();
      }

      // Fade out
      if (t > 0.77) {
        const fade = (t - 0.77) / 0.23;
        ctx.fillStyle = `${BG.replace(')', `,${fade})`).replace('rgb', 'rgba').replace('#', 'rgba(').replace(/^rgba\(([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/, (_, r, g, b) => `rgba(${parseInt(r,16)},${parseInt(g,16)},${parseInt(b,16)}`)}`;
        // Simple approach:
        ctx.fillStyle = isDark ? `rgba(13,12,10,${fade})` : `rgba(249,248,246,${fade})`;
        ctx.fillRect(0, 0, W, H);
      }

      frame++;
      if (t < 1) {
        raf = requestAnimationFrame(draw);
      } else {
        onDone();
      }
    }

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [onDone, isDark]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[9999] cursor-none"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
}
