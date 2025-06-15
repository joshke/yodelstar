// Particle system utilities

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  decay: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
}

// Enhanced particle system with star shapes
export const createHitParticles = (x: number, y: number, accuracy: number): Particle[] => {
  const particleCount = Math.round(accuracy / 5) + 10; // More particles
  const newParticles: Particle[] = [];
  
  for (let i = 0; i < particleCount; i++) {
    const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
    const speed = 3 + Math.random() * 6; // Faster particles
    const size = 4 + Math.random() * 8; // Bigger particles
    
    newParticles.push({
      id: Date.now() + i,
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2, // Add upward bias
      size: size,
      life: 1.0,
      decay: 0.015 + Math.random() * 0.01, // Slower decay
      color: accuracy > 90 ? '#FFD700' : accuracy > 80 ? '#FFA500' : '#FFFF00',
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2
    });
  }
  
  return newParticles;
};

// Draw star shape
export const drawStar = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rotation: number): void => {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    const innerAngle = ((i * 4 + 2) * Math.PI) / 5 - Math.PI / 2;
    
    if (i === 0) {
      ctx.moveTo(Math.cos(angle) * size, Math.sin(angle) * size);
    } else {
      ctx.lineTo(Math.cos(angle) * size, Math.sin(angle) * size);
    }
    ctx.lineTo(Math.cos(innerAngle) * size * 0.5, Math.sin(innerAngle) * size * 0.5);
  }
  ctx.closePath();
  ctx.fill();
  
  ctx.restore();
};

// Create sparkle particles for excellent performance
export const createSparkleParticles = (canvasWidth: number, canvasHeight: number, intensity: number): Particle[] => {
  const sparkleCount = Math.round(intensity / 4);
  const newSparkles: Particle[] = [];
  
  for (let i = 0; i < sparkleCount; i++) {
    const x = Math.random() * canvasWidth;
    const y = Math.random() * canvasHeight;
    
    newSparkles.push({
      id: Date.now() + i + 1000, // Offset to avoid ID conflicts
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5 - 0.5, // Slight upward drift
      size: 2 + Math.random() * 4,
      life: 1.0,
      decay: 0.02 + Math.random() * 0.02,
      color: intensity >= 95 ? '#FFD700' : intensity >= 90 ? '#4CAF50' : '#FF9800',
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.3
    });
  }
  
  return newSparkles;
};

// Update particles animation
export const updateParticles = (particles: Particle[]): Particle[] => {
  return particles.map(p => ({
    ...p,
    x: p.x + p.vx,
    y: p.y + p.vy,
    vy: p.vy + 0.3, // Add gravity
    life: p.life - p.decay,
    size: p.size * 0.98,
    rotation: p.rotation + p.rotationSpeed
  })).filter(p => p.life > 0);
}; 