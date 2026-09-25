import fs from 'node:fs';
import path from 'node:path';
import {execFileSync, spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {sceneSVG, DURATION, BPM, CUTS} from '../src/scene.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const a=(...p)=>path.join(root,'assets',...p);
for(const d of ['video','image','music','sfx']) fs.mkdirSync(a(d),{recursive:true});

function wav16(file, samples, sampleRate=48000, channels=1){
  const frames=Math.floor(samples.length/channels);
  const dataSize=frames*channels*2;
  const b=Buffer.alloc(44+dataSize);
  b.write('RIFF',0); b.writeUInt32LE(36+dataSize,4); b.write('WAVE',8); b.write('fmt ',12);
  b.writeUInt32LE(16,16); b.writeUInt16LE(1,20); b.writeUInt16LE(channels,22); b.writeUInt32LE(sampleRate,24);
  b.writeUInt32LE(sampleRate*channels*2,28); b.writeUInt16LE(channels*2,32); b.writeUInt16LE(16,34); b.write('data',36); b.writeUInt32LE(dataSize,40);
  for(let i=0;i<frames*channels;i++){
    const x=Math.max(-1,Math.min(1,samples[i]));
    b.writeInt16LE(Math.round(x<0?x*32768:x*32767),44+i*2);
  }
  fs.writeFileSync(file,b);
}
const sr=48000;
const hz=n=>440*Math.pow(2,(n-69)/12);
const osc=(type,phase,pulse=.38)=>{
  const s=Math.sin(phase);
  if(type==='sine') return s;
  if(type==='square') return s>=0?1:-1;
  if(type==='pulse') return ((phase%(Math.PI*2)+Math.PI*2)%(Math.PI*2))<Math.PI*2*pulse?1:-1;
  if(type==='triangle') return 2/Math.PI*Math.asin(s);
  if(type==='saw') return 2*(((phase/(Math.PI*2))%1+1)%1)-1;
  return s;
};
function addNote(buf,start,dur,freq,amp=0.2,type='pulse',opts={}){
  const i0=Math.floor(start*sr), i1=Math.min(buf.length,Math.ceil((start+dur)*sr));
  let phase=opts.phase||0;
  for(let i=i0;i<i1;i++){
    const t=(i/sr-start), u=t/dur;
    const attack=Math.min(1,t/(opts.attack??0.004));
    const env=attack*Math.pow(Math.max(0,1-u),opts.releasePower??2.2)*Math.exp(-(opts.decay??1.6)*u);
    const vibr=(opts.vibratoHz?Math.sin(2*Math.PI*opts.vibratoHz*t)*(opts.vibratoDepth??0.002):0);
    const f=freq*(1+vibr);
    phase+=2*Math.PI*f/sr;
    let v=osc(type,phase,opts.pulse??0.37);
    if(opts.second){v+=opts.second.amp*osc(opts.second.type||type,phase*(opts.second.mult||2),opts.second.pulse??0.5);}
    buf[i]+=amp*env*v;
  }
}
function lowpass(x,cut){
  const out=new Float64Array(x.length); const dt=1/sr, rc=1/(2*Math.PI*cut), al=dt/(rc+dt); let y=0;
  for(let i=0;i<x.length;i++){y+=al*(x[i]-y);out[i]=y;} return out;
}
function highpass(x,cut){
  const lp=lowpass(x,cut), out=new Float64Array(x.length); for(let i=0;i<x.length;i++) out[i]=x[i]-lp[i]; return out;
}
function finishLoFi(x,cut=3000,gain=1.0,bits=8){
  let y=lowpass(lowpass(x,cut),cut);
  const q=(1<<(bits-1))-1; let peak=1e-9;
  for(let i=0;i<y.length;i++){y[i]=Math.tanh(y[i]*1.7)*gain; y[i]=Math.round(y[i]*q)/q; peak=Math.max(peak,Math.abs(y[i]));}
  const norm=Math.min(1,0.94/peak); for(let i=0;i<y.length;i++) y[i]*=norm;
  return y;
}
function seededNoise(n,seed=0x12345678){const out=new Float64Array(n);let s=seed>>>0;for(let i=0;i<n;i++){s=(1664525*s+1013904223)>>>0;out[i]=(s/0xffffffff)*2-1;}return out;}

// Music: same measured 130.8 BPM, low spectral ceiling and attack density, but a newly composed A-minor motif.
function makeMusic(){
  const beat=60/BPM, bars=4, dur=bars*4*beat;
  let x=new Float64Array(Math.ceil(dur*sr));
  const bassMidi=[45,52,48,43,45,48,52,55, 45,52,50,43,48,45,43,40];
  const leadMidi=[64,67,60,64,62,69,67,70, 64,72,67,62,69,65,67,64];
  for(let bar=0;bar<bars;bar++){
    for(let e=0;e<8;e++){
      const t=(bar*4+e*.5)*beat;
      const bm=bassMidi[(bar*4+e)%bassMidi.length];
      addNote(x,t,beat*.34,hz(bm),0.28,'triangle',{attack:.002,decay:1.1,second:{amp:.22,mult:2,type:'sine'}});
      if((e+bar)%3!==1) addNote(x,t+.5*beat*.5,beat*.13,hz(bm+12),0.07,'pulse',{pulse:.31,decay:2.2});
    }
    const slots=[0,4,8,12,14];
    for(let k=0;k<slots.length;k++){
      const slot=slots[k]; const t=(bar*4)*beat+slot*(beat/4);
      const lm=leadMidi[(bar*4+k)%leadMidi.length];
      addNote(x,t,beat*.19,hz(lm),0.22,'pulse',{pulse:.29,attack:.0015,decay:2.0,second:{amp:.18,mult:2,type:'square'}});
    }
  }
  // Broadband attack clicks create the same vertical-onset character without copying the source samples.
  const noise=seededNoise(x.length,0x51c7b09);
  for(let bar=0;bar<bars;bar++) for(let e=0;e<8;e++){
    const i0=Math.floor((bar*4+e*.5)*beat*sr), n=Math.floor(.015*sr);
    for(let j=0;j<n&&i0+j<x.length;j++) x[i0+j]+=noise[i0+j]*0.035*Math.exp(-j/(sr*.004));
  }
  x=finishLoFi(x,2900,1.65,8);
  wav16(a('music','stickbug-inspired-loop.wav'),x,sr);
  return dur;
}
function makeIntroRise(){
  const dur=3.05, x=new Float64Array(Math.ceil(dur*sr));
  // Nine 1/3-second rising plucks, matching measured cadence but not the original sonic logo pitches.
  const midi=[69,71,72,74,76,77,79,81,83];
  for(let k=0;k<midi.length;k++) addNote(x,k/3,.27,hz(midi[k]),.42,'sine',{attack:.001,decay:2.8,releasePower:1.4,second:{amp:.16,mult:2,type:'sine'}});
  const y=finishLoFi(x,5200,.95,10); wav16(a('sfx','intro-rise.wav'),y,sr);
}
function makeOutlinePop(){
  const dur=.48, x=new Float64Array(Math.ceil(dur*sr));
  const noise=seededNoise(x.length,0x0ddba11);
  let phase=0;
  for(let i=0;i<x.length;i++){
    const t=i/sr,u=t/dur, f=950-520*u; phase+=2*Math.PI*f/sr;
    const env=Math.exp(-7*u);
    x[i]=.48*Math.sin(phase)*env + .18*noise[i]*Math.exp(-18*u);
  }
  const y=finishLoFi(x,6500,1,10); wav16(a('sfx','outline-pop.wav'),y,sr);
}
function makeMorph(){
  const dur=1.70, n=Math.ceil(dur*sr); let x=new Float64Array(n); const noise=seededNoise(n,0x7b6d331);
  const bp=highpass(lowpass(noise,7200),240);
  let phase=0;
  for(let i=0;i<n;i++){
    const t=i/sr,u=t/dur;
    const f=180+760*u+90*Math.sin(u*Math.PI*6); phase+=2*Math.PI*f/sr;
    const env=Math.sin(Math.PI*Math.min(1,u*.92+.04));
    const gate=.65+.35*(Math.sin(2*Math.PI*7.5*t)>-.2?1:0);
    x[i]=.20*bp[i]*env*gate + .09*osc('saw',phase)*env;
  }
  x=finishLoFi(x,7600,1,9); wav16(a('sfx','morph.wav'),x,sr);
}
function makeRevealHit(){
  const dur=.22,n=Math.ceil(dur*sr);let x=new Float64Array(n);const noise=seededNoise(n,0x3141592);let phase=0;
  for(let i=0;i<n;i++){
    const t=i/sr,u=t/dur,f=170*Math.pow(70/170,u);phase+=2*Math.PI*f/sr;
    x[i]=.52*Math.sin(phase)*Math.exp(-8*u)+.12*noise[i]*Math.exp(-25*u);
  }
  x=finishLoFi(x,5500,1,10);wav16(a('sfx','reveal-hit.wav'),x,sr);
}

const musicDur=makeMusic(); makeIntroRise(); makeOutlinePop(); makeMorph(); makeRevealHit();
if(process.argv.includes('--audio-only')){ console.log(JSON.stringify({bpm:BPM,musicDur,audio:'generated'},null,2)); process.exit(0); }

// Vector stills
fs.writeFileSync(a('image','stickbug-pose.svg'), sceneSVG(8.22,{width:816,height:720,transparent:true,bugOnly:true}));
fs.writeFileSync(a('image','intro-mark.svg'), sceneSVG(2.2,{width:816,height:720,transparent:true}));
fs.writeFileSync(a('image','morph-keyframe.svg'), sceneSVG(6.8,{width:816,height:720,transparent:true}));
for(const name of ['stickbug-pose','intro-mark','morph-keyframe']){
  execFileSync('/opt/imagemagick/bin/magick',[a('image',`${name}.svg`),a('image',`${name}.png`)]);
}

// Visual-only render. The source of truth remains the browser SVG renderer; this WebM is an editing convenience.
const temp=path.join(root,'.frames'); fs.rmSync(temp,{recursive:true,force:true}); fs.mkdirSync(temp,{recursive:true});
const fps=12, count=Math.ceil(DURATION*fps);
for(let i=0;i<count;i++) fs.writeFileSync(path.join(temp,`f_${String(i).padStart(4,'0')}.svg`),sceneSVG(i/fps,{width:408,height:360}));
const cmd=`find ${JSON.stringify(temp)} -name 'f_*.svg' -print0 | xargs -0 -P 16 -I{} sh -c '/opt/imagemagick/bin/magick "$1" "\${1%.svg}.png"' _ {}`;
let r=spawnSync('bash',['-lc',cmd],{stdio:'inherit'}); if(r.status!==0) process.exit(r.status||1);
execFileSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-framerate',String(fps),'-i',path.join(temp,'f_%04d.png'),'-c:v','libvpx-vp9','-b:v','0','-crf','28','-pix_fmt','yuv420p',a('video','visual-only.webm')]);
fs.rmSync(temp,{recursive:true,force:true});

// Transparent bug-only loop, 4 bars long.
const tempA=path.join(root,'.frames-alpha'); fs.rmSync(tempA,{recursive:true,force:true}); fs.mkdirSync(tempA,{recursive:true});
const alphaDur=musicDur, alphaCount=Math.ceil(alphaDur*fps);
for(let i=0;i<alphaCount;i++) fs.writeFileSync(path.join(tempA,`a_${String(i).padStart(4,'0')}.svg`),sceneSVG(CUTS.reveal+i/fps,{width:408,height:360,transparent:true,bugOnly:true}));
const cmdA=`find ${JSON.stringify(tempA)} -name 'a_*.svg' -print0 | xargs -0 -P 16 -I{} sh -c '/opt/imagemagick/bin/magick -background none "$1" "\${1%.svg}.png"' _ {}`;
r=spawnSync('bash',['-lc',cmdA],{stdio:'inherit'}); if(r.status!==0) process.exit(r.status||1);
execFileSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-framerate',String(fps),'-i',path.join(tempA,'a_%04d.png'),'-c:v','libvpx-vp9','-b:v','0','-crf','30','-pix_fmt','yuva420p','-auto-alt-ref','0',a('video','stickbug-dance-alpha.webm')]);
fs.rmSync(tempA,{recursive:true,force:true});

console.log(JSON.stringify({duration:DURATION,bpm:BPM,musicDur,fps,assets:'generated'},null,2));
