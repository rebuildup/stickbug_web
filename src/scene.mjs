const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const lerp=(a,b,t)=>a+(b-a)*t;
const ease=t=>{t=clamp(t);return t*t*(3-2*t);};

export const SOURCE_OFFSET=0.987;
export const DURATION=14.7679-SOURCE_OFFSET;
export const BPM=130.8;
export const sourceToTemplate=t=>t-SOURCE_OFFSET;

export const INTRO_NOTE_TIMES=[0.000,0.330,0.666,0.997,1.333,1.664,2.000,2.330,2.666,4.000];
export const INTRO_NOTE_FREQS=[527.34,515.62,597.66,621.09,656.25,656.25,738.28,785.16,843.75,878.91];

export const CUTS={
  finalDisappear:4.000,
  morphStart:sourceToTemplate(5.800),
  target2D:sourceToTemplate(7.3333333333),
  reveal:sourceToTemplate(7.500),
  first3D:sourceToTemplate(7.5333333333),
  preWhip:sourceToTemplate(10.600),
  whipStart:sourceToTemplate(10.630),
  garden:sourceToTemplate(11.2666666667),
};

export const TRACE_2D={
  body:[[165,60],[181,69],[205,82],[228,89],[281,98],[296,99]],
  legs:[
    [[181,70],[137,92],[93,133]],
    [[186,74],[159,105],[142,148]],
    [[205,82],[181,108],[163,148]],
    [[228,89],[217,113],[204,151]],
    [[281,98],[280,122],[279,153]],
  ],
  platform:[[0,148],[408,164]],
};

const SOURCE_LINES=[
  [[120,74],[170,74]], [[126,92],[178,92]], [[134,111],[181,111]],
  [[185,111],[205,77]], [[205,77],[240,109]], [[197,111],[218,95]], [[218,95],[241,113]],
];
const BACKGROUND_LINES=[[[58,50],[58,147]],[[340,43],[340,150]],[[315,45],[376,45]]];
const BASE_LINE=[[0,148],[408,164]];

function path(points,attrs=''){
  return `<polyline points="${points.map(p=>`${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ')}" fill="none" ${attrs}/>`;
}
function line(a,b,attrs=''){return `<line x1="${a[0].toFixed(2)}" y1="${a[1].toFixed(2)}" x2="${b[0].toFixed(2)}" y2="${b[1].toFixed(2)}" ${attrs}/>`;}
function mixPoint(a,b,t){return [lerp(a[0],b[0],t),lerp(a[1],b[1],t)];}
function mixPolyline(a,b,t){
  const n=Math.max(a.length,b.length), out=[];
  for(let i=0;i<n;i++) out.push(mixPoint(a[Math.min(i,a.length-1)],b[Math.min(i,b.length-1)],t));
  return out;
}

function stageBackground(w,h){
  const sx=w/408,sy=h/360;
  return `<rect width="${w}" height="${h}" fill="#968a93"/>
    <path d="M0 ${148*sy} L${w} ${164*sy} L${w} ${198*sy} L0 ${182*sy} Z" fill="#aaa2a2" opacity=".42"/>`;
}

function introScene(t,w,h){
  const sx=w/408,sy=h/360;
  const noteCount=INTRO_NOTE_TIMES.filter(x=>t>=x).length;
  const disappear=ease(clamp((t-CUTS.finalDisappear)/0.10));
  let out=stageBackground(w,h);
  out+=`<g transform="scale(${sx} ${sy})" stroke="#fff7e7" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">`;
  for(let i=0;i<7;i++){
    const active=noteCount>i;
    if(active) out+=line(SOURCE_LINES[i][0],SOURCE_LINES[i][1],`opacity="${(1-disappear).toFixed(3)}"`);
  }
  if(noteCount>=8) out+=line(BASE_LINE[0],BASE_LINE[1],`stroke="#eee7dc" opacity=".86"`);
  if(noteCount>=9) BACKGROUND_LINES.forEach(seg=>out+=line(seg[0],seg[1],`stroke="#ded7d8" opacity=".42"`));
  out+='</g>';
  return out;
}

function morphScene(t,w,h){
  const sx=w/408,sy=h/360;
  const u=clamp((t-CUTS.morphStart)/(CUTS.target2D-CUTS.morphStart));
  const m=ease(u);
  let out=stageBackground(w,h);
  out+=`<g transform="scale(${sx} ${sy})" stroke="#fff8ed" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">`;
  const targetPaths=[TRACE_2D.body,...TRACE_2D.legs];
  targetPaths.forEach((target,i)=>{
    const src=SOURCE_LINES[Math.min(i,SOURCE_LINES.length-1)];
    const srcPath=[src[0],src[1],src[1]];
    const local=ease(clamp((m-i*0.035)/0.86));
    out+=path(mixPolyline(srcPath,target,local));
  });
  out+=line(TRACE_2D.platform[0],TRACE_2D.platform[1],`stroke="#efe6dc" opacity="${(0.55+0.45*m).toFixed(3)}"`);
  out+='</g>';
  return out;
}

export function sceneSVG(t,{width=408,height=360}={}){
  t=clamp(t,0,DURATION);
  let body='';
  if(t<CUTS.morphStart) body=introScene(t,width,height);
  else if(t<CUTS.reveal) body=morphScene(t,width,height);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`;
}
