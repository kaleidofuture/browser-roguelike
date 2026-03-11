export const MAP_W = 35, MAP_H = 25, VP = 11, VP_HALF = 5;
export const WALL = 0, FLOOR = 1;
export const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
export const MAX_FLOOR = 10, MAX_INV = 12, MAX_FULL = 150, FULL_DECAY = 1, MAX_MP = 50;
export const DIRS_4 = [[0,-1],[0,1],[-1,0],[1,0]];
export const DIRS_8 = [[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]];
export const DIR_LABELS = ["↑","↗","→","↘","↓","↙","←","↖"];
