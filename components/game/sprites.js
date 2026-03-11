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
  stairs: [80, 176, 16, 16],   // stairs_down
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
  'ス': '/sprites/enemy_slime.png',     // マディ (muddy)
  '蝙': '/sprites/enemy_bat.png',       // インプ (imp)
  '蛇': '/sprites/enemy_snake.png',     // スワンピー (swampy)
  '鬼': '/sprites/enemy_goblin.png',    // ゴブリン (goblin)
  '弓': '/sprites/enemy_archer.png',    // スケルトン (skeleton)
  '花': '/sprites/enemy_flower.png',    // マスクオーク (masked_orc)
  '狼': '/sprites/enemy_wolf.png',      // アイスゾンビ (ice_zombie)
  '氷': '/sprites/enemy_ice.png',       // アイススケルトン (ice_skeleton)
  '雪': '/sprites/enemy_yeti.png',      // ウィザード (wizzard)
  '術': '/sprites/enemy_mage.png',      // エルフ (elf)
  '竜': '/sprites/enemy_dragon.png',    // ビッグデーモン (big_demon)
  '爆': '/sprites/enemy_bomber.png',    // オーク戦士 (orc_warrior)
  '溶': '/sprites/enemy_lava.png',      // オークシャーマン (orc_shaman)
  '召': '/sprites/enemy_summoner.png',  // ネクロマンサー (necromancer)
  '闇': '/sprites/enemy_dark.png',      // ビッグゾンビ (big_zombie)
  '死': '/sprites/enemy_reaper.png',    // タイニーゾンビ (tiny_zombie)
  '魔': '/sprites/enemy_demon.png',     // チョート (chort)
};

// Item char -> tileset sprite key (for consumables/throws on ground)
// Tileset items use key string, individual PNGs use path string with '/' prefix
export const ITEM_SPRITES = {
  '♥': '/sprites/item_potion_red.png',       // 回復薬 → red potion
  '✚': '/sprites/item_potion_big_red.png',   // 大回復薬 → big red potion
  '力': '/sprites/item_ring_gold.png',    // 力の指輪 → gold ring
  '守': '/sprites/item_necklace.png',    // 守りの首飾り → necklace
  '薬': '/sprites/item_herb.png',        // 薬草 → green herb
  '魔': '/sprites/item_magic_water.png', // 魔力の水 → blue magic water
  '●': '/sprites/item_stone.png',      // 石 → stone
  '食': '/sprites/item_food_apple.png', // リンゴ → apple
  '飯': '/sprites/item_food_meat.png',  // 焼き肉 → meat
  '🔴': '/sprites/item_wand_red.png',   // 炎の矢 → red arrow
  '🟣': '/sprites/item_staff_green.png', // 毒の杖 → green staff
  '🔵': '/sprites/item_wand_blue.png',  // 氷の矢 → blue arrow
};

// Equipment name -> tileset sprite [x, y, w, h] (for items on ground & inventory)
export const EQUIP_SPRITES = {
  // Weapons (individual PNGs from RPG Item Pack)
  'ボロの剣': '/sprites/item_sword_wood.png',
  '長剣':     '/sprites/item_sword_iron.png',
  '宝剣':     '/sprites/item_sword_steel.png',
  '聖剣':     '/sprites/item_sword_fire.png',
  // Armor (individual PNGs from RPG Item Pack)
  'ボロの盾': '/sprites/item_shield_wood.png',
  '鉄の盾':   '/sprites/item_shield_iron.png',
  '銅の盾':   '/sprites/item_shield_steel.png',
  '聖盾':     '/sprites/item_shield_holy.png',
};

// Theme CSS filters for tileset color variation
export const THEME_FILTERS = [
  'none',                                         // 洞窟 (base)
  'hue-rotate(80deg) saturate(1.3)',               // 森林 (green)
  'hue-rotate(180deg) brightness(1.15)',           // 氷穴 (cyan)
  'hue-rotate(-20deg) saturate(1.5) brightness(0.9)', // 溶岩 (red)
  'brightness(0.5) saturate(0.4)',                 // 闇域 (dark)
];
// Inverse filters to cancel parent theme filter on overlays
export const THEME_FILTERS_INV = [
  'none',
  'saturate(0.77) hue-rotate(-80deg)',
  'brightness(0.87) hue-rotate(-180deg)',
  'brightness(1.11) saturate(0.67) hue-rotate(20deg)',
  'saturate(2.5) brightness(2)',
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
