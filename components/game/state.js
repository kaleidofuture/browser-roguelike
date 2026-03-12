import { MAP_W, MAP_H, WALL, FLOOR, rand, MAX_FLOOR, MAX_FULL, FULL_DECAY, MAX_MP, DIRS_8, toKey } from './constants';
import { STATUS_INFO, ENEMY_POOLS } from './data';
import { getTheme } from './data';
import { genDungeon, calcVis } from './dungeon';

export function initState(){const d=genDungeon(1),vis=calcVis(d.start.x,d.start.y,d.map,d.rooms);
  return{map:d.map,rooms:d.rooms,stairs:d.stairs,enemies:d.enemies,items:d.items,traps:d.traps,events:d.events,merchant:d.merchant,
    px:d.start.x,py:d.start.y,facing:1,lastMove:null,hp:50,maxHp:50,mp:20,maxMp:20,baseAtk:8,baseDef:3,level:1,exp:0,expNext:15,
    floor:1,turns:0,gold:0,visible:vis,explored:new Set(vis),fullness:MAX_FULL,
    inventory:[],weapon:null,armor:null,statuses:{},
    msgs:["── B1F 洞窟 ── 冒険開始！"],gameOver:false,victory:false,pendingSfx:null,fx:[]};}

export function getAtk(s){return s.baseAtk+(s.weapon?s.weapon.atk:0);}
export function getDef(s){return s.baseDef+(s.armor?s.armor.def:0);}

export function addMsg(s,m){const ms=[...s.msgs,m];if(ms.length>50)ms.splice(0,ms.length-50);return ms;}
export function addStatus(target,status,dur){const ss={...target.statuses};ss[status]=(ss[status]||0)+dur;return{...target,statuses:ss};}
export function tickStatuses(st){const ns={};for(const[k,v] of Object.entries(st)){if(v>1)ns[k]=v-1;}return ns;}

export function killCheck(s,saveScore){if(s.hp<=0){s.hp=0;s.gameOver=true;s.msgs=addMsg(s,`💀 B${s.floor}Fで力尽きた...(Lv${s.level})`);s.pendingSfx="dead";if(saveScore)saveScore(s);}return s;}

export function levelUp(s){const nl=s.level+1,hpB=8+Math.floor(nl*1.5),mpB=3;
  return{...s,level:nl,maxHp:s.maxHp+hpB,hp:s.maxHp+hpB,maxMp:Math.min(MAX_MP,s.maxMp+mpB),mp:Math.min(MAX_MP,s.maxMp+mpB),
    baseAtk:s.baseAtk+2,baseDef:s.baseDef+1,expNext:Math.floor(s.expNext*1.6),
    msgs:addMsg(s,`🎉 Lv${nl}！ HP+${hpB} 攻+2 守+1`),pendingSfx:"lvl"};}

export function nextFloor(s,saveScore){
  if(s.floor>=MAX_FLOOR){const ns={...s,victory:true,gameOver:true,msgs:addMsg(s,"🏆 制覇！"),pendingSfx:"win"};if(saveScore)saveScore(ns);return ns;}
  const nf=s.floor+1,th=getTheme(nf),d=genDungeon(nf),vis=calcVis(d.start.x,d.start.y,d.map,d.rooms);
  return{...s,map:d.map,rooms:d.rooms,stairs:d.stairs,enemies:d.enemies,items:d.items,traps:d.traps,events:d.events,merchant:d.merchant,
    px:d.start.x,py:d.start.y,floor:nf,lastMove:null,visible:vis,explored:new Set(vis),
    msgs:addMsg(s,`── B${nf}F ${th.name} ──`),pendingSfx:"stairs",fx:[]};}

export function applyTrap(s,saveScore){const trap=s.traps.find(t=>t.x===s.px&&t.y===s.py&&!t.triggered);if(!trap)return s;
  let ns={...s,traps:s.traps.map(t=>t.id===trap.id?{...t,visible:true,triggered:true}:t),pendingSfx:"trap"};
  switch(trap.effect){
    case"poison":ns.msgs=addMsg(ns,"💜 毒の罠！");ns=addStatus(ns,"poison",8);break;
    case"pit":{const d=rand(8,15+ns.floor*2);ns.hp-=d;ns.msgs=addMsg(ns,`🕳 落穴！${d}dmg`);break;}
    case"warp":{
      let wr,wx,wy,tries=0;
      do{wr=ns.rooms[rand(0,ns.rooms.length-1)];wx=rand(wr.x,wr.x+wr.w-1);wy=rand(wr.y,wr.y+wr.h-1);tries++;}
      while(tries<50&&(ns.map[wy][wx]===WALL||ns.enemies.some(e=>e.hp>0&&e.x===wx&&e.y===wy)||(ns.merchant&&wx===ns.merchant.x&&wy===ns.merchant.y)));
      ns.px=wx;ns.py=wy;ns.msgs=addMsg(ns,"🌀 ワープ！");
      const wv=calcVis(ns.px,ns.py,ns.map,ns.rooms,ns.statuses.blind?2:5);ns.visible=wv;const we=new Set(ns.explored);for(const v of wv)we.add(v);ns.explored=we;break;}
    case"bomb":{const d=rand(15,20+ns.floor*3);ns.hp-=d;ns.msgs=addMsg(ns,`💥 地雷！${d}dmg`);break;}
    case"slow":ns=addStatus(ns,"slow",5);ns.msgs=addMsg(ns,"🐢 鈍足！");break;
    case"confuse":ns=addStatus(ns,"confuse",6);ns.msgs=addMsg(ns,"💫 混乱！");break;
    case"sleep":ns=addStatus(ns,"sleep",4);ns.msgs=addMsg(ns,"💤 睡眠！");break;
  }return killCheck(ns,saveScore);}

export function applyFull(s,saveScore){let ns={...s};
  // Hunger decays every 2 turns instead of every turn
  if(ns.turns%2===0)ns.fullness=ns.fullness-FULL_DECAY;
  if(ns.fullness<=0){ns.fullness=0;ns.hp-=1;if(ns.turns%5===0)ns.msgs=addMsg(ns,"🍚 空腹...");}
  else if(!ns.statuses.poison&&ns.hp<ns.maxHp&&ns.turns%2===0){const regen=ns.level>=11?3:ns.level>=6?2:1;ns.hp=Math.min(ns.maxHp,ns.hp+regen);}
  return killCheck(ns,saveScore);}

export function applyPStatus(s,saveScore){let ns={...s};if(ns.statuses.poison){ns.hp-=3;ns.msgs=addMsg(ns,"🟣 毒3dmg");}ns.statuses=tickStatuses(ns.statuses);return killCheck(ns,saveScore);}

export function checkEvents(s){let ns={...s};for(const ev of ns.events){if(ev.triggered)continue;const r=ns.rooms[ev.roomIdx];
  if(ns.px>=r.x&&ns.px<r.x+r.w&&ns.py>=r.y&&ns.py<r.y+r.h){ev.triggered=true;
    if(ev.type==="monsterHouse"){ns.msgs=addMsg(ns,"⚠️ モンスターハウス！");ns.enemies=ns.enemies.map(e=>e.x>=r.x&&e.x<r.x+r.w&&e.y>=r.y&&e.y<r.y+r.h?{...e,sleeping:false}:e);ns.pendingSfx="trap";}
    else if(ev.type==="treasure"){ns.msgs=addMsg(ns,"✨ 宝物部屋！");ns.pendingSfx="item";}}}return ns;}

export function moveEnemies(s,saveScore){let ns={...s,enemies:s.enemies.map(e=>({...e}))};
  const isMrc=(x,y)=>ns.merchant&&x===ns.merchant.x&&y===ns.merchant.y;
  for(const e of ns.enemies){if(e.hp<=0||e.sleeping)continue;
    if(e.statuses.sleep){e.statuses=tickStatuses(e.statuses);continue;}
    if(e.statuses.para&&Math.random()<0.4){e.statuses=tickStatuses(e.statuses);continue;}
    if(e.statuses.poison){e.hp-=2;if(e.hp<=0){ns.msgs=addMsg(ns,`${e.name}は毒で倒れた！`);e.statuses=tickStatuses(e.statuses);continue;}}
    e.statuses=tickStatuses(e.statuses);
    const dist=Math.max(Math.abs(e.x-ns.px),Math.abs(e.y-ns.py));

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

    if(e.statuses.confuse){const d=DIRS_8[rand(0,7)],nx=e.x+d[0],ny=e.y+d[1];
      if(nx>=0&&nx<MAP_W&&ny>=0&&ny<MAP_H&&ns.map[ny][nx]!==WALL&&!(nx===ns.px&&ny===ns.py)&&!ns.enemies.some(o=>o.id!==e.id&&o.hp>0&&o.x===nx&&o.y===ny)&&!isMrc(nx,ny)
        &&(d[0]===0||d[1]===0||(ns.map[e.y][e.x+d[0]]!==WALL&&ns.map[e.y+d[1]][e.x]!==WALL))){if(d[0]!==0)e.facing=d[0]>0?1:-1;e.x=nx;e.y=ny;}continue;}

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
          if(ddx!==0)e.facing=ddx>0?1:-1;
          const dmg=Math.max(1,e.atk-getDef(ns)+rand(-2,2));ns.hp-=dmg;ns.msgs=addMsg(ns,`${e.name}の遠距離攻撃！${dmg}dmg`);ns.pendingSfx="hit";
          ns.fx=[...(ns.fx||[]),{type:"playerHit",x:ns.px,y:ns.py},{type:"dmg",x:ns.px,y:ns.py,val:`-${dmg}`,color:"#f97316"}];
          ns=killCheck(ns,saveScore);if(ns.gameOver)return ns;continue;}}}

    if(e.ai==="caller"&&e.aware&&dist<=6&&Math.random()<0.12){const r2=ns.rooms.find(r=>e.x>=r.x&&e.x<r.x+r.w&&e.y>=r.y&&e.y<r.y+r.h);
      if(r2){const pool=ENEMY_POOLS[Math.min(Math.floor((ns.floor-1)/2),ENEMY_POOLS.length-1)],t=pool[rand(0,pool.length-1)],sc=1+ns.floor*0.15,nx=rand(r2.x,r2.x+r2.w-1),ny=rand(r2.y,r2.y+r2.h-1);
        if(ns.map[ny][nx]===FLOOR&&!ns.enemies.some(o=>o.hp>0&&o.x===nx&&o.y===ny)&&!(nx===ns.px&&ny===ns.py)&&!isMrc(nx,ny)){
          ns.enemies.push({...t,id:`c_${Date.now()}_${Math.random()}`,x:nx,y:ny,hp:Math.floor(t.hp*sc),maxHp:Math.floor(t.hp*sc),atk:Math.floor(t.atk*sc),def:t.def,statuses:{}});
          ns.msgs=addMsg(ns,`${e.name}が仲間を呼んだ！`);}}continue;}

    if(dist<=1){
      const edx=ns.px-e.x;if(edx!==0)e.facing=edx>0?1:-1;
      const dmg=Math.max(1,e.atk-getDef(ns)+rand(-1,2));ns.hp-=dmg;ns.msgs=addMsg(ns,`${e.name}の攻撃！${dmg}dmg`);ns.pendingSfx="hit";
      ns.fx=[...(ns.fx||[]),{type:"playerHit",x:ns.px,y:ns.py},{type:"dmg",x:ns.px,y:ns.py,val:`-${dmg}`,color:"#f87171"}];
      if(["poison","confuse","sleep","para","slow"].includes(e.ai)&&Math.random()<0.35&&!ns.statuses[e.ai]){
        const dur=STATUS_INFO[e.ai]?.dur||5;ns=addStatus(ns,e.ai,dur);ns.msgs=addMsg(ns,`${STATUS_INFO[e.ai]?.icon||""} ${STATUS_INFO[e.ai]?.name}！`);}
      ns=killCheck(ns,saveScore);if(ns.gameOver)return ns;continue;}

    if(e.ai==="erratic"&&!e.aware&&Math.random()<0.3){const d=DIRS_8[rand(0,7)],nx=e.x+d[0],ny=e.y+d[1];
      if(nx>=0&&nx<MAP_W&&ny>=0&&ny<MAP_H&&ns.map[ny][nx]!==WALL&&!(nx===ns.px&&ny===ns.py)&&!ns.enemies.some(o=>o.id!==e.id&&o.hp>0&&o.x===nx&&o.y===ny)&&!isMrc(nx,ny)
        &&(d[0]===0||d[1]===0||(ns.map[e.y][e.x+d[0]]!==WALL&&ns.map[e.y+d[1]][e.x]!==WALL))){if(d[0]!==0)e.facing=d[0]>0?1:-1;e.x=nx;e.y=ny;}continue;}

    if(e.aware){
      const BFS_DIRS=[[0,-1],[0,1],[-1,0],[1,0],[1,-1],[1,1],[-1,1],[-1,-1]];
      const path=(()=>{
        const Q=[{x:e.x,y:e.y,steps:null,depth:0}],visited=new Set([toKey(e.x,e.y)]);
        let qi=0;
        while(qi<Q.length){
          const{x:cx,y:cy,steps,depth}=Q[qi++];
          if(depth>=15)continue;
          for(const[ddx,ddy] of BFS_DIRS){
            const nx2=cx+ddx,ny2=cy+ddy,k2=toKey(nx2,ny2);
            if(nx2<0||nx2>=MAP_W||ny2<0||ny2>=MAP_H||visited.has(k2)||ns.map[ny2][nx2]===WALL)continue;
            if(ddx!==0&&ddy!==0&&(ns.map[cy][cx+ddx]===WALL||ns.map[cy+ddy][cx]===WALL))continue;
            if(nx2===ns.px&&ny2===ns.py){if(steps)return steps;continue;}
            visited.add(k2);
            if(!ns.enemies.some(o=>o.id!==e.id&&o.hp>0&&o.x===nx2&&o.y===ny2)&&!isMrc(nx2,ny2))
              Q.push({x:nx2,y:ny2,steps:steps||{x:nx2,y:ny2},depth:depth+1});
          }
        }return null;
      })();
      if(path){const edx=path.x-e.x;if(edx!==0)e.facing=edx>0?1:-1;e.x=path.x;e.y=path.y;}
    }else{
      if(!e.pDir||Math.random()<0.2)e.pDir=DIRS_8[rand(0,7)];
      const tryDirs=[e.pDir,...DIRS_8.filter(d=>d!==e.pDir).sort(()=>Math.random()-0.5)];
      let moved=false;
      for(const[ddx,ddy] of tryDirs){
        const nx3=e.x+ddx,ny3=e.y+ddy;
        if(nx3>=0&&nx3<MAP_W&&ny3>=0&&ny3<MAP_H&&ns.map[ny3][nx3]!==WALL
          &&!(nx3===ns.px&&ny3===ns.py)&&!ns.enemies.some(o=>o.id!==e.id&&o.hp>0&&o.x===nx3&&o.y===ny3)&&!isMrc(nx3,ny3)
          &&(ddx===0||ddy===0||(ns.map[e.y][e.x+ddx]!==WALL&&ns.map[e.y+ddy][e.x]!==WALL))){
          if(ddx!==0)e.facing=ddx>0?1:-1;e.x=nx3;e.y=ny3;e.pDir=[ddx,ddy];moved=true;break;}}
      if(!moved)e.pDir=DIRS_8[rand(0,7)];
    }}
  // Natural spawn
  if(ns.turns>0&&ns.turns%30===0){
    const pool=ENEMY_POOLS[Math.min(Math.floor((ns.floor-1)/2),ENEMY_POOLS.length-1)];
    const sc=1+ns.floor*0.15;
    const candidates=ns.rooms.filter(r=>!(ns.px>=r.x&&ns.px<r.x+r.w&&ns.py>=r.y&&ns.py<r.y+r.h));
    for(let tries=0;tries<10&&candidates.length>0;tries++){
      const r=candidates[rand(0,candidates.length-1)];
      const sx=rand(r.x,r.x+r.w-1),sy=rand(r.y,r.y+r.h-1);
      const sk=toKey(sx,sy);
      const isMrcSp=ns.merchant&&sx===ns.merchant.x&&sy===ns.merchant.y;
      if(ns.map[sy][sx]===FLOOR&&!ns.visible.has(sk)&&!ns.enemies.some(e2=>e2.hp>0&&e2.x===sx&&e2.y===sy)&&!isMrcSp){
        const t=pool[rand(0,pool.length-1)];
        ns.enemies.push({...t,id:`sp_${ns.turns}_${Math.random()}`,x:sx,y:sy,hp:Math.floor(t.hp*sc),maxHp:Math.floor(t.hp*sc),atk:Math.floor(t.atk*sc),def:t.def,statuses:{}});
        break;
      }
    }
  }
  return ns;}
