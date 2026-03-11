// Sprite configuration for 0x72 DungeonTileset II
// Spritesheet: /sprites/tileset.png
// Individual frames: /sprites/*.png

// Tileset sprite positions (from tile_list_v1.7)
// Format: [x, y, w, h] in the spritesheet
export const TILE_SPRITES = {
  // Floors (16x16)
  floor: [
    [16, 64, 16, 16],  // floor_1
    [32, 64, 16, 16],  // floor_2
    [48, 64, 16, 16],  // floor_3
    [16, 80, 16, 16],  // floor_4
    [32, 80, 16, 16],  // floor_5
    [48, 80, 16, 16],  // floor_6
    [16, 96, 16, 16],  // floor_7
    [32, 96, 16, 16],  // floor_8
  ],
  // Walls (16x16)
  wall_mid: [32, 16, 16, 16],
  wall_left: [16, 16, 16, 16],
  wall_right: [48, 16, 16, 16],
  wall_top_mid: [32, 0, 16, 16],
  // Special
  stairs: [80, 192, 16, 16],   // floor_stairs
  spikes: [16, 192, 16, 16],   // floor_spikes (trap)
  hole: [96, 144, 16, 16],
  // Items (16x16)
  flask_red: [288, 352, 16, 16],
  flask_blue: [304, 352, 16, 16],
  flask_green: [320, 352, 16, 16],
  flask_yellow: [336, 352, 16, 16],
  flask_big_red: [288, 336, 16, 16],
  flask_big_blue: [304, 336, 16, 16],
  flask_big_green: [320, 336, 16, 16],
  flask_big_yellow: [336, 336, 16, 16],
  // Chest
  chest_full: [304, 416, 16, 16],
  chest_empty: [304, 400, 16, 16],
  // Coin
  coin: [289, 385, 6, 7],
  // UI
  heart_full: [289, 370, 13, 12],
  heart_half: [305, 370, 13, 12],
  heart_empty: [321, 370, 13, 12],
  // Skull
  skull: [288, 432, 16, 16],
  // Bomb
  bomb: [288, 320, 16, 16],
};

// Enemy char -> individual frame PNG mapping
export const ENEMY_SPRITES = {
  'ス': '/sprites/enemy_slime.png',     // スライム
  '蝙': '/sprites/enemy_bat.png',       // コウモリ
  '蛇': '/sprites/enemy_snake.png',     // 毒蛇
  '鬼': '/sprites/enemy_goblin.png',    // ゴブリン
  '弓': '/sprites/enemy_archer.png',    // 弓兵
  '花': '/sprites/enemy_flower.png',    // 眠り花
  '狼': '/sprites/enemy_wolf.png',      // 狼
  '氷': '/sprites/enemy_ice.png',       // 氷精
  '雪': '/sprites/enemy_yeti.png',      // 雪男
  '術': '/sprites/enemy_mage.png',      // 魔術師
  '竜': '/sprites/enemy_dragon.png',    // 炎竜
  '爆': '/sprites/enemy_bomber.png',    // 爆弾魔
  '溶': '/sprites/enemy_lava.png',      // 溶岩獣
  '召': '/sprites/enemy_summoner.png',  // 召喚師
  '闇': '/sprites/enemy_dark.png',      // 闇王
  '死': '/sprites/enemy_reaper.png',    // 死神
  '魔': '/sprites/enemy_demon.png',     // 魔竜
};

// Item char -> tileset sprite position [x, y, w, h]
export const ITEM_SPRITES = {
  '♥': 'flask_red',       // 回復薬
  '✚': 'flask_big_red',   // 大回復薬
  '力': 'flask_yellow',   // 力の種
  '守': 'flask_blue',     // 守の種
  '食': 'flask_big_green', // おにぎり
  '飯': 'flask_big_yellow',// 大おにぎり
  '薬': 'flask_green',    // 解毒草
  '魔': 'flask_big_blue', // 魔力の水 (item context, not enemy 魔竜)
  '●': 'bomb',            // 石
  '†': 'skull',           // 毒針
  '→': 'flask_blue',      // 氷の矢
};

// Equipment sprites
export const EQUIP_SPRITES = {
  // Weapons - use tileset positions [x, y, w, h]
  '木の剣': [323, 10, 10, 21],    // weapon_regular_sword
  '鉄の剣': [307, 10, 10, 21],    // weapon_rusty_sword
  '鋼の剣': [339, 10, 10, 21],    // weapon_red_gem_sword
  '炎の剣': [322, 65, 12, 30],    // weapon_anime_sword
  // Armor - use shield-like items
  '皮の盾': [288, 352, 16, 16],   // flask_red as placeholder
  '鉄の盾': [304, 352, 16, 16],
  '鋼の盾': [320, 352, 16, 16],
  '聖盾':   [336, 352, 16, 16],
};

// Theme CSS filters for tileset color variation
export const THEME_FILTERS = [
  'none',                                         // 洞窟 (base)
  'hue-rotate(80deg) saturate(1.3)',               // 森林 (green)
  'hue-rotate(180deg) brightness(1.15)',           // 氷穴 (cyan)
  'hue-rotate(-20deg) saturate(1.5) brightness(0.9)', // 溶岩 (red)
  'brightness(0.5) saturate(0.4)',                 // 闇域 (dark)
];

// Tileset sheet dimensions
export const SHEET_URL = '/sprites/tileset.png';
export const SHEET_W = 512;
export const SHEET_H = 480;
export const PLAYER_SPRITE = '/sprites/player.png';
export const MERCHANT_SPRITE = '/sprites/merchant.png';

// Get a deterministic floor tile index based on position
export function getFloorTileIdx(x, y) {
  return ((x * 7 + y * 13) & 0x7fffffff) % TILE_SPRITES.floor.length;
}
