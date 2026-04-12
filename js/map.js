// ===== MAP SYSTEM =====
const TILE_SIZE = 48;

// Tile types
const T = {
    GRASS: 0,
    WALL: 1,
    FLOOR: 2,
    WATER: 3,
    PATH: 4,
    DOOR: 5,
    LAVA: 6,
    TREE: 7,
    DARK_FLOOR: 8,
    CHEST: 9,
    PORTAL: 10,
    BRIDGE: 11,
    BONES: 12,
    SKULL_WALL: 13,
    THRONE: 14,
    BUSH: 15
};

// Tile properties
const TILE_PROPS = {
    [T.GRASS]:      { solid: false, color: '#2d5a1e', color2: '#3a6b2a' },
    [T.WALL]:       { solid: true,  color: '#4a4a4a', color2: '#3a3a3a' },
    [T.FLOOR]:      { solid: false, color: '#8a7a5a', color2: '#7a6a4a' },
    [T.WATER]:      { solid: true,  color: '#1a5a8a', color2: '#2a6a9a', animated: true },
    [T.PATH]:       { solid: false, color: '#9a8a6a', color2: '#8a7a5a' },
    [T.DOOR]:       { solid: false, color: '#6a4a2a', color2: '#5a3a1a', teleport: true },
    [T.LAVA]:       { solid: true,  color: '#cc3300', color2: '#ff5500', animated: true, damage: 10 },
    [T.TREE]:       { solid: true,  color: '#1a4a0a', color2: '#2d5a1e' },
    [T.DARK_FLOOR]: { solid: false, color: '#3a2a1a', color2: '#2a1a0a' },
    [T.CHEST]:      { solid: true,  color: '#aa8a2a', color2: '#8a6a1a', interact: true },
    [T.PORTAL]:     { solid: false, color: '#6a2aaa', color2: '#8a4acc', animated: true, teleport: true },
    [T.BRIDGE]:     { solid: false, color: '#7a5a2a', color2: '#6a4a1a' },
    [T.BONES]:      { solid: false, color: '#aaa89a', color2: '#8a887a' },
    [T.SKULL_WALL]: { solid: true,  color: '#5a4a4a', color2: '#4a3a3a' },
    [T.THRONE]:     { solid: true,  color: '#8a2a2a', color2: '#6a1a1a' },
    [T.BUSH]:       { solid: true,  color: '#2a6a1a', color2: '#1a5a0a' }
};

// World maps
const MAPS = {
    village: {
        name: "Aldea de Augusto",
        width: 30,
        height: 25,
        spawnX: 14,
        spawnY: 20,
        ambientColor: 'rgba(0,0,0,0)',
        music: 'peaceful',
        data: null // Generated below
    },
    forest: {
        name: "Bosque Oscuro",
        width: 35,
        height: 30,
        spawnX: 1,
        spawnY: 15,
        ambientColor: 'rgba(0,20,0,0.3)',
        music: 'dark',
        data: null
    },
    dungeon: {
        name: "Mazmorra de Huesos",
        width: 30,
        height: 30,
        spawnX: 15,
        spawnY: 28,
        ambientColor: 'rgba(0,0,0,0.4)',
        music: 'dungeon',
        data: null
    },
    bossRoom: {
        name: "Guarida de El Cuero",
        width: 25,
        height: 20,
        spawnX: 12,
        spawnY: 18,
        ambientColor: 'rgba(30,0,0,0.4)',
        music: 'boss',
        data: null
    }
};

function generateMaps() {
    // === VILLAGE ===
    const v = [];
    for (let y = 0; y < 25; y++) {
        v[y] = [];
        for (let x = 0; x < 30; x++) {
            // Border
            if (x === 0 || x === 29 || y === 0 || y === 24) {
                v[y][x] = T.TREE;
            }
            // Water pond
            else if (x >= 3 && x <= 6 && y >= 3 && y <= 6) {
                v[y][x] = T.WATER;
            }
            // House 1
            else if (x >= 10 && x <= 15 && y >= 3 && y <= 7) {
                if (y === 3 || y === 7 || x === 10 || x === 15) v[y][x] = T.WALL;
                else if (x === 12 && y === 7) v[y][x] = T.FLOOR;
                else v[y][x] = T.FLOOR;
            }
            // House 2
            else if (x >= 20 && x <= 25 && y >= 3 && y <= 7) {
                if (y === 3 || y === 7 || x === 20 || x === 25) v[y][x] = T.WALL;
                else if (x === 22 && y === 7) v[y][x] = T.FLOOR;
                else v[y][x] = T.FLOOR;
            }
            // Main path vertical
            else if (x >= 13 && x <= 15 && y >= 7 && y <= 22) {
                v[y][x] = T.PATH;
            }
            // Path horizontal
            else if (y >= 12 && y <= 13 && x >= 3 && x <= 27) {
                v[y][x] = T.PATH;
            }
            // Bushes scattered
            else if ((x === 5 && y === 10) || (x === 25 && y === 15) || (x === 8 && y === 18)) {
                v[y][x] = T.BUSH;
            }
            // Trees scattered
            else if ((x === 3 && y === 15) || (x === 27 && y === 20) || (x === 7 && y === 22)) {
                v[y][x] = T.TREE;
            }
            // Exit to forest (right)
            else if (x === 29 && y >= 12 && y <= 13) {
                v[y][x] = T.PATH;
            }
            // Chest
            else if (x === 22 && y === 10) {
                v[y][x] = T.CHEST;
            }
            else {
                v[y][x] = T.GRASS;
            }
        }
    }
    // Open right exit
    v[12][29] = T.PATH;
    v[13][29] = T.PATH;
    MAPS.village.data = v;

    // === FOREST ===
    const f = [];
    for (let y = 0; y < 30; y++) {
        f[y] = [];
        for (let x = 0; x < 35; x++) {
            if (x === 0 || x === 34 || y === 0 || y === 29) {
                f[y][x] = T.TREE;
            }
            else if (Math.random() < 0.25 && !(x <= 2 && y >= 14 && y <= 16) && !(x >= 32 && y >= 14 && y <= 16)) {
                f[y][x] = T.TREE;
            }
            else {
                f[y][x] = T.GRASS;
            }
        }
    }
    // Carve path through forest
    for (let x = 0; x < 35; x++) {
        f[14][x] = T.PATH;
        f[15][x] = T.PATH;
        if (Math.random() < 0.3) f[13][x] = T.GRASS;
        if (Math.random() < 0.3) f[16][x] = T.GRASS;
    }
    // Clear areas for enemies
    for (let x = 10; x < 15; x++) { for (let y = 8; y < 12; y++) f[y][x] = T.GRASS; }
    for (let x = 20; x < 26; x++) { for (let y = 18; y < 23; y++) f[y][x] = T.GRASS; }
    // Lava patches
    f[10][25] = T.LAVA; f[10][26] = T.LAVA; f[11][25] = T.LAVA;
    // Entrance left
    f[14][0] = T.PATH; f[15][0] = T.PATH;
    // Portal to dungeon right side
    f[14][34] = T.PORTAL; f[15][34] = T.PORTAL;
    // Chest
    f[9][12] = T.CHEST;
    f[20][22] = T.CHEST;
    MAPS.forest.data = f;

    // === DUNGEON ===
    const d = [];
    for (let y = 0; y < 30; y++) {
        d[y] = [];
        for (let x = 0; x < 30; x++) {
            d[y][x] = T.SKULL_WALL;
        }
    }
    // Carve rooms and corridors
    // Room 1 (entry)
    for (let y = 24; y < 29; y++) for (let x = 12; x < 18; x++) d[y][x] = T.DARK_FLOOR;
    // Corridor up
    for (let y = 15; y < 25; y++) { d[y][14] = T.DARK_FLOOR; d[y][15] = T.DARK_FLOOR; }
    // Room 2 (middle)
    for (let y = 10; y < 16; y++) for (let x = 10; x < 20; x++) d[y][x] = T.DARK_FLOOR;
    // Bones in room 2
    d[12][12] = T.BONES; d[13][15] = T.BONES; d[11][17] = T.BONES;
    // Corridor to boss
    for (let y = 5; y < 11; y++) { d[y][14] = T.DARK_FLOOR; d[y][15] = T.DARK_FLOOR; }
    // Room 3 (treasure)
    for (let y = 10; y < 16; y++) for (let x = 22; x < 28; x++) d[y][x] = T.DARK_FLOOR;
    // Connect room 3
    for (let x = 19; x < 23; x++) { d[12][x] = T.DARK_FLOOR; d[13][x] = T.DARK_FLOOR; }
    // Chest in room 3
    d[11][25] = T.CHEST; d[14][24] = T.CHEST;
    // Left room
    for (let y = 10; y < 16; y++) for (let x = 2; x < 8; x++) d[y][x] = T.DARK_FLOOR;
    for (let x = 7; x < 11; x++) { d[12][x] = T.DARK_FLOOR; d[13][x] = T.DARK_FLOOR; }
    d[12][4] = T.BONES; d[11][5] = T.CHEST;
    // Portal to boss at top
    d[5][14] = T.PORTAL; d[5][15] = T.PORTAL;
    MAPS.dungeon.data = d;

    // === BOSS ROOM ===
    const b = [];
    for (let y = 0; y < 20; y++) {
        b[y] = [];
        for (let x = 0; x < 25; x++) {
            if (x === 0 || x === 24 || y === 0 || y === 19) {
                b[y][x] = T.SKULL_WALL;
            } else if (x >= 10 && x <= 14 && y >= 2 && y <= 4) {
                b[y][x] = T.DARK_FLOOR;
            } else {
                b[y][x] = T.DARK_FLOOR;
            }
        }
    }
    // Lava borders
    for (let x = 1; x < 24; x++) { b[1][x] = T.LAVA; b[18][x] = T.LAVA; }
    for (let y = 1; y < 19; y++) { b[y][1] = T.LAVA; b[y][23] = T.LAVA; }
    // Safe floor
    for (let x = 2; x < 23; x++) for (let y = 2; y < 18; y++) b[y][x] = T.DARK_FLOOR;
    // Throne
    b[3][12] = T.THRONE;
    // Lava pillars
    b[6][5] = T.LAVA; b[6][19] = T.LAVA;
    b[12][5] = T.LAVA; b[12][19] = T.LAVA;
    // Bones decoration
    b[8][8] = T.BONES; b[8][16] = T.BONES; b[14][8] = T.BONES; b[14][16] = T.BONES;
    // Entry
    b[18][12] = T.DARK_FLOOR; b[19][12] = T.DARK_FLOOR;
    MAPS.bossRoom.data = b;
}

// Map connections
const MAP_EXITS = {
    village: [
        { fromX: 29, fromYmin: 12, fromYmax: 13, toMap: 'forest', toX: 1, toY: 15 }
    ],
    forest: [
        { fromX: 0, fromYmin: 14, fromYmax: 15, toMap: 'village', toX: 28, toY: 12 },
        { fromX: 34, fromYmin: 14, fromYmax: 15, toMap: 'dungeon', toX: 15, toY: 27 }
    ],
    dungeon: [
        { fromX: 14, fromYmin: 5, fromYmax: 5, toMap: 'bossRoom', toX: 12, toY: 17 },
        { fromX: 15, fromYmin: 5, fromYmax: 5, toMap: 'bossRoom', toX: 12, toY: 17 }
    ],
    bossRoom: []
};

class GameMap {
    constructor() {
        generateMaps();
        this.currentMapId = 'village';
        this.currentMap = MAPS.village;
        this.animTimer = 0;
        this.discoveredChests = {};
        this.openedChests = new Set();
    }

    get data() { return this.currentMap.data; }
    get width() { return this.currentMap.width; }
    get height() { return this.currentMap.height; }

    loadMap(mapId, playerSpawnX, playerSpawnY) {
        this.currentMapId = mapId;
        this.currentMap = MAPS[mapId];
        return { x: playerSpawnX ?? this.currentMap.spawnX, y: playerSpawnY ?? this.currentMap.spawnY };
    }

    isSolid(tileX, tileY) {
        if (tileX < 0 || tileX >= this.width || tileY < 0 || tileY >= this.height) return true;
        const tile = this.data[tileY][tileX];
        if (tile === T.CHEST && this.openedChests.has(`${this.currentMapId}_${tileX}_${tileY}`)) return false;
        return TILE_PROPS[tile]?.solid ?? false;
    }

    getTile(tileX, tileY) {
        if (tileX < 0 || tileX >= this.width || tileY < 0 || tileY >= this.height) return T.WALL;
        return this.data[tileY][tileX];
    }

    openChest(tileX, tileY) {
        const key = `${this.currentMapId}_${tileX}_${tileY}`;
        if (this.openedChests.has(key)) return null;
        this.openedChests.add(key);
        this.data[tileY][tileX] = T.FLOOR;
        return true;
    }

    checkExit(tileX, tileY) {
        const exits = MAP_EXITS[this.currentMapId] || [];
        for (const exit of exits) {
            if (tileX === exit.fromX && tileY >= exit.fromYmin && tileY <= exit.fromYmax) {
                return exit;
            }
        }
        return null;
    }

    update(dt) {
        this.animTimer += dt;
    }

    render(ctx, camera) {
        const startTileX = Math.max(0, Math.floor(camera.x / TILE_SIZE) - 1);
        const startTileY = Math.max(0, Math.floor(camera.y / TILE_SIZE) - 1);
        const endTileX = Math.min(this.width, Math.ceil((camera.x + camera.viewWidth) / TILE_SIZE) + 1);
        const endTileY = Math.min(this.height, Math.ceil((camera.y + camera.viewHeight) / TILE_SIZE) + 1);

        for (let y = startTileY; y < endTileY; y++) {
            for (let x = startTileX; x < endTileX; x++) {
                const tile = this.data[y][x];
                const props = TILE_PROPS[tile];
                if (!props) continue;

                const drawX = x * TILE_SIZE - camera.x;
                const drawY = y * TILE_SIZE - camera.y;

                // Base tile
                let color = props.color;
                if (props.animated) {
                    const t = Math.sin(this.animTimer * 3 + x + y);
                    color = t > 0 ? props.color : props.color2;
                } else {
                    color = ((x + y) % 2 === 0) ? props.color : props.color2;
                }

                ctx.fillStyle = color;
                ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);

                // Tile decorations
                this.renderTileDecor(ctx, tile, drawX, drawY, x, y);
            }
        }

        // Ambient overlay
        if (this.currentMap.ambientColor) {
            ctx.fillStyle = this.currentMap.ambientColor;
            ctx.fillRect(0, 0, camera.viewWidth, camera.viewHeight);
        }
    }

    renderTileDecor(ctx, tile, dx, dy, tx, ty) {
        const s = TILE_SIZE;
        ctx.save();
        switch (tile) {
            case T.TREE:
                // Trunk
                ctx.fillStyle = '#5a3a1a';
                ctx.fillRect(dx + s*0.35, dy + s*0.5, s*0.3, s*0.5);
                // Canopy
                ctx.fillStyle = '#1a5a0a';
                ctx.beginPath();
                ctx.arc(dx + s*0.5, dy + s*0.35, s*0.35, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#2a6a1a';
                ctx.beginPath();
                ctx.arc(dx + s*0.4, dy + s*0.3, s*0.2, 0, Math.PI * 2);
                ctx.fill();
                break;
            case T.WATER:
                // Wave lines
                ctx.strokeStyle = 'rgba(100,180,255,0.3)';
                ctx.lineWidth = 1;
                const off = Math.sin(this.animTimer * 2 + tx) * 3;
                ctx.beginPath();
                ctx.moveTo(dx + 5, dy + s*0.3 + off);
                ctx.lineTo(dx + s - 5, dy + s*0.3 + off);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(dx + 8, dy + s*0.6 - off);
                ctx.lineTo(dx + s - 8, dy + s*0.6 - off);
                ctx.stroke();
                break;
            case T.CHEST:
                const key = `${this.currentMapId}_${tx}_${ty}`;
                if (!this.openedChests.has(key)) {
                    ctx.fillStyle = '#8B6914';
                    ctx.fillRect(dx + s*0.2, dy + s*0.3, s*0.6, s*0.4);
                    ctx.fillStyle = '#DAA520';
                    ctx.fillRect(dx + s*0.2, dy + s*0.3, s*0.6, s*0.15);
                    ctx.fillStyle = '#FFD700';
                    ctx.fillRect(dx + s*0.45, dy + s*0.38, s*0.1, s*0.12);
                }
                break;
            case T.LAVA:
                ctx.fillStyle = `rgba(255,255,0,${0.1 + Math.sin(this.animTimer*4+tx+ty)*0.1})`;
                ctx.fillRect(dx, dy, s, s);
                break;
            case T.PORTAL:
                ctx.fillStyle = `rgba(150,50,255,${0.3 + Math.sin(this.animTimer*3)*0.2})`;
                ctx.beginPath();
                ctx.arc(dx + s/2, dy + s/2, s*0.4, 0, Math.PI*2);
                ctx.fill();
                ctx.strokeStyle = `rgba(200,100,255,${0.5 + Math.sin(this.animTimer*5)*0.3})`;
                ctx.lineWidth = 2;
                ctx.stroke();
                break;
            case T.BONES:
                ctx.fillStyle = '#ccc8b0';
                ctx.fillRect(dx + s*0.2, dy + s*0.45, s*0.6, s*0.08);
                ctx.fillRect(dx + s*0.35, dy + s*0.3, s*0.08, s*0.4);
                break;
            case T.THRONE:
                ctx.fillStyle = '#8B0000';
                ctx.fillRect(dx + s*0.15, dy + s*0.1, s*0.7, s*0.8);
                ctx.fillStyle = '#DAA520';
                ctx.fillRect(dx + s*0.2, dy + s*0.05, s*0.6, s*0.1);
                ctx.fillRect(dx + s*0.1, dy + s*0.1, s*0.1, s*0.5);
                ctx.fillRect(dx + s*0.8, dy + s*0.1, s*0.1, s*0.5);
                break;
            case T.BUSH:
                ctx.fillStyle = '#2a7a1a';
                ctx.beginPath();
                ctx.arc(dx + s*0.5, dy + s*0.5, s*0.35, 0, Math.PI*2);
                ctx.fill();
                ctx.fillStyle = '#3a8a2a';
                ctx.beginPath();
                ctx.arc(dx + s*0.35, dy + s*0.4, s*0.2, 0, Math.PI*2);
                ctx.fill();
                break;
            case T.SKULL_WALL:
                // Brick pattern
                ctx.strokeStyle = '#3a2a2a';
                ctx.lineWidth = 1;
                ctx.strokeRect(dx+1, dy+1, s/2-1, s/2-1);
                ctx.strokeRect(dx+s/2, dy+1, s/2-1, s/2-1);
                // Skull decoration (random)
                if ((tx * 7 + ty * 13) % 5 === 0) {
                    ctx.fillStyle = '#8a8a7a';
                    ctx.beginPath();
                    ctx.arc(dx+s/2, dy+s/2, s*0.15, 0, Math.PI*2);
                    ctx.fill();
                    ctx.fillStyle = '#222';
                    ctx.fillRect(dx+s*0.4, dy+s*0.47, s*0.06, s*0.06);
                    ctx.fillRect(dx+s*0.54, dy+s*0.47, s*0.06, s*0.06);
                }
                break;
        }
        ctx.restore();
    }

    renderMinimap(ctx, player, mapCanvas) {
        const mw = mapCanvas.width;
        const mh = mapCanvas.height;
        const scaleX = mw / this.width;
        const scaleY = mh / this.height;

        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, mw, mh);

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const tile = this.data[y][x];
                const props = TILE_PROPS[tile];
                if (props) {
                    ctx.fillStyle = props.solid ? '#444' : (tile === T.PATH ? '#aa9' : tile === T.WATER ? '#26a' : tile === T.LAVA ? '#a30' : tile === T.PORTAL ? '#60a' : '#232');
                    ctx.fillRect(x * scaleX, y * scaleY, Math.ceil(scaleX), Math.ceil(scaleY));
                }
            }
        }

        // Player dot
        ctx.fillStyle = '#ff0';
        ctx.beginPath();
        ctx.arc(player.tileX * scaleX + scaleX/2, player.tileY * scaleY + scaleY/2, 3, 0, Math.PI*2);
        ctx.fill();
    }
}
