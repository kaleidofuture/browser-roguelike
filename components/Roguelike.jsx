"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import * as Tone from "tone";

// ===== CONSTANTS =====
const MAP_W = 35, MAP_H = 25, VP = 11, VP_HALF = 5;
const WALL = 0, FLOOR = 1;
const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const MAX_FLOOR = 10, MAX_INV = 12, MAX_FULL = 100, FULL_DECAY = 1, MAX_MP = 50;
const DIRS_4 = [[0,-1],[0,1],[-1,0],[1,0]];
const DIRS_8 = [[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]];
const DIR_LABELS = ["↑","↗","→","↘","↓","↙","←","↖"];

// ===== THEMES =====
const THEMES = [
  { name:"洞窟", wall:"#2a3a50", floor:"#334155", accent:"#94a3b8", bg:["#0f172a","#1a2332"] },
  { name:"森林", wall:"#1a6b3a", floor:"#1a3a2a", accent:"#4ade80", bg:["#071a0e","#14532d"] },
  { name:"氷穴", wall:"#1e6080", floor:"#1e3a5f", accent:"#67e8f9", bg:["#0c1e3a","#164e63"] },
  { name:"溶岩", wall:"#992828", floor:"#4a1c1c", accent:"#fb923c", bg:["#2a0a0a","#5a1515"] },
  { name:"闇域", wall:"#2a2520", floor:"#292524", accent:"#a78bfa", bg:["#0a0908","#1c1917"] },
];
const getTheme = f => THEMES[Math.min(Math.floor((f-1)/2), THEMES.length-1)];

// ===== STATUS =====
const STATUS_INFO = {
  poison:{name:"毒",icon:"🟣",dur:8},confuse:{name:"混乱",icon:"💫",dur:6},
  sleep:{name:"睡眠",icon:"💤",dur:4},para:{name:"麻痺",icon:"⚡",dur:5},
  blind:{name:"盲目",icon:"🌑",dur:6},slow:{name:"鈍足",icon:"🐢",dur:5},
};

// ===== ENEMIES =====
const ENEMY_POOLS = [
  [{name:"スライム",char:"ス",hp:10,atk:3,def:1,exp:5,color:"#4ade80",ai:"normal"},{name:"コウモリ",char:"蝙",hp:7,atk:5,def:0,exp:4,color:"#c084fc",ai:"erratic"},{name:"毒蛇",char:"蛇",hp:9,atk:4,def:0,exp:6,color:"#a855f7",ai:"poison"}],
  [{name:"ゴブリン",char:"鬼",hp:18,atk:7,def:2,exp:12,color:"#fb923c",ai:"normal"},{name:"弓兵",char:"弓",hp:12,atk:6,def:1,exp:14,color:"#f97316",ai:"ranged"},{name:"眠り花",char:"花",hp:8,atk:3,def:0,exp:10,color:"#f0abfc",ai:"sleep"},{name:"狼",char:"狼",hp:15,atk:9,def:1,exp:11,color:"#9ca3af",ai:"caller"}],
  [{name:"氷精",char:"氷",hp:22,atk:10,def:4,exp:20,color:"#67e8f9",ai:"para"},{name:"雪男",char:"雪",hp:30,atk:12,def:5,exp:25,color:"#e2e8f0",ai:"normal"},{name:"魔術師",char:"術",hp:16,atk:14,def:2,exp:22,color:"#818cf8",ai:"ranged"}],
  [{name:"炎竜",char:"竜",hp:50,atk:18,def:8,exp:55,color:"#dc2626",ai:"normal"},{name:"爆弾魔",char:"爆",hp:20,atk:22,def:2,exp:35,color:"#ef4444",ai:"ranged"},{name:"溶岩獣",char:"溶",hp:45,atk:16,def:10,exp:45,color:"#fb923c",ai:"confuse"},{name:"召喚師",char:"召",hp:25,atk:10,def:3,exp:40,color:"#f59e0b",ai:"caller"}],
  [{name:"闇王",char:"闇",hp:70,atk:24,def:12,exp:80,color:"#7c3aed",ai:"ranged"},{name:"死神",char:"死",hp:55,atk:28,def:6,exp:70,color:"#f87171",ai:"poison"},{name:"魔竜",char:"魔",hp:90,atk:22,def:14,exp:100,color:"#dc2626",ai:"caller"}],
];

// ===== ITEMS =====
const CONSUMABLES = [
  {name:"回復薬",char:"♥",type:"heal",value:25,color:"#22c55e",desc:"HP25回復"},
  {name:"大回復薬",char:"✚",type:"heal",value:50,color:"#10b981",desc:"HP50回復",mf:3},
  {name:"力の種",char:"力",type:"atkUp",value:2,color:"#f59e0b",desc:"攻撃力+2"},
  {name:"守の種",char:"守",type:"defUp",value:1,color:"#60a5fa",desc:"防御力+1"},
  {name:"おにぎり",char:"食",type:"food",value:40,color:"#fbbf24",desc:"満腹度+40"},
  {name:"大おにぎり",char:"飯",type:"food",value:80,color:"#f59e0b",desc:"満腹度+80",mf:4},
  {name:"解毒草",char:"薬",type:"cure",value:0,color:"#86efac",desc:"状態異常回復"},
  {name:"魔力の水",char:"魔",type:"mpHeal",value:20,color:"#a78bfa",desc:"MP20回復",mf:2},
];
const THROW_ITEMS = [
  {name:"石",char:"●",type:"throw",dmg:10,color:"#9ca3af",desc:"投擲:10dmg"},
  {name:"毒針",char:"†",type:"throwPoison",dmg:5,color:"#a855f7",desc:"投擲:毒付与",mf:3},
  {name:"氷の矢",char:"→",type:"throwPara",dmg:8,color:"#67e8f9",desc:"投擲:麻痺付与",mf:5},
];
const WEAPONS = [
  {name:"木の剣",char:"剣",slot:"weapon",atk:2,color:"#a1887f",mf:1},
  {name:"鉄の剣",char:"剣",slot:"weapon",atk:5,color:"#90a4ae",mf:2},
  {name:"鋼の剣",char:"剣",slot:"weapon",atk:9,color:"#b0bec5",mf:4},
  {name:"炎の剣",char:"炎",slot:"weapon",atk:14,color:"#ff7043",mf:7},
];
const ARMORS = [
  {name:"皮の盾",char:"盾",slot:"armor",def:1,color:"#a1887f",mf:1},
  {name:"鉄の盾",char:"盾",slot:"armor",def:3,color:"#90a4ae",mf:2},
  {name:"鋼の盾",char:"盾",slot:"armor",def:5,color:"#b0bec5",mf:4},
  {name:"聖盾",char:"聖",slot:"armor",def:8,color:"#ffee58",mf:7},
];

// ===== SKILLS =====
const SKILLS = [
  {id:"fireball",name:"火球",cost:8,type:"area",radius:1,dmg:20,desc:"周囲1マスに炎",icon:"🔥",mf:1},
  {id:"heal",name:"回復",cost:6,type:"selfHeal",value:30,desc:"HP30回復",icon:"💚",mf:1},
  {id:"ice",name:"氷結",cost:10,type:"line",range:5,dmg:15,status:"para",desc:"直線5マス氷+麻痺",icon:"❄️",mf:3},
  {id:"thunder",name:"雷鳴",cost:14,type:"room",dmg:18,desc:"部屋全体に雷",icon:"⚡",mf:5},
  {id:"fullHeal",name:"大回復",cost:18,type:"selfHeal",value:80,desc:"HP80回復",icon:"✨",mf:6},
  {id:"warp",name:"転移",cost:5,type:"warp",desc:"ランダム移動",icon:"🌀",mf:2},
];

const TRAP_TYPES = [
  {name:"毒の罠",effect:"poison",color:"#a855f7",char:"×"},
  {name:"落穴",effect:"pit",color:"#78350f",char:"×"},
  {name:"ワープ罠",effect:"warp",color:"#06b6d4",char:"×"},
  {name:"地雷",effect:"bomb",color:"#ef4444",char:"×"},
  {name:"鈍足罠",effect:"slow",color:"#6b7280",char:"×"},
  {name:"混乱罠",effect:"confuse",color:"#fbbf24",char:"×"},
  {name:"睡眠罠",effect:"sleep",color:"#60a5fa",char:"×"},
];

const SHOP_ITEMS = [
  {name:"回復薬",char:"♥",type:"heal",value:25,color:"#22c55e",desc:"HP25回復",price:30,category:"consumable"},
  {name:"大回復薬",char:"✚",type:"heal",value:50,color:"#10b981",desc:"HP50回復",price:60,category:"consumable"},
  {name:"おにぎり",char:"食",type:"food",value:40,color:"#fbbf24",desc:"満腹度+40",price:25,category:"consumable"},
  {name:"解毒草",char:"薬",type:"cure",value:0,color:"#86efac",desc:"状態異常回復",price:20,category:"consumable"},
  {name:"魔力の水",char:"魔",type:"mpHeal",value:20,color:"#a78bfa",desc:"MP20回復",price:40,category:"consumable"},
  {name:"石x3",char:"●",type:"throw",dmg:10,color:"#9ca3af",desc:"投擲:10dmg",price:15,category:"throw",qty:3},
];

// ===== AUDIO =====
let audioOk=false;const sy={};
function initAudio(){if(audioOk)return;audioOk=true;Tone.start();
  sy.a=new Tone.Synth({oscillator:{type:"square"},envelope:{attack:0.01,decay:0.1,sustain:0,release:0.05},volume:-18}).toDestination();
  sy.h=new Tone.Synth({oscillator:{type:"sawtooth"},envelope:{attack:0.01,decay:0.15,sustain:0,release:0.05},volume:-16}).toDestination();
  sy.i=new Tone.Synth({oscillator:{type:"triangle"},envelope:{attack:0.01,decay:0.2,sustain:0.1,release:0.1},volume:-14}).toDestination();
  sy.l=new Tone.PolySynth(Tone.Synth,{oscillator:{type:"triangle"},envelope:{attack:0.05,decay:0.3,sustain:0.1,release:0.2},volume:-14}).toDestination();
  sy.s=new Tone.Synth({oscillator:{type:"sine"},envelope:{attack:0.05,decay:0.4,sustain:0.1,release:0.3},volume:-14}).toDestination();
  sy.t=new Tone.NoiseSynth({noise:{type:"pink"},envelope:{attack:0.01,decay:0.2,sustain:0,release:0.1},volume:-16}).toDestination();
  sy.d=new Tone.Synth({oscillator:{type:"sawtooth"},envelope:{attack:0.1,decay:0.8,sustain:0,release:0.5},volume:-12}).toDestination();
  sy.e=new Tone.MetalSynth({frequency:300,envelope:{attack:0.01,decay:0.15,sustain:0,release:0.1},volume:-20}).toDestination();
  sy.m=new Tone.Synth({oscillator:{type:"sine"},envelope:{attack:0.02,decay:0.3,sustain:0.05,release:0.2},volume:-14}).toDestination();
}
function sfx(t){if(!audioOk)return;try{const n=Tone.now();
  if(t==="atk")sy.a.triggerAttackRelease("C5","16n",n);
  else if(t==="hit")sy.h.triggerAttackRelease("G3","16n",n);
  else if(t==="kill")sy.a.triggerAttackRelease("E5","16n",n);
  else if(t==="item")sy.i.triggerAttackRelease("E5","8n",n);
  else if(t==="food")sy.i.triggerAttackRelease("A4","8n",n);
  else if(t==="lvl"){sy.l.triggerAttackRelease(["C5","E5","G5"],"8n",n);sy.l.triggerAttackRelease(["E5","G5","C6"],"8n",n+0.2);}
  else if(t==="stairs"){sy.s.triggerAttackRelease("C4","8n",n);sy.s.triggerAttackRelease("E4","8n",n+0.15);sy.s.triggerAttackRelease("G4","8n",n+0.3);}
  else if(t==="trap")sy.t.triggerAttackRelease("8n",n);
  else if(t==="dead"){sy.d.triggerAttackRelease("E3","4n",n);sy.d.triggerAttackRelease("C3","4n",n+0.3);}
  else if(t==="equip")sy.e.triggerAttackRelease("8n",n);
  else if(t==="win"){sy.l.triggerAttackRelease(["C5","E5","G5"],"8n",n);sy.l.triggerAttackRelease(["D5","F5","A5"],"8n",n+0.25);sy.l.triggerAttackRelease(["E5","G5","C6"],"4n",n+0.5);}
  else if(t==="magic"){sy.m.triggerAttackRelease("A5","8n",n);sy.m.triggerAttackRelease("C6","16n",n+0.1);}
  else if(t==="throw")sy.a.triggerAttackRelease("G5","16n",n);
  else if(t==="shop")sy.i.triggerAttackRelease("C5","8n",n);
}catch(e){}}

// ===== VISIBILITY (Mystery Dungeon style) =====
// LOS for ranged enemies
function hasLOS(x0,y0,x1,y1,map){
  const dx=Math.abs(x1-x0),dy=Math.abs(y1-y0),sx=x0<x1?1:-1,syy=y0<y1?1:-1;
  let err=dx-dy,cx=x0,cy=y0;
  while(true){if(cx===x1&&cy===y1)return true;if(cx<0||cx>=MAP_W||cy<0||cy>=MAP_H)return false;
    if(map[cy][cx]===WALL&&!(cx===x0&&cy===y0))return false;
    const e2=2*err;if(e2>-dy){err-=dy;cx+=sx;}if(e2<dx){err+=dx;cy+=syy;}}
}
// Find which room the player is in (or null)
function findRoom(px,py,rooms){
  for(const r of rooms){
    if(px>=r.x&&px<r.x+r.w&&py>=r.y&&py<r.y+r.h) return r;
  }
  return null;
}
// Corridor visibility: only adjacent 1 tile (Mystery Dungeon standard)
function corridorVis(vis,px,py,map){
  for(const[dx,dy] of DIRS_8){
    const nx=px+dx,ny=py+dy;
    if(nx>=0&&nx<MAP_W&&ny>=0&&ny<MAP_H) vis.add(`${nx},${ny}`);
  }
}
// Room visibility: entire room + surrounding wall ring
function roomVis(vis,room){
  for(let ry=room.y-1;ry<=room.y+room.h;ry++){
    for(let rx=room.x-1;rx<=room.x+room.w;rx++){
      if(rx>=0&&rx<MAP_W&&ry>=0&&ry<MAP_H) vis.add(`${rx},${ry}`);
    }
  }
  // Also reveal 1 tile into each corridor exit (so you can see what's at the doorway)
  for(let rx=room.x;rx<room.x+room.w;rx++){
    // top edge
    if(room.y-1>=0&&rx>=0&&rx<MAP_W){
      const wy=room.y-1;
      if(wy>=0&&wy<MAP_H&&rx>=0&&rx<MAP_W){
        // Check if there's a corridor exit here (floor tile in wall ring)
        if(wy-1>=0&&rx>=0&&rx<MAP_W&&wy-1<MAP_H&&FLOOR===1) {
          // just add the wall ring tile, already done above
        }
      }
    }
  }
}
// Main visibility function
function calcVis(px,py,map,rooms,radius=5){
  const vis=new Set();
  vis.add(`${px},${py}`);
  const isBlind=radius<5;
  const room=findRoom(px,py,rooms);
  if(room&&!isBlind){
    // In a room (not blind): reveal entire room + walls + peek into corridor exits
    roomVis(vis,room);
    for(let ry=room.y-1;ry<=room.y+room.h;ry++){
      for(let rx=room.x-1;rx<=room.x+room.w;rx++){
        if(rx<0||rx>=MAP_W||ry<0||ry>=MAP_H) continue;
        if(rx>room.x-1&&rx<room.x+room.w&&ry>room.y-1&&ry<room.y+room.h) continue;
        if(map[ry][rx]===FLOOR){
          for(const[dx,dy] of DIRS_4){
            if(rx+dx>=room.x&&rx+dx<room.x+room.w&&ry+dy>=room.y&&ry+dy<room.y+room.h) continue;
            for(let d=0;d<=2;d++){
              const nx=rx+dx*d,ny=ry+dy*d;
              if(nx<0||nx>=MAP_W||ny<0||ny>=MAP_H) break;
              vis.add(`${nx},${ny}`);
              if(map[ny][nx]===WALL) break;
            }
          }
        }
      }
    }
  } else if(!room){
    // In a corridor: limited visibility
    corridorVis(vis,px,py,map);
    // If adjacent to a room entrance, peek into that room (unless blind)
    if(!isBlind){
      for(const[dx,dy] of DIRS_8){
        const ax=px+dx,ay=py+dy;
        const adjRoom=findRoom(ax,ay,rooms);
        if(adjRoom) roomVis(vis,adjRoom);
      }
    }
  } else {
    // Blind in room: only adjacent tiles
    corridorVis(vis,px,py,map);
  }
  return vis;
}

// ===== DUNGEON =====
function genDungeon(floor){
  const map=Array.from({length:MAP_H},()=>Array(MAP_W).fill(WALL));const rooms=[];
  for(let t=0;t<200&&rooms.length<rand(5,8);t++){
    const w=rand(4,8),h=rand(3,6),x=rand(1,MAP_W-w-2),y=rand(1,MAP_H-h-2);
    if(rooms.some(r=>x<r.x+r.w+2&&x+w+2>r.x&&y<r.y+r.h+2&&y+h+2>r.y))continue;
    rooms.push({x,y,w,h,cx:Math.floor(x+w/2),cy:Math.floor(y+h/2)});
    for(let ry=y;ry<y+h;ry++)for(let rx=x;rx<x+w;rx++)map[ry][rx]=FLOOR;
  }
  for(let i=1;i<rooms.length;i++){
    const{cx:ax,cy:ay}=rooms[i-1],{cx:bx,cy:by}=rooms[i];
    let cx=ax;while(cx!==bx){map[ay][cx]=FLOOR;cx+=cx<bx?1:-1;}map[ay][bx]=FLOOR;
    let cy=ay;while(cy!==by){map[cy][bx]=FLOOR;cy+=cy<by?1:-1;}map[by][bx]=FLOOR;
  }
  const start={x:rooms[0].cx,y:rooms[0].cy},stairs={x:rooms[rooms.length-1].cx,y:rooms[rooms.length-1].cy};
  const used=new Set([`${start.x},${start.y}`,`${stairs.x},${stairs.y}`]);

  // Place merchant first so enemies/items avoid it
  let merchant=null;
  if(floor>=2&&Math.random()<0.35){const ri=rand(1,rooms.length-2),r=rooms[ri];const mk=`${r.cx},${r.cy}`;if(!used.has(mk)){merchant={x:r.cx,y:r.cy};used.add(mk);}}

  const pi=Math.min(Math.floor((floor-1)/2),ENEMY_POOLS.length-1),pool=ENEMY_POOLS[pi];
  const enemies=[];
  for(let i=0;i<rand(4,6)+Math.floor(floor*0.8);i++){
    const r=rooms[rand(1,rooms.length-1)],ex=rand(r.x+1,r.x+r.w-2),ey=rand(r.y+1,r.y+r.h-2),k=`${ex},${ey}`;
    if(used.has(k)||enemies.some(e=>e.x===ex&&e.y===ey))continue;
    const t=pool[rand(0,pool.length-1)],sc=1+floor*0.15;
    enemies.push({...t,id:`e${i}_${Date.now()}_${Math.random()}`,x:ex,y:ey,hp:Math.floor(t.hp*sc),maxHp:Math.floor(t.hp*sc),atk:Math.floor(t.atk*sc),def:t.def,statuses:{}});
  }
  const items=[];
  const avC=CONSUMABLES.filter(c=>!c.mf||floor>=c.mf),avT=THROW_ITEMS.filter(c=>!c.mf||floor>=c.mf);
  for(let i=0;i<rand(3,5);i++){const r=rooms[rand(0,rooms.length-1)],ix=rand(r.x,r.x+r.w-1),iy=rand(r.y,r.y+r.h-1),k=`${ix},${iy}`;if(used.has(k))continue;used.add(k);
    const p2=Math.random()<0.25?avT:avC,t=p2[rand(0,p2.length-1)];
    items.push({...t,id:`ci${i}_${Date.now()}_${Math.random()}`,x:ix,y:iy,category:t.type?.startsWith("throw")?"throw":"consumable"});}
  for(let i=0;i<rand(1,2);i++){const r=rooms[rand(0,rooms.length-1)],ix=rand(r.x,r.x+r.w-1),iy=rand(r.y,r.y+r.h-1),k=`${ix},${iy}`;if(used.has(k))continue;used.add(k);
    const ep=Math.random()<0.5?WEAPONS:ARMORS,av=ep.filter(e=>!e.mf||floor>=e.mf),t=av[rand(0,av.length-1)];
    items.push({...t,id:`eq${i}_${Date.now()}_${Math.random()}`,x:ix,y:iy,category:"equipment"});}

  const traps=[];
  for(let i=0;i<rand(2,3)+Math.floor(floor*0.5);i++){const r=rooms[rand(0,rooms.length-1)],tx=rand(r.x,r.x+r.w-1),ty=rand(r.y,r.y+r.h-1),k=`${tx},${ty}`;if(used.has(k))continue;used.add(k);
    traps.push({...TRAP_TYPES[rand(0,TRAP_TYPES.length-1)],id:`t${i}_${Date.now()}`,x:tx,y:ty,visible:false,triggered:false});}

  const events=[];
  if(floor>=3&&rooms.length>3&&Math.random()<0.4){const ri=rand(2,rooms.length-2),r=rooms[ri];events.push({type:"monsterHouse",roomIdx:ri,triggered:false});
    for(let i=0;i<rand(4,7);i++){const ex=rand(r.x,r.x+r.w-1),ey=rand(r.y,r.y+r.h-1);if(enemies.some(e=>e.x===ex&&e.y===ey)||(merchant&&ex===merchant.x&&ey===merchant.y))continue;
      const t=pool[rand(0,pool.length-1)],sc=1+floor*0.15;
      enemies.push({...t,id:`mh${i}_${Date.now()}_${Math.random()}`,x:ex,y:ey,hp:Math.floor(t.hp*sc),maxHp:Math.floor(t.hp*sc),atk:Math.floor(t.atk*sc),def:t.def,statuses:{},sleeping:true});}}
  if(rooms.length>3&&Math.random()<0.35){const ri=rand(1,rooms.length-2),r=rooms[ri];events.push({type:"treasure",roomIdx:ri,triggered:false});
    for(let i=0;i<rand(2,4);i++){const ix=rand(r.x,r.x+r.w-1),iy=rand(r.y,r.y+r.h-1),k2=`${ix},${iy}`;if(used.has(k2))continue;used.add(k2);
      const allP=[...avC,...avT,...WEAPONS.filter(w=>!w.mf||floor>=w.mf),...ARMORS.filter(a=>!a.mf||floor>=a.mf)];const t=allP[rand(0,allP.length-1)];
      items.push({...t,id:`tr${i}_${Date.now()}_${Math.random()}`,x:ix,y:iy,category:t.slot?"equipment":t.type?.startsWith("throw")?"throw":"consumable"});}}

  return{map,rooms,start,stairs,enemies,items,traps,events,merchant};
}

// ===== STATE =====
function initState(){const d=genDungeon(1),vis=calcVis(d.start.x,d.start.y,d.map,d.rooms);
  return{map:d.map,rooms:d.rooms,stairs:d.stairs,enemies:d.enemies,items:d.items,traps:d.traps,events:d.events,merchant:d.merchant,
    px:d.start.x,py:d.start.y,hp:50,maxHp:50,mp:20,maxMp:20,baseAtk:8,baseDef:3,level:1,exp:0,expNext:15,
    floor:1,turns:0,gold:0,visible:vis,explored:new Set(vis),fullness:MAX_FULL,
    inventory:[],weapon:null,armor:null,statuses:{},
    msgs:["── B1F 洞窟 ── 冒険開始！"],gameOver:false,victory:false,pendingSfx:null,fx:[]};}
function getAtk(s){return s.baseAtk+(s.weapon?s.weapon.atk:0);}
function getDef(s){return s.baseDef+(s.armor?s.armor.def:0);}

// ===== COMPONENT =====
export default function Roguelike(){
  const [g,setG]=useState(null);
  const [screen,setScreen]=useState("title");
  const [modal,setModal]=useState(null); // 'inv','skill','map','shop','scores'
  const [throwMode,setThrowMode]=useState(null);
  const [skillDir,setSkillDir]=useState(null);
  const [scores,setScores]=useState([]);
  const [soundOn,setSoundOn]=useState(true);
  const touchRef=useRef(null);
  const [effects,setEffects]=useState([]);
  // Configurable side buttons: 4 slots [L1,L2,R1,R2]
  const BTN_ACTIONS={inv:{icon:"📦",label:"持物",color:"#fbbf24"},skill:{icon:"🔥",label:"魔法",color:"#818cf8"},map:{icon:"🗺",label:"地図",color:"#60a5fa"},sound:{icon:"🔊",label:"音",color:"#4ade80"}};
  const [btnLayout,setBtnLayout]=useState(["map","sound","inv","skill"]);
  const [showConfig,setShowConfig]=useState(false);
  const [configSlot,setConfigSlot]=useState(null);
  useEffect(()=>{(async()=>{try{const r=await window.storage.get("rl_btnLayout");if(r?.value)setBtnLayout(JSON.parse(r.value));}catch{}})();},[]);
  const saveBtnLayout=async(layout)=>{setBtnLayout(layout);try{await window.storage.set("rl_btnLayout",JSON.stringify(layout));}catch{};};
  const fxId=useRef(0);
  const spawnFx=useCallback((arr)=>{
    const nfx=arr.map(f=>({...f,id:fxId.current++,ts:Date.now()}));
    setEffects(p=>[...p,...nfx]);
    setTimeout(()=>setEffects(p=>p.filter(f=>!nfx.some(n=>n.id===f.id))),650);
  },[]);
  const prevTurn=useRef(0);
  useEffect(()=>{
    if(g&&g.fx&&g.fx.length>0&&g.turns!==prevTurn.current){
      prevTurn.current=g.turns;spawnFx(g.fx);setG(p=>p?{...p,fx:[]}:p);}
    else if(g&&g.fx&&g.fx.length>0){spawnFx(g.fx);setG(p=>p?{...p,fx:[]}:p);}
  },[g?.turns,g?.fx?.length]);

  useEffect(()=>{(async()=>{try{const r=await window.storage.get("rl_scores3");if(r?.value)setScores(JSON.parse(r.value));}catch{}})();},[]);
  const saveScore=async st=>{const e={floor:st.floor,level:st.level,turns:st.turns,victory:st.victory,date:new Date().toLocaleDateString("ja-JP")};
    const ns=[...scores,e].sort((a,b)=>b.floor===a.floor?a.turns-b.turns:b.floor-a.floor).slice(0,10);setScores(ns);
    try{await window.storage.set("rl_scores3",JSON.stringify(ns));}catch{}};
  const startGame=()=>{if(soundOn)initAudio();setG(initState());setScreen("game");setModal(null);setThrowMode(null);setSkillDir(null);};
  const addMsg=(s,m)=>{const ms=[...s.msgs,m];if(ms.length>50)ms.splice(0,ms.length-50);return ms;};
  const addStatus=(target,status,dur)=>{const ss={...target.statuses};ss[status]=(ss[status]||0)+dur;return{...target,statuses:ss};};
  const tickStatuses=st=>{const ns={};for(const[k,v] of Object.entries(st)){if(v>1)ns[k]=v-1;}return ns;};
  const killCheck=s=>{if(s.hp<=0){s.hp=0;s.gameOver=true;s.msgs=addMsg(s,`💀 B${s.floor}Fで力尽きた...(Lv${s.level})`);s.pendingSfx="dead";saveScore(s);}return s;};

  const levelUp=s=>{const nl=s.level+1,hpB=8+Math.floor(nl*1.5),mpB=3;
    return{...s,level:nl,maxHp:s.maxHp+hpB,hp:s.maxHp+hpB,maxMp:Math.min(MAX_MP,s.maxMp+mpB),mp:Math.min(MAX_MP,s.maxMp+mpB),
      baseAtk:s.baseAtk+2,baseDef:s.baseDef+1,expNext:Math.floor(s.expNext*1.6),
      msgs:addMsg(s,`🎉 Lv${nl}！ HP+${hpB} 攻+2 守+1`),pendingSfx:"lvl"};};

  const nextFloor=s=>{
    if(s.floor>=MAX_FLOOR){const ns={...s,victory:true,gameOver:true,msgs:addMsg(s,"🏆 制覇！"),pendingSfx:"win"};saveScore(ns);return ns;}
    const nf=s.floor+1,th=getTheme(nf),d=genDungeon(nf),vis=calcVis(d.start.x,d.start.y,d.map,d.rooms);
    return{...s,map:d.map,rooms:d.rooms,stairs:d.stairs,enemies:d.enemies,items:d.items,traps:d.traps,events:d.events,merchant:d.merchant,
      px:d.start.x,py:d.start.y,floor:nf,visible:vis,explored:new Set(vis),
      msgs:addMsg(s,`── B${nf}F ${th.name} ──`),pendingSfx:"stairs",fx:[]};};

  const applyTrap=s=>{const trap=s.traps.find(t=>t.x===s.px&&t.y===s.py&&!t.triggered);if(!trap)return s;
    let ns={...s,traps:s.traps.map(t=>t.id===trap.id?{...t,visible:true,triggered:true}:t),pendingSfx:"trap"};
    switch(trap.effect){
      case"poison":ns.msgs=addMsg(ns,"💜 毒の罠！");ns=addStatus(ns,"poison",8);break;
      case"pit":{const d=rand(8,15+ns.floor*2);ns.hp-=d;ns.msgs=addMsg(ns,`🕳 落穴！${d}dmg`);break;}
      case"warp":{
        // Find safe warp destination (not on enemy/wall)
        let wr,wx,wy,tries=0;
        do{wr=ns.rooms[rand(0,ns.rooms.length-1)];wx=rand(wr.x,wr.x+wr.w-1);wy=rand(wr.y,wr.y+wr.h-1);tries++;}
        while(tries<50&&(ns.map[wy][wx]===WALL||ns.enemies.some(e=>e.hp>0&&e.x===wx&&e.y===wy)||(ns.merchant&&wx===ns.merchant.x&&wy===ns.merchant.y)));
        ns.px=wx;ns.py=wy;ns.msgs=addMsg(ns,"🌀 ワープ！");
        const wv=calcVis(ns.px,ns.py,ns.map,ns.rooms,ns.statuses.blind?2:5);ns.visible=wv;const we=new Set(ns.explored);wv.forEach(v=>we.add(v));ns.explored=we;break;}
      case"bomb":{const d=rand(15,20+ns.floor*3);ns.hp-=d;ns.msgs=addMsg(ns,`💥 地雷！${d}dmg`);break;}
      case"slow":ns=addStatus(ns,"slow",5);ns.msgs=addMsg(ns,"🐢 鈍足！");break;
      case"confuse":ns=addStatus(ns,"confuse",6);ns.msgs=addMsg(ns,"💫 混乱！");break;
      case"sleep":ns=addStatus(ns,"sleep",4);ns.msgs=addMsg(ns,"💤 睡眠！");break;
    }return killCheck(ns);};

  const applyFull=s=>{let ns={...s,fullness:s.fullness-FULL_DECAY};
    if(ns.fullness<=0){ns.fullness=0;ns.hp-=2;if(ns.turns%10===0)ns.msgs=addMsg(ns,"🍚 空腹...");}
    else if(!ns.statuses.poison&&ns.hp<ns.maxHp&&ns.turns%2===0){const regen=ns.level>=11?3:ns.level>=6?2:1;ns.hp=Math.min(ns.maxHp,ns.hp+regen);}
    return killCheck(ns);};
  const applyPStatus=s=>{let ns={...s};if(ns.statuses.poison){ns.hp-=3;ns.msgs=addMsg(ns,"🟣 毒3dmg");}ns.statuses=tickStatuses(ns.statuses);return killCheck(ns);};

  const checkEvents=s=>{let ns={...s};for(const ev of ns.events){if(ev.triggered)continue;const r=ns.rooms[ev.roomIdx];
    if(ns.px>=r.x&&ns.px<r.x+r.w&&ns.py>=r.y&&ns.py<r.y+r.h){ev.triggered=true;
      if(ev.type==="monsterHouse"){ns.msgs=addMsg(ns,"⚠️ モンスターハウス！");ns.enemies=ns.enemies.map(e=>e.x>=r.x&&e.x<r.x+r.w&&e.y>=r.y&&e.y<r.y+r.h?{...e,sleeping:false}:e);ns.pendingSfx="trap";}
      else if(ev.type==="treasure"){ns.msgs=addMsg(ns,"✨ 宝物部屋！");ns.pendingSfx="item";}}}return ns;};

  const moveEnemies=s=>{let ns={...s,enemies:s.enemies.map(e=>({...e}))};
    const isMrc=(x,y)=>ns.merchant&&x===ns.merchant.x&&y===ns.merchant.y;
    for(const e of ns.enemies){if(e.hp<=0||e.sleeping)continue;
      if(e.statuses.sleep){e.statuses=tickStatuses(e.statuses);continue;}
      if(e.statuses.para&&Math.random()<0.4){e.statuses=tickStatuses(e.statuses);continue;}
      if(e.statuses.poison){e.hp-=2;if(e.hp<=0){ns.msgs=addMsg(ns,`${e.name}は毒で倒れた！`);e.statuses=tickStatuses(e.statuses);continue;}}
      e.statuses=tickStatuses(e.statuses);
      const dist=Math.max(Math.abs(e.x-ns.px),Math.abs(e.y-ns.py));

      // ── DETECTION (always runs first) ──
      const eRoom=ns.rooms.find(r=>e.x>=r.x&&e.x<r.x+r.w&&e.y>=r.y&&e.y<r.y+r.h);
      const pRoom=ns.rooms.find(r=>ns.px>=r.x&&ns.px<r.x+r.w&&ns.py>=r.y&&ns.py<r.y+r.h);
      const sameRoom=eRoom&&pRoom&&eRoom===pRoom;
      let canSee=sameRoom||dist<=1;
      if(!canSee){
        const ddx2=ns.px-e.x,ddy2=ns.py-e.y;
        if((ddx2===0||ddy2===0)&&dist<=12){
          const sx2=ddx2===0?0:(ddx2>0?1:-1),sy2=ddy2===0?0:(ddy2>0?1:-1);
          let los=true,lx=e.x+sx2,ly=e.y+sy2;
          while(!(lx===ns.px&&ly===ns.py)){
            if(lx<0||lx>=MAP_W||ly<0||ly>=MAP_H||ns.map[ly][lx]===WALL){los=false;break;}
            lx+=sx2;ly+=sy2;}
          if(los)canSee=true;}}
      if(canSee){e.aware=true;e.awareLost=0;}
      else if(e.aware){e.awareLost=(e.awareLost||0)+1;if(e.awareLost>10)e.aware=false;}

      // ── CONFUSED: random move ──
      if(e.statuses.confuse){const d=DIRS_8[rand(0,7)],nx=e.x+d[0],ny=e.y+d[1];
        if(nx>=0&&nx<MAP_W&&ny>=0&&ny<MAP_H&&ns.map[ny][nx]!==WALL&&!(nx===ns.px&&ny===ns.py)&&!ns.enemies.some(o=>o.id!==e.id&&o.hp>0&&o.x===nx&&o.y===ny)&&!isMrc(nx,ny)
          &&(d[0]===0||d[1]===0||(ns.map[e.y][e.x+d[0]]!==WALL&&ns.map[e.y+d[1]][e.x]!==WALL))){e.x=nx;e.y=ny;}continue;}

      // ── RANGED ATTACK ──
      if(e.ai==="ranged"&&dist<=5&&dist>1){
        const ddx=ns.px-e.x,ddy=ns.py-e.y;
        const isLine=ddx===0||ddy===0||Math.abs(ddx)===Math.abs(ddy);
        if(isLine){
          const sx=ddx===0?0:(ddx>0?1:-1),sy=ddy===0?0:(ddy>0?1:-1);
          let clear=true,cx=e.x+sx,cy=e.y+sy;
          while(!(cx===ns.px&&cy===ns.py)){
            if(cx<0||cx>=MAP_W||cy<0||cy>=MAP_H||ns.map[cy][cx]===WALL||ns.enemies.some(o=>o.id!==e.id&&o.hp>0&&o.x===cx&&o.y===cy)){clear=false;break;}
            cx+=sx;cy+=sy;}
          if(clear){
            const dmg=Math.max(1,e.atk-getDef(ns)+rand(-2,2));ns.hp-=dmg;ns.msgs=addMsg(ns,`${e.name}の遠距離攻撃！${dmg}dmg`);ns.pendingSfx="hit";
            ns.fx=[...(ns.fx||[]),{type:"playerHit",x:ns.px,y:ns.py},{type:"dmg",x:ns.px,y:ns.py,val:`-${dmg}`,color:"#f97316"}];
            ns=killCheck(ns);if(ns.gameOver)return ns;continue;}}}

      // ── CALLER ──
      if(e.ai==="caller"&&e.aware&&dist<=6&&Math.random()<0.12){const r2=ns.rooms.find(r=>e.x>=r.x&&e.x<r.x+r.w&&e.y>=r.y&&e.y<r.y+r.h);
        if(r2){const pool=ENEMY_POOLS[Math.min(Math.floor((ns.floor-1)/2),ENEMY_POOLS.length-1)],t=pool[rand(0,pool.length-1)],sc=1+ns.floor*0.15,nx=rand(r2.x,r2.x+r2.w-1),ny=rand(r2.y,r2.y+r2.h-1);
          if(ns.map[ny][nx]===FLOOR&&!ns.enemies.some(o=>o.hp>0&&o.x===nx&&o.y===ny)&&!(nx===ns.px&&ny===ns.py)&&!isMrc(nx,ny)){
            ns.enemies.push({...t,id:`c_${Date.now()}_${Math.random()}`,x:nx,y:ny,hp:Math.floor(t.hp*sc),maxHp:Math.floor(t.hp*sc),atk:Math.floor(t.atk*sc),def:t.def,statuses:{}});
            ns.msgs=addMsg(ns,`${e.name}が仲間を呼んだ！`);}}continue;}

      // ── MELEE ATTACK (adjacent) ──
      if(dist<=1){
        const dmg=Math.max(1,e.atk-getDef(ns)+rand(-1,2));ns.hp-=dmg;ns.msgs=addMsg(ns,`${e.name}の攻撃！${dmg}dmg`);ns.pendingSfx="hit";
        ns.fx=[...(ns.fx||[]),{type:"playerHit",x:ns.px,y:ns.py},{type:"dmg",x:ns.px,y:ns.py,val:`-${dmg}`,color:"#f87171"}];
        if(["poison","confuse","sleep","para"].includes(e.ai)&&Math.random()<0.35&&!ns.statuses[e.ai]){
          const dur=STATUS_INFO[e.ai]?.dur||5;ns=addStatus(ns,e.ai,dur);ns.msgs=addMsg(ns,`${STATUS_INFO[e.ai]?.icon||""} ${STATUS_INFO[e.ai]?.name}！`);}
        ns=killCheck(ns);if(ns.gameOver)return ns;continue;}

      // ── ERRATIC: 30% random move only when NOT aware ──
      if(e.ai==="erratic"&&!e.aware&&Math.random()<0.3){const d=DIRS_8[rand(0,7)],nx=e.x+d[0],ny=e.y+d[1];
        if(nx>=0&&nx<MAP_W&&ny>=0&&ny<MAP_H&&ns.map[ny][nx]!==WALL&&!(nx===ns.px&&ny===ns.py)&&!ns.enemies.some(o=>o.id!==e.id&&o.hp>0&&o.x===nx&&o.y===ny)&&!isMrc(nx,ny)
          &&(d[0]===0||d[1]===0||(ns.map[e.y][e.x+d[0]]!==WALL&&ns.map[e.y+d[1]][e.x]!==WALL))){e.x=nx;e.y=ny;}continue;}

      // ── MOVEMENT: pursuit or patrol ──
      if(e.aware){
        const BFS_DIRS=[[0,-1],[0,1],[-1,0],[1,0],[1,-1],[1,1],[-1,1],[-1,-1]];
        const path=(()=>{
          const Q=[{x:e.x,y:e.y,steps:[]}],visited=new Set([`${e.x},${e.y}`]);
          while(Q.length>0){
            const{x:cx,y:cy,steps}=Q.shift();
            if(steps.length>=20)continue;
            for(const[ddx,ddy] of BFS_DIRS){
              const nx2=cx+ddx,ny2=cy+ddy,k2=`${nx2},${ny2}`;
              if(nx2<0||nx2>=MAP_W||ny2<0||ny2>=MAP_H||visited.has(k2)||ns.map[ny2][nx2]===WALL)continue;
              if(ddx!==0&&ddy!==0&&(ns.map[cy][cx+ddx]===WALL||ns.map[cy+ddy][cx]===WALL))continue;
              if(nx2===ns.px&&ny2===ns.py){if(steps.length>0)return steps[0];continue;}
              visited.add(k2);
              if(!ns.enemies.some(o=>o.id!==e.id&&o.hp>0&&o.x===nx2&&o.y===ny2)&&!isMrc(nx2,ny2))
                Q.push({x:nx2,y:ny2,steps:steps.length===0?[{x:nx2,y:ny2}]:steps});
            }
          }return null;
        })();
        if(path){e.x=path.x;e.y=path.y;}
      }else{
        if(!e.pDir||Math.random()<0.2)e.pDir=DIRS_8[rand(0,7)];
        const tryDirs=[e.pDir,...DIRS_8.filter(d=>d!==e.pDir).sort(()=>Math.random()-0.5)];
        let moved=false;
        for(const[ddx,ddy] of tryDirs){
          const nx3=e.x+ddx,ny3=e.y+ddy;
          if(nx3>=0&&nx3<MAP_W&&ny3>=0&&ny3<MAP_H&&ns.map[ny3][nx3]!==WALL
            &&!(nx3===ns.px&&ny3===ns.py)&&!ns.enemies.some(o=>o.id!==e.id&&o.hp>0&&o.x===nx3&&o.y===ny3)&&!isMrc(nx3,ny3)
            &&(ddx===0||ddy===0||(ns.map[e.y][e.x+ddx]!==WALL&&ns.map[e.y+ddy][e.x]!==WALL))){
            e.x=nx3;e.y=ny3;e.pDir=[ddx,ddy];moved=true;break;}}
        if(!moved)e.pDir=DIRS_8[rand(0,7)];
      }}
    // Natural spawn: every ~30 turns, spawn 1 enemy in a room outside player's vision
    if(ns.turns>0&&ns.turns%30===0){
      const pool=ENEMY_POOLS[Math.min(Math.floor((ns.floor-1)/2),ENEMY_POOLS.length-1)];
      const sc=1+ns.floor*0.15;
      // Try to find a valid room not containing the player
      const candidates=ns.rooms.filter(r=>!(ns.px>=r.x&&ns.px<r.x+r.w&&ns.py>=r.y&&ns.py<r.y+r.h));
      for(let tries=0;tries<10&&candidates.length>0;tries++){
        const r=candidates[rand(0,candidates.length-1)];
        const sx=rand(r.x,r.x+r.w-1),sy=rand(r.y,r.y+r.h-1);
        const sk=`${sx},${sy}`;
        const isMrcSp=ns.merchant&&sx===ns.merchant.x&&sy===ns.merchant.y;
        if(ns.map[sy][sx]===FLOOR&&!ns.visible.has(sk)&&!ns.enemies.some(e2=>e2.hp>0&&e2.x===sx&&e2.y===sy)&&!isMrcSp){
          const t=pool[rand(0,pool.length-1)];
          ns.enemies.push({...t,id:`sp_${ns.turns}_${Math.random()}`,x:sx,y:sy,hp:Math.floor(t.hp*sc),maxHp:Math.floor(t.hp*sc),atk:Math.floor(t.atk*sc),def:t.def,statuses:{}});
          break;
        }
      }
    }
    return ns;};

  const useItem=idx=>{setG(prev=>{if(!prev||prev.gameOver)return prev;let s={...prev,inventory:[...prev.inventory],fx:[]};const item=s.inventory[idx];if(!item)return prev;
    if(item.category==="consumable"){s.inventory.splice(idx,1);
      // Non-food consumables restore a little fullness (like eating grass in Shiren)
      if(item.type!=="food"){s.fullness=Math.min(MAX_FULL,s.fullness+5);}
      if(item.type==="heal"){const h=Math.min(item.value,s.maxHp-s.hp);s.hp+=h;s.msgs=addMsg(s,`${item.name}！HP+${h}`);s.pendingSfx="item";s.fx.push({type:"heal",x:s.px,y:s.py,val:`+${h}`});}
      else if(item.type==="atkUp"){s.baseAtk+=item.value;s.msgs=addMsg(s,`${item.name}！攻+${item.value}`);s.pendingSfx="item";s.fx.push({type:"heal",x:s.px,y:s.py,val:`攻+${item.value}`});}
      else if(item.type==="defUp"){s.baseDef+=item.value;s.msgs=addMsg(s,`${item.name}！守+${item.value}`);s.pendingSfx="item";s.fx.push({type:"heal",x:s.px,y:s.py,val:`守+${item.value}`});}
      else if(item.type==="food"){s.fullness=Math.min(MAX_FULL,s.fullness+item.value);s.msgs=addMsg(s,`${item.name}！満腹度+${item.value}`);s.pendingSfx="food";s.fx.push({type:"heal",x:s.px,y:s.py,val:`満+${item.value}`});}
      else if(item.type==="cure"){s.statuses={};s.msgs=addMsg(s,"状態異常回復！");s.pendingSfx="item";s.fx.push({type:"heal",x:s.px,y:s.py,val:"回復!"});}
      else if(item.type==="mpHeal"){s.mp=Math.min(s.maxMp,s.mp+item.value);s.msgs=addMsg(s,`MP+${item.value}`);s.pendingSfx="item";s.fx.push({type:"heal",x:s.px,y:s.py,val:`MP+${item.value}`});}
    }else if(item.category==="equipment"){s.inventory.splice(idx,1);
      if(item.slot==="weapon"){if(s.weapon)s.inventory.push({...s.weapon,category:"equipment"});s.weapon=item;s.msgs=addMsg(s,`${item.name}装備！`);}
      else{if(s.armor)s.inventory.push({...s.armor,category:"equipment"});s.armor=item;s.msgs=addMsg(s,`${item.name}装備！`);}s.pendingSfx="equip";}
    return s;});};

  const dropItem=idx=>{setG(prev=>{if(!prev||prev.gameOver)return prev;
    let s={...prev,inventory:[...prev.inventory],items:[...prev.items]};
    const item=s.inventory[idx];if(!item)return prev;
    s.inventory.splice(idx,1);
    s.items.push({...item,id:`drop_${Date.now()}_${Math.random()}`,x:s.px,y:s.py});
    s.msgs=addMsg(s,`${item.name}を足元に置いた`);
    return s;});};

  const unequip=slot=>{setG(prev=>{if(!prev||prev.gameOver)return prev;
    let s={...prev,inventory:[...prev.inventory]};
    if(slot==="weapon"&&s.weapon){
      if(s.inventory.length>=MAX_INV)return{...s,msgs:addMsg(s,"持ち物がいっぱいで外せない！")};
      s.inventory.push({...s.weapon,category:"equipment"});s.msgs=addMsg(s,`${s.weapon.name}を外した`);s.weapon=null;
    }else if(slot==="armor"&&s.armor){
      if(s.inventory.length>=MAX_INV)return{...s,msgs:addMsg(s,"持ち物がいっぱいで外せない！")};
      s.inventory.push({...s.armor,category:"equipment"});s.msgs=addMsg(s,`${s.armor.name}を外した`);s.armor=null;
    }
    return s;});};

  const execThrow=(idx,di)=>{setG(prev=>{if(!prev||prev.gameOver)return prev;let s={...prev,inventory:[...prev.inventory],enemies:prev.enemies.map(e=>({...e}))};
    const item=s.inventory[idx];if(!item)return prev;s.inventory.splice(idx,1);
    const[ddx,ddy]=DIRS_8[di];let cx=s.px+ddx,cy=s.py+ddy,hitE=null;
    for(let i=0;i<10;i++){if(cx<0||cx>=MAP_W||cy<0||cy>=MAP_H||s.map[cy][cx]===WALL)break;hitE=s.enemies.find(e=>e.hp>0&&e.x===cx&&e.y===cy);if(hitE)break;cx+=ddx;cy+=ddy;}
    if(hitE){const target=s.enemies.find(e=>e.id===hitE.id),dmg=item.dmg||10;target.hp-=dmg;s.msgs=addMsg(s,`${item.name}→${target.name}！${dmg}dmg`);
      if(item.type==="throwPoison")target.statuses={...target.statuses,poison:(target.statuses.poison||0)+6};
      if(item.type==="throwPara")target.statuses={...target.statuses,para:(target.statuses.para||0)+4};
      if(target.hp<=0){s.exp+=target.exp;s.msgs=addMsg(s,`${target.name}撃破！+${target.exp}EXP`);while(s.exp>=s.expNext){s.exp-=s.expNext;s=levelUp(s);}}
      s.pendingSfx="throw";}else s.msgs=addMsg(s,`${item.name}は外れた`);return s;});setThrowMode(null);setModal(null);};

  const execSkill=(sid,di)=>{setG(prev=>{if(!prev||prev.gameOver)return prev;const sk=SKILLS.find(s=>s.id===sid);if(!sk||prev.mp<sk.cost)return prev;
    let s={...prev,mp:prev.mp-sk.cost,enemies:prev.enemies.map(e=>({...e})),pendingSfx:"magic",fx:[]};
    if(sk.type==="selfHeal"){const h=Math.min(sk.value,s.maxHp-s.hp);s.hp+=h;s.msgs=addMsg(s,`${sk.icon}${sk.name}！HP+${h}`);
      s.fx=[...(s.fx||[]),{type:"heal",x:s.px,y:s.py,val:`+${h}`}];}
    else if(sk.type==="warp"){
      let wr,wx,wy,tries=0;
      do{wr=s.rooms[rand(0,s.rooms.length-1)];wx=rand(wr.x,wr.x+wr.w-1);wy=rand(wr.y,wr.y+wr.h-1);tries++;}
      while(tries<50&&(s.map[wy][wx]===WALL||s.enemies.some(e=>e.hp>0&&e.x===wx&&e.y===wy)||(s.merchant&&wx===s.merchant.x&&wy===s.merchant.y)));
      s.px=wx;s.py=wy;s.msgs=addMsg(s,`${sk.icon}転移！`);
      const wv=calcVis(s.px,s.py,s.map,s.rooms,s.statuses.blind?2:5);s.visible=wv;const we=new Set(s.explored);wv.forEach(v=>we.add(v));s.explored=we;}
    else if(sk.type==="area"){let h=0;const hitTiles=[];for(const e of s.enemies){if(e.hp<=0)continue;if(Math.abs(e.x-s.px)<=sk.radius&&Math.abs(e.y-s.py)<=sk.radius){
      const d=Math.max(1,sk.dmg-e.def+rand(-2,2));e.hp-=d;h++;hitTiles.push({x:e.x,y:e.y,val:`-${d}`});if(e.hp<=0){s.exp+=e.exp;while(s.exp>=s.expNext){s.exp-=s.expNext;s=levelUp(s);}}}}
      s.fx=[...(s.fx||[]),{type:"skillArea",x:s.px,y:s.py,r:sk.radius,icon:sk.icon},...hitTiles.map(t=>({type:"dmg",...t,color:"#fbbf24"}))];
      s.msgs=addMsg(s,`${sk.icon}${sk.name}！${h}体命中`);}
    else if(sk.type==="line"&&di!=null){const[ddx,ddy]=DIRS_8[di];let cx=s.px+ddx,cy=s.py+ddy,h=0;const lineTiles=[];
      for(let i=0;i<sk.range;i++){if(cx<0||cx>=MAP_W||cy<0||cy>=MAP_H||s.map[cy][cx]===WALL)break;
        lineTiles.push({x:cx,y:cy});
        const e=s.enemies.find(e2=>e2.hp>0&&e2.x===cx&&e2.y===cy);
        if(e){const d=Math.max(1,sk.dmg-e.def+rand(-2,2));e.hp-=d;h++;if(sk.status)e.statuses={...e.statuses,[sk.status]:(e.statuses[sk.status]||0)+4};
          if(e.hp<=0){s.exp+=e.exp;while(s.exp>=s.expNext){s.exp-=s.expNext;s=levelUp(s);}}}cx+=ddx;cy+=ddy;}
      s.fx=[...(s.fx||[]),{type:"skillLine",tiles:lineTiles,icon:sk.icon}];
      s.msgs=addMsg(s,`${sk.icon}${sk.name}！${h}体命中`);}
    else if(sk.type==="room"){const room=s.rooms.find(r=>s.px>=r.x&&s.px<r.x+r.w&&s.py>=r.y&&s.py<r.y+r.h);let h=0;const roomTiles=[];
      if(room){for(const e of s.enemies){if(e.hp<=0)continue;if(e.x>=room.x&&e.x<room.x+room.w&&e.y>=room.y&&e.y<room.y+room.h){
        const d=Math.max(1,sk.dmg-e.def+rand(-2,2));e.hp-=d;h++;roomTiles.push({x:e.x,y:e.y,val:`-${d}`});if(e.hp<=0){s.exp+=e.exp;while(s.exp>=s.expNext){s.exp-=s.expNext;s=levelUp(s);}}}}}
      if(room)s.fx=[...(s.fx||[]),{type:"skillRoom",room,icon:sk.icon},...roomTiles.map(t=>({type:"dmg",...t,color:"#c084fc"}))];
      s.msgs=addMsg(s,`${sk.icon}${sk.name}！${h}体命中`);}
    return s;});setSkillDir(null);setModal(null);};

  const buyItem=si=>{setG(prev=>{if(!prev||prev.gameOver)return prev;if(prev.gold<si.price)return{...prev,msgs:addMsg(prev,`お金が足りない(${prev.gold}G)`)};
    if(prev.inventory.length>=MAX_INV)return{...prev,msgs:addMsg(prev,"持ち物がいっぱい！")};
    let s={...prev,gold:prev.gold-si.price,inventory:[...prev.inventory],pendingSfx:"shop"};
    for(let i=0;i<(si.qty||1)&&s.inventory.length<MAX_INV;i++)s.inventory.push({...si,id:`sh_${Date.now()}_${Math.random()}`});
    s.msgs=addMsg(s,`${si.name}購入！-${si.price}G`);return s;});};

  const processTurn=useCallback((dx,dy)=>{setG(prev=>{if(!prev||prev.gameOver)return prev;
    // Wait (0,0) always consumes a turn
    if(dx===0&&dy===0){
      let s={...prev,turns:prev.turns+1,pendingSfx:null,fx:[]};
      s=applyPStatus(s);if(s.gameOver)return s;s=applyFull(s);if(s.gameOver)return s;return moveEnemies(s);}
    let s={...prev,pendingSfx:null,fx:[]};
    // Status effects that consume turn regardless
    if(s.statuses.sleep){s={...s,turns:s.turns+1};s.msgs=addMsg(s,"💤 眠っている...");s=applyPStatus(s);if(s.gameOver)return s;s=applyFull(s);if(s.gameOver)return s;return moveEnemies(s);}
    if(s.statuses.para&&Math.random()<0.4){s={...s,turns:s.turns+1};s.msgs=addMsg(s,"⚡ 痺れて動けない！");s=applyPStatus(s);if(s.gameOver)return s;s=applyFull(s);if(s.gameOver)return s;return moveEnemies(s);}
    if(s.statuses.slow&&s.turns%2===0){s={...s,turns:s.turns+1};s=applyPStatus(s);if(s.gameOver)return s;s=applyFull(s);if(s.gameOver)return s;return moveEnemies(s);}
    if(s.statuses.confuse&&Math.random()<0.5){const rd=DIRS_8[rand(0,7)];dx=rd[0];dy=rd[1];}
    const nx=s.px+dx,ny=s.py+dy;
    // Block diagonal movement through wall corners
    const diagBlock=dx!==0&&dy!==0&&(s.map[s.py][s.px+dx]===WALL||s.map[s.py+dy][s.px]===WALL);
    if(nx<0||nx>=MAP_W||ny<0||ny>=MAP_H||s.map[ny][nx]===WALL||diagBlock) return prev; // No turn consumed
    // Valid action: increment turn
    s={...s,turns:s.turns+1};
    const enemy=s.enemies.find(e=>e.hp>0&&e.x===nx&&e.y===ny);
    if(enemy){s={...s,enemies:s.enemies.map(e=>({...e})),fx:[]};const target=s.enemies.find(e=>e.id===enemy.id);
      if(target.sleeping){target.sleeping=false;s.msgs=addMsg(s,`${target.name}が起きた！`);}
      const dmg=Math.max(1,getAtk(s)-target.def+rand(-1,3));target.hp-=dmg;s.msgs=addMsg(s,`${target.name}に${dmg}dmg！`);s.pendingSfx="atk";
      s.fx.push({type:"hit",x:nx,y:ny},{type:"dmg",x:nx,y:ny,val:`-${dmg}`,color:"#fff"});
      if(target.hp<=0){const gd=rand(3,8+s.floor*2);s.exp+=target.exp;s.gold+=gd;s.msgs=addMsg(s,`${target.name}撃破！+${target.exp}EXP +${gd}G`);s.pendingSfx="kill";
        s.fx.push({type:"kill",x:nx,y:ny,char:target.char,color:target.color});
        while(s.exp>=s.expNext){s.exp-=s.expNext;s=levelUp(s);}}
      s=applyPStatus(s);if(s.gameOver)return s;s=applyFull(s);if(s.gameOver)return s;return moveEnemies(s);}
    s.px=nx;s.py=ny;
    if(s.merchant&&nx===s.merchant.x&&ny===s.merchant.y){s.px=prev.px;s.py=prev.py;s.msgs=addMsg(s,"🏪 商人！");s.pendingSfx="shop";setTimeout(()=>setModal("shop"),50);return s;}
    const item=s.items.find(it=>it.x===nx&&it.y===ny);
    if(item){if(s.inventory.length<MAX_INV){s={...s,items:s.items.filter(it=>it.id!==item.id),inventory:[...s.inventory,{...item}]};s.msgs=addMsg(s,`${item.name}を拾った`);s.pendingSfx="item";}
      else s.msgs=addMsg(s,"持ち物がいっぱい！ 📦から捨てて空きを作ろう");}
    s=applyTrap(s);if(s.gameOver)return s;s=checkEvents(s);
    if(s.px===s.stairs.x&&s.py===s.stairs.y)return nextFloor(s);
    const vis=calcVis(s.px,s.py,s.map,s.rooms,s.statuses.blind?2:5);s.visible=vis;const ne=new Set(s.explored);vis.forEach(v=>ne.add(v));s.explored=ne;
    if(s.turns%5===0&&s.mp<s.maxMp)s.mp=Math.min(s.maxMp,s.mp+1);
    s=applyPStatus(s);if(s.gameOver)return s;s=applyFull(s);if(s.gameOver)return s;return moveEnemies(s);});},[]);

  useEffect(()=>{if(g?.pendingSfx&&soundOn)sfx(g.pendingSfx);},[g?.pendingSfx,g?.turns,soundOn]);
  useEffect(()=>{const onKey=e=>{if(modal||throwMode||skillDir)return;
    const km={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],w:[0,-1],s:[0,1],a:[-1,0],d:[1,0],q:[-1,-1],e:[1,-1],z:[-1,1],c:[1,1]};
    if(km[e.key]){e.preventDefault();processTurn(...km[e.key]);}if(e.key===" "||e.key===".")processTurn(0,0);
    if(e.key==="i")setModal(v=>v==="inv"?null:"inv");if(e.key==="m")setModal(v=>v==="map"?null:"map");if(e.key==="k")setModal(v=>v==="skill"?null:"skill");};
    window.addEventListener("keydown",onKey);return()=>window.removeEventListener("keydown",onKey);},[processTurn,modal,throwMode,skillDir]);
  const handleTS=e=>{touchRef.current={x:e.touches[0].clientX,y:e.touches[0].clientY};};
  const handleTE=e=>{if(!touchRef.current||modal||throwMode||skillDir)return;
    const ddx=e.changedTouches[0].clientX-touchRef.current.x,ddy=e.changedTouches[0].clientY-touchRef.current.y;
    if(Math.abs(ddx)<25&&Math.abs(ddy)<25)return;
    const angle=Math.atan2(ddy,ddx),idx=Math.round(angle/(Math.PI/4)),map8=[[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]],di=((idx%8)+8)%8;
    processTurn(map8[di][0],map8[di][1]);touchRef.current=null;};

  // ===== RENDER HELPERS =====
  const Bar=({value,max,color,label,h=10})=>(
    <div style={{position:"relative",height:h,background:"rgba(255,255,255,0.06)",borderRadius:h/2,overflow:"hidden"}}>
      <div style={{height:"100%",width:`${(value/max)*100}%`,background:color,borderRadius:h/2,transition:"width 0.2s"}}/>
      {label&&<span style={{position:"absolute",top:0,left:0,right:0,textAlign:"center",fontSize:h>8?9:7,lineHeight:`${h}px`,fontWeight:600,color:"#fff",textShadow:"0 1px 3px rgba(0,0,0,0.7)",letterSpacing:"0.02em"}}>{label}</span>}
    </div>);

  const Overlay=({children,onClose})=>(
    <div onClick={onClose} style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.8)",backdropFilter:"blur(4px)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"linear-gradient(180deg,#1e293b,#0f172a)",borderRadius:20,padding:20,maxWidth:360,width:"100%",maxHeight:"80vh",overflowY:"auto",border:"1px solid rgba(255,255,255,0.08)",boxShadow:"0 20px 60px rgba(0,0,0,0.5)"}}>{children}</div>
    </div>);

  // ===== TITLE =====
  if(screen==="title"){
    return(
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100dvh",background:"linear-gradient(170deg,#0f172a 0%,#1a2332 50%,#0f172a 100%)",color:"#e2e8f0",fontFamily:"'Hiragino Sans','Noto Sans JP',sans-serif",padding:32,textAlign:"center"}}>
        <div style={{fontSize:56,marginBottom:16,filter:"drop-shadow(0 4px 12px rgba(251,191,36,0.3))"}}>⚔️</div>
        <h1 style={{fontSize:28,fontWeight:800,color:"#fbbf24",margin:"0 0 6px",letterSpacing:"0.05em"}}>不思議のダンジョン</h1>
        <p style={{fontSize:13,color:"#64748b",marginBottom:40,letterSpacing:"0.1em"}}>全{MAX_FLOOR}階を踏破せよ</p>
        <button onClick={startGame} style={{padding:"16px 56px",fontSize:17,fontWeight:700,background:"linear-gradient(135deg,#f59e0b,#d97706)",color:"#0f172a",border:"none",borderRadius:14,cursor:"pointer",boxShadow:"0 6px 24px rgba(245,158,11,0.35)",letterSpacing:"0.05em",marginBottom:16}}>冒険に出る</button>
        <button onClick={()=>setModal("scores")} style={{padding:"10px 28px",fontSize:12,fontWeight:600,background:"transparent",color:"#64748b",border:"1px solid #334155",borderRadius:10,cursor:"pointer"}}>🏅 ランキング</button>
        {modal==="scores"&&<Overlay onClose={()=>setModal(null)}>
          <h3 style={{color:"#fbbf24",margin:"0 0 16px",fontSize:16,fontWeight:700}}>🏅 ランキング</h3>
          {scores.length===0?<p style={{color:"#475569",fontSize:13}}>記録はまだありません</p>:
            scores.map((s,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,0.05)",fontSize:13,color:s.victory?"#fbbf24":"#94a3b8"}}>
              <span>#{i+1} {s.victory?"🏆":"💀"} B{s.floor}F Lv{s.level}</span><span style={{color:"#64748b"}}>{s.turns}T {s.date}</span></div>)}
          <button onClick={()=>setModal(null)} style={{marginTop:16,padding:"10px",fontSize:13,fontWeight:600,background:"rgba(255,255,255,0.06)",color:"#94a3b8",border:"none",borderRadius:10,cursor:"pointer",width:"100%"}}>閉じる</button>
        </Overlay>}
      </div>);
  }

  if(!g)return null;

  // ===== GAME OVER =====
  if(g.gameOver){
    return(
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100dvh",background:g.victory?"linear-gradient(170deg,#1a1a2e,#16213e)":"linear-gradient(170deg,#1a0a0a,#2d1b1b)",color:"#e2e8f0",fontFamily:"'Hiragino Sans','Noto Sans JP',sans-serif",padding:32,textAlign:"center"}}>
        <div style={{fontSize:56,marginBottom:16}}>{g.victory?"🏆":"💀"}</div>
        <h2 style={{fontSize:22,fontWeight:800,color:g.victory?"#fbbf24":"#f87171",marginBottom:20}}>{g.victory?"ダンジョン制覇！":"冒険は終わった..."}</h2>
        <div style={{background:"rgba(255,255,255,0.04)",borderRadius:16,padding:"20px 32px",marginBottom:28,fontSize:14,lineHeight:2.2,border:"1px solid rgba(255,255,255,0.06)"}}>
          B{g.floor}F ／ Lv{g.level} ／ {g.turns}ターン<br/>攻撃:{getAtk(g)} ／ 防御:{getDef(g)} ／ {g.gold}G</div>
        <button onClick={startGame} style={{padding:"14px 48px",fontSize:16,fontWeight:700,background:"linear-gradient(135deg,#6366f1,#4f46e5)",color:"#fff",border:"none",borderRadius:14,cursor:"pointer",boxShadow:"0 6px 24px rgba(99,102,241,0.3)",marginBottom:12}}>もう一度挑戦</button>
        <button onClick={()=>{setScreen("title");setG(null);}} style={{padding:"10px 28px",fontSize:12,fontWeight:600,background:"transparent",color:"#64748b",border:"1px solid #334155",borderRadius:10,cursor:"pointer"}}>タイトルへ</button>
      </div>);
  }

  // ===== GAME SCREEN =====
  const theme=getTheme(g.floor);
  const nearE=g.enemies.filter(e=>e.hp>0&&g.visible.has(`${e.x},${e.y}`));
  const recentM=g.msgs.slice(-3);
  const statusIcons=Object.keys(g.statuses).map(k=>STATUS_INFO[k]?.icon||"").join(" ");
  const avSkills=SKILLS.filter(sk=>!sk.mf||g.floor>=sk.mf);

  // Tile size: compute from available width
  const screenW=typeof window!=="undefined"?Math.min(window.innerWidth,480):380;
  const ts=Math.floor((screenW-8)/VP);
  const mapPx=ts*VP;

  const renderMap=()=>{const tiles=[];
    for(let vy=0;vy<VP;vy++)for(let vx=0;vx<VP;vx++){
      const mx=g.px-VP_HALF+vx,my=g.py-VP_HALF+vy,key=`${mx},${my}`,inB=mx>=0&&mx<MAP_W&&my>=0&&my<MAP_H;
      const isV=g.visible.has(key),isE=g.explored.has(key);
      let bg="#000",ch="",fg="#fff",op=1,bdr="",shadow="";
      if(inB&&(isV||isE)){
        const isWall=g.map[my][mx]===WALL;
        bg=isWall?theme.wall:theme.floor;
        if(!isV)op=0.25;
        if(isWall&&isV){shadow="inset 0 0 "+(ts>28?"4":"2")+"px rgba(255,255,255,0.08)";bdr="1px solid rgba(255,255,255,0.04)";}
        if(mx===g.px&&my===g.py){ch="＠";fg="#38bdf8";}
        else if(g.merchant&&mx===g.merchant.x&&my===g.merchant.y&&isV){ch="商";fg="#fbbf24";}
        else if(isV){const en=g.enemies.find(e=>e.hp>0&&e.x===mx&&e.y===my);
          if(en){ch=en.char;fg=en.color;}
          else if(mx===g.stairs.x&&my===g.stairs.y){ch="▼";fg="#a78bfa";}
          else{const tr=g.traps.find(t=>t.x===mx&&t.y===my&&t.visible);
            if(tr){ch=tr.char;fg=tr.color;}else{const it=g.items.find(i2=>i2.x===mx&&i2.y===my);if(it){ch=it.char;fg=it.color;}}}}
        else if(mx===g.stairs.x&&my===g.stairs.y&&isE){ch="▼";fg="#a78bfa";}}
      tiles.push(<div key={`${vx}-${vy}`} style={{width:ts,height:ts,backgroundColor:bg,opacity:op,display:"flex",alignItems:"center",justifyContent:"center",fontSize:ts*0.46,color:fg,fontWeight:"bold",boxSizing:"border-box",boxShadow:shadow||"none",border:bdr||"none"}}>{ch}</div>);
    }return tiles;};

  // Check if a direction is actionable (move, attack, or interact)
  const canAct=(dx,dy)=>{
    if(dx===0&&dy===0) return true; // wait always ok
    if(!g||g.gameOver) return false;
    const nx=g.px+dx,ny=g.py+dy;
    if(nx<0||nx>=MAP_W||ny<0||ny>=MAP_H) return false;
    if(g.map[ny][nx]===WALL) return false;
    if(dx!==0&&dy!==0&&(g.map[g.py][g.px+dx]===WALL||g.map[g.py+dy][g.px]===WALL)) return false;
    return true;
  };

  const hasEnemy=(dx,dy)=>{
    if(!g||dx===0&&dy===0) return false;
    const nx=g.px+dx,ny=g.py+dy;
    return g.enemies.some(e=>e.hp>0&&e.x===nx&&e.y===ny);
  };

  const DBtn=({label,dx,dy,sz=50})=>{
    const ok=canAct(dx,dy);
    const enemy=ok&&hasEnemy(dx,dy);
    return <button onClick={()=>{if(ok)processTurn(dx,dy);}} style={{width:sz,height:sz,fontSize:enemy?15:17,border:"none",borderRadius:12,cursor:ok?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",
      background:enemy?"rgba(239,68,68,0.12)":ok?"rgba(255,255,255,0.04)":"rgba(255,255,255,0.01)",color:enemy?"#f87171":ok?"rgba(255,255,255,0.5)":"rgba(255,255,255,0.1)",WebkitTapHighlightColor:"transparent"}}>
      {enemy?"⚔":label}
    </button>;
  };

  return(
    <div onTouchStart={handleTS} onTouchEnd={handleTE}
      style={{display:"flex",flexDirection:"column",height:"100dvh",background:`linear-gradient(180deg,${theme.bg[0]},${theme.bg[1]})`,color:"#e2e8f0",fontFamily:"'Hiragino Sans','Noto Sans JP',monospace",overflow:"hidden",userSelect:"none",WebkitUserSelect:"none"}}>

      {/* ── HEADER (fixed) ── */}
      <div style={{flexShrink:0,width:"100%",padding:"6px 12px 4px",boxSizing:"border-box"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:4}}>
          <span style={{fontSize:12,fontWeight:700,color:theme.accent}}>B{g.floor}F {theme.name}</span>
          <span style={{fontSize:10,color:"#64748b"}}>Lv{g.level}　{g.gold}G　T{g.turns}</span>
        </div>
        <Bar value={g.hp} max={g.maxHp} h={12} label={`HP ${g.hp}/${g.maxHp}`}
          color={g.hp/g.maxHp>0.5?"linear-gradient(90deg,#22c55e,#16a34a)":g.hp/g.maxHp>0.25?"#eab308":"#ef4444"}/>
        <div style={{display:"flex",gap:6,marginTop:3}}>
          <div style={{flex:1}}><Bar value={g.mp} max={g.maxMp} h={5} color="linear-gradient(90deg,#818cf8,#6366f1)"/><div style={{fontSize:7,color:"#64748b",marginTop:1}}>MP{g.mp}</div></div>
          <div style={{flex:1}}><Bar value={g.fullness} max={MAX_FULL} h={5} color={g.fullness>30?"linear-gradient(90deg,#f59e0b,#fbbf24)":"#ef4444"}/><div style={{fontSize:7,color:"#64748b",marginTop:1}}>満腹{g.fullness}</div></div>
          <div style={{flex:1}}><Bar value={g.exp} max={g.expNext} h={5} color="linear-gradient(90deg,#6366f1,#a78bfa)"/><div style={{fontSize:7,color:"#64748b",marginTop:1}}>EXP{g.exp}/{g.expNext}</div></div>
        </div>
        {statusIcons&&<div style={{fontSize:10,marginTop:2}}>{statusIcons}</div>}
      </div>

      {/* ── MAP AREA (flex:1, fills remaining) ── */}
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden",minHeight:0}}>
        {/* CSS Animations */}
        <style>{`
          @keyframes fx-shake{0%,100%{transform:translate(0,0)}15%{transform:translate(-3px,-2px)}30%{transform:translate(3px,2px)}45%{transform:translate(-2px,1px)}60%{transform:translate(2px,-1px)}75%{transform:translate(-1px,2px)}}
          @keyframes fx-flash{0%{opacity:0.9;transform:scale(1.1)}100%{opacity:0;transform:scale(0.5)}}
          @keyframes fx-dmg{0%{opacity:1;transform:translateY(0) scale(1)}50%{opacity:1;transform:translateY(-18px) scale(1.1)}100%{opacity:0;transform:translateY(-30px) scale(0.7)}}
          @keyframes fx-kill{0%{opacity:1;transform:scale(1)}40%{opacity:0.8;transform:scale(1.4)}100%{opacity:0;transform:scale(0.1) rotate(180deg)}}
          @keyframes fx-particle{0%{opacity:1;transform:translate(0,0) scale(1)}100%{opacity:0;transform:translate(var(--px),var(--py)) scale(0)}}
          @keyframes fx-playerHit{0%{background:rgba(255,60,60,0.5)}100%{background:transparent}}
          @keyframes fx-skill{0%{opacity:0.8;transform:scale(0.5)}30%{opacity:0.6;transform:scale(1.05)}100%{opacity:0;transform:scale(1.2)}}
          @keyframes fx-heal{0%{opacity:0.7;box-shadow:0 0 8px #4ade80}100%{opacity:0;box-shadow:0 0 20px transparent}}
        `}</style>
        {/* Map grid */}
        <div style={{position:"relative",borderRadius:10,overflow:"hidden",boxShadow:"0 4px 20px rgba(0,0,0,0.4)"}}>
          <div style={{display:"grid",gridTemplateColumns:`repeat(${VP},${ts}px)`}}>{renderMap()}</div>
          {/* Effect overlay */}
          <div style={{position:"absolute",top:0,left:0,width:ts*VP,height:ts*VP,pointerEvents:"none",overflow:"hidden"}}>
            {effects.filter(f=>f.type!=="move").map(f=>{
              // Convert world coords to viewport pixel position
              const vx=(f.x!==undefined)?(f.x-g.px+VP_HALF)*ts:0;
              const vy=(f.y!==undefined)?(f.y-g.py+VP_HALF)*ts:0;
              if(f.type==="hit") return <div key={f.id} style={{position:"absolute",left:vx,top:vy,width:ts,height:ts,
                background:"radial-gradient(circle,rgba(255,255,255,0.9),rgba(255,200,50,0.4),transparent)",borderRadius:"50%",
                animation:"fx-flash 350ms ease-out forwards"}}/>;
              if(f.type==="playerHit") return <div key={f.id} style={{position:"absolute",left:vx,top:vy,width:ts,height:ts,
                animation:"fx-playerHit 400ms ease-out forwards",borderRadius:4}}/>;
              if(f.type==="dmg") return <div key={f.id} style={{position:"absolute",left:vx,top:vy-4,width:ts,
                textAlign:"center",fontSize:ts*0.38,fontWeight:900,color:f.color||"#fff",
                textShadow:"0 1px 3px rgba(0,0,0,0.9),0 0 6px rgba(0,0,0,0.5)",
                animation:"fx-dmg 600ms ease-out forwards",zIndex:10}}>{f.val}</div>;
              if(f.type==="heal") return <div key={f.id} style={{position:"absolute",left:vx,top:vy-4,width:ts,
                textAlign:"center",fontSize:ts*0.38,fontWeight:900,color:"#4ade80",
                textShadow:"0 0 8px rgba(74,222,128,0.6)",
                animation:"fx-dmg 600ms ease-out forwards",zIndex:10}}>{f.val}</div>;
              if(f.type==="kill"){
                const particles=Array.from({length:6},(_,i)=>({
                  angle:i*60+rand(-15,15), dist:rand(12,24)
                }));
                return <div key={f.id}>{/* death burst */}
                  <div style={{position:"absolute",left:vx,top:vy,width:ts,height:ts,display:"flex",alignItems:"center",justifyContent:"center",
                    fontSize:ts*0.5,color:f.color,animation:"fx-kill 500ms ease-out forwards",zIndex:5}}>{f.char}</div>
                  {particles.map((p,i)=><div key={i} style={{position:"absolute",left:vx+ts/2-2,top:vy+ts/2-2,width:5,height:5,borderRadius:"50%",
                    background:f.color||"#fff",
                    "--px":`${Math.cos(p.angle*Math.PI/180)*p.dist}px`,"--py":`${Math.sin(p.angle*Math.PI/180)*p.dist}px`,
                    animation:`fx-particle 450ms ease-out ${i*30}ms forwards`,zIndex:4}}/>)}
                </div>;}
              if(f.type==="skillArea"){
                const tiles=[];
                for(let dy=-f.r;dy<=f.r;dy++)for(let dx=-f.r;dx<=f.r;dx++){
                  const ax=(f.x+dx-g.px+VP_HALF)*ts,ay=(f.y+dy-g.py+VP_HALF)*ts;
                  tiles.push(<div key={`${dx},${dy}`} style={{position:"absolute",left:ax,top:ay,width:ts,height:ts,
                    background:"radial-gradient(circle,rgba(251,191,36,0.4),rgba(239,68,68,0.2),transparent)",
                    animation:"fx-skill 500ms ease-out forwards"}}/>);
                }
                return <div key={f.id}>{tiles}</div>;
              }
              if(f.type==="skillLine"&&f.tiles){
                return <div key={f.id}>{f.tiles.map((t,i)=>{
                  const lx=(t.x-g.px+VP_HALF)*ts,ly=(t.y-g.py+VP_HALF)*ts;
                  return <div key={i} style={{position:"absolute",left:lx,top:ly,width:ts,height:ts,display:"flex",alignItems:"center",justifyContent:"center",
                    background:"radial-gradient(circle,rgba(99,102,241,0.5),rgba(139,92,246,0.2),transparent)",fontSize:ts*0.4,
                    animation:`fx-skill 400ms ease-out ${i*50}ms forwards`}}>{i===0?f.icon:""}</div>;
                })}</div>;
              }
              if(f.type==="skillRoom"&&f.room){
                const tiles=[];
                for(let ry=f.room.y;ry<f.room.y+f.room.h;ry++)for(let rx=f.room.x;rx<f.room.x+f.room.w;rx++){
                  const rx2=(rx-g.px+VP_HALF)*ts,ry2=(ry-g.py+VP_HALF)*ts;
                  tiles.push(<div key={`${rx},${ry}`} style={{position:"absolute",left:rx2,top:ry2,width:ts,height:ts,
                    background:"radial-gradient(circle,rgba(192,132,252,0.35),rgba(139,92,246,0.15),transparent)",
                    animation:"fx-skill 550ms ease-out forwards"}}/>);
                }
                return <div key={f.id}>{tiles}</div>;
              }
              return null;
            })}
          </div>
        </div>

        {/* Overlay: Enemy HP (top-left) */}
        {nearE.length>0&&<div style={{position:"absolute",top:8,left:8,maxWidth:"60%",pointerEvents:"none"}}>
          {nearE.slice(0,3).map(e=>(
            <div key={e.id} style={{display:"flex",alignItems:"center",gap:4,marginBottom:3,background:"rgba(0,0,0,0.6)",borderRadius:6,padding:"3px 8px",backdropFilter:"blur(4px)"}}>
              <span style={{fontSize:9,color:e.color,fontWeight:600,whiteSpace:"nowrap"}}>{e.char}{e.name}</span>
              <div style={{flex:1,minWidth:40}}><Bar value={e.hp} max={e.maxHp} h={4} color={e.hp/e.maxHp>0.5?"#22c55e":e.hp/e.maxHp>0.25?"#eab308":"#ef4444"}/></div>
              <span style={{fontSize:7,color:"#94a3b8"}}>{e.hp}</span>
              {Object.keys(e.statuses).length>0&&<span style={{fontSize:7}}>{Object.keys(e.statuses).map(k=>STATUS_INFO[k]?.icon||"").join("")}</span>}
            </div>))}
        </div>}

        {/* Overlay: Messages (bottom) */}
        <div style={{position:"absolute",bottom:4,left:8,right:8,pointerEvents:"none"}}>
          {recentM.map((m,i)=><div key={i} style={{fontSize:10,color:i===recentM.length-1?"#e2e8f0":"#94a3b8",lineHeight:1.4,
            textShadow:"0 1px 4px rgba(0,0,0,0.8),0 0 8px rgba(0,0,0,0.6)",
            background:i===recentM.length-1?"rgba(0,0,0,0.45)":"transparent",
            borderRadius:4,padding:i===recentM.length-1?"2px 6px":"0 6px"}}>{m}</div>)}
        </div>
      </div>

      {/* ── CONTROLS (fixed bottom) ── */}
      {(()=>{
        const BS=50,BG=4;
        const execBtn=(id)=>{
          if(id==="inv")setModal("inv");
          else if(id==="skill")setModal("skill");
          else if(id==="map")setModal("map");
          else if(id==="sound")setSoundOn(v=>!v);
        };
        const SideBtn=({id,sz=50})=>{
          if(!id)return <div style={{width:sz,height:sz}}/>;
          const a=BTN_ACTIONS[id];if(!a)return null;
          const icon=id==="sound"?(soundOn?"🔊":"🔇"):a.icon;
          const badge=id==="inv"&&g?g.inventory.length:null;
          return <button onClick={()=>execBtn(id)} style={{width:sz,height:sz,fontSize:20,border:"none",borderRadius:12,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:0,
            background:"rgba(255,255,255,0.06)",color:id==="sound"?(soundOn?a.color:"#475569"):a.color,WebkitTapHighlightColor:"transparent",position:"relative"}}>
            <span>{icon}</span>
            <span style={{fontSize:7,fontWeight:600,lineHeight:1,marginTop:1}}>{a.label}</span>
            {badge!=null&&<span style={{position:"absolute",top:2,right:5,fontSize:8,fontWeight:700,color:"#fbbf24"}}>{badge}</span>}
          </button>;
        };
        return <div style={{flexShrink:0,padding:"4px 8px 10px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            {/* Left side buttons */}
            <div style={{display:"flex",flexDirection:"column",gap:BG}}>
              <SideBtn id={btnLayout[0]}/><SideBtn id={btnLayout[1]}/>
            </div>

            {/* 8-Dir Pad */}
            <div style={{display:"grid",gridTemplateColumns:`repeat(3,${BS}px)`,gap:BG}}>
              <DBtn label="↖" dx={-1} dy={-1} sz={BS}/><DBtn label="↑" dx={0} dy={-1} sz={BS}/><DBtn label="↗" dx={1} dy={-1} sz={BS}/>
              <DBtn label="←" dx={-1} dy={0} sz={BS}/>
              <button onClick={()=>processTurn(0,0)} style={{width:BS,height:BS,fontSize:9,fontWeight:700,border:"none",borderRadius:12,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(255,255,255,0.08)",color:"#94a3b8",WebkitTapHighlightColor:"transparent"}}>待機</button>
              <DBtn label="→" dx={1} dy={0} sz={BS}/>
              <DBtn label="↙" dx={-1} dy={1} sz={BS}/><DBtn label="↓" dx={0} dy={1} sz={BS}/><DBtn label="↘" dx={1} dy={1} sz={BS}/>
            </div>

            {/* Right side buttons */}
            <div style={{display:"flex",flexDirection:"column",gap:BG}}>
              <SideBtn id={btnLayout[2]}/><SideBtn id={btnLayout[3]}/>
            </div>
          </div>
          {/* Config gear */}
          <div style={{display:"flex",justifyContent:"center",marginTop:4}}>
            <button onClick={()=>setShowConfig(true)} style={{fontSize:10,border:"none",background:"transparent",color:"#475569",cursor:"pointer",padding:"2px 8px",WebkitTapHighlightColor:"transparent"}}>⚙ 配置変更</button>
          </div>
        </div>;
      })()}

      {/* ── BUTTON CONFIG MODAL ── */}
      {showConfig&&<Overlay onClose={()=>{setShowConfig(false);setConfigSlot(null);}}>
        <h3 style={{color:"#e2e8f0",margin:"0 0 12px",fontSize:15,fontWeight:700}}>⚙ ボタン配置</h3>
        <p style={{fontSize:11,color:"#94a3b8",margin:"0 0 12px"}}>スロットをタップ → 割り当てるボタンを選択</p>
        <div style={{display:"flex",justifyContent:"center",gap:12,marginBottom:16}}>
          {/* Layout preview */}
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{display:"flex",flexDirection:"column",gap:4}}>
              {[0,1].map(i=><button key={i} onClick={()=>setConfigSlot(i)} style={{width:50,height:50,fontSize:18,border:configSlot===i?"2px solid #60a5fa":"2px solid transparent",borderRadius:12,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                background:configSlot===i?"rgba(96,165,250,0.15)":"rgba(255,255,255,0.06)",color:BTN_ACTIONS[btnLayout[i]]?.color||"#fff",WebkitTapHighlightColor:"transparent"}}>
                <span>{BTN_ACTIONS[btnLayout[i]]?.icon||"?"}</span>
                <span style={{fontSize:7,marginTop:1}}>{["左上","左下"][i]}</span>
              </button>)}
            </div>
            <div style={{width:60,height:60,borderRadius:12,background:"rgba(255,255,255,0.04)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#475569"}}>D-pad</div>
            <div style={{display:"flex",flexDirection:"column",gap:4}}>
              {[2,3].map(i=><button key={i} onClick={()=>setConfigSlot(i)} style={{width:50,height:50,fontSize:18,border:configSlot===i?"2px solid #60a5fa":"2px solid transparent",borderRadius:12,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                background:configSlot===i?"rgba(96,165,250,0.15)":"rgba(255,255,255,0.06)",color:BTN_ACTIONS[btnLayout[i]]?.color||"#fff",WebkitTapHighlightColor:"transparent"}}>
                <span>{BTN_ACTIONS[btnLayout[i]]?.icon||"?"}</span>
                <span style={{fontSize:7,marginTop:1}}>{["右上","右下"][i-2]}</span>
              </button>)}
            </div>
          </div>
        </div>
        {configSlot!=null&&<div>
          <p style={{fontSize:10,color:"#60a5fa",margin:"0 0 8px",fontWeight:600}}>▼ {["左上","左下","右上","右下"][configSlot]}に割り当て</p>
          <div style={{display:"flex",flexWrap:"wrap",gap:6,justifyContent:"center"}}>
            {Object.entries(BTN_ACTIONS).map(([id,a])=><button key={id} onClick={()=>{
              const nl=[...btnLayout];nl[configSlot]=id;saveBtnLayout(nl);setConfigSlot(null);
            }} style={{width:60,height:50,fontSize:16,border:btnLayout[configSlot]===id?"2px solid #60a5fa":"1px solid rgba(255,255,255,0.1)",borderRadius:10,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
              background:btnLayout[configSlot]===id?"rgba(96,165,250,0.15)":"rgba(255,255,255,0.04)",color:a.color,WebkitTapHighlightColor:"transparent"}}>
              <span>{a.icon}</span><span style={{fontSize:8,marginTop:2}}>{a.label}</span>
            </button>)}
          </div>
        </div>}
        <button onClick={()=>{setShowConfig(false);setConfigSlot(null);}} style={{marginTop:16,padding:"10px",fontSize:13,fontWeight:600,background:"rgba(255,255,255,0.06)",color:"#94a3b8",border:"none",borderRadius:10,cursor:"pointer",width:"100%"}}>閉じる</button>
      </Overlay>}

      {/* ── INVENTORY MODAL ── */}
      {modal==="inv"&&<Overlay onClose={()=>{setModal(null);setThrowMode(null);}}>
        <h3 style={{color:"#fbbf24",margin:"0 0 12px",fontSize:16,fontWeight:700}}>📦 持ち物 <span style={{fontSize:12,fontWeight:400,color:"#64748b"}}>{g.inventory.length}/{MAX_INV}</span></h3>
        {/* Equipped */}
        <div style={{display:"flex",gap:8,marginBottom:12}}>
          <div style={{flex:1,background:"rgba(255,255,255,0.04)",borderRadius:10,padding:"8px 10px",position:"relative"}}>
            <div style={{fontSize:9,color:"#64748b",marginBottom:2}}>🗡 武器</div>
            <div style={{fontSize:12,fontWeight:600,color:g.weapon?"#f59e0b":"#334155"}}>{g.weapon?`${g.weapon.name} (攻+${g.weapon.atk})`:"素手"}</div>
            {g.weapon&&<button onClick={()=>unequip("weapon")} style={{position:"absolute",top:6,right:6,padding:"2px 8px",fontSize:9,fontWeight:600,border:"none",borderRadius:6,cursor:"pointer",background:"rgba(255,255,255,0.08)",color:"#94a3b8"}}>外す</button>}
          </div>
          <div style={{flex:1,background:"rgba(255,255,255,0.04)",borderRadius:10,padding:"8px 10px",position:"relative"}}>
            <div style={{fontSize:9,color:"#64748b",marginBottom:2}}>🛡 防具</div>
            <div style={{fontSize:12,fontWeight:600,color:g.armor?"#60a5fa":"#334155"}}>{g.armor?`${g.armor.name} (守+${g.armor.def})`:"なし"}</div>
            {g.armor&&<button onClick={()=>unequip("armor")} style={{position:"absolute",top:6,right:6,padding:"2px 8px",fontSize:9,fontWeight:600,border:"none",borderRadius:6,cursor:"pointer",background:"rgba(255,255,255,0.08)",color:"#94a3b8"}}>外す</button>}
          </div>
        </div>
        {/* Foot items */}
        {(()=>{const footItems=g.items.filter(it=>it.x===g.px&&it.y===g.py);
          return footItems.length>0&&(
            <div style={{marginBottom:12,background:"rgba(251,191,36,0.06)",borderRadius:10,padding:"8px 10px",border:"1px solid rgba(251,191,36,0.12)"}}>
              <div style={{fontSize:10,color:"#fbbf24",fontWeight:600,marginBottom:6}}>足元のアイテム</div>
              {footItems.map((fi,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0"}}>
                  <span style={{fontSize:12}}><span style={{color:fi.color,marginRight:4}}>{fi.char}</span>{fi.name}</span>
                  {g.inventory.length<MAX_INV&&<button onClick={()=>{setG(prev=>{
                    let s={...prev,items:prev.items.filter(it=>it.id!==fi.id),inventory:[...prev.inventory,{...fi}]};
                    s.msgs=addMsg(s,`${fi.name}を拾った`);s.pendingSfx="item";return s;});}}
                    style={{padding:"4px 10px",fontSize:10,fontWeight:600,border:"none",borderRadius:6,cursor:"pointer",background:"#16a34a",color:"#fff"}}>拾う</button>}
                </div>))}
            </div>);})()}
        {g.inventory.length===0?<p style={{color:"#475569",fontSize:13,textAlign:"center",padding:16}}>何も持っていない</p>:
          g.inventory.map((item,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
              <div style={{flex:1,minWidth:0}}>
                <span style={{color:item.color,marginRight:6,fontSize:14}}>{item.char}</span>
                <span style={{fontSize:13,fontWeight:500}}>{item.name}</span>
                <div style={{fontSize:10,color:"#64748b",marginTop:1}}>{item.category==="consumable"?item.desc:item.category==="throw"?item.desc:item.slot==="weapon"?`攻撃+${item.atk}`:`防御+${item.def}`}</div>
              </div>
              <div style={{display:"flex",gap:4,flexShrink:0}}>
                {item.category==="throw"&&<button onClick={()=>{setThrowMode({itemIdx:i});setModal(null);}} style={{padding:"6px 10px",fontSize:10,fontWeight:600,border:"none",borderRadius:8,cursor:"pointer",background:"#dc2626",color:"#fff"}}>投</button>}
                <button onClick={()=>{useItem(i);setModal(null);}} style={{padding:"6px 10px",fontSize:10,fontWeight:600,border:"none",borderRadius:8,cursor:"pointer",
                  background:item.category==="equipment"?"#4f46e5":"#16a34a",color:"#fff"}}>{item.category==="equipment"?"装備":"使う"}</button>
                <button onClick={()=>{dropItem(i);}} style={{padding:"6px 10px",fontSize:10,fontWeight:600,border:"none",borderRadius:8,cursor:"pointer",background:"rgba(255,255,255,0.06)",color:"#94a3b8"}}>捨</button>
              </div>
            </div>))}
        <button onClick={()=>{setModal(null);setThrowMode(null);}} style={{marginTop:14,padding:"10px",fontSize:13,fontWeight:600,background:"rgba(255,255,255,0.06)",color:"#94a3b8",border:"none",borderRadius:10,cursor:"pointer",width:"100%"}}>閉じる</button>
      </Overlay>}

      {/* ── THROW DIR ── */}
      {throwMode&&<Overlay onClose={()=>setThrowMode(null)}>
        <h3 style={{color:"#dc2626",margin:"0 0 14px",fontSize:15,fontWeight:700,textAlign:"center"}}>投げる方向</h3>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,64px)",gap:6,justifyContent:"center"}}>
          {[7,0,1,6,-1,2,5,4,3].map((di,i)=>di===-1?
            <div key={i} style={{width:64,height:64,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:"#334155"}}>●</div>:
            <button key={i} onClick={()=>execThrow(throwMode.itemIdx,di)} style={{width:64,height:64,fontSize:22,border:"none",borderRadius:12,background:"rgba(255,255,255,0.06)",color:"#e2e8f0",cursor:"pointer"}}>{DIR_LABELS[di]}</button>)}
        </div>
        <button onClick={()=>setThrowMode(null)} style={{marginTop:14,padding:"10px",fontSize:13,fontWeight:600,background:"rgba(255,255,255,0.06)",color:"#94a3b8",border:"none",borderRadius:10,cursor:"pointer",width:"100%"}}>キャンセル</button>
      </Overlay>}

      {/* ── SKILL MODAL ── */}
      {modal==="skill"&&!skillDir&&<Overlay onClose={()=>setModal(null)}>
        <h3 style={{color:"#818cf8",margin:"0 0 12px",fontSize:16,fontWeight:700}}>🔥 スキル <span style={{fontSize:12,fontWeight:400,color:"#64748b"}}>MP {g.mp}/{g.maxMp}</span></h3>
        {avSkills.map(sk=>(
          <div key={sk.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,0.04)",opacity:g.mp>=sk.cost?1:0.35}}>
            <div>
              <span style={{fontSize:16,marginRight:6}}>{sk.icon}</span>
              <span style={{fontSize:13,fontWeight:500}}>{sk.name}</span>
              <div style={{fontSize:10,color:"#64748b",marginTop:1}}>{sk.desc}（MP{sk.cost}）</div>
            </div>
            <button onClick={()=>{if(g.mp<sk.cost)return;if(sk.type==="line"){setSkillDir({skillId:sk.id});setModal(null);}else{execSkill(sk.id,null);setModal(null);}}}
              disabled={g.mp<sk.cost} style={{padding:"6px 14px",fontSize:11,fontWeight:600,border:"none",borderRadius:8,cursor:"pointer",
              background:g.mp>=sk.cost?"#4f46e5":"#1e293b",color:g.mp>=sk.cost?"#fff":"#475569"}}>使う</button>
          </div>))}
        <button onClick={()=>setModal(null)} style={{marginTop:14,padding:"10px",fontSize:13,fontWeight:600,background:"rgba(255,255,255,0.06)",color:"#94a3b8",border:"none",borderRadius:10,cursor:"pointer",width:"100%"}}>閉じる</button>
      </Overlay>}

      {/* ── SKILL DIR ── */}
      {skillDir&&<Overlay onClose={()=>setSkillDir(null)}>
        <h3 style={{color:"#818cf8",margin:"0 0 14px",fontSize:15,fontWeight:700,textAlign:"center"}}>スキル方向</h3>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,64px)",gap:6,justifyContent:"center"}}>
          {[7,0,1,6,-1,2,5,4,3].map((di,i)=>di===-1?
            <div key={i} style={{width:64,height:64,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:"#334155"}}>●</div>:
            <button key={i} onClick={()=>execSkill(skillDir.skillId,di)} style={{width:64,height:64,fontSize:22,border:"none",borderRadius:12,background:"rgba(255,255,255,0.06)",color:"#e2e8f0",cursor:"pointer"}}>{DIR_LABELS[di]}</button>)}
        </div>
        <button onClick={()=>setSkillDir(null)} style={{marginTop:14,padding:"10px",fontSize:13,fontWeight:600,background:"rgba(255,255,255,0.06)",color:"#94a3b8",border:"none",borderRadius:10,cursor:"pointer",width:"100%"}}>キャンセル</button>
      </Overlay>}

      {/* ── SHOP ── */}
      {modal==="shop"&&<Overlay onClose={()=>setModal(null)}>
        <h3 style={{color:"#fbbf24",margin:"0 0 12px",fontSize:16,fontWeight:700}}>🏪 商人 <span style={{fontSize:12,fontWeight:400,color:"#64748b"}}>{g.gold}G</span></h3>
        {SHOP_ITEMS.map((si,i)=>(
          <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,0.04)",opacity:g.gold>=si.price?1:0.35}}>
            <div><span style={{color:si.color,marginRight:6,fontSize:14}}>{si.char}</span><span style={{fontSize:13}}>{si.name}</span>
              <div style={{fontSize:10,color:"#64748b",marginTop:1}}>{si.desc}</div></div>
            <button onClick={()=>buyItem(si)} disabled={g.gold<si.price} style={{padding:"6px 14px",fontSize:11,fontWeight:600,border:"none",borderRadius:8,cursor:"pointer",
              background:g.gold>=si.price?"#d97706":"#1e293b",color:g.gold>=si.price?"#0f172a":"#475569"}}>{si.price}G</button>
          </div>))}
        <button onClick={()=>setModal(null)} style={{marginTop:14,padding:"10px",fontSize:13,fontWeight:600,background:"rgba(255,255,255,0.06)",color:"#94a3b8",border:"none",borderRadius:10,cursor:"pointer",width:"100%"}}>閉じる</button>
      </Overlay>}

      {/* ── MINIMAP ── */}
      {modal==="map"&&<Overlay onClose={()=>setModal(null)}>
        <h3 style={{color:"#60a5fa",margin:"0 0 12px",fontSize:16,fontWeight:700,textAlign:"center"}}>🗺 B{g.floor}F {theme.name}</h3>
        <div style={{display:"grid",gridTemplateColumns:`repeat(${MAP_W},7px)`,gap:0,justifyContent:"center",borderRadius:8,overflow:"hidden"}}>
          {Array.from({length:MAP_H},(_,my)=>Array.from({length:MAP_W},(_2,mx)=>{
            const k=`${mx},${my}`,isE=g.explored.has(k);let c="#08080c";
            if(isE){c=g.map[my][mx]===WALL?theme.wall:theme.floor;
              if(mx===g.px&&my===g.py)c="#38bdf8";
              else if(mx===g.stairs.x&&my===g.stairs.y)c="#a78bfa";
              else if(g.merchant&&mx===g.merchant.x&&my===g.merchant.y)c="#fbbf24";
              else{const he=g.enemies.find(e=>e.hp>0&&e.x===mx&&e.y===my&&g.visible.has(k));if(he)c="#ef4444";}}
            return <div key={k} style={{width:7,height:7,backgroundColor:c}}/>;}))}
        </div>
        <div style={{display:"flex",gap:12,marginTop:10,fontSize:10,color:"#64748b",justifyContent:"center"}}>
          <span><span style={{color:"#38bdf8"}}>■</span> 自分</span><span><span style={{color:"#a78bfa"}}>■</span> 階段</span>
          <span><span style={{color:"#ef4444"}}>■</span> 敵</span><span><span style={{color:"#fbbf24"}}>■</span> 商人</span></div>
        <button onClick={()=>setModal(null)} style={{marginTop:14,padding:"10px",fontSize:13,fontWeight:600,background:"rgba(255,255,255,0.06)",color:"#94a3b8",border:"none",borderRadius:10,cursor:"pointer",width:"100%"}}>閉じる</button>
      </Overlay>}
    </div>);
}
