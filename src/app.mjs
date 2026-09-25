import {sceneSVG,DURATION,CUTS} from './scene.mjs';
const stage=document.querySelector('#stage');
const slider=document.querySelector('#timeline');
const timeLabel=document.querySelector('#time');
const play=document.querySelector('#play');
let playing=false, base=0, started=0, raf=0;
function render(t){
  t=Math.max(0,Math.min(DURATION,t));
  stage.innerHTML=sceneSVG(t,{width:816,height:720});
  slider.value=t; timeLabel.textContent=`${t.toFixed(3)} s`;
}
function frame(now){
  if(!playing)return;
  let t=base+(now-started)/1000;
  if(t>=DURATION){t=0;base=0;started=now;restartAudio();}
  render(t); raf=requestAnimationFrame(frame);
}
const audio=[
  {el:new Audio('./assets/sfx/intro-rise.wav'),at:CUTS.introPulseStart},
  {el:new Audio('./assets/sfx/outline-pop.wav'),at:CUTS.outlinePop},
  {el:new Audio('./assets/sfx/morph.wav'),at:CUTS.morphStart},
  {el:new Audio('./assets/sfx/reveal-hit.wav'),at:CUTS.reveal},
  {el:new Audio('./assets/music/stickbug-inspired-loop.wav'),at:CUTS.reveal},
];
function stopAudio(){audio.forEach(a=>{a.el.pause();a.el.currentTime=0;});}
function restartAudio(){
  stopAudio();
  const t=Number(slider.value);
  audio.forEach(a=>{
    if(t>=a.at && t<a.at+a.el.duration){a.el.currentTime=t-a.at;a.el.play().catch(()=>{});}
    else if(t<a.at){setTimeout(()=>{if(playing)a.el.play().catch(()=>{});},(a.at-t)*1000);}
  });
}
play.onclick=()=>{
  playing=!playing; play.textContent=playing?'Pause':'Play';
  if(playing){base=Number(slider.value);started=performance.now();restartAudio();raf=requestAnimationFrame(frame);} else {cancelAnimationFrame(raf);stopAudio();}
};
slider.oninput=()=>{base=Number(slider.value);render(base);if(playing){started=performance.now();restartAudio();}};
slider.max=DURATION; slider.step=.001; render(0);
