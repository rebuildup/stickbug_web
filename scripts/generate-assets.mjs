import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {sceneSVG,BPM} from '../src/scene.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const asset=(...p)=>path.join(root,'assets',...p);
for(const d of ['image','music','sfx'])fs.mkdirSync(asset(d),{recursive:true});
const sr=48000;

function wav16(file,samples,sampleRate=sr){
  const b=Buffer.alloc(44+samples.length*2);b.write('RIFF',0);b.writeUInt32LE(36+samples.length*2,4);b.write('WAVE',8);b.write('fmt ',12);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(sampleRate,24);b.writeUInt32LE(sampleRate*2,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(samples.length*2,40);
  for(let i=0;i<samples.length;i++){const x=Math.max(-1,Math.min(1,samples[i]));b.writeInt16LE(Math.round(x<0?x*32768:x*32767),44+i*2);}fs.writeFileSync(file,b);
}
const hz=n=>440*Math.pow(2,(n-69)/12);
function seededNoise(n,seed=0x51c7b09){const o=new Float64Array(n);let s=seed>>>0;for(let i=0;i<n;i++){s=(1664525*s+1013904223)>>>0;o[i]=(s/0xffffffff)*2-1;}return o;}
function lowpass(x,cut){const o=new Float64Array(x.length),dt=1/sr,rc=1/(2*Math.PI*cut),a=dt/(rc+dt);let y=0;for(let i=0;i<x.length;i++){y+=a*(x[i]-y);o[i]=y;}return o;}
function highpass(x,cut){const lp=lowpass(x,cut),o=new Float64Array(x.length);for(let i=0;i<x.length;i++)o[i]=x[i]-lp[i];return o;}
function softclip(x,drive=1.5){for(let i=0;i<x.length;i++)x[i]=Math.tanh(x[i]*drive);return x;}
function normalize(x,peak=.94){let p=1e-9;for(const v of x)p=Math.max(p,Math.abs(v));const g=Math.min(1,peak/p);for(let i=0;i<x.length;i++)x[i]*=g;return x;}
function addDamped(buf,start,freq,amp,decay=18,phase=0){const i0=Math.max(0,Math.floor(start*sr)),n=Math.min(buf.length-i0,Math.ceil(1.0*sr));for(let j=0;j<n;j++){const t=j/sr,e=Math.exp(-decay*t);if(e<1e-5)break;buf[i0+j]+=amp*e*Math.sin(2*Math.PI*freq*t+phase);}}
function addTone(buf,start,dur,freq,amp,opts={}){const i0=Math.floor(start*sr),i1=Math.min(buf.length,Math.ceil((start+dur)*sr));let ph=opts.phase||0;for(let i=i0;i<i1;i++){const t=i/sr-start,u=t/dur;const a=Math.min(1,t/(opts.attack??.002));const e=a*Math.pow(Math.max(0,1-u),opts.releasePower??1.5)*Math.exp(-(opts.decay??2.0)*u);const wow=1+(opts.wow??0)*Math.sin(2*Math.PI*(opts.wowHz??5.2)*t);ph+=2*Math.PI*freq*wow/sr;let s=Math.sin(ph);if(opts.square)s=.72*s+.28*(s>=0?1:-1);buf[i]+=amp*e*s;}}

function makeOutlinePop(){
  const dur=.79,n=Math.ceil(dur*sr),x=new Float64Array(n),noise=seededNoise(n,0x8806250);
  for(let i=0;i<n;i++){
    const t=i/sr;
    const attack=Math.min(1,t/.012),env=attack*Math.exp(-17.0*Math.max(0,t-.018));
    const pure=Math.sin(2*Math.PI*880*t)+.009*Math.sin(2*Math.PI*1760*t+.7);
    const glass=.027*Math.sin(2*Math.PI*6240*t+1.1)*Math.exp(-24*t);
    x[i]=.72*env*pure+glass+.010*noise[i]*Math.exp(-34*t);
  }
  normalize(x,.93);wav16(asset('sfx','outline-pop.wav'),x);
}

const morphEvents=[
  [0.024,-28.9,[746,2236,1491,400,600]],[0.101,-25.1,[746,1491,582,400,509]],
  [0.168,-22.3,[400,782,527,1964,2236]],[0.221,-21.7,[382,527,782,655,982]],
  [0.320,-18.6,[782,509,655,382,1000]],[0.429,-17.4,[491,782,982,327,1164]],
  [0.483,-17.9,[491,782,382,655,582]],[0.587,-20.6,[982,491,782,327,382]],
  [0.624,-21.3,[655,327,964,382,582]],[0.672,-21.8,[327,527,1164,1036,2200]],
  [0.709,-22.3,[327,509,1946,1164,1036]],[0.787,-20.0,[982,382,764,527,327]],
  [0.824,-19.3,[964,782,491,382,1455]],[0.965,-18.0,[491,382,1164,327,2200]],
  [1.067,-14.7,[491,1455,582,382,964]],[1.131,-18.7,[491,582,982,382,1455]],
  [1.227,-20.6,[382,582,509,1436,1527]],[1.267,-19.2,[382,509,964,582,1455]],
  [1.331,-21.1,[964,382,255,491,1436]],[1.453,-21.4,[491,764,382,255,564]],
  [1.568,-18.4,[473,382,327,1927,2273]],[1.640,-23.3,[382,764,509,582,1146]],
];
function makeMorph(){
  const dur=1.70,n=Math.ceil(dur*sr),x=new Float64Array(n),noise=seededNoise(n,0x5b8a75),bp=highpass(lowpass(noise,6200),180);
  const weights=[1,.62,.44,.31,.23];
  for(const [time,db,freqs] of morphEvents){
    const amp=Math.pow(10,(db+14.7)/20)*.23;
    freqs.forEach((f,i)=>addDamped(x,time,f,amp*weights[i],12+i*2.8,(i*.83)%6.28));
    [2203,2438,2695,2929,3445,3727,4102,4852,5400,6234].forEach((f,i)=>addDamped(x,time,f,amp*[.28,.24,.20,.17,.14,.12,.10,.085,.072,.06][i],15+i*1.35,(i*1.17)%6.28));
    const i0=Math.floor(time*sr),len=Math.floor(.052*sr);for(let j=0;j<len&&i0+j<n;j++)x[i0+j]+=bp[i0+j]*amp*.12*Math.exp(-j/(sr*.012));
  }
  for(let i=0;i<n;i++){const t=i/sr,u=t/dur,bed=.045*(.35+.65*Math.sin(Math.PI*u));x[i]+=bed*(Math.sin(2*Math.PI*(375+8*Math.sin(t*5.1))*t)+.42*Math.sin(2*Math.PI*492*t+.4));}
  let y=lowpass(softclip(x,1.9),5600);normalize(y,.94);wav16(asset('sfx','morph.wav'),y);
}
function makeRevealHit(){
  const dur=.24,n=Math.ceil(dur*sr),x=new Float64Array(n),noise=seededNoise(n,0x7500aa);let phase=0;
  for(let i=0;i<n;i++){const t=i/sr,u=t/dur,f=122*Math.pow(62/122,u);phase+=2*Math.PI*f/sr;x[i]=.62*Math.sin(phase)*Math.exp(-9*u)+.11*noise[i]*Math.exp(-28*u);}
  const y=normalize(lowpass(x,4200),.90);wav16(asset('sfx','reveal-hit.wav'),y);
}

function makeMusic(){
  const beat=60/BPM,bars=4,dur=bars*4*beat,n=Math.ceil(dur*sr),x=new Float64Array(n),noise=seededNoise(n,0x1308beef);
  const roots=[45,48,43,50];
  const lead=[[64,67,71,62],[65,69,60,67],[62,67,70,65],[69,64,67,71]];
  for(let bar=0;bar<bars;bar++){
    const root=roots[bar];
    addTone(x,bar*4*beat,4*beat,hz(root-12),.19,{attack:.02,decay:.35,releasePower:.7,wow:.003,wowHz:3.7});
    addTone(x,bar*4*beat,4*beat,hz(root),.13,{attack:.012,decay:.5,releasePower:.65,square:true,wow:.004,wowHz:5.2});
    for(let e=0;e<8;e++){
      const t=(bar*4+e*.5)*beat;
      addTone(x,t,beat*.82,hz(root+(e%3===1?7:0)),.20,{attack:.002,decay:1.3,releasePower:1.1,square:true,wow:.003});
      addTone(x,t+.015,beat*.58,hz(root+12),.075,{attack:.001,decay:1.8,releasePower:1.2,wow:.006,wowHz:6.1});
      const i0=Math.floor(t*sr),m=Math.floor(.055*sr);for(let j=0;j<m&&i0+j<n;j++)x[i0+j]+=.06*noise[i0+j]*Math.exp(-j/(sr*.012));
    }
    for(let k=0;k<4;k++){
      const t=(bar*4+k)*beat+.06*beat;
      addTone(x,t,beat*.72,hz(lead[bar][k]),.15,{attack:.002,decay:1.5,releasePower:.95,square:true,wow:.004,wowHz:4.4});
      addTone(x,t+.045,beat*.85,hz(lead[bar][k]-12),.09,{attack:.003,decay:1.2,releasePower:1.0});
    }
  }
  let y=lowpass(lowpass(softclip(x,1.55),1550),1550);
  const q=1023;for(let i=0;i<y.length;i++)y[i]=Math.round(y[i]*q)/q;
  normalize(y,.92);wav16(asset('music','stickbug-inspired-loop.wav'),y);return dur;
}

makeOutlinePop();makeMorph();makeRevealHit();const musicDur=makeMusic();
if(process.argv.includes('--audio-only')){console.log(JSON.stringify({bpm:BPM,musicDur,sfx:'spectrally resynthesized'},null,2));process.exit(0);}
fs.writeFileSync(asset('image','morph-keyframe.svg'),sceneSVG(6.85,{width:816,height:720,transparent:true}));
fs.writeFileSync(asset('image','stickbug-2d-pose.svg'),sceneSVG(7.49,{width:816,height:720,transparent:true}));
console.log(JSON.stringify({bpm:BPM,musicDur,images:['morph-keyframe.svg','stickbug-2d-pose.svg']},null,2));
