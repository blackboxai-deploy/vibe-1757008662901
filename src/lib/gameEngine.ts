export interface GameState {
  isPlaying: boolean;
  isPaused: boolean;
  score: number;
  level: number;
  lives: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface GameBounds {
  width: number;
  height: number;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationId: number | null = null;
  private lastTime = 0;
  private gameLoop: ((deltaTime: number) => void) | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not get 2D context from canvas');
    }
    this.ctx = context;
    this.setupCanvas();
  }

  private setupCanvas() {
    // Set up high-DPI canvas
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
  }

  setGameLoop(gameLoop: (deltaTime: number) => void) {
    this.gameLoop = gameLoop;
  }

  start() {
    if (this.animationId) return;
    this.lastTime = performance.now();
    this.animate();
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private animate = (currentTime: number) => {
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    if (this.gameLoop) {
      this.gameLoop(deltaTime);
    }

    this.animationId = requestAnimationFrame(this.animate);
  };

  clear() {
    const rect = this.canvas.getBoundingClientRect();
    this.ctx.clearRect(0, 0, rect.width, rect.height);
  }

  drawRect(x: number, y: number, width: number, height: number, color: string) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, width, height);
  }

  drawCircle(x: number, y: number, radius: number, color: string) {
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fill();
  }

  drawText(text: string, x: number, y: number, color = '#fff', font = '16px Arial') {
    this.ctx.fillStyle = color;
    this.ctx.font = font;
    this.ctx.fillText(text, x, y);
  }

  getCanvas() {
    return this.canvas;
  }

  getContext() {
    return this.ctx;
  }

  getBounds(): GameBounds {
    return {
      width: this.canvas.width,
      height: this.canvas.height
    };
  }
}

export class InputManager {
  private keys: Set<string> = new Set();
  private touches: Map<number, Point> = new Map();

  constructor(canvas: HTMLCanvasElement) {
    this.setupKeyboard();
    this.setupTouch(canvas);
  }

  private setupKeyboard() {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });
  }

  private setupTouch(canvas: HTMLCanvasElement) {
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const rect = canvas.getBoundingClientRect();
        this.touches.set(touch.identifier, {
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top
        });
      }
    });

    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        this.touches.delete(touch.identifier);
      }
    });
  }

  isKeyPressed(key: string): boolean {
    return this.keys.has(key);
  }

  getTouches(): Point[] {
    return Array.from(this.touches.values());
  }

  clear() {
    this.keys.clear();
    this.touches.clear();
  }
}

export class CollisionDetector {
  static pointInRect(point: Point, rect: { x: number; y: number; width: number; height: number }): boolean {
    return point.x >= rect.x && 
           point.x <= rect.x + rect.width && 
           point.y >= rect.y && 
           point.y <= rect.y + rect.height;
  }

  static rectIntersect(rect1: { x: number; y: number; width: number; height: number }, 
                      rect2: { x: number; y: number; width: number; height: number }): boolean {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  }

  static circleIntersect(circle1: { x: number; y: number; radius: number }, 
                        circle2: { x: number; y: number; radius: number }): boolean {
    const dx = circle1.x - circle2.x;
    const dy = circle1.y - circle2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < circle1.radius + circle2.radius;
  }
}

export const Utils = {
  randomBetween: (min: number, max: number): number => {
    return Math.random() * (max - min) + min;
  },

  randomInt: (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  clamp: (value: number, min: number, max: number): number => {
    return Math.max(min, Math.min(max, value));
  },

  lerp: (start: number, end: number, factor: number): number => {
    return start + (end - start) * factor;
  },

  distance: (p1: Point, p2: Point): number => {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
};