"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { MAP_W, MAP_H, WALL, VP, VP_HALF, rand, MAX_FLOOR, MAX_INV, MAX_FULL, MAX_MP, DIRS_8, DIR_LABELS, toKey } from "./game/constants";
import { getTheme, STATUS_INFO, SKILLS, SHOP_ITEMS, ENEMY_POOLS, CONSUMABLES, THROW_ITEMS, WEAPONS, ARMORS, THEMES, TRAP_TYPES } from "./game/data";
import { initAudio, sfx, playBgm, stopBgm, playFloorBgm } from "./game/audio";
import { calcVis } from "./game/dungeon";
import { initState, getAtk, getDef, addMsg, addStatus, tickStatuses, killCheck, levelUp, nextFloor, applyTrap, applyFull, applyPStatus, checkEvents, moveEnemies } from "./game/state";
import { Bar } from "./ui/Bar";
import { Overlay } from "./ui/Overlay";
import { TILE_SPRITES, ENEMY_SPRITES, ITEM_SPRITES, EQUIP_SPRITES, THEME_FILTERS, THEME_FILTERS_INV, SHEET_URL, SHEET_W, SHEET_H, PLAYER_SPRITE, MERCHANT_SPRITE, getFloorTileIdx } from "./game/sprites";

export default function Roguelike(){
  const [g,setG]=useState(null);
  const [screen,setScreen]=useState("splash");
  const [isMobile,setIsMobile]=useState(false);
  useEffect(()=>{const ch=()=>setIsMobile(window.innerWidth<640);ch();window.addEventListener("resize",ch);return()=>window.removeEventListener("resize",ch);},[]);
  const [modal,setModal]=useState(null);
  const [throwMode,setThrowMode]=useState(null);
  const [skillDir,setSkillDir]=useState(null);
  const [scores,setScores]=useState([]);
  const [soundOn,setSoundOn]=useState(true);
  const touchRef=useRef(null);
  const [effects,setEffects]=useState([]);
  const BTN_ACTIONS={inv:{icon:"📦",label:"持物",color:"#fbbf24"},skill:{icon:"🔥",label:"魔法",color:"#818cf8"},map:{icon:"🗺",label:"地図",color:"#60a5fa"},sound:{icon:"🔊",label:"音",color:"#4ade80"}};
  const [btnLayout,setBtnLayout]=useState(["map","sound","inv","skill"]);
  const [showConfig,setShowConfig]=useState(false);
  const [libTab,setLibTab]=useState("enemy");
  const [previewBgm,setPreviewBgm]=useState(null);
  const [configSlot,setConfigSlot]=useState(null);
  useEffect(()=>{try{const r=localStorage.getItem("rl_btnLayout");if(r)setBtnLayout(JSON.parse(r));}catch{}},[]);
  const saveBtnLayout=(layout)=>{setBtnLayout(layout);try{localStorage.setItem("rl_btnLayout",JSON.stringify(layout));}catch{}};
  const fxId=useRef(0);
  const spawnFx=useCallback((arr)=>{
    const nfx=arr.map(f=>({...f,id:fxId.current++,ts:Date.now()}));
    setEffects(p=>[...p,...nfx]);
    setTimeout(()=>setEffects(p=>p.filter(f=>!nfx.some(n=>n.id===f.id))),650);
  },[]);
  const prevTurn=useRef(0);
  useEffect(()=>{
    if(g?.fx?.length>0){
      prevTurn.current=g.turns;spawnFx(g.fx);setG(p=>p?{...p,fx:[]}:p);}
  },[g?.turns,g?.fx?.length]);

  useEffect(()=>{try{const r=localStorage.getItem("rl_scores3");if(r)setScores(JSON.parse(r));}catch{}},[]);
  const saveScoreFn=st=>{const e={floor:st.floor,level:st.level,turns:st.turns,victory:st.victory,date:new Date().toLocaleDateString("ja-JP")};
    const ns=[...scores,e].sort((a,b)=>b.floor===a.floor?a.turns-b.turns:b.floor-a.floor).slice(0,10);setScores(ns);
    try{localStorage.setItem("rl_scores3",JSON.stringify(ns));}catch{}};
  const saveScoreRef=useRef(saveScoreFn);saveScoreRef.current=saveScoreFn;
  const saveScore=useCallback((st)=>saveScoreRef.current(st),[]);
  const startGame=()=>{if(soundOn)initAudio();setG(initState());setScreen("game");setModal(null);setThrowMode(null);setSkillDir(null);if(soundOn)playFloorBgm(1);};

  // 1ターン消費して敵行動まで進める共通処理
  const endTurn=(s)=>{s={...s,turns:s.turns+1};s=applyPStatus(s,saveScore);if(s.gameOver)return s;s=applyFull(s,saveScore);if(s.gameOver)return s;return moveEnemies(s,saveScore);};

  const useItem=idx=>{setG(prev=>{if(!prev||prev.gameOver)return prev;let s={...prev,inventory:[...prev.inventory],fx:[]};const item=s.inventory[idx];if(!item)return prev;
    if(item.category==="consumable"){s.inventory.splice(idx,1);
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
    return endTurn(s);});};

  const dropItem=idx=>{setG(prev=>{if(!prev||prev.gameOver)return prev;
    let s={...prev,inventory:[...prev.inventory],items:[...prev.items],fx:[]};
    const item=s.inventory[idx];if(!item)return prev;
    s.inventory.splice(idx,1);
    s.items.push({...item,id:`drop_${Date.now()}_${Math.random()}`,x:s.px,y:s.py});
    s.msgs=addMsg(s,`${item.name}を足元に置いた`);
    return endTurn(s);});};

  const unequip=slot=>{setG(prev=>{if(!prev||prev.gameOver)return prev;
    let s={...prev,inventory:[...prev.inventory],fx:[]};
    if(slot==="weapon"&&s.weapon){
      if(s.inventory.length>=MAX_INV)return{...s,msgs:addMsg(s,"持ち物がいっぱいで外せない！")};
      s.inventory.push({...s.weapon,category:"equipment"});s.msgs=addMsg(s,`${s.weapon.name}を外した`);s.weapon=null;
    }else if(slot==="armor"&&s.armor){
      if(s.inventory.length>=MAX_INV)return{...s,msgs:addMsg(s,"持ち物がいっぱいで外せない！")};
      s.inventory.push({...s.armor,category:"equipment"});s.msgs=addMsg(s,`${s.armor.name}を外した`);s.armor=null;
    }
    return endTurn(s);});};

  const execThrow=(idx,di)=>{setG(prev=>{if(!prev||prev.gameOver)return prev;let s={...prev,inventory:[...prev.inventory],enemies:prev.enemies.map(e=>({...e}))};
    const item=s.inventory[idx];if(!item)return prev;s.inventory.splice(idx,1);
    const[ddx,ddy]=DIRS_8[di];let cx=s.px+ddx,cy=s.py+ddy,hitE=null;
    for(let i=0;i<10;i++){if(cx<0||cx>=MAP_W||cy<0||cy>=MAP_H||s.map[cy][cx]===WALL)break;hitE=s.enemies.find(e=>e.hp>0&&e.x===cx&&e.y===cy);if(hitE)break;cx+=ddx;cy+=ddy;}
    if(hitE){const target=s.enemies.find(e=>e.id===hitE.id),dmg=item.dmg||10;target.hp-=dmg;s.msgs=addMsg(s,`${item.name}→${target.name}！${dmg}dmg`);
      if(item.type==="throwPoison")target.statuses={...target.statuses,poison:(target.statuses.poison||0)+6};
      if(item.type==="throwSlow")target.statuses={...target.statuses,slow:(target.statuses.slow||0)+4};
      if(target.hp<=0){s.exp+=target.exp;s.msgs=addMsg(s,`${target.name}撃破！+${target.exp}EXP`);let ls=s;while(ls.exp>=ls.expNext){ls.exp-=ls.expNext;ls=levelUp(ls);}s=ls;}
      s.pendingSfx="throw";}else s.msgs=addMsg(s,`${item.name}は外れた`);return endTurn(s);});setThrowMode(null);setModal(null);};

  const execSkill=(sid,di)=>{setG(prev=>{if(!prev||prev.gameOver)return prev;const sk=SKILLS.find(s=>s.id===sid);if(!sk||prev.mp<sk.cost)return prev;
    let s={...prev,mp:prev.mp-sk.cost,enemies:prev.enemies.map(e=>({...e})),pendingSfx:"magic",fx:[]};
    if(sk.type==="selfHeal"){const h=Math.min(sk.value,s.maxHp-s.hp);s.hp+=h;s.msgs=addMsg(s,`${sk.icon}${sk.name}！HP+${h}`);
      s.fx=[...(s.fx||[]),{type:"heal",x:s.px,y:s.py,val:`+${h}`}];}
    else if(sk.type==="warp"){
      let wr,wx,wy,tries=0;
      do{wr=s.rooms[rand(0,s.rooms.length-1)];wx=rand(wr.x,wr.x+wr.w-1);wy=rand(wr.y,wr.y+wr.h-1);tries++;}
      while(tries<50&&(s.map[wy][wx]===WALL||s.enemies.some(e=>e.hp>0&&e.x===wx&&e.y===wy)||(s.merchant&&wx===s.merchant.x&&wy===s.merchant.y)));
      s.px=wx;s.py=wy;s.msgs=addMsg(s,`${sk.icon}転移！`);
      const wv=calcVis(s.px,s.py,s.map,s.rooms,s.statuses.blind?2:5);s.visible=wv;const we=new Set(s.explored);for(const v of wv)we.add(v);s.explored=we;}
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
    return endTurn(s);});setSkillDir(null);setModal(null);};

  const buyItem=si=>{setG(prev=>{if(!prev||prev.gameOver)return prev;if(prev.gold<si.price)return{...prev,msgs:addMsg(prev,`お金が足りない(${prev.gold}G)`)};
    if(prev.inventory.length>=MAX_INV)return{...prev,msgs:addMsg(prev,"持ち物がいっぱい！")};
    let s={...prev,gold:prev.gold-si.price,inventory:[...prev.inventory],pendingSfx:"shop"};
    for(let i=0;i<(si.qty||1)&&s.inventory.length<MAX_INV;i++)s.inventory.push({...si,id:`sh_${Date.now()}_${Math.random()}`});
    s.msgs=addMsg(s,`${si.name}購入！-${si.price}G`);return s;});};

  const processTurn=useCallback((dx,dy)=>{setG(prev=>{if(!prev||prev.gameOver)return prev;
    if(dx===0&&dy===0){
      let s={...prev,turns:prev.turns+1,pendingSfx:null,fx:[]};
      s=applyPStatus(s,saveScore);if(s.gameOver)return s;s=applyFull(s,saveScore);if(s.gameOver)return s;return moveEnemies(s,saveScore);}
    let s={...prev,pendingSfx:null,fx:[]};
    if(s.statuses.sleep){s={...s,turns:s.turns+1};s.msgs=addMsg(s,"💤 眠っている...");s=applyPStatus(s,saveScore);if(s.gameOver)return s;s=applyFull(s,saveScore);if(s.gameOver)return s;return moveEnemies(s,saveScore);}
    if(s.statuses.para&&Math.random()<0.4){s={...s,turns:s.turns+1};s.msgs=addMsg(s,"⚡ 痺れて動けない！");s=applyPStatus(s,saveScore);if(s.gameOver)return s;s=applyFull(s,saveScore);if(s.gameOver)return s;return moveEnemies(s,saveScore);}
    if(s.statuses.slow&&s.turns%2===0){s={...s,turns:s.turns+1};s=applyPStatus(s,saveScore);if(s.gameOver)return s;s=applyFull(s,saveScore);if(s.gameOver)return s;return moveEnemies(s,saveScore);}
    if(s.statuses.confuse&&Math.random()<0.5){const rd=DIRS_8[rand(0,7)];dx=rd[0];dy=rd[1];}
    if(dx!==0)s.facing=dx>0?1:-1;
    const nx=s.px+dx,ny=s.py+dy;
    const diagBlock=dx!==0&&dy!==0&&(s.map[s.py][s.px+dx]===WALL||s.map[s.py+dy][s.px]===WALL);
    if(nx<0||nx>=MAP_W||ny<0||ny>=MAP_H||s.map[ny][nx]===WALL||diagBlock) return dx!==0?{...prev,facing:dx>0?1:-1}:prev;
    s={...s,turns:s.turns+1};
    const enemy=s.enemies.find(e=>e.hp>0&&e.x===nx&&e.y===ny);
    if(enemy){s={...s,enemies:s.enemies.map(e=>({...e})),fx:[]};const target=s.enemies.find(e=>e.id===enemy.id);
      if(target.sleeping){target.sleeping=false;s.msgs=addMsg(s,`${target.name}が起きた！`);}
      const dmg=Math.max(1,getAtk(s)-target.def+rand(-1,3));target.hp-=dmg;s.msgs=addMsg(s,`${target.name}に${dmg}dmg！`);s.pendingSfx="atk";
      s.fx.push({type:"hit",x:nx,y:ny},{type:"dmg",x:nx,y:ny,val:`-${dmg}`,color:"#fff"});
      if(target.hp<=0){const gd=rand(3,8+s.floor*2);s.exp+=target.exp;s.gold+=gd;s.msgs=addMsg(s,`${target.name}撃破！+${target.exp}EXP +${gd}G`);s.pendingSfx="kill";
        s.fx.push({type:"kill",x:nx,y:ny,char:target.char,color:target.color});
        while(s.exp>=s.expNext){s.exp-=s.expNext;s=levelUp(s);}}
      s=applyPStatus(s,saveScore);if(s.gameOver)return s;s=applyFull(s,saveScore);if(s.gameOver)return s;return moveEnemies(s,saveScore);}
    s.px=nx;s.py=ny;s.lastMove={dx,dy,t:s.turns};
    if(s.merchant&&nx===s.merchant.x&&ny===s.merchant.y){s.px=prev.px;s.py=prev.py;s.lastMove=null;s.msgs=addMsg(s,"🏪 商人！");s.pendingSfx="shop";setTimeout(()=>setModal("shop"),50);return s;}
    const item=s.items.find(it=>it.x===nx&&it.y===ny);
    if(item){if(s.inventory.length<MAX_INV){s={...s,items:s.items.filter(it=>it.id!==item.id),inventory:[...s.inventory,{...item}]};s.msgs=addMsg(s,`${item.name}を拾った`);s.pendingSfx="item";}
      else s.msgs=addMsg(s,"持ち物がいっぱい！ 📦から捨てて空きを作ろう");}
    s=applyTrap(s,saveScore);if(s.gameOver)return s;s=checkEvents(s);
    if(s.px===s.stairs.x&&s.py===s.stairs.y)return nextFloor(s,saveScore);
    const vis=calcVis(s.px,s.py,s.map,s.rooms,s.statuses.blind?2:5);s.visible=vis;const ne=new Set(s.explored);for(const v of vis)ne.add(v);s.explored=ne;
    if(s.turns%5===0&&s.mp<s.maxMp)s.mp=Math.min(s.maxMp,s.mp+1);
    s=applyPStatus(s,saveScore);if(s.gameOver)return s;s=applyFull(s,saveScore);if(s.gameOver)return s;return moveEnemies(s,saveScore);});},[]);

  useEffect(()=>{if(g?.pendingSfx&&soundOn)sfx(g.pendingSfx);},[g?.pendingSfx,g?.turns,soundOn]);
  // BGM: switch on floor change, stop on game over
  useEffect(()=>{if(!soundOn){stopBgm();return;}
    if(screen==="title")return;
    if(g?.gameOver){stopBgm();return;}
    if(g?.floor)playFloorBgm(g.floor);
  },[g?.floor,g?.gameOver,soundOn,screen]);
  // BGM: play title BGM when on title (only works after audio initialized)
  useEffect(()=>{if(screen==="title"&&soundOn)playBgm("title");else if(screen==="title")stopBgm();},[screen,soundOn]);
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

  // Sprite icon for UI (inventory, shop, library, etc.) - fixed size
  const itemIcon=(item,size=20)=>{
    const ik=ITEM_SPRITES[item.char];
    const eq=item.name?EQUIP_SPRITES[item.name]:null;
    const pngPath=typeof ik==='string'&&ik.startsWith('/')?ik:typeof eq==='string'&&eq.startsWith('/')?eq:null;
    if(pngPath){
      return <div style={{display:'inline-block',width:size,height:size,verticalAlign:'middle',marginRight:6,backgroundImage:`url(${pngPath})`,backgroundSize:'contain',backgroundRepeat:'no-repeat',backgroundPosition:'center',imageRendering:'pixelated'}}/>;
    }
    const sprite=ik?TILE_SPRITES[ik]:Array.isArray(eq)?eq:null;
    if(sprite){
      const [sx,sy,sw,sh]=sprite;
      const sc=size/Math.max(sw,sh);
      return <div style={{display:'inline-block',width:size,height:size,verticalAlign:'middle',marginRight:6,backgroundImage:`url(${SHEET_URL})`,backgroundPosition:`-${sx*sc}px -${sy*sc}px`,backgroundSize:`${SHEET_W*sc}px ${SHEET_H*sc}px`,imageRendering:'pixelated'}}/>;
    }
    return <span style={{color:item.color,marginRight:6,fontSize:size*0.7}}>{item.char}</span>;
  };

  // ===== SPLASH =====
  if(screen==="splash"){
    return(
      <div onClick={()=>{if(soundOn){initAudio();playBgm("title");}setScreen("title");}}
        style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100dvh",background:"linear-gradient(170deg,#0f172a 0%,#1a2332 50%,#0f172a 100%)",color:"#e2e8f0",fontFamily:"'Hiragino Sans','Noto Sans JP',sans-serif",cursor:"pointer",userSelect:"none",WebkitUserSelect:"none",position:"relative",overflow:"hidden"}}>
        <style>{`@keyframes splash-blink{0%,100%{opacity:0.4}50%{opacity:1}}@keyframes splash-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}`}</style>
        <div style={{marginBottom:24,animation:"splash-float 3s ease-in-out infinite",filter:"drop-shadow(0 8px 16px rgba(0,0,0,0.6))"}}>
          <img src={PLAYER_SPRITE} alt="" style={{width:64,height:96,imageRendering:"pixelated"}}/>
        </div>
        <div style={{fontSize:14,color:"#94a3b8",letterSpacing:"0.15em",animation:"splash-blink 2s ease-in-out infinite"}}>- Tap to Start -</div>
        <div style={{position:"absolute",bottom:20,textAlign:"center",lineHeight:1.8}}>
          <div style={{fontSize:10,color:"#cbd5e1",letterSpacing:"0.05em"}}>&copy; 2026 KaleidoFuture</div>
          <div style={{fontSize:8,color:"#94a3b8"}}>Sprites: 0x72 DungeonTileset II (CC0) | Audio: Tone.js (MIT)</div>
        </div>
      </div>);
  }

  // ===== TITLE =====
  if(screen==="title"){
    return(
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100dvh",background:"linear-gradient(170deg,#0f172a 0%,#1a2332 50%,#0f172a 100%)",color:"#e2e8f0",fontFamily:"'Hiragino Sans','Noto Sans JP',sans-serif",padding:32,paddingTop:"max(32px, env(safe-area-inset-top))",textAlign:"center",boxSizing:"border-box",position:"relative",overflow:"hidden"}}>
        <style>{`
          @keyframes title-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
          @keyframes title-glow{0%,100%{text-shadow:0 0 12px rgba(251,191,36,0.3),0 2px 8px rgba(0,0,0,0.5)}50%{text-shadow:0 0 24px rgba(251,191,36,0.5),0 2px 8px rgba(0,0,0,0.5)}}
          @keyframes title-torch{0%,100%{opacity:0.6;transform:scaleY(1)}50%{opacity:1;transform:scaleY(1.1)}}
          @keyframes title-btn{0%,100%{box-shadow:0 6px 24px rgba(245,158,11,0.35)}50%{box-shadow:0 6px 32px rgba(245,158,11,0.55)}}
          @keyframes title-particle{0%{opacity:0;transform:translateY(0)}20%{opacity:0.6}100%{opacity:0;transform:translateY(-60px)}}
          @keyframes sparkle{0%{opacity:0;transform:scale(0) rotate(0deg)}25%{opacity:1;transform:scale(1) rotate(90deg)}50%{opacity:0.6;transform:scale(0.6) rotate(180deg)}75%{opacity:1;transform:scale(1) rotate(270deg)}100%{opacity:0;transform:scale(0) rotate(360deg)}}
          @keyframes sparkle-drift{0%{transform:translateY(0)}100%{transform:translateY(-20px)}}
          @keyframes shooting-star{0%{opacity:0;transform:translateX(0) translateY(0)}10%{opacity:1}70%{opacity:0.6}100%{opacity:0;transform:translateX(var(--ss-dx)) translateY(var(--ss-dy))}}
        `}</style>
        {/* Sparkle particles */}
        {[...Array(24)].map((_,i)=>{const colors=["#fbbf24","#f59e0b","#fcd34d","#fff7ed","#67e8f9","#a78bfa"];
          return <div key={`sp${i}`} style={{position:"absolute",zIndex:0,pointerEvents:"none",
            left:isMobile?`${5+((i*17+3)%90)}%`:`${20+((i*17+3)%60)}%`,top:`${10+((i*31+7)%80)}%`,
            width:i%3===0?6:4,height:i%3===0?6:4,
            animation:`sparkle ${2.5+i*0.4}s ease-in-out ${i*0.3}s infinite, sparkle-drift ${4+i*0.5}s ease-in-out ${i*0.2}s infinite alternate`,
          }}>
            <div style={{width:"100%",height:"100%",position:"relative"}}>
              <div style={{position:"absolute",top:"50%",left:0,right:0,height:1,background:colors[i%colors.length],borderRadius:1,transform:"translateY(-50%)"}}/>
              <div style={{position:"absolute",left:"50%",top:0,bottom:0,width:1,background:colors[i%colors.length],borderRadius:1,transform:"translateX(-50%)"}}/>
            </div>
          </div>;})}
        {/* Shooting stars */}
        {[...Array(8)].map((_,i)=>{const angles=[25,35,20,40,30,22,38,28];const dists=[90,130,110,100,120,85,140,95];
          const dx=Math.round(Math.cos(angles[i]*Math.PI/180)*dists[i]);
          const dy=Math.round(Math.sin(angles[i]*Math.PI/180)*dists[i]);
          const lefts=isMobile?[15,75,25,65,10,80,35,55]:[42,50,44,52,40,48,51,45];const tops=[8,25,50,15,65,40,5,55];
          const col=["#fbbf24","#67e8f9","#fcd34d","#a78bfa","#f59e0b","#fff7ed","#67e8f9","#fcd34d"][i];
          const sz=3+i%2;
          return <div key={`ss${i}`} style={{position:"absolute",zIndex:0,pointerEvents:"none",
          left:`${lefts[i]}%`,top:`${tops[i]}%`,
          width:sz,height:sz,borderRadius:"50%",
          background:col,boxShadow:`0 0 4px ${col}, 0 0 8px ${col}`,
          opacity:0,
          '--ss-dx':`${dx}px`,'--ss-dy':`${dy}px`,
          animation:`shooting-star ${1.2+i*0.15}s ease-in ${0.3+i*1.1}s infinite`,
        }}/>;})}
        {/* Floor tiles decoration */}
        <div style={{position:"absolute",bottom:0,left:0,right:0,height:80,display:"flex",justifyContent:"center",gap:0,opacity:0.9,zIndex:0,pointerEvents:"none"}}>
          {[...Array(12)].map((_,i)=><div key={i} style={{width:32,height:32,backgroundImage:`url(${SHEET_URL})`,backgroundPosition:`-${16*2}px -${64}px`,backgroundSize:`${SHEET_W*2}px ${SHEET_H*2}px`,imageRendering:"pixelated"}}/>)}
        </div>
        {/* Hero sprite */}
        <div style={{position:"relative",zIndex:1,marginBottom:12,animation:"title-float 3s ease-in-out infinite",filter:"drop-shadow(0 8px 16px rgba(0,0,0,0.6))"}}>
          <img src={PLAYER_SPRITE} alt="" style={{width:80,height:120,imageRendering:"pixelated"}}/>
        </div>
        <h1 style={{position:"relative",zIndex:1,fontSize:28,fontWeight:800,color:"#fbbf24",margin:"0 0 6px",letterSpacing:"0.05em",animation:"title-glow 3s ease-in-out infinite"}}>不思議のダンジョン</h1>
        <p style={{position:"relative",zIndex:1,fontSize:13,color:"#64748b",marginBottom:36,letterSpacing:"0.1em"}}>全{MAX_FLOOR}階を踏破せよ</p>
        <button onClick={startGame} style={{position:"relative",zIndex:1,padding:"16px 56px",fontSize:17,fontWeight:700,background:"linear-gradient(135deg,#f59e0b,#d97706)",color:"#0f172a",border:"2px solid rgba(251,191,36,0.3)",borderRadius:14,cursor:"pointer",letterSpacing:"0.05em",marginBottom:16,animation:"title-btn 2s ease-in-out infinite",imageRendering:"pixelated"}}>冒険に出る</button>
        <div style={{position:"relative",zIndex:1,display:"flex",gap:10}}>
          <button onClick={()=>setModal("scores")} style={{padding:"10px 28px",fontSize:12,fontWeight:600,background:"transparent",color:"#64748b",border:"1px solid #334155",borderRadius:10,cursor:"pointer"}}>ランキング</button>
          <button onClick={()=>{setLibTab("enemy");setModal("library");}} style={{padding:"10px 28px",fontSize:12,fontWeight:600,background:"transparent",color:"#64748b",border:"1px solid #334155",borderRadius:10,cursor:"pointer"}}>ライブラリ</button>
        </div>
        {modal==="scores"&&<Overlay onClose={()=>setModal(null)}>
          <h3 style={{color:"#fbbf24",margin:"0 0 16px",fontSize:16,fontWeight:700}}>ランキング</h3>
          {scores.length===0?<p style={{color:"#475569",fontSize:13}}>記録はまだありません</p>:
            scores.map((s,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,0.05)",fontSize:13,color:s.victory?"#fbbf24":"#94a3b8"}}>
              <span>#{i+1} {s.victory?"🏆":"💀"} B{s.floor}F Lv{s.level}</span><span style={{color:"#64748b"}}>{s.turns}T {s.date}</span></div>)}
          <button onClick={()=>setModal(null)} style={{marginTop:16,padding:"10px",fontSize:13,fontWeight:600,background:"rgba(255,255,255,0.06)",color:"#94a3b8",border:"none",borderRadius:10,cursor:"pointer",width:"100%"}}>閉じる</button>
        </Overlay>}
        {modal==="library"&&<Overlay onClose={()=>{if(previewBgm){stopBgm();setPreviewBgm(null);playBgm("title");}setModal(null);}}>
          <h3 style={{color:"#fbbf24",margin:"0 0 12px",fontSize:16,fontWeight:700}}>📖 ライブラリ</h3>
          <div style={{display:"flex",gap:4,marginBottom:12}}>
            {[["enemy","エネミー"],["item","アイテム"],["equip","装備"],["trap","トラップ"],["bgm","BGM"]].map(([k,l])=>(
              <button key={k} onClick={()=>{setLibTab(k);const el=document.getElementById('lib-scroll');if(el)el.scrollTop=0;}} style={{flex:1,padding:"8px 0",fontSize:11,fontWeight:600,border:"none",borderRadius:8,cursor:"pointer",
                background:libTab===k?"rgba(251,191,36,0.15)":"rgba(255,255,255,0.04)",color:libTab===k?"#fbbf24":"#64748b"}}>{l}</button>
            ))}
          </div>
          <div id="lib-scroll" style={{maxHeight:"55vh",overflowY:"auto"}}>
            {libTab==="enemy"&&ENEMY_POOLS.map((pool,pi)=>(
              <div key={pi}>
                <div style={{fontSize:10,color:THEMES[pi]?.accent||"#94a3b8",fontWeight:700,padding:"8px 0 4px",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>{THEMES[pi]?.name||`エリア${pi+1}`}（B{pi*2+1}-{pi*2+2}F）</div>
                {pool.map((e,i)=>{const src=ENEMY_SPRITES[e.char];return(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,0.03)"}}>
                    <div style={{width:32,height:32,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.3)",borderRadius:6}}>
                      {src?<img src={src} alt="" style={{width:28,height:34,imageRendering:"pixelated",objectFit:"contain"}}/>:
                        <span style={{fontSize:18,color:e.color}}>{e.char}</span>}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:600,color:e.color}}>{e.name}</div>
                      <div style={{fontSize:10,color:"#64748b"}}>HP{e.hp} 攻{e.atk} 守{e.def} EXP{e.exp}</div>
                    </div>
                  </div>);})}
              </div>
            ))}
            {libTab==="item"&&<>
              <div style={{fontSize:10,color:"#4ade80",fontWeight:700,padding:"4px 0",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>消費アイテム</div>
              {CONSUMABLES.map((it,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,0.03)"}}>
                  <div style={{width:24,height:24,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    {itemIcon(it,20)}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:600,color:it.color}}>{it.name}</div>
                    <div style={{fontSize:10,color:"#64748b"}}>{it.desc}{it.mf?` (${it.mf}F~)`:""}</div>
                  </div>
                </div>))}
              <div style={{fontSize:10,color:"#f87171",fontWeight:700,padding:"8px 0 4px",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>投擲アイテム</div>
              {THROW_ITEMS.map((it,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,0.03)"}}>
                  <div style={{width:24,height:24,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    {itemIcon(it,20)}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:600,color:it.color}}>{it.name}</div>
                    <div style={{fontSize:10,color:"#64748b"}}>{it.desc}{it.mf?` (${it.mf}F~)`:""}</div>
                  </div>
                </div>))}
            </>}
            {libTab==="equip"&&<>
              <div style={{fontSize:10,color:"#f59e0b",fontWeight:700,padding:"4px 0",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>武器</div>
              {WEAPONS.map((it,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,0.03)"}}>
                  <div style={{width:32,height:32,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(255,255,255,0.04)",borderRadius:4}}>
                    {itemIcon(it,28)}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:600,color:it.color}}>{it.name}</div>
                    <div style={{fontSize:10,color:"#64748b"}}>攻撃+{it.atk}{it.mf?` (${it.mf}F~)`:""}</div>
                  </div>
                </div>))}
              <div style={{fontSize:10,color:"#60a5fa",fontWeight:700,padding:"8px 0 4px",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>防具</div>
              {ARMORS.map((it,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,0.03)"}}>
                  <div style={{width:32,height:32,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(255,255,255,0.04)",borderRadius:4}}>
                    {itemIcon(it,28)}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:600,color:it.color}}>{it.name}</div>
                    <div style={{fontSize:10,color:"#64748b"}}>防御+{it.def}{it.mf?` (${it.mf}F~)`:""}</div>
                  </div>
                </div>))}
            </>}
            {libTab==="trap"&&<>
              {TRAP_TYPES.map((tr,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,0.03)"}}>
                  <div style={{width:24,height:24,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>
                    {tr.icon}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:600,color:tr.color}}>{tr.name}</div>
                    <div style={{fontSize:10,color:"#64748b"}}>{tr.desc}</div>
                  </div>
                </div>))}
            </>}
            {libTab==="bgm"&&<>
              {[{key:"title",name:"冒険の始まり",desc:"タイトル画面",color:"#fbbf24",icon:"🏰"},
                {key:"cave",name:"暗闇の洞窟",desc:"B1-2F 洞窟",color:"#94a3b8",icon:"🕯"},
                {key:"forest",name:"緑の回廊",desc:"B3-4F 森林",color:"#4ade80",icon:"🌿"},
                {key:"ice",name:"凍てつく深淵",desc:"B5-6F 氷穴",color:"#67e8f9",icon:"❄"},
                {key:"lava",name:"灼熱の炉",desc:"B7-8F 溶岩",color:"#fb923c",icon:"🔥"},
                {key:"dark",name:"終焉の闇",desc:"B9-10F 闇域",color:"#a78bfa",icon:"🌑"},
              ].map((bgm,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,0.03)"}}>
                  <div style={{width:32,height:32,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,background:"rgba(0,0,0,0.3)",borderRadius:6}}>
                    {bgm.icon}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:600,color:bgm.color}}>{bgm.name}</div>
                    <div style={{fontSize:10,color:"#64748b"}}>{bgm.desc}</div>
                  </div>
                  <button onClick={()=>{initAudio();if(previewBgm===bgm.key){stopBgm();setPreviewBgm(null);}else{playBgm(bgm.key);setPreviewBgm(bgm.key);}}}
                    style={{padding:"6px 12px",fontSize:10,fontWeight:600,border:"none",borderRadius:8,cursor:"pointer",
                    background:previewBgm===bgm.key?"#dc2626":"rgba(255,255,255,0.08)",color:previewBgm===bgm.key?"#fff":"#94a3b8"}}>
                    {previewBgm===bgm.key?"■ 停止":"▶ 再生"}</button>
                </div>))}
            </>}
          </div>
          <button onClick={()=>{if(previewBgm){stopBgm();setPreviewBgm(null);playBgm("title");}setModal(null);}} style={{marginTop:14,padding:"10px",fontSize:13,fontWeight:600,background:"rgba(255,255,255,0.06)",color:"#94a3b8",border:"none",borderRadius:10,cursor:"pointer",width:"100%"}}>閉じる</button>
        </Overlay>}
      </div>);
  }

  if(!g)return null;

  // ===== GAME OVER =====
  if(g.gameOver){
    const victoryBg=g.victory?"linear-gradient(170deg,#1a1a2e 0%,#16213e 50%,#1a1a2e 100%)":"linear-gradient(170deg,#1a0a0a 0%,#2d1b1b 50%,#1a0a0a 100%)";
    return(
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100dvh",background:victoryBg,color:"#e2e8f0",fontFamily:"'Hiragino Sans','Noto Sans JP',sans-serif",padding:32,paddingTop:"max(32px, env(safe-area-inset-top))",textAlign:"center",boxSizing:"border-box",position:"relative",overflow:"hidden"}}>
        <style>{`
          @keyframes go-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
          @keyframes go-glow{0%,100%{filter:drop-shadow(0 4px 12px rgba(251,191,36,0.3))}50%{filter:drop-shadow(0 4px 24px rgba(251,191,36,0.6))}}
          @keyframes go-fade{0%{opacity:0;transform:translateY(10px)}100%{opacity:1;transform:translateY(0)}}
        `}</style>
        {/* Sprite character */}
        <div style={{marginBottom:16,animation:g.victory?"go-float 3s ease-in-out infinite, go-glow 3s ease-in-out infinite":"go-float 4s ease-in-out infinite",filter:g.victory?undefined:"grayscale(0.5) brightness(0.7)"}}>
          <img src={PLAYER_SPRITE} alt="" style={{width:64,height:96,imageRendering:"pixelated"}}/>
        </div>
        <h2 style={{fontSize:22,fontWeight:800,color:g.victory?"#fbbf24":"#f87171",marginBottom:20,animation:"go-fade 0.6s ease-out"}}>{g.victory?"ダンジョン制覇！":"冒険は終わった..."}</h2>
        <div style={{background:"rgba(255,255,255,0.04)",borderRadius:16,padding:"20px 32px",marginBottom:28,fontSize:14,lineHeight:2.2,border:"1px solid rgba(255,255,255,0.06)",animation:"go-fade 0.8s ease-out",backdropFilter:"blur(4px)"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"4px 20px",textAlign:"left"}}>
            <span style={{color:"#64748b"}}>到達階</span><span style={{fontWeight:600}}>B{g.floor}F</span>
            <span style={{color:"#64748b"}}>レベル</span><span style={{fontWeight:600}}>Lv{g.level}</span>
            <span style={{color:"#64748b"}}>ターン</span><span style={{fontWeight:600}}>{g.turns}</span>
            <span style={{color:"#64748b"}}>攻撃/防御</span><span style={{fontWeight:600}}>{getAtk(g)} / {getDef(g)}</span>
            <span style={{color:"#64748b"}}>所持金</span><span style={{fontWeight:600,color:"#fbbf24"}}>{g.gold}G</span>
          </div>
        </div>
        <button onClick={startGame} style={{padding:"14px 48px",fontSize:16,fontWeight:700,background:g.victory?"linear-gradient(135deg,#f59e0b,#d97706)":"linear-gradient(135deg,#6366f1,#4f46e5)",color:g.victory?"#0f172a":"#fff",border:"none",borderRadius:14,cursor:"pointer",boxShadow:g.victory?"0 6px 24px rgba(245,158,11,0.3)":"0 6px 24px rgba(99,102,241,0.3)",marginBottom:12,animation:"go-fade 1s ease-out"}}>もう一度挑戦</button>
        <button onClick={()=>{setScreen("title");setG(null);}} style={{padding:"10px 28px",fontSize:12,fontWeight:600,background:"transparent",color:"#64748b",border:"1px solid #334155",borderRadius:10,cursor:"pointer",animation:"go-fade 1.2s ease-out"}}>タイトルへ</button>
      </div>);
  }

  // ===== GAME SCREEN =====
  const theme=getTheme(g.floor);
  const nearE=g.enemies.filter(e=>e.hp>0&&g.visible.has(toKey(e.x,e.y)));
  const recentM=g.msgs.slice(-3);
  const statusIcons=Object.keys(g.statuses).map(k=>STATUS_INFO[k]?.icon||"").join(" ");
  const avSkills=SKILLS.filter(sk=>!sk.mf||g.floor>=sk.mf);

  const screenW=typeof window!=="undefined"?Math.min(window.innerWidth,480):380;
  const ts=Math.floor((screenW-8)/VP);
  const mapPx=ts*VP;

  const themeIdx=Math.min(Math.floor((g.floor-1)/2), THEME_FILTERS.length-1);
  const tileFilter=THEME_FILTERS[themeIdx];
  const tileFilterInv=THEME_FILTERS_INV[themeIdx];
  const scale=ts/16;

  const tileSpriteBg=(sprite)=>{
    const [sx,sy,sw,sh]=sprite;
    return {
      backgroundImage:`url(${SHEET_URL})`,
      backgroundPosition:`-${sx*scale}px -${sy*scale}px`,
      backgroundSize:`${SHEET_W*scale}px ${SHEET_H*scale}px`,
      imageRendering:'pixelated',
    };
  };



  const renderMap=()=>{const tiles=[];
    for(let vy=0;vy<VP;vy++)for(let vx=0;vx<VP;vx++){
      const mx=g.px-VP_HALF+vx,my=g.py-VP_HALF+vy,key=toKey(mx,my),inB=mx>=0&&mx<MAP_W&&my>=0&&my<MAP_H;
      const isV=inB&&g.visible.has(key),isE=inB&&g.explored.has(key);
      let op=1;
      let entitySprite=null; // {src, isTall}
      let itemSprite=null; // tileset sprite key
      let isWall=false;

      if(inB&&(isV||isE)){
        isWall=g.map[my][mx]===WALL;
        if(!isV)op=0.25;
        if(isV){
          if(mx===g.px&&my===g.py){entitySprite={src:PLAYER_SPRITE,isTall:true,facing:g.facing||1,isPlayer:true};}
          else if(g.merchant&&mx===g.merchant.x&&my===g.merchant.y){entitySprite={src:MERCHANT_SPRITE,isTall:true};}
          else{
            const en=g.enemies.find(e=>e.hp>0&&e.x===mx&&e.y===my);
            if(en){const src=ENEMY_SPRITES[en.char];if(src)entitySprite={src,isTall:true,facing:en.facing||1};else entitySprite={char:en.char,color:en.color,facing:en.facing||1};}
            else if(mx===g.stairs.x&&my===g.stairs.y){itemSprite='stairs';}
            else{
              const tr=g.traps.find(t=>t.x===mx&&t.y===my&&t.visible);
              if(tr){itemSprite={trap:true,color:tr.color,icon:tr.icon};}
              else{const it=g.items.find(i2=>i2.x===mx&&i2.y===my);
                if(it){const ik=ITEM_SPRITES[it.char];const eq=it.name?EQUIP_SPRITES[it.name]:null;
                  const resolved=ik||eq;
                  if(typeof resolved==='string'&&resolved.startsWith('/'))itemSprite={png:resolved};
                  else if(typeof resolved==='string')itemSprite=resolved;
                  else if(Array.isArray(resolved))itemSprite={direct:resolved};
                  else entitySprite={char:it.char,color:it.color};}}}}
        } else if(mx===g.stairs.x&&my===g.stairs.y&&isE){itemSprite='stairs';}
      }

      // Floor/wall background
      const floorIdx=getFloorTileIdx(mx,my);
      const baseTile=(!inB||!(isV||isE))?null:isWall?TILE_SPRITES.wall_mid:TILE_SPRITES.floor[floorIdx];

      // Floor edge detection
      const isFloor=baseTile&&!isWall;
      const wallAt=(wx,wy)=>wx<0||wx>=MAP_W||wy<0||wy>=MAP_H||g.map[wy][wx]===WALL;

      tiles.push(
        <div key={`${vx}-${vy}`} style={{
          width:ts,height:ts,position:'relative',overflow:'visible',opacity:op,boxSizing:'border-box',
          backgroundColor:baseTile?'transparent':'#000',
          ...(baseTile?{...tileSpriteBg(baseTile),filter:tileFilter}:{}),
        }}>
          {baseTile&&isWall&&<div style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',background:'rgba(0,0,0,0.35)',zIndex:1}}/>}
          {isFloor&&<div style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',zIndex:1,pointerEvents:'none',filter:tileFilterInv,
            borderTop:wallAt(mx,my-1)?'2px solid rgba(200,220,255,0.4)':'none',
            borderBottom:wallAt(mx,my+1)?'2px solid rgba(200,220,255,0.4)':'none',
            borderLeft:wallAt(mx-1,my)?'2px solid rgba(200,220,255,0.4)':'none',
            borderRight:wallAt(mx+1,my)?'2px solid rgba(200,220,255,0.4)':'none',
            boxSizing:'border-box'}}/>}
          {/* Item sprite (tileset or individual PNG) */}
          {itemSprite?.png&&(
            <div style={{position:'absolute',top:0,left:0,width:ts,height:ts,zIndex:2,backgroundImage:`url(${itemSprite.png})`,backgroundSize:'contain',backgroundRepeat:'no-repeat',backgroundPosition:'center',imageRendering:'pixelated',filter:tileFilterInv}}/>
          )}
          {itemSprite&&!itemSprite.png&&(itemSprite.direct||TILE_SPRITES[itemSprite])&&(
            <div style={{position:'absolute',top:0,left:0,width:ts,height:ts,zIndex:2,...tileSpriteBg(itemSprite.direct||TILE_SPRITES[itemSprite])}}/>
          )}
          {itemSprite?.trap&&(
            <div style={{position:'absolute',top:0,left:0,width:ts,height:ts,zIndex:2,display:'flex',alignItems:'center',justifyContent:'center',filter:tileFilterInv}}>
              <div style={{width:ts*0.5,height:ts*0.5,background:itemSprite.color,transform:'rotate(45deg)',border:'2px solid #000',boxShadow:`0 0 8px ${itemSprite.color}, 0 0 16px ${itemSprite.color}88`}}/>
              <span style={{position:'absolute',fontSize:ts*0.4,lineHeight:1,filter:'drop-shadow(0 1px 2px rgba(0,0,0,0.9))'}}>{itemSprite.icon}</span>
            </div>
          )}
          {itemSprite==='stairs'&&(
            <div style={{position:'absolute',top:0,left:0,width:ts,height:ts,zIndex:3,filter:tileFilterInv,pointerEvents:'none'}}>
              <div style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',borderRadius:'50%',background:'radial-gradient(circle,rgba(251,191,36,0.5) 0%,transparent 70%)',animation:'stairs-pulse 2s ease-in-out infinite'}}/>
              <div style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <span style={{fontSize:ts*0.4,color:'#fbbf24',textShadow:'0 1px 3px rgba(0,0,0,0.8)',animation:'stairs-arrow 1.5s ease-in-out infinite'}}>▼</span>
              </div>
            </div>
          )}
          {/* Entity sprite (individual PNG) */}
          {entitySprite?.src&&(
            <img key={entitySprite.isPlayer&&g.lastMove?`p${g.lastMove.t}`:undefined}
              src={entitySprite.src} alt="" style={{
              position:'absolute',bottom:0,left:'50%',
              transform:`translateX(-50%) scaleX(${entitySprite.facing===-1?-1:1})`,
              width:ts,height:entitySprite.isTall?ts*1.5:ts,
              imageRendering:'pixelated',zIndex:3,pointerEvents:'none',
              filter:tileFilterInv,
              ...(entitySprite.isPlayer&&g.lastMove?{'--sx':`${-g.lastMove.dx*ts*0.28}px`,'--sy':`${-g.lastMove.dy*ts*0.28}px`,animation:'entity-slide 0.16s cubic-bezier(0.25,0.1,0.25,1)'}:{}),
            }}/>
          )}
          {/* Fallback text for unmapped entities */}
          {entitySprite&&!entitySprite.src&&(
            <div style={{position:'absolute',top:0,left:0,width:ts,height:ts,display:'flex',alignItems:'center',justifyContent:'center',
              fontSize:ts*0.46,color:entitySprite.color,fontWeight:'bold',zIndex:3}}>{entitySprite.char}</div>
          )}
        </div>
      );
    }return tiles;};

  const canAct=(dx,dy)=>{
    if(dx===0&&dy===0) return true;
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
      style={{display:"flex",flexDirection:"column",height:"100dvh",paddingTop:"env(safe-area-inset-top)",background:`linear-gradient(180deg,${theme.bg[0]},${theme.bg[1]})`,color:"#e2e8f0",fontFamily:"'Hiragino Sans','Noto Sans JP',monospace",overflow:"hidden",userSelect:"none",WebkitUserSelect:"none",boxSizing:"border-box"}}>

      {/* ── HEADER ── */}
      <div style={{flexShrink:0,width:"100%",padding:"6px 12px 4px",boxSizing:"border-box",background:"rgba(0,0,0,0.25)",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <img src={PLAYER_SPRITE} alt="" style={{width:16,height:24,imageRendering:"pixelated"}}/>
            <span style={{fontSize:12,fontWeight:700,color:theme.accent}}>B{g.floor}F {theme.name}</span>
          </div>
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

      {/* ── MAP AREA ── */}
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden",minHeight:0}}>
        <style>{`
          @keyframes fx-shake{0%,100%{transform:translate(0,0)}15%{transform:translate(-3px,-2px)}30%{transform:translate(3px,2px)}45%{transform:translate(-2px,1px)}60%{transform:translate(2px,-1px)}75%{transform:translate(-1px,2px)}}
          @keyframes fx-flash{0%{opacity:0.9;transform:scale(1.1)}100%{opacity:0;transform:scale(0.5)}}
          @keyframes fx-dmg{0%{opacity:1;transform:translateY(0) scale(1)}50%{opacity:1;transform:translateY(-18px) scale(1.1)}100%{opacity:0;transform:translateY(-30px) scale(0.7)}}
          @keyframes fx-kill{0%{opacity:1;transform:scale(1)}40%{opacity:0.8;transform:scale(1.4)}100%{opacity:0;transform:scale(0.1) rotate(180deg)}}
          @keyframes fx-particle{0%{opacity:1;transform:translate(0,0) scale(1)}100%{opacity:0;transform:translate(var(--px),var(--py)) scale(0)}}
          @keyframes fx-playerHit{0%{background:rgba(255,60,60,0.5)}100%{background:transparent}}
          @keyframes fx-skill{0%{opacity:0.8;transform:scale(0.5)}30%{opacity:0.6;transform:scale(1.05)}100%{opacity:0;transform:scale(1.2)}}
          @keyframes fx-heal{0%{opacity:0.7;box-shadow:0 0 8px #4ade80}100%{opacity:0;box-shadow:0 0 20px transparent}}
          @keyframes stairs-pulse{0%,100%{opacity:0.25;transform:scale(0.9)}50%{opacity:0.6;transform:scale(1.05)}}
          @keyframes stairs-arrow{0%,100%{transform:translateY(0);opacity:0.9}50%{transform:translateY(3px);opacity:0.5}}
          @keyframes entity-slide{from{translate:var(--sx) var(--sy)}to{translate:0 0}}
        `}</style>
        <div style={{position:"relative",borderRadius:10,overflow:"hidden",boxShadow:"0 4px 20px rgba(0,0,0,0.4)"}}>
          <div style={{display:"grid",gridTemplateColumns:`repeat(${VP},${ts}px)`}}>{renderMap()}</div>
          {/* Effect overlay */}
          <div style={{position:"absolute",top:0,left:0,width:ts*VP,height:ts*VP,pointerEvents:"none",overflow:"hidden"}}>
            {effects.filter(f=>f.type!=="move").map(f=>{
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
                const killSrc=ENEMY_SPRITES[f.char];
                return <div key={f.id}>
                  <div style={{position:"absolute",left:vx,top:vy,width:ts,height:ts,display:"flex",alignItems:"center",justifyContent:"center",
                    animation:"fx-kill 500ms ease-out forwards",zIndex:5}}>
                    {killSrc?<img src={killSrc} alt="" style={{width:ts,height:ts*1.2,imageRendering:'pixelated',objectFit:'contain'}}/>:
                      <span style={{fontSize:ts*0.5,color:f.color}}>{f.char}</span>}
                  </div>
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

        {/* Enemy HP overlay */}
        {nearE.length>0&&<div style={{position:"absolute",top:8,left:8,maxWidth:"60%",pointerEvents:"none"}}>
          {nearE.slice(0,3).map(e=>(
            <div key={e.id} style={{display:"flex",alignItems:"center",gap:4,marginBottom:3,background:"rgba(0,0,0,0.75)",borderRadius:6,padding:"3px 8px"}}>
              <span style={{fontSize:9,color:e.color,fontWeight:600,whiteSpace:"nowrap"}}>{e.char}{e.name}</span>
              <div style={{flex:1,minWidth:40}}><Bar value={e.hp} max={e.maxHp} h={4} color={e.hp/e.maxHp>0.5?"#22c55e":e.hp/e.maxHp>0.25?"#eab308":"#ef4444"}/></div>
              <span style={{fontSize:7,color:"#94a3b8"}}>{e.hp}</span>
              {Object.keys(e.statuses).length>0&&<span style={{fontSize:7}}>{Object.keys(e.statuses).map(k=>STATUS_INFO[k]?.icon||"").join("")}</span>}
            </div>))}
        </div>}

        {/* Messages overlay */}
        <div style={{position:"absolute",bottom:4,left:4,right:4,pointerEvents:"none",background:"rgba(0,0,0,0.7)",borderRadius:6,padding:"4px 8px",border:"1px solid rgba(255,255,255,0.06)"}}>
          {recentM.map((m,i)=><div key={i} style={{fontSize:10,color:i===recentM.length-1?"#e2e8f0":"#64748b",lineHeight:1.5,
            fontFamily:"'Hiragino Sans','Noto Sans JP',monospace"}}>{m}</div>)}
        </div>
      </div>

      {/* ── CONTROLS ── */}
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
            <div style={{display:"flex",flexDirection:"column",gap:BG}}>
              <SideBtn id={btnLayout[0]}/><SideBtn id={btnLayout[1]}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:`repeat(3,${BS}px)`,gap:BG}}>
              <DBtn label="↖" dx={-1} dy={-1} sz={BS}/><DBtn label="↑" dx={0} dy={-1} sz={BS}/><DBtn label="↗" dx={1} dy={-1} sz={BS}/>
              <DBtn label="←" dx={-1} dy={0} sz={BS}/>
              <button onClick={()=>processTurn(0,0)} style={{width:BS,height:BS,fontSize:9,fontWeight:700,border:"none",borderRadius:12,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(255,255,255,0.08)",color:"#94a3b8",WebkitTapHighlightColor:"transparent"}}>待機</button>
              <DBtn label="→" dx={1} dy={0} sz={BS}/>
              <DBtn label="↙" dx={-1} dy={1} sz={BS}/><DBtn label="↓" dx={0} dy={1} sz={BS}/><DBtn label="↘" dx={1} dy={1} sz={BS}/>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:BG}}>
              <SideBtn id={btnLayout[2]}/><SideBtn id={btnLayout[3]}/>
            </div>
          </div>
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
        {(()=>{const footItems=g.items.filter(it=>it.x===g.px&&it.y===g.py);
          return footItems.length>0&&(
            <div style={{marginBottom:12,background:"rgba(251,191,36,0.06)",borderRadius:10,padding:"8px 10px",border:"1px solid rgba(251,191,36,0.12)"}}>
              <div style={{fontSize:10,color:"#fbbf24",fontWeight:600,marginBottom:6}}>足元のアイテム</div>
              {footItems.map((fi,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0"}}>
                  <span style={{fontSize:12}}>{itemIcon(fi,16)}{fi.name}</span>
                  {g.inventory.length<MAX_INV&&<button onClick={()=>{setG(prev=>{
                    if(!prev||prev.gameOver)return prev;
                    let s={...prev,items:prev.items.filter(it=>it.id!==fi.id),inventory:[...prev.inventory,{...fi}],fx:[]};
                    s.msgs=addMsg(s,`${fi.name}を拾った`);s.pendingSfx="item";return endTurn(s);});setModal(null);}}
                    style={{padding:"4px 10px",fontSize:10,fontWeight:600,border:"none",borderRadius:6,cursor:"pointer",background:"#16a34a",color:"#fff"}}>拾う</button>}
                </div>))}
            </div>);})()}
        {g.inventory.length===0?<p style={{color:"#475569",fontSize:13,textAlign:"center",padding:16}}>何も持っていない</p>:
          g.inventory.map((item,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
              <div style={{flex:1,minWidth:0}}>
                {itemIcon(item,20)}
                <span style={{fontSize:13,fontWeight:500}}>{item.name}</span>
                <div style={{fontSize:10,color:"#64748b",marginTop:1}}>{item.category==="consumable"?item.desc:item.category==="throw"?item.desc:item.slot==="weapon"?`攻撃+${item.atk}`:`防御+${item.def}`}</div>
              </div>
              <div style={{display:"flex",gap:4,flexShrink:0}}>
                {item.category==="throw"&&<button onClick={()=>{setThrowMode({itemIdx:i});setModal(null);}} style={{padding:"6px 10px",fontSize:10,fontWeight:600,border:"none",borderRadius:8,cursor:"pointer",background:"#dc2626",color:"#fff"}}>投</button>}
                <button onClick={()=>{useItem(i);setModal(null);}} style={{padding:"6px 10px",fontSize:10,fontWeight:600,border:"none",borderRadius:8,cursor:"pointer",
                  background:item.category==="equipment"?"#4f46e5":"#16a34a",color:"#fff"}}>{item.category==="equipment"?"装備":"使う"}</button>
                <button onClick={()=>{dropItem(i);setModal(null);}} style={{padding:"6px 10px",fontSize:10,fontWeight:600,border:"none",borderRadius:8,cursor:"pointer",background:"rgba(255,255,255,0.06)",color:"#94a3b8"}}>捨</button>
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
            <div>{itemIcon(si,18)}<span style={{fontSize:13}}>{si.name}</span>
              <div style={{fontSize:10,color:"#64748b",marginTop:1}}>{si.desc}</div></div>
            <button onClick={()=>buyItem(si)} disabled={g.gold<si.price} style={{padding:"6px 14px",fontSize:11,fontWeight:600,border:"none",borderRadius:8,cursor:"pointer",
              background:g.gold>=si.price?"#d97706":"#1e293b",color:g.gold>=si.price?"#0f172a":"#475569"}}>{si.price}G</button>
          </div>))}
        <button onClick={()=>setModal(null)} style={{marginTop:14,padding:"10px",fontSize:13,fontWeight:600,background:"rgba(255,255,255,0.06)",color:"#94a3b8",border:"none",borderRadius:10,cursor:"pointer",width:"100%"}}>閉じる</button>
      </Overlay>}

      {/* ── MINIMAP (Canvas) ── */}
      {modal==="map"&&<Overlay onClose={()=>setModal(null)}>
        <h3 style={{color:"#60a5fa",margin:"0 0 12px",fontSize:16,fontWeight:700,textAlign:"center"}}>🗺 B{g.floor}F {theme.name}</h3>
        <canvas ref={el=>{if(!el)return;const S=7,ctx=el.getContext("2d");el.width=MAP_W*S;el.height=MAP_H*S;
          for(let my=0;my<MAP_H;my++)for(let mx=0;mx<MAP_W;mx++){
            const k=toKey(mx,my),isE=g.explored.has(k);let c="#08080c";
            if(isE){c=g.map[my][mx]===WALL?theme.wall:theme.floor;
              if(mx===g.px&&my===g.py)c="#38bdf8";
              else if(mx===g.stairs.x&&my===g.stairs.y)c="#a78bfa";
              else if(g.merchant&&mx===g.merchant.x&&my===g.merchant.y)c="#fbbf24";
              else{const he=g.enemies.find(e=>e.hp>0&&e.x===mx&&e.y===my&&g.visible.has(k));if(he)c="#ef4444";}}
            ctx.fillStyle=c;ctx.fillRect(mx*S,my*S,S,S);}
        }} style={{borderRadius:8,display:"block",margin:"0 auto"}}/>
        <div style={{display:"flex",gap:12,marginTop:10,fontSize:10,color:"#64748b",justifyContent:"center"}}>
          <span><span style={{color:"#38bdf8"}}>■</span> 自分</span><span><span style={{color:"#a78bfa"}}>■</span> 階段</span>
          <span><span style={{color:"#ef4444"}}>■</span> 敵</span><span><span style={{color:"#fbbf24"}}>■</span> 商人</span></div>
        <button onClick={()=>setModal(null)} style={{marginTop:14,padding:"10px",fontSize:13,fontWeight:600,background:"rgba(255,255,255,0.06)",color:"#94a3b8",border:"none",borderRadius:10,cursor:"pointer",width:"100%"}}>閉じる</button>
      </Overlay>}
    </div>);
}
