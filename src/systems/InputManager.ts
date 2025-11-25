export interface Vector2D {
  x: number;
  y: number;
}

export interface TouchState {
  leftId: number | null;
  rightId: number | null;
  moveVector: Vector2D;
  aimVector: Vector2D;
  leftStart: Vector2D;
  leftCurrent: Vector2D;
}

export interface KeyState {
  w: boolean;
  a: boolean;
  s: boolean;
  d: boolean;
}

export class InputManager {
  private keys: KeyState = { w: false, a: false, s: false, d: false };
  private mouse: Vector2D = { x: 0, y: 0 };
  private touches: TouchState = {
    leftId: null,
    rightId: null,
    moveVector: { x: 0, y: 0 },
    aimVector: { x: 0, y: 0 },
    leftStart: { x: 0, y: 0 },
    leftCurrent: { x: 0, y: 0 }
  };

  constructor(private canvas: HTMLCanvasElement) {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Keyboard
    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      if (key in this.keys) {
        this.keys[key as keyof KeyState] = true;
      }
    });

    window.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase();
      if (key in this.keys) {
        this.keys[key as keyof KeyState] = false;
      }
    });

    // Mouse
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });

    // Touch
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
  }

  private handleTouchStart(e: TouchEvent): void {
    e.preventDefault();
    for (const touch of Array.from(e.changedTouches)) {
      if (touch.clientX < this.canvas.width / 2 && this.touches.leftId === null) {
        this.touches.leftId = touch.identifier;
        this.touches.leftStart = this.touches.leftCurrent = { x: touch.clientX, y: touch.clientY };
      } else if (touch.clientX >= this.canvas.width / 2 && this.touches.rightId === null) {
        this.touches.rightId = touch.identifier;
      }
    }
  }

  private handleTouchMove(e: TouchEvent): void {
    e.preventDefault();
    for (const touch of Array.from(e.changedTouches)) {
      if (touch.identifier === this.touches.leftId) {
        this.touches.leftCurrent = { x: touch.clientX, y: touch.clientY };
        const dx = this.touches.leftCurrent.x - this.touches.leftStart.x;
        const dy = this.touches.leftCurrent.y - this.touches.leftStart.y;
        const angle = Math.atan2(dy, dx);
        const distance = Math.min(Math.hypot(dx, dy), 50) / 50;
        this.touches.moveVector = {
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance
        };
      } else if (touch.identifier === this.touches.rightId) {
        // Direct screen position for faster aiming
        this.touches.aimVector = { x: touch.clientX, y: touch.clientY };
      }
    }
  }

  private handleTouchEnd(e: TouchEvent): void {
    for (const touch of Array.from(e.changedTouches)) {
      if (touch.identifier === this.touches.leftId) {
        this.touches.leftId = null;
        this.touches.moveVector = { x: 0, y: 0 };
      }
      if (touch.identifier === this.touches.rightId) {
        this.touches.rightId = null;
        this.touches.aimVector = { x: 0, y: 0 }; // Reset aimVector when right touch ends
      }
    }
  }

  getMoveVector(): Vector2D {
    if (this.touches.leftId !== null) {
      return this.touches.moveVector;
    }
    
    let x = (this.keys.d ? 1 : 0) - (this.keys.a ? 1 : 0);
    let y = (this.keys.s ? 1 : 0) - (this.keys.w ? 1 : 0);
    
    // Normalize diagonal movement
    if (x !== 0 && y !== 0) {
      x *= 0.707;
      y *= 0.707;
    }
    
    return { x, y };
  }

  getAimAngle(playerX: number, playerY: number): number {
    if (this.touches.rightId !== null) {
      return Math.atan2(this.touches.aimVector.y - playerY, this.touches.aimVector.x - playerX);
    }
    return Math.atan2(this.mouse.y - playerY, this.mouse.x - playerX);
  }

  getTouchState(): TouchState {
    return this.touches;
  }

  isMoving(): boolean {
    const mv = this.getMoveVector();
    return mv.x !== 0 || mv.y !== 0;
  }

  reset(): void {
    // Reset keyboard
    this.keys = { w: false, a: false, s: false, d: false };
    
    // Reset touch states
    this.touches.leftId = null;
    this.touches.rightId = null;
    this.touches.moveVector = { x: 0, y: 0 };
    this.touches.aimVector = { x: 0, y: 0 };
    this.touches.leftStart = { x: 0, y: 0 };
    this.touches.leftCurrent = { x: 0, y: 0 };
  }
}
