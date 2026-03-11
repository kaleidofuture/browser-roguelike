export const THEMES = [
  { name:"洞窟", wall:"#2a3a50", floor:"#334155", accent:"#94a3b8", bg:["#0f172a","#1a2332"] },
  { name:"森林", wall:"#1a6b3a", floor:"#1a3a2a", accent:"#4ade80", bg:["#071a0e","#14532d"] },
  { name:"氷穴", wall:"#1e6080", floor:"#1e3a5f", accent:"#67e8f9", bg:["#0c1e3a","#164e63"] },
  { name:"溶岩", wall:"#992828", floor:"#4a1c1c", accent:"#fb923c", bg:["#2a0a0a","#5a1515"] },
  { name:"闇域", wall:"#2a2520", floor:"#292524", accent:"#a78bfa", bg:["#0a0908","#1c1917"] },
];
export const getTheme = f => THEMES[Math.min(Math.floor((f-1)/2), THEMES.length-1)];

export const STATUS_INFO = {
  poison:{name:"毒",icon:"🟣",dur:8},confuse:{name:"混乱",icon:"💫",dur:6},
  sleep:{name:"睡眠",icon:"💤",dur:4},para:{name:"麻痺",icon:"⚡",dur:5},
  blind:{name:"盲目",icon:"🌑",dur:6},slow:{name:"鈍足",icon:"🐢",dur:5},
};

export const ENEMY_POOLS = [
  [{name:"マディ",char:"ス",hp:10,atk:3,def:1,exp:5,color:"#4ade80",ai:"normal"},{name:"インプ",char:"蝙",hp:7,atk:5,def:0,exp:4,color:"#c084fc",ai:"erratic"},{name:"スワンピー",char:"蛇",hp:9,atk:4,def:0,exp:6,color:"#a855f7",ai:"poison"}],
  [{name:"ゴブリン",char:"鬼",hp:18,atk:7,def:2,exp:12,color:"#fb923c",ai:"normal"},{name:"スケルトン",char:"弓",hp:12,atk:6,def:1,exp:14,color:"#f97316",ai:"ranged"},{name:"マスクオーク",char:"花",hp:8,atk:3,def:0,exp:10,color:"#f0abfc",ai:"sleep"},{name:"アイスゾンビ",char:"狼",hp:15,atk:9,def:1,exp:11,color:"#9ca3af",ai:"caller"}],
  [{name:"アイススケルトン",char:"氷",hp:22,atk:10,def:4,exp:20,color:"#67e8f9",ai:"slow"},{name:"ウィザード",char:"雪",hp:30,atk:12,def:5,exp:25,color:"#e2e8f0",ai:"normal"},{name:"エルフ",char:"術",hp:16,atk:14,def:2,exp:22,color:"#818cf8",ai:"ranged"}],
  [{name:"ビッグデーモン",char:"竜",hp:50,atk:18,def:8,exp:55,color:"#dc2626",ai:"normal"},{name:"オーク戦士",char:"爆",hp:20,atk:22,def:2,exp:35,color:"#ef4444",ai:"ranged"},{name:"オークシャーマン",char:"溶",hp:45,atk:16,def:10,exp:45,color:"#fb923c",ai:"normal"},{name:"ネクロマンサー",char:"召",hp:25,atk:10,def:3,exp:40,color:"#f59e0b",ai:"caller"}],
  [{name:"ビッグゾンビ",char:"闇",hp:70,atk:24,def:12,exp:80,color:"#7c3aed",ai:"ranged"},{name:"タイニーゾンビ",char:"死",hp:55,atk:28,def:6,exp:70,color:"#f87171",ai:"poison"},{name:"チョート",char:"魔",hp:90,atk:22,def:14,exp:100,color:"#dc2626",ai:"caller"}],
];

export const CONSUMABLES = [
  {name:"回復薬",char:"♥",type:"heal",value:25,color:"#22c55e",desc:"HP25回復"},
  {name:"大回復薬",char:"✚",type:"heal",value:50,color:"#10b981",desc:"HP50回復",mf:3},
  {name:"力の指輪",char:"力",type:"atkUp",value:2,color:"#f59e0b",desc:"攻撃力+2"},
  {name:"守りの首飾り",char:"守",type:"defUp",value:1,color:"#60a5fa",desc:"防御力+1"},
  {name:"リンゴ",char:"食",type:"food",value:50,color:"#4ade80",desc:"満腹度+50"},
  {name:"焼き肉",char:"飯",type:"food",value:100,color:"#f59e0b",desc:"満腹度+100",mf:3},
  {name:"薬草",char:"薬",type:"cure",value:0,color:"#86efac",desc:"状態異常回復"},
  {name:"魔力の水",char:"魔",type:"mpHeal",value:20,color:"#a78bfa",desc:"MP20回復",mf:2},
];

export const THROW_ITEMS = [
  {name:"石",char:"●",type:"throw",dmg:10,color:"#9ca3af",desc:"投擲:10ダメージ"},
  {name:"炎の矢",char:"🔴",type:"throwFire",dmg:12,color:"#ef4444",desc:"投擲:炎12ダメージ",mf:3},
  {name:"毒の杖",char:"🟣",type:"throwPoison",dmg:5,color:"#a855f7",desc:"投擲:5ダメージ+毒付与",mf:4},
  {name:"氷の矢",char:"🔵",type:"throwSlow",dmg:8,color:"#67e8f9",desc:"投擲:8ダメージ+鈍足付与",mf:5},
];

export const WEAPONS = [
  {name:"ボロの剣",char:"剣",slot:"weapon",atk:2,color:"#a1887f",mf:1},
  {name:"長剣",char:"剣",slot:"weapon",atk:5,color:"#90a4ae",mf:2},
  {name:"宝剣",char:"剣",slot:"weapon",atk:9,color:"#b0bec5",mf:4},
  {name:"聖剣",char:"剣",slot:"weapon",atk:14,color:"#fbbf24",mf:7},
];

export const ARMORS = [
  {name:"ボロの盾",char:"盾",slot:"armor",def:1,color:"#a1887f",mf:1},
  {name:"鉄の盾",char:"盾",slot:"armor",def:3,color:"#90a4ae",mf:2},
  {name:"銅の盾",char:"盾",slot:"armor",def:5,color:"#cd7f32",mf:4},
  {name:"聖盾",char:"聖",slot:"armor",def:8,color:"#fbbf24",mf:7},
];

export const SKILLS = [
  {id:"fireball",name:"火球",cost:8,type:"area",radius:1,dmg:20,desc:"周囲1マスに炎",icon:"🔥",mf:1},
  {id:"heal",name:"回復",cost:6,type:"selfHeal",value:30,desc:"HP30回復",icon:"💚",mf:1},
  {id:"ice",name:"氷結",cost:10,type:"line",range:5,dmg:15,status:"slow",desc:"直線5マス氷+鈍足",icon:"❄️",mf:3},
  {id:"thunder",name:"雷鳴",cost:14,type:"room",dmg:18,desc:"部屋全体に雷",icon:"⚡",mf:5},
  {id:"fullHeal",name:"大回復",cost:18,type:"selfHeal",value:80,desc:"HP80回復",icon:"✨",mf:6},
  {id:"warp",name:"転移",cost:5,type:"warp",desc:"ランダム移動",icon:"🌀",mf:2},
];

export const TRAP_TYPES = [
  {name:"毒の罠",effect:"poison",color:"#a855f7",char:"×",icon:"🟣",desc:"毒状態にする"},
  {name:"落穴",effect:"pit",color:"#d97706",char:"×",icon:"🕳️",desc:"ダメージ+ランダム移動"},
  {name:"ワープ罠",effect:"warp",color:"#06b6d4",char:"×",icon:"🌀",desc:"ランダムな場所に飛ばす"},
  {name:"地雷",effect:"bomb",color:"#ef4444",char:"×",icon:"💥",desc:"大ダメージ"},
  {name:"鈍足罠",effect:"slow",color:"#94a3b8",char:"×",icon:"🐢",desc:"鈍足状態にする"},
  {name:"混乱罠",effect:"confuse",color:"#fbbf24",char:"×",icon:"💫",desc:"混乱状態にする"},
  {name:"睡眠罠",effect:"sleep",color:"#60a5fa",char:"×",icon:"💤",desc:"睡眠状態にする"},
];

export const SHOP_ITEMS = [
  {name:"回復薬",char:"♥",type:"heal",value:25,color:"#22c55e",desc:"HP25回復",price:30,category:"consumable"},
  {name:"大回復薬",char:"✚",type:"heal",value:50,color:"#10b981",desc:"HP50回復",price:60,category:"consumable"},
  {name:"リンゴ",char:"食",type:"food",value:50,color:"#4ade80",desc:"満腹度+50",price:25,category:"consumable"},
  {name:"薬草",char:"薬",type:"cure",value:0,color:"#86efac",desc:"状態異常回復",price:20,category:"consumable"},
  {name:"魔力の水",char:"魔",type:"mpHeal",value:20,color:"#a78bfa",desc:"MP20回復",price:40,category:"consumable"},
  {name:"石x3",char:"●",type:"throw",dmg:10,color:"#9ca3af",desc:"投擲:10dmg",price:15,category:"throw",qty:3},
];
