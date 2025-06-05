import { ANIMATIONS } from './Constants';

export interface AnimationFrame {
    x: number;
    y: number;
    width: number;
    height: number;
    duration: number;
}

export interface Animation {
    name: string;
    frames: AnimationFrame[];
    loop: boolean;
    speed: number;
}

export class AnimationHelper {
    private animations: Map<string, Animation> = new Map();
    private currentAnimation: string | null = null;
    private currentFrame: number = 0;
    private frameTime: number = 0;
    private isPlaying: boolean = false;

    constructor() {
        this.initializeAnimations();
    }

    private initializeAnimations(): void {
        // Player animations
        this.addAnimation(ANIMATIONS.PLAYER.IDLE, {
            name: ANIMATIONS.PLAYER.IDLE,
            frames: [
                { x: 0, y: 0, width: 32, height: 48, duration: 500 },
                { x: 32, y: 0, width: 32, height: 48, duration: 500 }
            ],
            loop: true,
            speed: 1
        });

        this.addAnimation(ANIMATIONS.PLAYER.WALK, {
            name: ANIMATIONS.PLAYER.WALK,
            frames: [
                { x: 0, y: 48, width: 32, height: 48, duration: 200 },
                { x: 32, y: 48, width: 32, height: 48, duration: 200 },
                { x: 64, y: 48, width: 32, height: 48, duration: 200 },
                { x: 96, y: 48, width: 32, height: 48, duration: 200 }
            ],
            loop: true,
            speed: 1
        });

        this.addAnimation(ANIMATIONS.PLAYER.ATTACK, {
            name: ANIMATIONS.PLAYER.ATTACK,
            frames: [
                { x: 0, y: 96, width: 32, height: 48, duration: 100 },
                { x: 32, y: 96, width: 32, height: 48, duration: 100 },
                { x: 64, y: 96, width: 32, height: 48, duration: 100 }
            ],
            loop: false,
            speed: 1
        });

        // Enemy animations
        this.addAnimation(ANIMATIONS.ENEMY.IDLE, {
            name: ANIMATIONS.ENEMY.IDLE,
            frames: [
                { x: 128, y: 0, width: 32, height: 48, duration: 600 },
                { x: 160, y: 0, width: 32, height: 48, duration: 600 }
            ],
            loop: true,
            speed: 1
        });

        this.addAnimation(ANIMATIONS.ENEMY.WALK, {
            name: ANIMATIONS.ENEMY.WALK,
            frames: [
                { x: 128, y: 48, width: 32, height: 48, duration: 250 },
                { x: 160, y: 48, width: 32, height: 48, duration: 250 },
                { x: 192, y: 48, width: 32, height: 48, duration: 250 },
                { x: 224, y: 48, width: 32, height: 48, duration: 250 }
            ],
            loop: true,
            speed: 1
        });

        // Effect animations
        this.addAnimation(ANIMATIONS.EFFECTS.EXPLOSION, {
            name: ANIMATIONS.EFFECTS.EXPLOSION,
            frames: [
                { x: 0, y: 144, width: 64, height: 64, duration: 80 },
                { x: 64, y: 144, width: 64, height: 64, duration: 80 },
                { x: 128, y: 144, width: 64, height: 64, duration: 80 },
                { x: 192, y: 144, width: 64, height: 64, duration: 80 },
                { x: 256, y: 144, width: 64, height: 64, duration: 80 }
            ],
            loop: false,
            speed: 1
        });
    }

    addAnimation(name: string, animation: Animation): void {
        this.animations.set(name, animation);
    }

    playAnimation(name: string, force: boolean = false): boolean {
        if (!this.animations.has(name)) {
            console.warn(`Animation '${name}' not found`);
            return false;
        }

        if (this.currentAnimation === name && !force) {
            return true;
        }

        this.currentAnimation = name;
        this.currentFrame = 0;
        this.frameTime = 0;
        this.isPlaying = true;

        return true;
    }

    stopAnimation(): void {
        this.isPlaying = false;
        this.currentAnimation = null;
        this.currentFrame = 0;
        this.frameTime = 0;
    }

    update(deltaTime: number): void {
        if (!this.isPlaying || !this.currentAnimation) {
            return;
        }

        const animation = this.animations.get(this.currentAnimation);
        if (!animation) {
            return;
        }

        this.frameTime += deltaTime * animation.speed;
        const currentFrameData = animation.frames[this.currentFrame];

        if (this.frameTime >= currentFrameData.duration) {
            this.frameTime = 0;
            this.currentFrame++;

            if (this.currentFrame >= animation.frames.length) {
                if (animation.loop) {
                    this.currentFrame = 0;
                } else {
                    this.isPlaying = false;
                    this.currentFrame = animation.frames.length - 1;
                }
            }
        }
    }

    getCurrentFrame(): AnimationFrame | null {
        if (!this.currentAnimation || !this.isPlaying) {
            return null;
        }

        const animation = this.animations.get(this.currentAnimation);
        if (!animation) {
            return null;
        }

        return animation.frames[this.currentFrame];
    }

    isAnimationPlaying(name?: string): boolean {
        if (name) {
            return this.isPlaying && this.currentAnimation === name;
        }
        return this.isPlaying;
    }

    getCurrentAnimationName(): string | null {
        return this.currentAnimation;
    }

    // Utility methods for common animation tasks
    createSpriteAnimation(
        name: string,
        spriteSheet: {
            startX: number;
            startY: number;
            frameWidth: number;
            frameHeight: number;
            frameCount: number;
            framesPerRow: number;
        },
        options: {
            frameDuration: number;
            loop: boolean;
            speed: number;
        }
    ): void {
        const frames: AnimationFrame[] = [];

        for (let i = 0; i < spriteSheet.frameCount; i++) {
            const row = Math.floor(i / spriteSheet.framesPerRow);
            const col = i % spriteSheet.framesPerRow;

            frames.push({
                x: spriteSheet.startX + (col * spriteSheet.frameWidth),
                y: spriteSheet.startY + (row * spriteSheet.frameHeight),
                width: spriteSheet.frameWidth,
                height: spriteSheet.frameHeight,
                duration: options.frameDuration
            });
        }

        this.addAnimation(name, {
            name,
            frames,
            loop: options.loop,
            speed: options.speed
        });
    }

    // Tween animation helper
    static lerp(start: number, end: number, progress: number): number {
        return start + (end - start) * progress;
    }

    static easeInOut(t: number): number {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    static easeIn(t: number): number {
        return t * t;
    }

    static easeOut(t: number): number {
        return 1 - Math.pow(1 - t, 2);
    }

    // Animation state management
    getAnimationProgress(): number {
        if (!this.currentAnimation || !this.isPlaying) {
            return 0;
        }

        const animation = this.animations.get(this.currentAnimation);
        if (!animation) {
            return 0;
        }

        const totalFrames = animation.frames.length;
        const currentFrameData = animation.frames[this.currentFrame];
        const frameProgress = this.frameTime / currentFrameData.duration;

        return (this.currentFrame + frameProgress) / totalFrames;
    }

    setAnimationSpeed(speed: number): void {
        if (speed <= 0) {
            console.warn('Animation speed must be greater than 0');
            return;
        }

        if (this.currentAnimation) {
            const animation = this.animations.get(this.currentAnimation);
            if (animation) {
                animation.speed = speed;
            }
        }
    }
}
