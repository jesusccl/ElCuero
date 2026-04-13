// ═══════════════════════════════════════════════════════
//  AUGUSTO — El Cazador de Sombras
//  game.js — top-down RPG engine
// ═══════════════════════════════════════════════════════

const canvas = document.getElementById('c');
const ctx    = canvas.getContext('2d');

// Viewport / world constants
const VW = 576, VH = 576;
const TS = 48;          // tile size in pixels
const MAP_W = 26;       // tiles wide
const MAP_H = 26;       // tiles tall

// Tile IDs
const TILE = { FLOOR:0, WALL:1, WATER:2, LAVA:3, BOSS:4 };

// ── Palette ───────────────────────────────────────────
const PAL = {
  floorA:  '#12042a', floorB:  '#1a0838', floorBoss: '#080f00',
  wallA:   '#0d0220', wallB:   '#160430',
  waterA:  '#00112b', waterB:  '#001e44',
  lavaA:   '#2a0800', lavaB:   '#440d00',
  accent:  '#7c4dff', accent2: '#00e5ff',
  gold:    '#ffd54f', red:     '#ff1744',
  green:   '#69ff47',
};

// ── World map ─────────────────────────────────────────
// 0=floor 1=wall 2=water 3=lava 4=boss floor
// Hand-crafted 26×26 grid — readable layout
const RAW_MAP = [
  '11111111111111111111111111',
  '10000000000100000000000001',
  '10010000000100000000000001',
  '10010001110100011000000001',
  '10000001000100010000003001',
  '10011101000100010011103001',
  '10000001000000010000000001',
  '10000001111111110000000001',
  '10010000000000000000010001',
  '10010000000000000000010001',
  '10000000111111110000000001',
  '10000000100000010003000001',
  '10011110100000010003000001',
  '10000010100000010000000001',
  '10000010100000010000000001',
  '10000000111111110000000001',
  '10010000000000000000010001',
  '10010000000000000044010001',
  '10000001110000011144000001',
  '10000000010000010044000001',
  '10001110010000010000110001',
  '10000000010000010000000001',
  '10000001110111110000000001',
  '10000000000000000000000001',
  '10000000000000000000000001',
  '11111111111111111111111111',
];

let worldMap = null;

function buildMap() {
  worldMap = [];
  for (let row = 0; row < MAP_H; row++) {
    worldMap[row] = [];
    const line = RAW_MAP[row] || '';
    for (let col = 0; col < MAP_W; col++) {
      const ch = line[col] || '0';
      worldMap[row][col] = parseInt(ch);
    }
  }
}

function tileAt(col, row) {
  if (col < 0 || row < 0 || col >= MAP_W || row >= MAP_H) return TILE.WALL;
  return worldMap[row][col];
}

function isSolid(col, row) {
  const t = tileAt(col, row);
  return t === TILE.WALL || t === TILE.WATER;
}

// ── Camera ────────────────────────────────────────────
let camX = 0, camY = 0;

function updateCamera(wx, wy) {
  camX = wx - VW / 2;
  camY = wy - VH / 2;
  camX = Math.max(0, Math.min(MAP_W * TS - VW, camX));
  camY = Math.max(0, Math.min(MAP_H * TS - VH, camY));
}

// world→screen helpers
function wx2s(wx) { return wx - camX; }
function wy2s(wy) { return wy - camY; }

// ── Input ─────────────────────────────────────────────
const keys = {};
const touch = {
  up:false, down:false, left:false, right:false,
  attack:false, skill:false,
  _atk:false, _skl:false,
};

window.addEventListener('keydown', e => { keys[e.key] = true;  e.preventDefault(); });
window.addEventListener('keyup',   e => { keys[e.key] = false; });

function setupTouch() {
  if (!('ontouchstart' in window || navigator.maxTouchPoints > 0)) return;
  document.getElementById('controls').classList.add('visible');

  function bind(id, key) {
    const el = document.getElementById(id);
    el.addEventListener('touchstart', e => {
      e.preventDefault(); touch[key] = true; el.classList.add('pressed');
    }, { passive: false });
    el.addEventListener('touchend', e => {
      e.preventDefault(); touch[key] = false; el.classList.remove('pressed');
    }, { passive: false });
  }
  bind('btnUp',    'up');
  bind('btnDown',  'down');
  bind('btnLeft',  'left');
  bind('btnRight', 'right');
  bind('btnAttack','attack');
  bind('btnSkill', 'skill');
}

function isUp()    { return keys['w'] || keys['ArrowUp']    || touch.up;    }
function isDown()  { return keys['s'] || keys['ArrowDown']  || touch.down;  }
function isLeft()  { return keys['a'] || keys['ArrowLeft']  || touch.left;  }
function isRight() { return keys['d'] || keys['ArrowRight'] || touch.right; }
function isAtk()   { return keys['j'] || keys[' '] || touch.attack; }
function isSkl()   { return keys['k'] || touch.skill; }

// ── Entity movement with tile collision ───────────────
const PLAYER_SPEED = 2.6;

function moveWithCollision(ent, dx, dy) {
  // Move X
  ent.wx += dx;
  const col  = Math.floor(ent.wx / TS);
  const row  = Math.floor(ent.wy / TS);
  const colR = Math.floor((ent.wx + ent.r) / TS);
  const colL = Math.floor((ent.wx - ent.r) / TS);
  const rowT = Math.floor((ent.wy - ent.r) / TS);
  const rowB = Math.floor((ent.wy + ent.r) / TS);

  if (dx > 0 && (isSolid(colR, rowT) || isSolid(colR, rowB))) {
    ent.wx = colR * TS - ent.r - 0.1;
  }
  if (dx < 0 && (isSolid(colL, rowT) || isSolid(colL, rowB))) {
    ent.wx = (colL + 1) * TS + ent.r + 0.1;
  }

  // Move Y
  ent.wy += dy;
  const col2  = Math.floor(ent.wx / TS);
  const rowT2 = Math.floor((ent.wy - ent.r) / TS);
  const rowB2 = Math.floor((ent.wy + ent.r) / TS);
  const colR2 = Math.floor((ent.wx + ent.r) / TS);
  const colL2 = Math.floor((ent.wx - ent.r) / TS);

  if (dy > 0 && (isSolid(colL2, rowB2) || isSolid(colR2, rowB2))) {
    ent.wy = rowB2 * TS - ent.r - 0.1;
  }
  if (dy < 0 && (isSolid(colL2, rowT2) || isSolid(colR2, rowT2))) {
    ent.wy = (rowT2 + 1) * TS + ent.r + 0.1;
  }
}

// ── Player ────────────────────────────────────────────
const player = {
  wx: 3 * TS + TS / 2,
  wy: 3 * TS + TS / 2,
  r: 12,
  hp: 100, maxHp: 100,
  mana: 100, maxMana: 100,
  facing: 2,        // 0=up 1=right 2=down 3=left
  atkCd: 0, sklCd: 0,
  inv: 0,           // invincibility frames
  atkAnim: 0,
  dead: false,
  stepT: 0, stepF: 0, moving: false,
};

// ── Enemies ───────────────────────────────────────────
let enemies = [];

const ENEMY_DEFS = {
  demon: { r:13, hp:45,  spd:1.1, atk:8,  colBody:'#5a0020', colGlow:'#ff1744', shape:'demon' },
  shade: { r:11, hp:22,  spd:1.7, atk:5,  colBody:'#1a0050', colGlow:'#7c4dff', shape:'shade' },
  imp:   { r:9,  hp:18,  spd:2.0, atk:4,  colBody:'#2a0040', colGlow:'#e040fb', shape:'imp'   },
  golem: { r:18, hp:130, spd:0.55,atk:16, colBody:'#1a1200', colGlow:'#ff9100', shape:'golem' },
};

function makeEnemy(wx, wy, type) {
  const d = ENEMY_DEFS[type] || ENEMY_DEFS.demon;
  return {
    wx, wy, r: d.r,
    hp: d.hp, maxHp: d.hp,
    spd: d.spd, atk: d.atk,
    colBody: d.colBody, colGlow: d.colGlow,
    shape: d.shape, type,
    facing: 2,
    atkCd: 0, hurtT: 0,
    dead: false, aggro: false,
    stepT: 0, stepF: 0,
  };
}

// ── Boss ──────────────────────────────────────────────
let boss = null;
let bossActive = false;
let bossDefeated = false;

function makeBoss() {
  return {
    wx: 22 * TS, wy: 19 * TS,
    r: 34,
    hp: 700, maxHp: 700,
    spd: 0.85,
    atk: 18,
    facing: 2,
    hurtT: 0, atkCd: 0,
    dead: false,
    dashT: 0, dashing: false, dashVx: 0, dashVy: 0,
    tentT: 0,
    phase: 1,
  };
}

// ── Wave spawns ───────────────────────────────────────
const WAVES = {
  1: [
    { type:'imp',   wx: 5,wy: 5 },
    { type:'shade', wx: 9,wy: 4 },
    { type:'demon', wx: 7,wy: 8 },
    { type:'imp',   wx:11,wy: 7 },
    { type:'shade', wx: 4,wy:10 },
    { type:'demon', wx:10,wy:11 },
  ],
  2: [
    { type:'demon', wx: 5,wy: 5 },
    { type:'golem', wx: 9,wy: 5 },
    { type:'shade', wx: 6,wy: 9 },
    { type:'imp',   wx:11,wy: 4 },
    { type:'demon', wx: 4,wy:12 },
    { type:'imp',   wx:10,wy:12 },
    { type:'golem', wx: 7,wy:12 },
    { type:'shade', wx:12,wy: 9 },
  ],
};

function spawnWave(w) {
  enemies = [];
  boss = null;
  bossActive = false;
  document.getElementById('bossHud').classList.remove('visible');

  if (w >= 3) {
    bossActive = true;
    boss = makeBoss();
    document.getElementById('bossHud').classList.add('visible');
    document.getElementById('bossBar').style.width = '100%';
    // Guards
    enemies.push(makeEnemy(20*TS, 17*TS, 'demon'));
    enemies.push(makeEnemy(23*TS, 16*TS, 'shade'));
    enemies.push(makeEnemy(21*TS, 21*TS, 'imp'));
    showMsg('☠  EL CUERO DESPERTÓ  ☠', 3000);
    showDialog('EL CUERO', '"Augusto... He devorado miles como tú. ¡Tu piel será parte de mí!"', 4000);
  } else {
    const defs = WAVES[w] || WAVES[1];
    for (const d of defs) {
      enemies.push(makeEnemy(d.wx * TS + TS/2, d.wy * TS + TS/2, d.type));
    }
  }
}

// ── Particles ─────────────────────────────────────────
let particles     = [];
let projectiles   = [];
let floatingTexts = [];

function addParticle(wx, wy, vx, vy, r, color, glow, life) {
  particles.push({ wx, wy, vx, vy, r, color, glow, life, maxLife: life });
}

function burst(wx, wy, color, n = 10, speed = 4) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    addParticle(wx, wy, Math.cos(a)*speed*(0.5+Math.random()), Math.sin(a)*speed*(0.5+Math.random()),
      Math.random()*3+1.5, color, 10, 25+Math.floor(Math.random()*15));
  }
}

function splat(wx, wy, color, n = 8) {
  for (let i = 0; i < n; i++) {
    addParticle(wx, wy, (Math.random()-0.5)*6, (Math.random()-0.5)*6,
      Math.random()*3+1, color, 4, 30+Math.floor(Math.random()*20));
  }
}

function floatText(wx, wy, text, color, size = 12) {
  floatingTexts.push({ wx, wy, text, color, size, life: 45, maxLife: 45, vy: -0.9 });
}

function spawnGold(wx, wy, amt) {
  for (let i = 0; i < 5; i++) {
    addParticle(wx+(Math.random()-0.5)*20, wy+(Math.random()-0.5)*20,
      (Math.random()-0.5)*3, (Math.random()-0.5)*3, 3, PAL.gold, 8, 50);
  }
  floatText(wx, wy - 10, `+${amt}`, PAL.gold, 13);
}

// ── Attack & damage ───────────────────────────────────
const ATK_R = 46;

function playerAttack() {
  if (player.atkCd > 0 || player.dead) return;
  player.atkCd = 16;
  player.atkAnim = 12;

  const facingAngle = [Math.PI * 1.5, 0, Math.PI * 0.5, Math.PI][player.facing];

  function tryHit(target) {
    if (target.dead) return;
    const dx = target.wx - player.wx;
    const dy = target.wy - player.wy;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist > ATK_R + target.r) return;

    // Arc check — only hit things roughly in front
    const angle = Math.atan2(dy, dx);
    let diff = angle - facingAngle;
    while (diff >  Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    if (Math.abs(diff) > 1.3) return;

    const dmg = 18 + Math.floor(Math.random() * 12);
    target.hp -= dmg;
    target.hurtT = 14;
    splat(target.wx, target.wy, '#cc0000', 6);
    floatText(target.wx, target.wy - target.r - 4, `-${dmg}`, '#ff5555');
    if (target === boss) {
      splat(target.wx, target.wy, PAL.green, 5);
    }
    return dmg;
  }

  for (const e of enemies) {
    const d = tryHit(e);
    if (d && e.hp <= 0) killEnemy(e);
  }
  if (boss && !boss.dead) {
    const d = tryHit(boss);
    if (d && boss.hp <= 0) killBoss();
  }
}

function playerSkill() {
  if (player.sklCd > 0 || player.mana < 25 || player.dead) return;
  player.sklCd = 60;
  player.mana -= 25;

  const angle = [Math.PI * 1.5, 0, Math.PI * 0.5, Math.PI][player.facing];
  projectiles.push({
    wx: player.wx, wy: player.wy,
    vx: Math.cos(angle) * 7,
    vy: Math.sin(angle) * 7,
    r: 9, color: PAL.accent2,
    type: 'player', life: 100,
  });
  burst(player.wx, player.wy, PAL.accent, 8, 3);
}

function killEnemy(e) {
  if (e.dead) return;
  e.dead = true;
  const gold = e.shape === 'golem' ? 50 : e.shape === 'demon' ? 20 : 10;
  score += gold;
  updateHUD();
  burst(e.wx, e.wy, e.colGlow, 12);
  splat(e.wx, e.wy, '#cc0000', 10);
  spawnGold(e.wx, e.wy, gold);
  player.mana = Math.min(player.maxMana, player.mana + 8);
}

function killBoss() {
  if (boss.dead) return;
  boss.dead = true;
  bossDefeated = true;
  score += 500;
  updateHUD();
  burst(boss.wx, boss.wy, PAL.green, 30, 8);
  burst(boss.wx, boss.wy, '#ffffff', 20, 5);
  splat(boss.wx, boss.wy, '#00aa00', 20);
  spawnGold(boss.wx, boss.wy, 500);
  showDialog('EL CUERO', '"No... ¡Augusto maldito! Esto no puede ser..."', 3000);
  setTimeout(() => {
    gameRunning = false;
    document.getElementById('victoryOverlay').classList.add('visible');
  }, 3500);
}

// ── Boss AI ───────────────────────────────────────────
function updateBoss() {
  if (!boss || boss.dead) return;
  const b = boss;
  b.phase = b.hp / b.maxHp < 0.5 ? 2 : 1;
  const rage = b.phase === 2;

  b.dashT++;
  b.tentT++;
  if (b.hurtT > 0) b.hurtT--;
  if (b.atkCd > 0) b.atkCd--;

  const dx = player.wx - b.wx;
  const dy = player.wy - b.wy;
  const dist = Math.sqrt(dx*dx + dy*dy) || 1;

  // Dash
  const dashCd = rage ? 110 : 190;
  if (b.dashT > dashCd && !b.dashing) {
    b.dashing = true; b.dashT = 0;
    b.dashVx = (dx / dist) * (rage ? 8.5 : 5.5);
    b.dashVy = (dy / dist) * (rage ? 8.5 : 5.5);
    floatText(b.wx, b.wy - 50, '¡EMBESTIDA!', '#ff9100', 11);
  }

  if (b.dashing) {
    moveWithCollision(b, b.dashVx, b.dashVy);
    b.dashVx *= 0.87; b.dashVy *= 0.87;
    if (Math.abs(b.dashVx) < 0.5 && Math.abs(b.dashVy) < 0.5) b.dashing = false;
  } else {
    const spd = b.spd * (rage ? 1.5 : 1);
    moveWithCollision(b, (dx/dist)*spd, (dy/dist)*spd);
  }

  // Tentacle shots
  const tentCd = rage ? 100 : 180;
  if (b.tentT > tentCd) {
    b.tentT = 0;
    const shots = rage ? 4 : 2;
    for (let i = 0; i < shots; i++) {
      const spread = (i - (shots-1)/2) * 0.4;
      const ang = Math.atan2(dy, dx) + spread;
      projectiles.push({
        wx: b.wx, wy: b.wy,
        vx: Math.cos(ang) * 4.5, vy: Math.sin(ang) * 4.5,
        r: 8, color: PAL.green,
        type: 'boss', life: 110,
      });
    }
  }

  // Melee
  if (b.atkCd === 0 && player.inv === 0) {
    const d2 = (b.r + player.r + 4);
    if (dist < d2) {
      b.atkCd = 70;
      const dmg = rage ? 25 : 18;
      player.hp -= dmg;
      player.inv = 50;
      splat(player.wx, player.wy, '#cc0000', 5);
      if (player.hp <= 0) { playerDied('El Cuero te devoró'); }
    }
  }
}

// ── Enemy AI ──────────────────────────────────────────
function updateEnemy(e) {
  if (e.dead) return;
  if (e.hurtT > 0) e.hurtT--;
  if (e.atkCd > 0) e.atkCd--;

  const dx = player.wx - e.wx;
  const dy = player.wy - e.wy;
  const dist = Math.sqrt(dx*dx + dy*dy) || 1;

  if (dist < 300) e.aggro = true;

  if (e.aggro) {
    const spd = e.hurtT > 0 ? e.spd * 0.2 : e.spd;
    moveWithCollision(e, (dx/dist)*spd, (dy/dist)*spd);
    // update facing
    if (Math.abs(dx) > Math.abs(dy)) e.facing = dx > 0 ? 1 : 3;
    else e.facing = dy > 0 ? 2 : 0;

    // step anim
    if (e.stepT++ > 12) { e.stepT = 0; e.stepF = (e.stepF+1)%4; }
  }

  // Melee attack
  if (e.atkCd === 0 && player.inv === 0 && dist < e.r + player.r + 4) {
    e.atkCd = 60;
    player.hp -= e.atk;
    player.inv = 40;
    splat(player.wx, player.wy, '#cc0000', 4);
    if (player.hp <= 0) { playerDied('Caíste en combate'); }
  }
}

// ── Game state ────────────────────────────────────────
let gameRunning = false;
let score = 0;
let wave  = 1;
let frame = 0;

function updateHUD() {
  document.getElementById('hpBar').style.width   = Math.max(0, player.hp / player.maxHp * 100) + '%';
  document.getElementById('manaBar').style.width = Math.max(0, player.mana / player.maxMana * 100) + '%';
  document.getElementById('scoreVal').textContent = score;
  if (boss && !boss.dead) {
    document.getElementById('bossBar').style.width = Math.max(0, boss.hp / boss.maxHp * 100) + '%';
  }
}

// ── Main update ───────────────────────────────────────
function update() {
  if (!gameRunning || player.dead) return;
  frame++;

  // ── Player input ──────────────────────────────────
  let mdx = 0, mdy = 0;
  if (isLeft())  mdx -= PLAYER_SPEED;
  if (isRight()) mdx += PLAYER_SPEED;
  if (isUp())    mdy -= PLAYER_SPEED;
  if (isDown())  mdy += PLAYER_SPEED;

  // Normalize diagonal
  if (mdx !== 0 && mdy !== 0) { mdx *= 0.707; mdy *= 0.707; }

  player.moving = mdx !== 0 || mdy !== 0;

  if (player.moving) {
    moveWithCollision(player, mdx, mdy);
    // Update facing
    if (Math.abs(mdx) > Math.abs(mdy)) player.facing = mdx > 0 ? 1 : 3;
    else player.facing = mdy > 0 ? 2 : 0;
    // Step animation
    if (player.stepT++ > 14) { player.stepT = 0; player.stepF = (player.stepF+1)%4; }
  }

  // ── Attack buttons ────────────────────────────────
  if (isAtk() && !touch._atk) { playerAttack(); touch._atk = true; }
  if (!isAtk()) touch._atk = false;

  if (isSkl() && !touch._skl) { playerSkill(); touch._skl = false; }
  if (!isSkl()) touch._skl = false;

  // ── Cooldowns ─────────────────────────────────────
  if (player.atkCd  > 0) player.atkCd--;
  if (player.atkAnim > 0) player.atkAnim--;
  if (player.sklCd  > 0) player.sklCd--;
  if (player.inv    > 0) player.inv--;
  if (frame % 60 === 0)  player.mana = Math.min(player.maxMana, player.mana + 3);

  // ── Lava damage ───────────────────────────────────
  const ptile = tileAt(Math.floor(player.wx/TS), Math.floor(player.wy/TS));
  if (ptile === TILE.LAVA && player.inv === 0 && frame % 30 === 0) {
    player.hp -= 5; player.inv = 20;
    splat(player.wx, player.wy, '#ff4400', 3);
    if (player.hp <= 0) { playerDied('Caíste en la lava'); return; }
  }

  // ── Camera ────────────────────────────────────────
  updateCamera(player.wx, player.wy);

  // ── Enemies ───────────────────────────────────────
  for (const e of enemies) updateEnemy(e);

  // ── Boss ──────────────────────────────────────────
  updateBoss();

  // ── Projectiles ───────────────────────────────────
  for (const p of projectiles) {
    p.wx += p.vx; p.wy += p.vy; p.life--;

    // Wall hit
    const col = Math.floor(p.wx/TS), row = Math.floor(p.wy/TS);
    if (isSolid(col, row)) { p.life = 0; burst(p.wx, p.wy, p.color, 4, 2); continue; }

    if (p.type === 'player') {
      // vs enemies
      for (const e of enemies) {
        if (e.dead) continue;
        const dx = p.wx-e.wx, dy = p.wy-e.wy;
        if (dx*dx+dy*dy < (p.r+e.r)*(p.r+e.r)) {
          const dmg = 32 + Math.floor(Math.random()*14);
          e.hp -= dmg; e.hurtT = 14;
          splat(e.wx, e.wy, '#cc0000', 7);
          floatText(e.wx, e.wy - e.r - 4, `-${dmg}`, PAL.accent2);
          if (e.hp <= 0) killEnemy(e);
          p.life = 0; break;
        }
      }
      // vs boss
      if (p.life > 0 && boss && !boss.dead) {
        const dx = p.wx-boss.wx, dy = p.wy-boss.wy;
        if (dx*dx+dy*dy < (p.r+boss.r)*(p.r+boss.r)) {
          const dmg = 32 + Math.floor(Math.random()*14);
          boss.hp -= dmg; boss.hurtT = 14;
          splat(boss.wx, boss.wy, PAL.green, 8);
          floatText(boss.wx, boss.wy - boss.r - 4, `-${dmg}`, PAL.green, 14);
          if (boss.hp <= 0) killBoss();
          p.life = 0;
        }
      }
    }

    if (p.type === 'boss' && player.inv === 0) {
      const dx = p.wx-player.wx, dy = p.wy-player.wy;
      if (dx*dx+dy*dy < (p.r+player.r)*(p.r+player.r)) {
        player.hp -= 12; player.inv = 30;
        splat(player.wx, player.wy, '#cc0000', 4);
        if (player.hp <= 0) { playerDied('Tentáculo del Cuero'); }
        p.life = 0;
      }
    }

    // Trail
    addParticle(p.wx, p.wy, (Math.random()-0.5)*0.5, (Math.random()-0.5)*0.5,
      p.r * 0.5, p.color, 7, 10);
  }

  projectiles = projectiles.filter(p => p.life > 0);

  // ── Particles ─────────────────────────────────────
  for (const p of particles) {
    p.wx += p.vx; p.wy += p.vy;
    p.vx *= 0.93; p.vy *= 0.93;
    p.life--;
  }
  particles = particles.filter(p => p.life > 0);

  for (const t of floatingTexts) { t.wy += t.vy; t.life--; }
  floatingTexts = floatingTexts.filter(t => t.life > 0);

  // ── Wave clear ────────────────────────────────────
  const allDead = enemies.every(e => e.dead);
  const bossDone = bossActive ? (boss && boss.dead) : true;
  if (allDead && bossDone && !bossDefeated) {
    wave++;
    document.getElementById('levelVal').textContent = wave;
    showMsg(`⚔ ZONA ${wave} — Sigue, Augusto ⚔`, 2500);
    setTimeout(() => spawnWave(wave), 2200);
  }

  updateHUD();
}

// ── Drawing helpers ───────────────────────────────────
function drawShadow(wx, wy, r) {
  const sx = wx2s(wx), sy = wy2s(wy);
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(sx, sy + r * 0.55, r * 0.65, r * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ── Draw map ──────────────────────────────────────────
function drawMap() {
  const startCol = Math.max(0, Math.floor(camX / TS));
  const startRow = Math.max(0, Math.floor(camY / TS));
  const endCol   = Math.min(MAP_W, startCol + Math.ceil(VW / TS) + 2);
  const endRow   = Math.min(MAP_H, startRow + Math.ceil(VH / TS) + 2);

  for (let row = startRow; row < endRow; row++) {
    for (let col = startCol; col < endCol; col++) {
      const tile = worldMap[row][col];
      const sx = col * TS - camX;
      const sy = row * TS - camY;

      switch (tile) {
        case TILE.FLOOR: drawFloorTile(sx, sy, col, row); break;
        case TILE.WALL:  drawWallTile(sx, sy, col, row);  break;
        case TILE.WATER: drawWaterTile(sx, sy, col, row); break;
        case TILE.LAVA:  drawLavaTile(sx, sy, col, row);  break;
        case TILE.BOSS:  drawBossTile(sx, sy, col, row);  break;
      }
    }
  }
}

function drawFloorTile(sx, sy, col, row) {
  const dark = (col + row) % 2 === 0;
  ctx.fillStyle = dark ? PAL.floorA : PAL.floorB;
  ctx.fillRect(sx, sy, TS, TS);
  // subtle grid
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(sx + 0.5, sy + 0.5, TS - 1, TS - 1);
  // random worn spot
  if ((col * 7 + row * 13) % 17 === 0) {
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(sx + 8, sy + 8, TS - 16, TS - 16);
  }
}

function drawWallTile(sx, sy, col, row) {
  const dark = (col + row) % 2 === 0;
  ctx.fillStyle = dark ? PAL.wallA : PAL.wallB;
  ctx.fillRect(sx, sy, TS, TS);
  // 3D top bevel
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(sx, sy, TS, 3);
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(sx, sy + TS - 3, TS, 3);
  ctx.fillRect(sx + TS - 3, sy, 3, TS);
  // glow outline for walls that border floor (top)
  if (row > 0 && worldMap[row-1]?.[col] === TILE.FLOOR) {
    ctx.fillStyle = 'rgba(124,77,255,0.15)';
    ctx.fillRect(sx, sy + TS - 6, TS, 6);
  }
}

function drawWaterTile(sx, sy, col, row) {
  ctx.fillStyle = PAL.waterA;
  ctx.fillRect(sx, sy, TS, TS);
  const wave = Math.sin(frame * 0.05 + col * 0.8 + row * 0.6) * 0.2 + 0.2;
  ctx.fillStyle = `rgba(0,150,255,${wave})`;
  ctx.fillRect(sx, sy, TS, TS);
  // ripple lines
  ctx.strokeStyle = `rgba(0,229,255,${wave * 0.5})`;
  ctx.lineWidth = 1;
  const offset = (frame * 0.4 + col * 5) % TS;
  for (let y = sy + (offset % 10); y < sy + TS; y += 10) {
    ctx.beginPath(); ctx.moveTo(sx, y); ctx.lineTo(sx + TS, y); ctx.stroke();
  }
}

function drawLavaTile(sx, sy, col, row) {
  ctx.fillStyle = PAL.lavaA;
  ctx.fillRect(sx, sy, TS, TS);
  const pulse = Math.sin(frame * 0.07 + col * 1.3 + row) * 0.3 + 0.4;
  ctx.fillStyle = `rgba(200,50,0,${pulse})`;
  ctx.fillRect(sx, sy, TS, TS);
  // glow veins
  ctx.strokeStyle = `rgba(255,${Math.floor(pulse * 100)},0,0.7)`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(sx + 4, sy + 6); ctx.lineTo(sx + TS/2, sy + TS - 6); ctx.lineTo(sx + TS - 4, sy + 8);
  ctx.stroke();
  // lava glow
  ctx.fillStyle = `rgba(255,100,0,${pulse * 0.3})`;
  ctx.fillRect(sx, sy, TS, TS);
}

function drawBossTile(sx, sy, col, row) {
  ctx.fillStyle = PAL.floorBoss;
  ctx.fillRect(sx, sy, TS, TS);
  ctx.strokeStyle = 'rgba(0,80,0,0.4)';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(sx + 0.5, sy + 0.5, TS - 1, TS - 1);
  // pulsing green tint in boss zone
  const p = Math.sin(frame * 0.04 + col * 0.3) * 0.06 + 0.04;
  ctx.fillStyle = `rgba(50,200,0,${p})`;
  ctx.fillRect(sx, sy, TS, TS);
}

// ── Draw Augusto (boy knight, top-down) ───────────────
// Friendly purple/teal palette: small, clearly a kid
function drawPlayer() {
  const sx = wx2s(player.wx), sy = wy2s(player.wy);
  if (sx < -40 || sx > VW+40 || sy < -40 || sy > VH+40) return;

  drawShadow(player.wx, player.wy, player.r);
  ctx.save();
  ctx.translate(sx, sy);

  const flash = player.inv > 0 && Math.floor(player.inv / 4) % 2 === 0;
  ctx.globalAlpha = flash ? 0.3 : 1;

  // Rotate to facing direction
  const ang = [Math.PI * 1.5, 0, Math.PI * 0.5, Math.PI][player.facing];
  ctx.rotate(ang);

  // Bob when moving
  const bobY = player.moving ? Math.sin(frame * 0.25) * 1.5 : 0;
  ctx.translate(0, bobY);

  // ── Cape / cloak (back) ──────────────────────────
  ctx.fillStyle = '#2a0060';
  ctx.beginPath();
  ctx.moveTo(-6, 3); ctx.lineTo(-9, 16); ctx.lineTo(9, 16); ctx.lineTo(6, 3);
  ctx.fill();
  // cape accent stripe
  ctx.fillStyle = PAL.accent;
  ctx.fillRect(-2, 6, 4, 8);

  // ── Body — small rounded torso ────────────────────
  ctx.fillStyle = '#3d007a';
  ctx.beginPath(); ctx.ellipse(0, 2, 9, 11, 0, 0, Math.PI*2); ctx.fill();

  // Chest plate (slightly lighter, smaller = kid proportions)
  const cpGrad = ctx.createLinearGradient(-7, -5, 7, 8);
  cpGrad.addColorStop(0, '#5c00b8'); cpGrad.addColorStop(0.5, '#7c4dff'); cpGrad.addColorStop(1, '#3d007a');
  ctx.fillStyle = cpGrad;
  ctx.beginPath();
  ctx.moveTo(-6, -6); ctx.lineTo(6, -6);
  ctx.lineTo(7, 5); ctx.lineTo(0, 9); ctx.lineTo(-7, 5);
  ctx.closePath(); ctx.fill();
  // Gold trim
  ctx.strokeStyle = PAL.gold; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-6, -6); ctx.lineTo(6, -6);
  ctx.lineTo(7, 5); ctx.lineTo(0, 9); ctx.lineTo(-7, 5);
  ctx.closePath(); ctx.stroke();

  // Star emblem on chest (kid detail)
  ctx.fillStyle = PAL.gold;
  ctx.shadowColor = PAL.gold; ctx.shadowBlur = 5;
  const starPoints = 5;
  ctx.beginPath();
  for (let i = 0; i < starPoints * 2; i++) {
    const r2 = i % 2 === 0 ? 3.5 : 1.5;
    const a = (i / (starPoints * 2)) * Math.PI * 2 - Math.PI / 2;
    i === 0 ? ctx.moveTo(Math.cos(a)*r2, Math.cos(a)*r2) :
              ctx.lineTo(Math.cos(a)*r2, Math.sin(a)*r2 - 0);
    // proper star
    const r3 = i % 2 === 0 ? 3.5 : 1.5;
    const a2 = (i / (starPoints * 2)) * Math.PI * 2 - Math.PI / 2;
    if (i === 0) ctx.moveTo(Math.cos(a2)*r3, Math.sin(a2)*r3 - 1);
    else         ctx.lineTo(Math.cos(a2)*r3, Math.sin(a2)*r3 - 1);
  }
  ctx.closePath(); ctx.fill();
  ctx.shadowBlur = 0;

  // ── Pauldrons ─────────────────────────────────────
  ctx.fillStyle = '#5c00b8';
  ctx.beginPath(); ctx.arc(-9, -3, 5, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#7c4dff';
  ctx.beginPath(); ctx.arc(-9, -3, 3, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#5c00b8';
  ctx.beginPath(); ctx.arc( 9, -3, 5, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#7c4dff';
  ctx.beginPath(); ctx.arc( 9, -3, 3, 0, Math.PI*2); ctx.fill();

  // ── Helmet (round, kid-sized) ─────────────────────
  const hGrad = ctx.createRadialGradient(0, -9, 1, 0, -9, 10);
  hGrad.addColorStop(0, '#9c6dff'); hGrad.addColorStop(1, '#2a0060');
  ctx.fillStyle = hGrad;
  ctx.beginPath(); ctx.arc(0, -9, 10, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = PAL.gold; ctx.lineWidth = 1;
  ctx.stroke();

  // Visor slit — glowing cyan eyes (cute!)
  ctx.fillStyle = PAL.accent2;
  ctx.shadowColor = PAL.accent2; ctx.shadowBlur = 8;
  ctx.fillRect(-5, -10, 4, 3);
  ctx.fillRect(1,  -10, 4, 3);
  ctx.shadowBlur = 0;

  // Tiny plume on top
  ctx.fillStyle = '#ff6090';
  ctx.shadowColor = '#ff6090'; ctx.shadowBlur = 4;
  ctx.beginPath();
  ctx.moveTo(-2, -18); ctx.lineTo(0, -24); ctx.lineTo(2, -18);
  ctx.fill();
  ctx.shadowBlur = 0;

  // ── Sword (attack animation) ──────────────────────
  if (player.atkAnim > 0) {
    const prog = 1 - player.atkAnim / 12;
    const swingA = -Math.PI * 0.7 + prog * Math.PI * 1.2;
    ctx.save();
    ctx.rotate(swingA);
    // blade
    ctx.fillStyle = '#c8e0ff';
    ctx.shadowColor = PAL.accent2; ctx.shadowBlur = 8;
    ctx.fillRect(-1.5, 2, 3, 26);
    ctx.shadowBlur = 0;
    // tip glow
    ctx.fillStyle = PAL.accent2;
    ctx.shadowColor = PAL.accent2; ctx.shadowBlur = 12;
    ctx.fillRect(-2, 24, 4, 6);
    ctx.shadowBlur = 0;
    // crossguard
    ctx.fillStyle = PAL.gold;
    ctx.fillRect(-7, 2, 14, 4);
    // swing arc
    ctx.strokeStyle = 'rgba(0,229,255,0.2)'; ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(0, 0, 22, -Math.PI*0.7, -Math.PI*0.7 + prog*Math.PI*1.2);
    ctx.stroke();
    ctx.restore();
  } else {
    // Sword at rest
    ctx.save();
    ctx.translate(9, 3); ctx.rotate(0.3);
    ctx.fillStyle = '#c8e0ff'; ctx.fillRect(-1.5, -18, 3, 18);
    ctx.fillStyle = PAL.gold;  ctx.fillRect(-5, -1, 10, 3);
    ctx.restore();
    // Shield
    ctx.save();
    ctx.translate(-10, 2);
    ctx.fillStyle = '#2a0060';
    ctx.beginPath(); ctx.ellipse(0, 0, 5, 7, -0.2, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = PAL.gold; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = PAL.accent;
    ctx.fillRect(-1, -4, 2, 8); ctx.fillRect(-3, -1, 6, 2);
    ctx.restore();
  }

  ctx.globalAlpha = 1;
  ctx.restore();

  // HP bar above
  const bw = 32, bh = 4;
  const bx = sx - bw/2, by = sy - player.r - 11;
  ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = player.hp/player.maxHp > 0.5 ? '#ff1744' : '#ff6659';
  ctx.fillRect(bx, by, bw * (player.hp / player.maxHp), bh);
}

// ── Draw enemy ────────────────────────────────────────
function drawEnemy(e) {
  const sx = wx2s(e.wx), sy = wy2s(e.wy);
  if (sx < -50 || sx > VW+50 || sy < -50 || sy > VH+50) return;

  drawShadow(e.wx, e.wy, e.r);
  ctx.save();
  ctx.translate(sx, sy);

  const flash = e.hurtT > 0 && Math.floor(e.hurtT / 3) % 2 === 0;
  ctx.globalAlpha = flash ? 0.4 : 1;

  const ang = [Math.PI * 1.5, 0, Math.PI * 0.5, Math.PI][e.facing || 2];
  ctx.rotate(ang);

  const bob = e.aggro ? Math.sin(frame * 0.2 + e.wx) * 1.5 : 0;
  ctx.translate(0, bob);

  switch (e.shape) {
    case 'demon': drawDemon(e); break;
    case 'shade': drawShade(e); break;
    case 'imp':   drawImp(e);   break;
    case 'golem': drawGolem(e); break;
  }

  ctx.globalAlpha = 1;
  ctx.restore();

  // HP bar
  const bw = e.r * 2 + 4, bh = 3;
  const bx = sx - bw/2, by = sy - e.r - 8;
  ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = e.hp/e.maxHp > 0.5 ? '#ff1744' : '#ff9100';
  ctx.fillRect(bx, by, bw * (e.hp / e.maxHp), bh);
}

function drawDemon(e) {
  ctx.fillStyle = e.colBody;
  ctx.beginPath(); ctx.ellipse(0, 0, e.r, e.r, 0, 0, Math.PI*2); ctx.fill();
  // glow core
  ctx.fillStyle = e.colGlow; ctx.shadowColor = e.colGlow; ctx.shadowBlur = 10;
  ctx.beginPath(); ctx.ellipse(0, 0, e.r*0.4, e.r*0.4, 0, 0, Math.PI*2); ctx.fill();
  ctx.shadowBlur = 0;
  // horns
  ctx.fillStyle = '#1a0010';
  ctx.beginPath(); ctx.arc(-e.r*0.45, -e.r*0.65, 3.5, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc( e.r*0.45, -e.r*0.65, 3.5, 0, Math.PI*2); ctx.fill();
  // eyes
  ctx.fillStyle = e.colGlow; ctx.shadowColor = e.colGlow; ctx.shadowBlur = 7;
  ctx.beginPath(); ctx.arc(-4, -4, 2.5, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc( 4, -4, 2.5, 0, Math.PI*2); ctx.fill();
  ctx.shadowBlur = 0;
}

function drawShade(e) {
  ctx.globalAlpha *= 0.8;
  ctx.fillStyle = e.colBody;
  ctx.beginPath(); ctx.ellipse(0, 0, e.r, e.r, 0, 0, Math.PI*2); ctx.fill();
  ctx.globalAlpha = Math.min(ctx.globalAlpha * 1.25, 1);
  ctx.fillStyle = e.colGlow; ctx.shadowColor = e.colGlow; ctx.shadowBlur = 14;
  ctx.beginPath(); ctx.ellipse(0, 0, e.r*0.5, e.r*0.5, 0, 0, Math.PI*2); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath(); ctx.arc(-4, -3, 2.5, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc( 4, -3, 2.5, 0, Math.PI*2); ctx.fill();
}

function drawImp(e) {
  ctx.fillStyle = e.colBody;
  ctx.beginPath(); ctx.ellipse(0, 0, e.r, e.r*0.85, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = e.colGlow; ctx.shadowColor = e.colGlow; ctx.shadowBlur = 6;
  // tiny wings
  ctx.beginPath(); ctx.arc(-e.r*0.6, -e.r*0.5, 3.5, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc( e.r*0.6, -e.r*0.5, 3.5, 0, Math.PI*2); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffaadd';
  ctx.beginPath(); ctx.arc(-3, -3, 2, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc( 3, -3, 2, 0, Math.PI*2); ctx.fill();
}

function drawGolem(e) {
  ctx.fillStyle = e.colBody;
  ctx.beginPath(); ctx.rect(-e.r, -e.r, e.r*2, e.r*2); ctx.fill();
  ctx.strokeStyle = e.colGlow; ctx.shadowColor = e.colGlow; ctx.shadowBlur = 8; ctx.lineWidth = 2;
  // cracks
  ctx.beginPath(); ctx.moveTo(-8,-8); ctx.lineTo(0,0); ctx.lineTo(8,-6); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-4, 4); ctx.lineTo(6, 8); ctx.stroke();
  ctx.shadowBlur = 0;
  // glowing eyes
  ctx.fillStyle = e.colGlow; ctx.shadowColor = e.colGlow; ctx.shadowBlur = 10;
  ctx.beginPath(); ctx.arc(-5, -5, 4.5, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc( 5, -5, 4.5, 0, Math.PI*2); ctx.fill();
  ctx.shadowBlur = 0;
}

// ── Draw El Cuero boss ────────────────────────────────
function drawBoss() {
  if (!boss || boss.dead) return;
  const b = boss;
  const sx = wx2s(b.wx), sy = wy2s(b.wy);
  if (sx < -120 || sx > VW+120 || sy < -120 || sy > VH+120) return;

  drawShadow(b.wx, b.wy, b.r * 0.9);
  ctx.save();
  ctx.translate(sx, sy);

  const flash = b.hurtT > 0 && Math.floor(b.hurtT / 3) % 2 === 0;
  ctx.globalAlpha = flash ? 0.35 : 1;

  const rage   = b.phase === 2;
  const pulse  = Math.sin(frame * 0.06) * 0.1 + 1;
  const glowC  = rage ? '#ff4400' : PAL.green;
  const bodyC  = rage ? '#1a2800' : '#0a1a00';

  // Outer ring glow
  ctx.strokeStyle = glowC; ctx.shadowColor = glowC; ctx.shadowBlur = rage ? 32 : 20;
  ctx.lineWidth = 3.5;
  ctx.beginPath(); ctx.arc(0, 0, b.r * pulse, 0, Math.PI*2); ctx.stroke();
  ctx.shadowBlur = 0;

  // Body
  ctx.fillStyle = bodyC;
  ctx.beginPath(); ctx.ellipse(0, 0, b.r * 0.88 * pulse, b.r * 0.82 * pulse, 0, 0, Math.PI*2); ctx.fill();

  // Leather wrinkles
  ctx.strokeStyle = rage ? '#3a5500' : '#1e4400'; ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + frame * 0.008;
    const r1 = b.r * 0.12, r2 = b.r * 0.7 * pulse;
    const cpx = Math.cos(a + 0.4) * b.r * 0.4 + Math.sin(frame*0.05 + i) * 6;
    const cpy = Math.sin(a + 0.4) * b.r * 0.4 + Math.cos(frame*0.05 + i) * 6;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a)*r1, Math.sin(a)*r1);
    ctx.quadraticCurveTo(cpx, cpy, Math.cos(a)*r2, Math.sin(a)*r2);
    ctx.stroke();
  }

  // Tentacles
  const tc = rage ? 12 : 8;
  for (let i = 0; i < tc; i++) {
    const a = (i / tc) * Math.PI * 2 + frame * 0.02 * (i % 2 === 0 ? 1 : -1);
    const len = b.r * 1.35 + Math.sin(frame * 0.07 + i) * 10;
    const cpx = Math.cos(a)*b.r*0.7 + Math.sin(frame*0.05+i)*9;
    const cpy = Math.sin(a)*b.r*0.7 + Math.cos(frame*0.05+i)*9;
    ctx.strokeStyle = rage ? '#336600' : '#1a4400';
    ctx.lineWidth = 2.5 - i * 0.12;
    ctx.shadowColor = glowC; ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a)*b.r*0.5, Math.sin(a)*b.r*0.5);
    ctx.quadraticCurveTo(cpx, cpy, Math.cos(a)*len, Math.sin(a)*len);
    ctx.stroke();
    ctx.shadowBlur = 0;
    // tip
    ctx.fillStyle = glowC;
    ctx.beginPath(); ctx.arc(Math.cos(a)*len, Math.sin(a)*len, 3, 0, Math.PI*2); ctx.fill();
  }

  // Central eye
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.ellipse(0, 0, b.r*0.36, b.r*0.27, 0, 0, Math.PI*2); ctx.fill();

  const eyeC = rage ? '#ff2200' : '#00ff55';
  ctx.fillStyle = eyeC; ctx.shadowColor = eyeC; ctx.shadowBlur = 22;
  ctx.beginPath(); ctx.ellipse(0, 0, b.r*0.22, b.r*0.17, 0, 0, Math.PI*2); ctx.fill();
  ctx.shadowBlur = 0;

  // Pupil tracking player
  const pdx = player.wx - b.wx, pdy = player.wy - b.wy;
  const pd  = Math.sqrt(pdx*pdx + pdy*pdy) || 1;
  const px  = (pdx/pd) * b.r * 0.07, py = (pdy/pd) * b.r * 0.07;
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.ellipse(px, py, b.r*0.11, b.r*0.085, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.beginPath(); ctx.arc(px - b.r*0.05, py - b.r*0.04, b.r*0.035, 0, Math.PI*2); ctx.fill();

  // Dash flash
  if (b.dashing) {
    ctx.strokeStyle = '#ffaa00'; ctx.lineWidth = 4;
    ctx.shadowColor = '#ffaa00'; ctx.shadowBlur = 22;
    ctx.beginPath(); ctx.arc(0, 0, b.r*pulse + 5, 0, Math.PI*2); ctx.stroke();
    ctx.shadowBlur = 0;
  }

  ctx.globalAlpha = 1;
  ctx.restore();

  // Name above boss
  ctx.font = "bold 10px 'Cinzel Decorative'";
  ctx.fillStyle = PAL.green; ctx.textAlign = 'center';
  ctx.shadowColor = PAL.green; ctx.shadowBlur = 10;
  ctx.fillText('☠ EL CUERO ☠', sx, sy - b.r - 16);
  ctx.shadowBlur = 0;
}

// ── Draw particles ────────────────────────────────────
function drawParticles() {
  for (const p of particles) {
    ctx.save();
    ctx.globalAlpha = p.life / p.maxLife;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color; ctx.shadowBlur = p.glow;
    ctx.beginPath(); ctx.arc(wx2s(p.wx), wy2s(p.wy), p.r, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }
}

function drawProjectiles() {
  for (const p of projectiles) {
    ctx.save();
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color; ctx.shadowBlur = 14;
    ctx.beginPath(); ctx.arc(wx2s(p.wx), wy2s(p.wy), p.r, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }
}

function drawFloatingTexts() {
  for (const t of floatingTexts) {
    ctx.save();
    ctx.globalAlpha = t.life / t.maxLife;
    ctx.font = `bold ${t.size}px 'Cinzel Decorative'`;
    ctx.fillStyle = t.color; ctx.shadowColor = t.color; ctx.shadowBlur = 6;
    ctx.textAlign = 'center';
    ctx.fillText(t.text, wx2s(t.wx), wy2s(t.wy));
    ctx.restore();
  }
}

// ── Minimap ───────────────────────────────────────────
function drawMinimap() {
  const mw = 80, mh = 80;
  const mx = VW - mw - 8, my = VH - mh - 8;
  const scX = mw / MAP_W, scY = mh / MAP_H;

  ctx.fillStyle = 'rgba(5,0,14,0.8)';
  ctx.strokeStyle = '#3d1f6b'; ctx.lineWidth = 1;
  ctx.fillRect(mx, my, mw, mh);
  ctx.strokeRect(mx, my, mw, mh);

  for (let row = 0; row < MAP_H; row += 2) {
    for (let col = 0; col < MAP_W; col += 2) {
      const t = tileAt(col, row);
      ctx.fillStyle =
        t === TILE.WALL  ? '#2a1060' :
        t === TILE.WATER ? '#001e44' :
        t === TILE.LAVA  ? '#440d00' :
        t === TILE.BOSS  ? '#0a1a00' : '#1a0838';
      ctx.fillRect(mx + col*scX, my + row*scY, scX*2+1, scY*2+1);
    }
  }

  // Enemies
  ctx.fillStyle = '#ff1744';
  for (const e of enemies) {
    if (e.dead) continue;
    ctx.beginPath();
    ctx.arc(mx + (e.wx/TS)*scX, my + (e.wy/TS)*scY, 2, 0, Math.PI*2);
    ctx.fill();
  }
  // Boss
  if (boss && !boss.dead) {
    ctx.fillStyle = PAL.green;
    ctx.beginPath();
    ctx.arc(mx + (boss.wx/TS)*scX, my + (boss.wy/TS)*scY, 3.5, 0, Math.PI*2);
    ctx.fill();
  }
  // Player
  ctx.fillStyle = PAL.gold;
  ctx.shadowColor = PAL.gold; ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.arc(mx + (player.wx/TS)*scX, my + (player.wy/TS)*scY, 2.5, 0, Math.PI*2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

// ── Render ────────────────────────────────────────────
function render() {
  ctx.clearRect(0, 0, VW, VH);
  if (!worldMap) return;

  drawMap();
  drawParticles();
  drawProjectiles();

  // Depth sort by Y
  const drawList = [];
  if (!player.dead) drawList.push({ y: player.wy, fn: drawPlayer });
  for (const e of enemies) if (!e.dead) drawList.push({ y: e.wy, fn: () => drawEnemy(e) });
  if (boss && !boss.dead)              drawList.push({ y: boss.wy, fn: drawBoss });
  drawList.sort((a, b) => a.y - b.y);
  for (const d of drawList) d.fn();

  drawFloatingTexts();
  if (gameRunning) drawMinimap();

  // Vignette
  const vig = ctx.createRadialGradient(VW/2, VH/2, VH*0.25, VW/2, VH/2, VH*0.85);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,10,0.65)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, VW, VH);
}

// ── Game loop ─────────────────────────────────────────
function loop() {
  update();
  render();
  requestAnimationFrame(loop);
}

// ── UI helpers ────────────────────────────────────────
function showMsg(text, dur) {
  const el = document.getElementById('msg');
  el.textContent = text;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), dur);
}

function showDialog(name, text, dur) {
  const el   = document.getElementById('dialog');
  const nEl  = document.getElementById('dialogName');
  const tEl  = document.getElementById('dialogText');
  nEl.textContent = name;
  tEl.textContent = text;
  el.classList.add('visible');
  setTimeout(() => el.classList.remove('visible'), dur);
}

function playerDied(reason) {
  if (player.dead) return;
  player.dead = true;
  gameRunning  = false;
  splat(player.wx, player.wy, '#cc0000', 20);
  burst(player.wx, player.wy, '#ff1744', 14, 5);
  document.getElementById('deathReason').textContent = `"${reason}"`;
  setTimeout(() => document.getElementById('deathOverlay').classList.add('visible'), 1200);
}

// ── Start / restart ───────────────────────────────────
function startGame() {
  buildMap();

  // Reset player
  player.wx = 3*TS + TS/2; player.wy = 3*TS + TS/2;
  player.hp = 100; player.mana = 100;
  player.dead = false; player.inv = 0;
  player.atkCd = 0; player.sklCd = 0; player.atkAnim = 0;
  player.facing = 2; player.moving = false;

  score = 0; wave = 1; frame = 0; bossDefeated = false;
  particles = []; projectiles = []; floatingTexts = [];

  document.getElementById('scoreVal').textContent = '0';
  document.getElementById('levelVal').textContent = '1';
  document.getElementById('hpBar').style.width   = '100%';
  document.getElementById('manaBar').style.width = '100%';

  document.getElementById('overlay').style.display       = 'none';
  document.getElementById('deathOverlay').classList.remove('visible');
  document.getElementById('victoryOverlay').classList.remove('visible');
  document.getElementById('bossHud').classList.remove('visible');

  updateCamera(player.wx, player.wy);
  spawnWave(1);
  gameRunning = true;
  setupTouch();
}

// ── Button events ─────────────────────────────────────
document.getElementById('startBtn').addEventListener('click',   startGame);
document.getElementById('restartBtn').addEventListener('click', startGame);
document.getElementById('victoryBtn').addEventListener('click', startGame);

// Start loop immediately (renders black / overlay until startGame called)
loop();
