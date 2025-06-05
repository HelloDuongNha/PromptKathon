import { GameEntity, Position, ENTITY_TYPES, RESOURCE_TYPES, ResourceType } from '../utils/Constants';

export class Resource implements GameEntity {
    public id: string;
    public type = ENTITY_TYPES.RESOURCE;
    public position: Position;
    public size = { width: 16, height: 16 };
    public health = 1;
    public maxHealth = 1;
    public active = true;

    public resourceType: ResourceType;
    public amount: number;
    public collected = false;

    constructor(x: number, y: number, resourceType: ResourceType = RESOURCE_TYPES.RICE, amount: number = 1) {
        this.id = `res_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        this.position = { x, y };
        this.resourceType = resourceType;
        this.amount = amount;
    }

    public update(_deltaTime: number): void {
        // Resources are static for now
    }

    public render(ctx: CanvasRenderingContext2D, sprite: HTMLImageElement): void {
        ctx.drawImage(
            sprite,
            this.position.x,
            this.position.y,
            this.size.width,
            this.size.height
        );
    }

    public collect(): void {
        if (this.collected) return;
        this.collected = true;
        const evt = new CustomEvent('resourceCollected', { detail: { id: this.id, type: this.resourceType, amount: this.amount } });
        window.dispatchEvent(evt);
    }

    public isAlive(): boolean {
        return this.active && !this.collected;
    }

    public serialize(): any {
        return {
            id: this.id,
            resourceType: this.resourceType,
            position: this.position,
            amount: this.amount,
            collected: this.collected
        };
    }

    static deserialize(data: any): Resource {
        const res = new Resource(data.position.x, data.position.y, data.resourceType, data.amount);
        res.id = data.id;
        res.collected = data.collected || false;
        return res;
    }
}
