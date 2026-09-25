import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {sceneSVG,BPM,INTRO_NOTE_TIMES,INTRO_NOTE_FREQS,CUTS,DURATION} from '../src/scene.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const asset=(...p)=>path.join(root,'assets',...p);
for(const d of ['image','music','sfx']) fs.mkdirSync(asset(d),{recursive:true});
const sr=48000;

function wav16(file,samples,sampleRate=sr){
  const b=Buffer.alloc(44+samples.length*2);
  b.write('RIFF',0);b.writeUInt32LE(36+samples.length*2,4);b.write('WAVE',8);b.write('fmt ',12);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(sampleRate,24);b.writeUInt32LE(sampleRate*2,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(samples.length*2,40);
  for(let i=0;i<samples.length;i++){const x=Math.max(-1,Math.min(1,samples[i]));b.writeInt16LE(Math.round(x<0?x*32768:x*32767),44+i*2);}fs.writeFileSync(file,b);
}
function normalize(x,peak=.95){let p=1e-9;for(const v of x)p=Math.max(p,Math.abs(v));const g=Math.min(1,peak/p);for(let i=0;i<x.length;i++)x[i]*=g;return x;}
function softclip(x,d=1.6){for(let i=0;i<x.length;i++)x[i]=Math.tanh(d*x[i]);return x;}
function lowpass(x,cut){const y=new Float64Array(x.length); const dt=1/sr, rc=1/(2*Math.PI*cut), a=dt/(dt+rc); let s=0; for(let i=0;i<x.length;i++){s+=a*(x[i]-s);y[i]=s;} return y;}
function noise(n,seed=1){const out=new Float64Array(n); let s=seed>>>0; for(let i=0;i<n;i++){s=(1664525*s+1013904223)>>>0; out[i]=(s/0xffffffff)*2-1;} return out;}

function addBell(buf,start,freq,amp=.65,dur=1.25){
  const i0=Math.floor(start*sr), i1=Math.min(buf.length,Math.floor((start+dur)*sr));
  let p1=0,p2=0,p3=0,p4=0;
  for(let i=i0;i<i1;i++){
    const t=(i-i0)/sr;
    const env=Math.exp(-2.6*t);
    const hit=Math.min(1,t/0.002);
    p1+=2*Math.PI*freq/sr;p2+=2*Math.PI*freq*2.68/sr;p3+=2*Math.PI*freq*4.12/sr;p4+=2*Math.PI*freq*5.43/sr;
    let s=0.72*Math.sin(p1)+0.24*Math.sin(p2+0.3)+0.14*Math.sin(p3+0.8)+0.08*Math.sin(p4+1.2);
    s*=amp*env*hit;buf[i]+=s;
  }
}
function makeIntro(){
  const dur=5.3,buf=new Float64Array(Math.ceil(dur*sr));
  for(let i=0;i<INTRO_NOTE_TIMES.length;i++)addBell(buf,INTRO_NOTE_TIMES[i],INTRO_NOTE_FREQS[i],i===INTRO_NOTE_TIMES.length-1?0.85:0.62,1.08);
  const y=normalize(lowpass(softclip(buf,1.2),5400),0.93);
  wav16(asset('sfx','intro-bells.wav'),y);
}
function makeMorph(){
  const dur=CUTS.reveal-CUTS.morphStart+0.12,buf=new Float64Array(Math.ceil(dur*sr));
  const n=noise(buf.length,0x12345);
  for(let i=0;i<buf.length;i++){
    const t=i/sr,u=t/dur;
    const rise=Math.min(1,t/0.35)*Math.pow(1-u,0.25);
    const f1=180+210*u,f2=270+250*u,f3=360+130*u;
    buf[i]+=rise*(0.30*Math.sin(2*Math.PI*f1*t)+0.22*Math.sin(2*Math.PI*f2*t+0.4)+0.15*Math.sin(2*Math.PI*f3*t+1.2));
    buf[i]+=0.045*n[i]*(0.55+0.45*Math.sin(Math.PI*u))*Math.exp(-0.6*u);
  }
  const stabTimes=[.024,.101,.168,.221,.320,.429,.483,.587,.624,.672,.709,.787,.824,.965,1.067,1.131,1.227,1.267,1.331,1.453,1.568,1.640];
  const roots=[187.5,246,196,255,187.5,246,196,255];
  for(let si=0;si<stabTimes.length;si++){
    const s0=stabTimes[si],i0=Math.floor(s0*sr),root=roots[si%roots.length];
    const phases=[0,.2,.55,.9,1.25];
    for(let j=0;j<sr*.34&&i0+j<buf.length;j++){
      const t=j/sr;
      const attack=Math.min(1,t/.014),env=attack*Math.exp(-6.2*t);
      const pitch=root*(1-.025*Math.min(1,t/.18));
      let brass=0;
      for(let h=1;h<=5;h++)brass += [1,.58,.38,.24,.14][h-1]*Math.sin(2*Math.PI*pitch*h*t+phases[h-1]);
      const formant=.20*Math.sin(2*Math.PI*492*t+.3)+.12*Math.sin(2*Math.PI*773*t+.7)+.07*Math.sin(2*Math.PI*1453*t+1.1);
      buf[i0+j]+=0.085*env*(brass+formant);
    }
  }
  const y=normalize(lowpass(softclip(buf,1.95),3100),0.92);
  wav16(asset('sfx','morph-brass.wav'),y);
}
function makeRevealHit(){
  const dur=0.20,buf=new Float64Array(Math.ceil(dur*sr));
  for(let i=0;i<buf.length;i++){
    const t=i/sr,u=t/dur,f=240*Math.pow(0.42,u);
    buf[i]+=0.72*Math.sin(2*Math.PI*f*t)*Math.exp(-7*u);
  }
  const y=normalize(lowpass(buf,2400),0.88);wav16(asset('sfx','reveal-hit.wav'),y);
}
function makeMusic(){
  const beat=60/BPM,dur=DURATION-CUTS.reveal+0.8,nS=Math.ceil(dur*sr),buf=new Float64Array(nS),nz=noise(nS,0x56789);
  const bass=[93.75,93.75,101.5,93.75,93.75,117.0,101.5,93.75];
  const lead=[304.7,304.7,468.75,304.7,562.5,304.7,468.75,304.7];
  for(let bar=0;bar<8;bar++){
    for(let step=0;step<8;step++){
      const t=(bar*8+step)*beat*0.5;
      const f0=bass[(bar+step)%bass.length],f1=lead[(bar*2+step)%lead.length],i0=Math.floor(t*sr);
      let p0=0,p1=0,p2=0;
      for(let j=0;j<sr*0.36&&i0+j<nS;j++){
        const s=j/sr,env=Math.exp(-5.4*s);
        p0+=2*Math.PI*f0/sr;p1+=2*Math.PI*(f0*3.25)/sr;p2+=2*Math.PI*f1/sr;
        buf[i0+j]+=0.16*env*(0.9*Math.sin(p0)+0.28*Math.sign(Math.sin(p0*2.01)));
        buf[i0+j]+=0.05*env*Math.sin(p1+0.7);
        buf[i0+j]+=0.06*Math.exp(-4.2*s)*Math.sin(p2);
        if(j<sr*0.04)buf[i0+j]+=0.03*nz[i0+j]*Math.exp(-60*s);
      }
    }
  }
  const y=normalize(lowpass(lowpass(softclip(buf,1.8),1750),1450),0.92);
  wav16(asset('music','stickbug-inspired-loop.wav'),y);
}

makeIntro();makeMorph();makeRevealHit();makeMusic();
fs.writeFileSync(asset('image','morph-keyframe.svg'),sceneSVG((CUTS.morphStart+CUTS.reveal)*0.5,{width:816,height:720}));
fs.writeFileSync(asset('image','stickbug-2d-pose.svg'),sceneSVG(CUTS.reveal-0.03,{width:816,height:720}));
console.log(JSON.stringify({ok:true,files:['intro-bells.wav','morph-brass.wav','reveal-hit.wav','stickbug-inspired-loop.wav']},null,2));
