import React, { useEffect, useRef } from "react";
import type { BloodClan } from "../model/bloodBoundTypes";

interface BloodBoundFireworksProps {
  winnerClan?: BloodClan | null;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  color: string;
  decay: number;
  flicker: boolean;
}

interface Rocket {
  x: number;
  y: number;
  targetY: number;
  vx: number;
  vy: number;
  color: string;
  exploded: boolean;
}

const CLAN_PALETTES: Record<string, string[]> = {
  ROSE: [
    "#f43f5e", // Ruby rose
    "#e11d48", // Deep crimson
    "#ff0055", // Neon ruby
    "#fda4af", // Rose pink
    "#ffd700", // Gold spark
    "#ff4d6d", // Bright rose
    "#ffffff", // White shimmer
  ],
  FAN: [
    "#10b981", // Emerald
    "#059669", // Jade
    "#34d399", // Mint green
    "#6ee7b7", // Radiant green
    "#00f5a0", // Bright neon jade
    "#fde047", // Amber accent
    "#ffffff", // White shimmer
  ],
  INQUISITOR: [
    "#f59e0b", // Solar gold
    "#fbbf24", // Radiant amber
    "#fde047", // Luminous yellow
    "#ea580c", // Royal flame
    "#d97706", // Dark bronze
    "#fef08a", // Pale gold
    "#ffffff", // White shimmer
  ],
};

export const BloodBoundFireworks: React.FC<BloodBoundFireworksProps> = ({ winnerClan = "ROSE" }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const palette = CLAN_PALETTES[winnerClan ?? "ROSE"] ?? CLAN_PALETTES.ROSE;
    const rockets: Rocket[] = [];
    const particles: Particle[] = [];

    const spawnRocket = () => {
      const startX = width * 0.15 + Math.random() * (width * 0.7);
      const targetY = height * 0.12 + Math.random() * (height * 0.35);
      const color = palette[Math.floor(Math.random() * palette.length)];
      rockets.push({
        x: startX,
        y: height,
        targetY,
        vx: (Math.random() - 0.5) * 3,
        vy: -(11 + Math.random() * 4),
        color,
        exploded: false,
      });
    };

    const explodeRocket = (x: number, y: number, baseColor: string) => {
      const count = 75 + Math.floor(Math.random() * 35);
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.5 + Math.random() * 7;
        const color = Math.random() > 0.3 ? baseColor : palette[Math.floor(Math.random() * palette.length)];
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1,
          size: 2 + Math.random() * 2.5,
          color,
          decay: 0.012 + Math.random() * 0.016,
          flicker: Math.random() > 0.4,
        });
      }
    };

    // Initial volley
    for (let i = 0; i < 4; i++) {
      setTimeout(spawnRocket, i * 250);
    }

    let lastRocketTime = Date.now();

    const loop = () => {
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter";

      const now = Date.now();
      if (now - lastRocketTime > 450 + Math.random() * 350) {
        spawnRocket();
        lastRocketTime = now;
      }

      // Update rockets
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.x += r.vx;
        r.y += r.vy;
        r.vy += 0.08; // gravity

        // Draw rocket head & trail
        ctx.beginPath();
        ctx.arc(r.x, r.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = r.color;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(r.x - r.vx * 1.5, r.y - r.vy * 1.5, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        ctx.fill();

        if (r.vy >= -1 || r.y <= r.targetY) {
          explodeRocket(r.x, r.y, r.color);
          rockets.splice(i, 1);
        }
      }

      // Update particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.96;
        p.vy *= 0.96;
        p.vy += 0.06; // gravity
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        const drawAlpha = p.flicker && Math.random() > 0.4 ? p.alpha * 0.4 : p.alpha;
        ctx.save();
        ctx.globalAlpha = Math.max(0, drawAlpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.restore();
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, [winnerClan]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 50,
      }}
    />
  );
};
