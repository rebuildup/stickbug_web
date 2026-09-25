const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const lerp=(a,b,t)=>a+(b-a)*t;
const ease=t=>{t=clamp(t);return t*t*(3-2*t);};

export const DURATION=14.7679;
export const BPM=130.8;
export const CUTS={
  setupEnd:5.000,
  outlinePop:5.000,
  morphStart:5.800,
  reveal:7.500,
  whipStart:10.630,
  gardenStart:11.250,
};

const sourceSegments=[
  [[-64,-24],[-17,-24]], [[-57,-6],[-7,-6]], [[-49,13],[-3,13]],
  [[-2,13],[18,-22]], [[18,-22],[52,10]], [[8,13],[26,-4]],
  [[26,-4],[48,14]], [[43,-20],[67,-20]],
];

export const BUG_TRACE=[
  [[-58,-12],[53,-7]],
  [[-58,-12],[-88,-34]],
  [[-45,-11],[-79,34]],
  [[-31,-10],[-20,39]],
  [[-17,-9],[-41,34]],
  [[1,-8],[8,40]],
  [[20,-8],[5,36]],
  [[40,-7],[53,33]],
];

function line(a,b,attrs=''){
  return `<line x1="${a[0].toFixed(2)}" y1="${a[1].toFixed(2)}" x2="${b[0].toFixed(2)}" y2="${b[1].toFixed(2)}" ${attrs}/>`;
}
function mixSeg(a,b,t){return [[lerp(a[0][0],b[0][0],t),lerp(a[0][1],b[0][1],t)],[lerp(a[1][0],b[1][0],t),lerp(a[1][1],b[1][1],t)]];}

function morph2D(t,w,h){
  const cx=w*.5,cy=h*.38,s=Math.min(w/408,h/360)*.95;
  const m=ease(clamp((t-CUTS.morphStart)/(CUTS.reveal-CUTS.morphStart)));
  const barY=h*.59;
  let out=`<rect x="${w*.12}" y="${barY}" width="${w*.76}" height="${Math.max(7,h*.022)}" rx="4" fill="#b7afb6" transform="rotate(${(-4*m).toFixed(2)} ${w/2} ${barY})"/>`;
  if(t<CUTS.morphStart) return out;
  out+=`<g transform="translate(${cx} ${cy}) scale(${s})">`;
  sourceSegments.forEach((seg,i)=>{
    const u=ease(clamp((m-i*.035)/.79));
    const z=mixSeg(seg,BUG_TRACE[i],u);
    out+=line(z[0],z[1],`stroke="#fff7e7" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"`);
  });
  out+='</g>';
  return out;
}

export function sceneSVG(t,{width=408,height=360,transparent=false}={}){
  t=Math.max(0,Math.min(DURATION,t));
  let body='';
  if(t<CUTS.outlinePop){
    if(!transparent)body+=`<rect width="100%" height="100%" fill="#ffffff"/>`;
  }else if(t<CUTS.reveal){
    if(!transparent)body+=`<rect width="100%" height="100%" fill="#93868f"/>`;
    body+=morph2D(t,width,height);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`;
}
