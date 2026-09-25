import {sceneSVG,DURATION,CUTS} from './scene.mjs';
import {createStickBug3D} from './stickbug3d.mjs';

const layer2d=document.querySelector('#stage2d');
const canvas=document.querySelector('#stage3d');
const setupNote=document.querySelector('#setup-note');
const slider=document.querySelector('#timeline');
const timeLabel=document.querySelector('#time');
const play=document.querySelector('#play');
const bug3d=createStickBug3D(canvas);
let playing=false,base=0,started=0,raf=0,timers=[];

function render(t){
  t=Math.max(0,Math.min(DURATION,t));
  const in3d=t>=CUTS.reveal;
  layer2d.innerHTML=sceneSVG(t,{width:816,height:720});
  layer2d.hidden=in3d;canvas.hidden=!in3d;
  setupNote.hidden=t>=CUTS.outlinePop;
  if(in3d)bug3d.renderTime(t);
  slider.value=t;timeLabel.textContent=`${t.toFixed(3)} s`;
}
function frame(now){
  if(!playing)return;
  let t=base+(now-started)/1000;
  if(t>=DURATION){t=0;base=0;started=now;restartAudio(0);}
  render(t);raf=requestAnimationFrame(frame);
}
const audio=[
  {el:new Audio('./assets/sfx/outline-pop.wav'),at:CUTS.outlinePop},
  {el:new Audio('./assets/sfx/morph.wav'),at:CUTS.morphStart},
  {el:new Audio('./assets/sfx/reveal-hit.wav'),at:CUTS.reveal},
  {el:new Audio('./assets/music/stickbug-inspired-loop.wav'),at:CUTS.reveal},
];
function stopAudio(){timers.forEach(clearTimeout);timers=[];audio.forEach(a=>{a.el.pause();a.el.currentTime=0;});}
function restartAudio(t=Number(slider.value)){
  stopAudio();
  audio.forEach(a=>{
    const dur=Number.isFinite(a.el.duration)?a.el.duration:99;
    if(t>=a.at&&t<a.at+dur){a.el.currentTime=Math.max(0,t-a.at);a.el.play().catch(()=>{});}
    else if(t<a.at){timers.push(setTimeout(()=>{if(playing)a.el.play().catch(()=>{});},(a.at-t)*1000));}
  });
}
play.onclick=()=>{
  playing=!playing;play.textContent=playing?'Pause':'Play';
  if(playing){base=Number(slider.value);started=performance.now();restartAudio(base);raf=requestAnimationFrame(frame);}
  else{cancelAnimationFrame(raf);stopAudio();}
};
slider.oninput=()=>{base=Number(slider.value);render(base);if(playing){started=performance.now();restartAudio(base);}};
window.addEventListener('resize',()=>bug3d.resize());
slider.max=DURATION;slider.step=.001;render(0);
