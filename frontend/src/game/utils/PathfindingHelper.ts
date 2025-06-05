import { Position } from './Constants';

export interface PathNode {
    x: number;
    y: number;
    g: number; // Cost from start
    h: number; // Heuristic cost to end
    f: number; // Total cost (g + h)
    parent: PathNode | null;
    walkable: boolean;
}

export interface PathfindingOptions {
    allowDiagonal: boolean;
    heuristicWeight: number;
    maxIterations: number;
}

export class PathfindingHelper {
    private grid: PathNode[][] = [];
    private gridWidth: number = 0;
    private gridHeight: number = 0;
    private cellSize: number = 32;

    constructor(width: number, height: number, cellSize: number = 32) {
        this.gridWidth = Math.floor(width / cellSize);
        this.gridHeight = Math.floor(height / cellSize);
        this.cellSize = cellSize;
        this.initializeGrid();
    }

    private initializeGrid(): void {
        this.grid = [];
        for (let y = 0; y < this.gridHeight; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.gridWidth; x++) {
                this.grid[y][x] = {
                    x,
                    y,
                    g: 0,
                    h: 0,
                    f: 0,
                    parent: null,
                    walkable: true
                };
            }
        }
    }

    // A* Pathfinding Algorithm
    findPath(
        start: Position,
        end: Position,
        options: Partial<PathfindingOptions> = {}
    ): Position[] {
        const opts: PathfindingOptions = {
            allowDiagonal: true,
            heuristicWeight: 1.0,
            maxIterations: 1000,
            ...options
        };

        // Convert world coordinates to grid coordinates
        const startNode = this.worldToGrid(start);
        const endNode = this.worldToGrid(end);

        // Validate start and end positions
        if (!this.isValidGridPosition(startNode.x, startNode.y) ||
            !this.isValidGridPosition(endNode.x, endNode.y)) {
            return [];
        }

        if (!this.grid[startNode.y][startNode.x].walkable ||
            !this.grid[endNode.y][endNode.x].walkable) {
            return [];
        }

        // Reset grid
        this.resetPathfinding();

        const openList: PathNode[] = [];
        const closedList: Set<string> = new Set();

        const startGridNode = this.grid[startNode.y][startNode.x];
        startGridNode.g = 0;
        startGridNode.h = this.calculateHeuristic(startGridNode, endNode, opts.heuristicWeight);
        startGridNode.f = startGridNode.g + startGridNode.h;

        openList.push(startGridNode);

        let iterations = 0;
        while (openList.length > 0 && iterations < opts.maxIterations) {
            iterations++;

            // Find node with lowest f cost
            let currentNode = openList[0];
            let currentIndex = 0;

            for (let i = 1; i < openList.length; i++) {
                if (openList[i].f < currentNode.f) {
                    currentNode = openList[i];
                    currentIndex = i;
                }
            }

            // Move current node from open to closed list
            openList.splice(currentIndex, 1);
            closedList.add(`${currentNode.x},${currentNode.y}`);

            // Check if we reached the goal
            if (currentNode.x === endNode.x && currentNode.y === endNode.y) {
                return this.reconstructPath(currentNode);
            }

            // Check all neighbors
            const neighbors = this.getNeighbors(currentNode, opts.allowDiagonal);

            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.x},${neighbor.y}`;

                if (closedList.has(neighborKey) || !neighbor.walkable) {
                    continue;
                }

                const tentativeG = currentNode.g + this.getDistance(currentNode, neighbor);

                // Check if this path to neighbor is better
                const existingInOpen = openList.find(n => n.x === neighbor.x && n.y === neighbor.y);

                if (!existingInOpen) {
                    neighbor.g = tentativeG;
                    neighbor.h = this.calculateHeuristic(neighbor, endNode, opts.heuristicWeight);
                    neighbor.f = neighbor.g + neighbor.h;
                    neighbor.parent = currentNode;
                    openList.push(neighbor);
                } else if (tentativeG < existingInOpen.g) {
                    existingInOpen.g = tentativeG;
                    existingInOpen.f = existingInOpen.g + existingInOpen.h;
                    existingInOpen.parent = currentNode;
                }
            }
        }

        // No path found
        return [];
    }

    private reconstructPath(endNode: PathNode): Position[] {
        const path: Position[] = [];
        let currentNode: PathNode | null = endNode;

        while (currentNode) {
            const worldPos = this.gridToWorld(currentNode.x, currentNode.y);
            path.unshift(worldPos);
            currentNode = currentNode.parent;
        }

        return path;
    }

    private getNeighbors(node: PathNode, allowDiagonal: boolean): PathNode[] {
        const neighbors: PathNode[] = [];
        const directions = [
            { x: 0, y: -1 }, // North
            { x: 1, y: 0 },  // East
            { x: 0, y: 1 },  // South
            { x: -1, y: 0 }  // West
        ];

        if (allowDiagonal) {
            directions.push(
                { x: -1, y: -1 }, // Northwest
                { x: 1, y: -1 },  // Northeast
                { x: 1, y: 1 },   // Southeast
                { x: -1, y: 1 }   // Southwest
            );
        }

        for (const dir of directions) {
            const newX = node.x + dir.x;
            const newY = node.y + dir.y;

            if (this.isValidGridPosition(newX, newY)) {
                neighbors.push(this.grid[newY][newX]);
            }
        }

        return neighbors;
    }

    private calculateHeuristic(node: PathNode, end: Position, weight: number): number {
        // Manhattan distance for non-diagonal, Euclidean for diagonal
        const dx = Math.abs(node.x - end.x);
        const dy = Math.abs(node.y - end.y);
        return Math.sqrt(dx * dx + dy * dy) * weight;
    }

    private getDistance(nodeA: PathNode, nodeB: PathNode): number {
        const dx = Math.abs(nodeA.x - nodeB.x);
        const dy = Math.abs(nodeA.y - nodeB.y);

        // Diagonal movement costs more
        if (dx === 1 && dy === 1) {
            return Math.sqrt(2); // ~1.414
        }
        return 1;
    }

    private resetPathfinding(): void {
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                const node = this.grid[y][x];
                node.g = 0;
                node.h = 0;
                node.f = 0;
                node.parent = null;
            }
        }
    }

    // Utility methods
    worldToGrid(worldPos: Position): Position {
        return {
            x: Math.floor(worldPos.x / this.cellSize),
            y: Math.floor(worldPos.y / this.cellSize)
        };
    }

    gridToWorld(gridX: number, gridY: number): Position {
        return {
            x: gridX * this.cellSize + this.cellSize / 2,
            y: gridY * this.cellSize + this.cellSize / 2
        };
    }

    isValidGridPosition(x: number, y: number): boolean {
        return x >= 0 && x < this.gridWidth && y >= 0 && y < this.gridHeight;
    }

    setWalkable(worldPos: Position, walkable: boolean): void {
        const gridPos = this.worldToGrid(worldPos);
        if (this.isValidGridPosition(gridPos.x, gridPos.y)) {
            this.grid[gridPos.y][gridPos.x].walkable = walkable;
        }
    }

    isWalkable(worldPos: Position): boolean {
        const gridPos = this.worldToGrid(worldPos);
        if (this.isValidGridPosition(gridPos.x, gridPos.y)) {
            return this.grid[gridPos.y][gridPos.x].walkable;
        }
        return false;
    }

    // Set obstacles from array of positions
    setObstacles(obstacles: Position[]): void {
        for (const obstacle of obstacles) {
            this.setWalkable(obstacle, false);
        }
    }

    // Clear all obstacles
    clearObstacles(): void {
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                this.grid[y][x].walkable = true;
            }
        }
    }

    // Simple line of sight check
    hasLineOfSight(start: Position, end: Position): boolean {
        const startGrid = this.worldToGrid(start);
        const endGrid = this.worldToGrid(end);

        // Bresenham's line algorithm
        const dx = Math.abs(endGrid.x - startGrid.x);
        const dy = Math.abs(endGrid.y - startGrid.y);
        const sx = startGrid.x < endGrid.x ? 1 : -1;
        const sy = startGrid.y < endGrid.y ? 1 : -1;
        let err = dx - dy;

        let x = startGrid.x;
        let y = startGrid.y;

        while (true) {
            // Check if current position is walkable
            if (!this.isValidGridPosition(x, y) || !this.grid[y][x].walkable) {
                return false;
            }

            // Check if we reached the end
            if (x === endGrid.x && y === endGrid.y) {
                break;
            }

            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x += sx;
            }
            if (e2 < dx) {
                err += dx;
                y += sy;
            }
        }

        return true;
    }

    // Get closest walkable position
    getClosestWalkablePosition(target: Position): Position | null {
        const gridPos = this.worldToGrid(target);

        if (this.isValidGridPosition(gridPos.x, gridPos.y) &&
            this.grid[gridPos.y][gridPos.x].walkable) {
            return target;
        }

        // Search in expanding circles
        for (let radius = 1; radius <= 10; radius++) {
            for (let x = gridPos.x - radius; x <= gridPos.x + radius; x++) {
                for (let y = gridPos.y - radius; y <= gridPos.y + radius; y++) {
                    if (this.isValidGridPosition(x, y) && this.grid[y][x].walkable) {
                        return this.gridToWorld(x, y);
                    }
                }
            }
        }

        return null;
    }

    // Debug visualization
    getDebugGrid(): { walkable: boolean; x: number; y: number }[] {
        const debugGrid: { walkable: boolean; x: number; y: number }[] = [];

        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                debugGrid.push({
                    walkable: this.grid[y][x].walkable,
                    x: x * this.cellSize,
                    y: y * this.cellSize
                });
            }
        }

        return debugGrid;
    }
}
