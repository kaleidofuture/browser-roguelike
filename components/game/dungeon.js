import { MAP_W, MAP_H, WALL, FLOOR, rand, DIRS_4, DIRS_8 } from './constants';
import { ENEMY_POOLS, CONSUMABLES, THROW_ITEMS, WEAPONS, ARMORS, TRAP_TYPES } from './data';

// LOS for ranged enemies
export function hasLOS(x0,y0,x1,y1,map){
  const dx=Math.abs(x1-x0),dy=Math.abs(y1-y0),sx=x0<x1?1:-1,syy=y0<y1?1:-1;
  let err=dx-dy,cx=x0,cy=y0;
  while(true){if(cx===x1&&cy===y1)return true;if(cx<0||cx>=MAP_W||cy<0||cy>=MAP_H)return false;
    if(map[cy][cx]===WALL&&!(cx===x0&&cy===y0))return false;
    const e2=2*err;if(e2>-dy){err-=dy;cx+=sx;}if(e2<dx){err+=dx;cy+=syy;}}
}

// Find which room the player is in (or null)
export function findRoom(px,py,rooms){
  for(const r of rooms){
    if(px>=r.x&&px<r.x+r.w&&py>=r.y&&py<r.y+r.h) return r;
  }
  return null;
}

// Corridor visibility: only adjacent 1 tile
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
  for(let rx=room.x;rx<room.x+room.w;rx++){
    if(room.y-1>=0&&rx>=0&&rx<MAP_W){
      const wy=room.y-1;
      if(wy>=0&&wy<MAP_H&&rx>=0&&rx<MAP_W){
        if(wy-1>=0&&rx>=0&&rx<MAP_W&&wy-1<MAP_H&&FLOOR===1) {
        }
      }
    }
  }
}

// Main visibility function
export function calcVis(px,py,map,rooms,radius=5){
  const vis=new Set();
  vis.add(`${px},${py}`);
  const isBlind=radius<5;
  const room=findRoom(px,py,rooms);
  if(room&&!isBlind){
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
    corridorVis(vis,px,py,map);
    if(!isBlind){
      for(const[dx,dy] of DIRS_8){
        const ax=px+dx,ay=py+dy;
        const adjRoom=findRoom(ax,ay,rooms);
        if(adjRoom) roomVis(vis,adjRoom);
      }
    }
  } else {
    corridorVis(vis,px,py,map);
  }
  return vis;
}

// Dungeon generation
export function genDungeon(floor){
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
  // Guarantee at least 1 food item per floor
  const foodItems=avC.filter(c=>c.type==="food");
  if(foodItems.length>0){const r=rooms[rand(0,rooms.length-1)],ix=rand(r.x,r.x+r.w-1),iy=rand(r.y,r.y+r.h-1),k=`${ix},${iy}`;
    if(!used.has(k)){used.add(k);const t=foodItems[rand(0,foodItems.length-1)];
      items.push({...t,id:`food_${Date.now()}_${Math.random()}`,x:ix,y:iy,category:"consumable"});}}
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
