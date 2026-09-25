const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => { t = clamp(t); return t * t * (3 - 2 * t); };
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));

export const DURATION = 14.7679;
export const BPM = 130.8;
export const CUTS = {
  introPulseStart: 1.034,
  stageCut: 3.700,
  outlinePop: 5.000,
  morphStart: 5.800,
  reveal: 7.500,
  whipStart: 10.630,
  gardenStart: 11.250,
};

const introPolys = [
  // A custom angular "SB"-like mark. It intentionally does not trace the EA logo.
  [[-100,-55],[-20,-55],[-33,-38],[-112,-38]],
  [[-116,-25],[-48,-25],[-60,-8],[-126,-8]],
  [[-126,5],[-60,5],[-74,23],[-132,23]],
  [[-46,23],[-8,-55],[12,-30],[-20,23]],
  [[14,-28],[50,-55],[76,-22],[59,-8]],
  [[61,-6],[82,22],[58,22],[45,4]],
  [[-18,23],[10,23],[33,-4],[18,-18]],
  [[31,-2],[50,22],[25,22],[15,9]],
  [[-4,-23],[18,-23],[6,-8],[-12,-8]],
];

const markLines = [
  [[-105,-48],[-28,-48]],
  [[-115,-17],[-46,-17]],
  [[-120,16],[-58,16]],
  [[-55,16],[-13,-48]],
  [[-13,-48],[54,16]],
  [[12,-18],[40,12]],
  [[-2,16],[28,-17]],
  [[28,-17],[59,16]],
];

const bugRest = [
  [[-56,-13],[48,-7]],     // long body
  [[-56,-13],[-87,-34]],   // raised rear limb / antenna silhouette
  [[-43,-11],[-76,35]],    // rear leg, long and open
  [[-31,-10],[-17,39]],    // rear-middle leg
  [[-16,-9],[-40,34]],     // crossing middle leg
  [[2,-8],[8,41]],         // middle-front leg
  [[20,-8],[4,36]],        // crossing front leg
  [[40,-7],[53,34]],       // front leg
];

function poly(points, attrs='') {
  return `<polygon points="${points.map(p => p.join(',')).join(' ')}" ${attrs}/>`;
}
function line(a,b,attrs='') {
  return `<line x1="${a[0].toFixed(2)}" y1="${a[1].toFixed(2)}" x2="${b[0].toFixed(2)}" y2="${b[1].toFixed(2)}" ${attrs}/>`;
}
function txLine(seg, cx, cy, s=1, rot=0) {
  const c=Math.cos(rot), sn=Math.sin(rot);
  const map=p=>[cx+s*(p[0]*c-p[1]*sn), cy+s*(p[0]*sn+p[1]*c)];
  return [map(seg[0]),map(seg[1])];
}
function mixSeg(a,b,t){return [[lerp(a[0][0],b[0][0],t),lerp(a[0][1],b[0][1],t)],[lerp(a[1][0],b[1][0],t),lerp(a[1][1],b[1][1],t)]];}

function bugSegments(time){
  const rel=time-CUTS.reveal;
  const beat=rel*BPM/60*Math.PI*2;
  const bob=4.2*Math.sin(beat*2+0.3);
  const rot=0.035*Math.sin(beat+0.5)+0.018*Math.sin(beat*0.5);
  const out=bugRest.map((s,i)=>[[...s[0]],[...s[1]]]);
  // Body flex and alternating leg swing based on the observed dance: compact/open poses every ~eighth/quarter note.
  out[0][0][1]+=2*Math.sin(beat); out[0][1][1]-=2*Math.sin(beat);
  const swing=[0.0,1.4,2.7,4.1,5.2,0.8,2.1,3.4];
  for(let i=1;i<out.length;i++){
    out[i][1][0]+=11*Math.sin(beat+swing[i]);
    out[i][1][1]+=6*Math.cos(beat*2+swing[i]);
    out[i][0][1]+=2.5*Math.sin(beat*2+swing[i]);
  }
  // A more exaggerated front/rear "dance" kick on alternating beats.
  out[2][1][0]-=7*Math.max(0,Math.sin(beat));
  out[6][1][0]+=8*Math.max(0,-Math.sin(beat));
  return {segs:out,bob,rot};
}

function introMark(t,w,h){
  const cx=w*0.5, cy=h*0.38, s=Math.min(w/408,h/360)*0.78;
  const pulses=clamp(Math.floor((t-CUTS.introPulseStart)/0.3333)+1,0,9);
  let out=`<g transform="translate(${cx} ${cy}) scale(${s})">`;
  introPolys.forEach((p,i)=>{
    const outlined=i<pulses;
    out+=poly(p, outlined?`fill="none" stroke="#1675b8" stroke-width="5" stroke-linejoin="round"`:`fill="#1675b8"`);
  });
  out+='</g>';
  if(t<3.6) out+=`<text x="${w/2}" y="${h*0.545}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="${Math.min(w,h)*0.036}" letter-spacing="${Math.min(w,h)*0.012}" fill="#b7b7b7">SIGNAL BUG</text>`;
  return out;
}

function stageAndMorph(t,w,h){
  const cx=w*0.5, cy=h*0.38, s=Math.min(w/408,h/360)*0.92;
  let out='';
  const barY=h*0.59;
  const morph=clamp((t-CUTS.morphStart)/(CUTS.reveal-CUTS.morphStart));
  const barRot=-4*ease(morph);
  out+=`<rect x="${w*0.12}" y="${barY}" width="${w*0.76}" height="${Math.max(7,h*0.022)}" rx="4" fill="#b7afb6" transform="rotate(${barRot.toFixed(2)} ${w/2} ${barY})"/>`;
  if(t<CUTS.outlinePop){
    out+=`<g transform="translate(${cx} ${cy}) scale(${s})" filter="url(#softGlow)">`;
    markLines.forEach(seg=>out+=line(seg[0],seg[1],`stroke="#1778bd" stroke-width="8" stroke-linecap="round"`));
    out+='</g>';
  } else {
    out+=`<g transform="translate(${cx} ${cy}) scale(${s})">`;
    markLines.forEach((seg,i)=>{
      const u=ease(clamp((morph-i*0.035)/0.78));
      const m=mixSeg(seg,bugRest[i],u);
      out+=line(m[0],m[1],`stroke="#fff4df" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"`);
    });
    out+='</g>';
  }
  return out;
}

function bokeh(seed,x,y,r,color,op){return `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" opacity="${op}"/>`;}
function gardenBg(t,w,h){
  const u=clamp((t-CUTS.whipStart)/(CUTS.gardenStart-CUTS.whipStart));
  const dark=1-ease(u);
  let out=`<rect width="${w}" height="${h}" fill="#8e8188"/>`;
  if(u>0){
    out+=`<g opacity="${ease(u)}" filter="url(#bgBlur)"><rect width="${w}" height="${h}" fill="#b8bd8f"/>`;
    const blobs=[
      [.15,.16,.18,'#5e6f45',.9],[.35,.25,.22,'#d5dda6',.9],[.62,.18,.19,'#778b55',.8],[.82,.28,.25,'#cbd79b',.9],
      [.18,.58,.24,'#a6b66d',.8],[.46,.48,.18,'#edf0ba',.72],[.72,.55,.26,'#839b5e',.82],[.92,.65,.2,'#d6dd9e',.85]
    ];
    blobs.forEach((b,i)=>out+=bokeh(i,b[0]*w,b[1]*h,b[2]*w,b[3],b[4]));
    out+='</g>';
  }
  const ledgeY=lerp(h*0.60,h*0.58,ease(u));
  out+=`<path d="M0 ${ledgeY} L${w} ${ledgeY-7} L${w} ${h} L0 ${h} Z" fill="#d8d3c0"/>`;
  out+=`<path d="M0 ${ledgeY+24} L${w} ${ledgeY+17} L${w} ${ledgeY+43} L0 ${ledgeY+49} Z" fill="#b3acae" opacity=".8"/>`;
  if(t>=CUTS.whipStart&&t<CUTS.gardenStart){
    const q=(t-CUTS.whipStart)/(CUTS.gardenStart-CUTS.whipStart);
    out+=`<rect x="${w*(.36+.4*q)}" y="0" width="${w*.18}" height="${h*.62}" fill="#443d42" opacity="${1-q}"/>`;
  }
  return out;
}

function danceBug(t,w,h){
  const {segs,bob,rot}=bugSegments(t);
  let q=0;
  if(t>=CUTS.whipStart&&t<CUTS.gardenStart)q=(t-CUTS.whipStart)/(CUTS.gardenStart-CUTS.whipStart);
  const after=clamp((t-CUTS.gardenStart)/0.35);
  const s0=Math.min(w/408,h/360)*1.0, s1=Math.min(w/408,h/360)*0.72;
  const s=lerp(s0,s1,ease(after));
  const x=lerp(w*.47,w*.63,ease(after))+ (q>0&&q<1 ? w*.11*Math.sin(q*Math.PI*3) : 0);
  const y=lerp(h*.40,h*.46,ease(after))+bob*s;
  let out=`<g>`;
  segs.forEach((seg,i)=>{
    const z=txLine(seg,x,y,s,rot);
    out+=line(z[0],z[1],`stroke="#fff6df" stroke-width="${Math.max(3,5.3*s)}" stroke-linecap="round" stroke-linejoin="round" opacity=".96"`);
  });
  out+=`<circle cx="${x+58*s}" cy="${y-10*s}" r="${3.4*s}" fill="#fff6df"/>`;
  out+='</g>';
  return out;
}

export function sceneSVG(t,{width=408,height=360,transparent=false,bugOnly=false}={}){
  t=((t%DURATION)+DURATION)%DURATION;
  const defs=`<defs>
    <filter id="softGlow"><feGaussianBlur stdDeviation="1.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="bgBlur"><feGaussianBlur stdDeviation="18"/></filter>
  </defs>`;
  let body='';
  if(bugOnly){
    if(t<CUTS.reveal)t=CUTS.reveal+(t%CUTS.reveal);
    body+=danceBug(t,width,height);
  } else if(t<CUTS.stageCut){
    if(!transparent) body+=`<rect width="100%" height="100%" fill="#ffffff"/>`;
    body+=introMark(t,width,height);
  } else if(t<CUTS.reveal){
    if(!transparent) body+=`<rect width="100%" height="100%" fill="#93868f"/>`;
    body+=stageAndMorph(t,width,height);
  } else {
    if(!transparent) body+=gardenBg(t,width,height);
    body+=danceBug(t,width,height);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${defs}${body}</svg>`;
}
