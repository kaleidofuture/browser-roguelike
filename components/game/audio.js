import * as Tone from "tone";

let audioOk=false;const sy={};
export function initAudio(){if(audioOk)return;audioOk=true;Tone.start();
  sy.a=new Tone.Synth({oscillator:{type:"square"},envelope:{attack:0.01,decay:0.1,sustain:0,release:0.05},volume:-18}).toDestination();
  sy.h=new Tone.Synth({oscillator:{type:"sawtooth"},envelope:{attack:0.01,decay:0.15,sustain:0,release:0.05},volume:-16}).toDestination();
  sy.i=new Tone.Synth({oscillator:{type:"triangle"},envelope:{attack:0.01,decay:0.2,sustain:0.1,release:0.1},volume:-14}).toDestination();
  sy.l=new Tone.PolySynth(Tone.Synth,{oscillator:{type:"triangle"},envelope:{attack:0.05,decay:0.3,sustain:0.1,release:0.2},volume:-14}).toDestination();
  sy.s=new Tone.Synth({oscillator:{type:"sine"},envelope:{attack:0.05,decay:0.4,sustain:0.1,release:0.3},volume:-14}).toDestination();
  sy.t=new Tone.NoiseSynth({noise:{type:"pink"},envelope:{attack:0.01,decay:0.2,sustain:0,release:0.1},volume:-16}).toDestination();
  sy.d=new Tone.Synth({oscillator:{type:"sawtooth"},envelope:{attack:0.1,decay:0.8,sustain:0,release:0.5},volume:-12}).toDestination();
  sy.e=new Tone.MetalSynth({frequency:300,envelope:{attack:0.01,decay:0.15,sustain:0,release:0.1},volume:-20}).toDestination();
  sy.m=new Tone.Synth({oscillator:{type:"sine"},envelope:{attack:0.02,decay:0.3,sustain:0.05,release:0.2},volume:-14}).toDestination();
  initBgm();
}
export function sfx(t){if(!audioOk)return;try{const n=Tone.now();
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

// ===== BGM System =====
let bgmSynths=null;
let bgmParts=[];
let currentBgm=null;

function initBgm(){
  if(bgmSynths)return;
  bgmSynths={
    // Melody: square wave, classic chiptune lead
    mel:new Tone.Synth({oscillator:{type:"square"},envelope:{attack:0.02,decay:0.15,sustain:0.3,release:0.1},volume:-20}).toDestination(),
    // Harmony/arp: triangle wave, soft accompaniment
    har:new Tone.Synth({oscillator:{type:"triangle"},envelope:{attack:0.01,decay:0.2,sustain:0.2,release:0.1},volume:-24}).toDestination(),
    // Bass: square wave, low octave
    bas:new Tone.Synth({oscillator:{type:"square"},envelope:{attack:0.01,decay:0.1,sustain:0.4,release:0.05},volume:-22}).toDestination(),
    // Percussion: noise hit
    perc:new Tone.NoiseSynth({noise:{type:"white"},envelope:{attack:0.001,decay:0.06,sustain:0,release:0.03},volume:-28}).toDestination(),
  };
}

// Note: "0" = rest (no note played)
const BGM_DATA={
  // Title: Bright, adventurous, C major, 120bpm
  title:{bpm:120,mel:[
    ["0:0","E4","8n"],["0:1","G4","8n"],["0:2","C5","4n"],["1:0","D5","8n"],["1:1","C5","8n"],["1:2","E5","4n"],
    ["2:0","D5","8n"],["2:1","C5","8n"],["2:2","A4","8n"],["2:3","G4","8n"],["3:0","A4","4n"],["3:2","G4","4n"],
    ["4:0","E4","8n"],["4:1","G4","8n"],["4:2","A4","4n"],["5:0","C5","8n"],["5:1","D5","8n"],["5:2","E5","4n"],
    ["6:0","G5","8n"],["6:1","E5","8n"],["6:2","D5","8n"],["6:3","C5","8n"],["7:0","C5","2n"],
  ],har:[
    ["0:0","C4","8n"],["0:2","E4","8n"],["1:0","G4","8n"],["1:2","C4","8n"],
    ["2:0","F4","8n"],["2:2","A4","8n"],["3:0","E4","8n"],["3:2","D4","8n"],
    ["4:0","C4","8n"],["4:2","E4","8n"],["5:0","F4","8n"],["5:2","G4","8n"],
    ["6:0","E4","8n"],["6:2","G4","8n"],["7:0","E4","2n"],
  ],bas:[
    ["0:0","C3","4n"],["0:2","C3","4n"],["1:0","G2","4n"],["1:2","G2","4n"],
    ["2:0","F2","4n"],["2:2","F2","4n"],["3:0","C3","4n"],["3:2","G2","4n"],
    ["4:0","A2","4n"],["4:2","A2","4n"],["5:0","F2","4n"],["5:2","G2","4n"],
    ["6:0","C3","4n"],["6:2","G2","4n"],["7:0","C3","2n"],
  ],perc:[
    ["0:0","8n"],["0:2","8n"],["1:0","8n"],["1:2","8n"],
    ["2:0","8n"],["2:2","8n"],["3:0","8n"],["3:2","8n"],
    ["4:0","8n"],["4:2","8n"],["5:0","8n"],["5:2","8n"],
    ["6:0","8n"],["6:2","8n"],["7:0","8n"],["7:2","8n"],
  ]},

  // Cave (B1-2F): Mysterious, Am, 90bpm - sparse and tense
  cave:{bpm:90,mel:[
    ["0:0","A3","8n"],["0:2","C4","8n"],["1:0","E4","4n"],["1:2","D4","8n"],
    ["2:0","C4","8n"],["2:2","A3","4n"],["3:1","E4","8n"],["3:3","D4","8n"],
    ["4:0","A3","8n"],["4:2","B3","8n"],["5:0","C4","4n"],["5:2","E4","8n"],
    ["6:0","D4","4n"],["6:2","C4","8n"],["7:0","A3","2n"],
  ],har:[
    ["0:0","E3","4n"],["1:0","A3","4n"],["2:0","C4","4n"],["3:0","E3","4n"],
    ["4:0","A3","4n"],["5:0","G3","4n"],["6:0","F3","4n"],["7:0","E3","2n"],
  ],bas:[
    ["0:0","A2","2n"],["1:0","A2","2n"],["2:0","F2","2n"],["3:0","E2","2n"],
    ["4:0","A2","2n"],["5:0","C3","2n"],["6:0","D3","2n"],["7:0","A2","2n"],
  ],perc:[
    ["0:0","16n"],["1:0","16n"],["2:0","16n"],["3:0","16n"],
    ["4:0","16n"],["5:0","16n"],["6:0","16n"],["7:0","16n"],
  ]},

  // Forest (B3-4F): Gentle, C major/F major, 100bpm - peaceful with motion
  forest:{bpm:100,mel:[
    ["0:0","C4","8n"],["0:1","E4","8n"],["0:2","G4","8n"],["0:3","A4","8n"],
    ["1:0","G4","4n"],["1:2","E4","4n"],
    ["2:0","F4","8n"],["2:1","A4","8n"],["2:2","C5","8n"],["2:3","A4","8n"],
    ["3:0","G4","2n"],
    ["4:0","A4","8n"],["4:1","G4","8n"],["4:2","E4","8n"],["4:3","D4","8n"],
    ["5:0","C4","4n"],["5:2","E4","4n"],
    ["6:0","F4","8n"],["6:1","E4","8n"],["6:2","D4","4n"],
    ["7:0","C4","2n"],
  ],har:[
    ["0:0","E4","8n"],["0:2","G4","8n"],["1:0","C4","8n"],["1:2","E4","8n"],
    ["2:0","F4","8n"],["2:2","A4","8n"],["3:0","E4","8n"],["3:2","G4","8n"],
    ["4:0","F4","8n"],["4:2","E4","8n"],["5:0","C4","8n"],["5:2","G3","8n"],
    ["6:0","A3","8n"],["6:2","F3","8n"],["7:0","E3","2n"],
  ],bas:[
    ["0:0","C3","4n"],["0:2","C3","4n"],["1:0","C3","4n"],["1:2","G2","4n"],
    ["2:0","F2","4n"],["2:2","F2","4n"],["3:0","C3","4n"],["3:2","G2","4n"],
    ["4:0","F2","4n"],["4:2","F2","4n"],["5:0","C3","4n"],["5:2","C3","4n"],
    ["6:0","F2","4n"],["6:2","G2","4n"],["7:0","C3","2n"],
  ],perc:[
    ["0:0","16n"],["0:2","16n"],["1:0","16n"],["1:2","16n"],
    ["2:0","16n"],["2:2","16n"],["3:0","16n"],["3:2","16n"],
    ["4:0","16n"],["4:2","16n"],["5:0","16n"],["5:2","16n"],
    ["6:0","16n"],["6:2","16n"],["7:0","16n"],["7:2","16n"],
  ]},

  // Ice (B5-6F): Ethereal, Em/Bm, 85bpm - crystalline and cold
  ice:{bpm:85,mel:[
    ["0:0","B4","8n"],["0:2","E5","4n"],["1:0","D5","8n"],["1:1","B4","8n"],["1:2","A4","4n"],
    ["2:0","G4","8n"],["2:2","B4","4n"],["3:0","A4","8n"],["3:2","E4","4n"],
    ["4:0","B4","8n"],["4:2","D5","4n"],["5:0","E5","8n"],["5:1","D5","8n"],["5:2","B4","4n"],
    ["6:0","A4","8n"],["6:2","G4","4n"],["7:0","E4","2n"],
  ],har:[
    ["0:0","E4","4n"],["0:2","G4","4n"],["1:0","F#4","4n"],["1:2","E4","4n"],
    ["2:0","E4","4n"],["2:2","D4","4n"],["3:0","C4","4n"],["3:2","B3","4n"],
    ["4:0","E4","4n"],["4:2","G4","4n"],["5:0","F#4","4n"],["5:2","E4","4n"],
    ["6:0","D4","4n"],["6:2","B3","4n"],["7:0","E4","2n"],
  ],bas:[
    ["0:0","E2","2n"],["1:0","B2","2n"],["2:0","E2","2n"],["3:0","A2","2n"],
    ["4:0","E2","2n"],["5:0","B2","2n"],["6:0","A2","2n"],["7:0","E2","2n"],
  ],perc:[
    ["0:0","16n"],["2:0","16n"],["4:0","16n"],["6:0","16n"],
  ]},

  // Lava (B7-8F): Intense, Dm, 110bpm - driving and dangerous
  lava:{bpm:110,mel:[
    ["0:0","D4","8n"],["0:1","F4","8n"],["0:2","A4","8n"],["0:3","D5","8n"],
    ["1:0","C5","8n"],["1:1","A4","8n"],["1:2","Bb4","4n"],
    ["2:0","A4","8n"],["2:1","G4","8n"],["2:2","F4","8n"],["2:3","E4","8n"],
    ["3:0","D4","4n"],["3:2","F4","4n"],
    ["4:0","A4","8n"],["4:1","Bb4","8n"],["4:2","C5","8n"],["4:3","D5","8n"],
    ["5:0","C5","4n"],["5:2","A4","4n"],
    ["6:0","Bb4","8n"],["6:1","A4","8n"],["6:2","G4","8n"],["6:3","F4","8n"],
    ["7:0","D4","2n"],
  ],har:[
    ["0:0","F4","8n"],["0:2","A4","8n"],["1:0","G4","8n"],["1:2","F4","8n"],
    ["2:0","D4","8n"],["2:2","F4","8n"],["3:0","A3","8n"],["3:2","D4","8n"],
    ["4:0","F4","8n"],["4:2","G4","8n"],["5:0","E4","8n"],["5:2","F4","8n"],
    ["6:0","G4","8n"],["6:2","F4","8n"],["7:0","D4","2n"],
  ],bas:[
    ["0:0","D2","4n"],["0:2","D2","4n"],["1:0","Bb2","4n"],["1:2","C3","4n"],
    ["2:0","D3","4n"],["2:2","A2","4n"],["3:0","D2","4n"],["3:2","D2","4n"],
    ["4:0","D2","4n"],["4:2","Bb2","4n"],["5:0","C3","4n"],["5:2","A2","4n"],
    ["6:0","Bb2","4n"],["6:2","C3","4n"],["7:0","D2","2n"],
  ],perc:[
    ["0:0","16n"],["0:1","16n"],["0:2","16n"],["0:3","16n"],
    ["1:0","16n"],["1:1","16n"],["1:2","16n"],["1:3","16n"],
    ["2:0","16n"],["2:1","16n"],["2:2","16n"],["2:3","16n"],
    ["3:0","16n"],["3:1","16n"],["3:2","16n"],["3:3","16n"],
    ["4:0","16n"],["4:1","16n"],["4:2","16n"],["4:3","16n"],
    ["5:0","16n"],["5:1","16n"],["5:2","16n"],["5:3","16n"],
    ["6:0","16n"],["6:1","16n"],["6:2","16n"],["6:3","16n"],
    ["7:0","16n"],["7:1","16n"],["7:2","16n"],["7:3","16n"],
  ]},

  // Dark (B9-10F): Ominous, Cm, 80bpm - slow, heavy, final area
  dark:{bpm:80,mel:[
    ["0:0","C4","4n"],["0:2","Eb4","4n"],["1:0","G4","4n"],["1:2","Ab4","8n"],["1:3","G4","8n"],
    ["2:0","F4","4n"],["2:2","Eb4","4n"],["3:0","D4","4n"],["3:2","C4","4n"],
    ["4:0","Eb4","4n"],["4:2","G4","4n"],["5:0","Ab4","4n"],["5:2","Bb4","4n"],
    ["6:0","Ab4","4n"],["6:2","G4","4n"],["7:0","C4","2n"],
  ],har:[
    ["0:0","Eb3","2n"],["1:0","Eb3","2n"],["2:0","Ab3","2n"],["3:0","G3","2n"],
    ["4:0","C4","2n"],["5:0","Eb4","2n"],["6:0","Ab3","2n"],["7:0","G3","2n"],
  ],bas:[
    ["0:0","C2","2n"],["1:0","Eb2","2n"],["2:0","F2","2n"],["3:0","G2","2n"],
    ["4:0","Ab2","2n"],["5:0","Eb2","2n"],["6:0","F2","2n"],["7:0","C2","2n"],
  ],perc:[
    ["0:0","16n"],["1:0","16n"],["3:0","16n"],["5:0","16n"],["7:0","16n"],
  ]},
};

// Map floor to BGM key
const FLOOR_BGM=["cave","cave","forest","forest","ice","ice","lava","lava","dark","dark"];

function stopBgmParts(){
  bgmParts.forEach(p=>{try{p.stop();p.dispose();}catch{}});
  bgmParts=[];
}

export function playBgm(key){
  if(!audioOk||!bgmSynths)return;
  if(currentBgm===key)return;
  stopBgmParts();
  currentBgm=key;
  const data=BGM_DATA[key];
  if(!data)return;
  try{
    Tone.getTransport().stop();
    Tone.getTransport().cancel();
    Tone.getTransport().bpm.value=data.bpm;
    const loopLen="8m";
    // Melody
    if(data.mel?.length){
      const p=new Tone.Part((time,val)=>{
        bgmSynths.mel.triggerAttackRelease(val.note,val.dur,time);
      },data.mel.map(([t,n,d])=>({time:t,note:n,dur:d}))).start(0);
      p.loop=true;p.loopEnd=loopLen;bgmParts.push(p);
    }
    // Harmony
    if(data.har?.length){
      const p=new Tone.Part((time,val)=>{
        bgmSynths.har.triggerAttackRelease(val.note,val.dur,time);
      },data.har.map(([t,n,d])=>({time:t,note:n,dur:d}))).start(0);
      p.loop=true;p.loopEnd=loopLen;bgmParts.push(p);
    }
    // Bass
    if(data.bas?.length){
      const p=new Tone.Part((time,val)=>{
        bgmSynths.bas.triggerAttackRelease(val.note,val.dur,time);
      },data.bas.map(([t,n,d])=>({time:t,note:n,dur:d}))).start(0);
      p.loop=true;p.loopEnd=loopLen;bgmParts.push(p);
    }
    // Percussion
    if(data.perc?.length){
      const p=new Tone.Part((time,val)=>{
        bgmSynths.perc.triggerAttackRelease(val.dur,time);
      },data.perc.map(([t,d])=>({time:t,dur:d}))).start(0);
      p.loop=true;p.loopEnd=loopLen;bgmParts.push(p);
    }
    Tone.getTransport().start();
  }catch(e){console.warn("BGM error:",e);}
}

export function stopBgm(){
  stopBgmParts();
  currentBgm=null;
  try{Tone.getTransport().stop();Tone.getTransport().cancel();}catch{}
}

export function playFloorBgm(floor){
  const key=FLOOR_BGM[Math.min(floor-1,FLOOR_BGM.length-1)];
  playBgm(key);
}
