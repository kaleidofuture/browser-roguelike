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
