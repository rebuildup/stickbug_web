import {sceneSVG,DURATION,CUTS} from './scene.mjs';
import {createStickBug3D} from './stickbug3d.mjs';

const layer2d=document.querySelector('#stage2d');
const canvas=document.querySelector('#stage3d');
const slider=document.querySelector('#timeline');
const timeLabel=document.querySelector('#time');
const play=document.querySelector('#play');
const note=document.querySelector('#setup-note');
const bug3d=createStickBug3D(canvas);
const search=new URLSearchParams(location.search);
let base=Number(search.get('t')||0), started=0, raf=0, playing=search.get('autoplay')==='1', timers=[];

const audio=[
  {el:new Audio('./assets/sfx/intro-bells.wav'),at:0},
  {el:new Audio('./assets/sfx/morph-brass.wav'),at:CUTS.morphStart},
  {el:new Audio('./assets/sfx/reveal-hit.wav'),at:CUTS.reveal-0.035},
  {el:new Audio('./assets/music/stickbug-inspired-loop.wav'),at:CUTS.reveal},
];
audio.forEach(a=>a.el.preload='auto');

function stopAudio(){timers.forEach(clearTimeout);timers=[];audio.forEach(a=>{a.el.pause();a.el.currentTime=0;});}
function restartAudio(t=Number(slider.value)){
  stopAudio();
  audio.forEach(a=>{
    const dur=Number.isFinite(a.el.duration)&&a.el.duration>0?a.el.duration:99;
    if(t>=a.at&&t<a.at+dur){a.el.currentTime=Math.max(0,t-a.at);a.el.play().catch(()=>{});}
    else if(t<a.at){timers.push(setTimeout(()=>{if(playing)a.el.play().catch(()=>{});},(a.at-t)*1000));}
  });
}
function render(t){
  t=Math.max(0,Math.min(DURATION,t));
  const in3d=t>=CUTS.reveal;
  layer2d.innerHTML=sceneSVG(t,{width:816,height:720});
  layer2d.hidden=in3d;canvas.hidden=!in3d;
  note.hidden=t>=CUTS.morphStart;
  if(in3d) bug3d.renderTime(t);
  slider.value=t;timeLabel.textContent=`${t.toFixed(3)} s`;
}
function frame(now){
  let t=base+(now-started)/1000;
  if(t>DURATION){base=0;started=now;t=0;restartAudio(0);}
  render(t);if(playing)raf=requestAnimationFrame(frame);
}
play.onclick=()=>{
  playing=!playing;play.textContent=playing?'Pause':'Play';
  if(playing){started=performance.now();base=Number(slider.value);restartAudio(base);raf=requestAnimationFrame(frame);}
  else{cancelAnimationFrame(raf);stopAudio();}
};
slider.oninput=()=>{base=Number(slider.value);render(base);if(playing){started=performance.now();restartAudio(base);}};
window.addEventListener('resize',()=>bug3d.resize());
window.setTime=t=>{base=t;render(t);};
slider.max=DURATION;slider.step=.001;render(base);
if(playing){play.textContent='Pause';started=performance.now();restartAudio(base);raf=requestAnimationFrame(frame);}
