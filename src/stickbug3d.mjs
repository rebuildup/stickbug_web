import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';
import {CUTS,BPM} from './scene.mjs';

const REF_W=408,REF_H=360;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const mix=(a,b,t)=>a+(b-a)*t;
const smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
const mix2=(a,b,t)=>[mix(a[0],b[0],t),mix(a[1],b[1],t)];
const mixPts=(a,b,t)=>a.map((p,i)=>mix2(p,b[Math.min(i,b.length-1)],t));
const Y_AXIS=new THREE.Vector3(0,1,0);

const KEYS=[
  {
    t:CUTS.first3D,
    camera:{pos:[-1.8,1.1,7.5],target:[0.1,0.0,0]},
    body:[[172,57],[207,79],[224,88],[279,89],[295,89]],
    legs:[
      [[179,64],[132,92],[84,135]],
      [[175,72],[157,103],[96,135]],
      [[207,79],[181,108],[148,139]],
      [[207,79],[190,110],[168,141]],
      [[224,88],[214,114],[203,144]],
      [[279,89],[285,119],[286,151]],
    ],
    railTop:[[0,132],[408,167],[408,181],[0,145]],
    railFront:[[0,145],[408,181],[408,360],[0,360]],
    bg:'mauve',bugAlpha:.96,bugThickness:1.0,
  },
  {
    t:CUTS.preWhip,
    camera:{pos:[0.1,1.0,6.1],target:[0.5,0.0,0]},
    body:[[239,111],[254,126],[272,150],[302,150],[315,151]],
    legs:[
      [[239,111],[190,144],[139,181]],
      [[243,118],[211,151],[181,191]],
      [[254,126],[232,158],[218,199]],
      [[272,150],[258,177],[245,206]],
      [[286,150],[278,180],[267,210]],
      [[310,151],[311,184],[313,216]],
    ],
    railTop:[[0,175],[408,240],[408,256],[0,190]],
    railFront:[[0,190],[408,256],[408,360],[0,360]],
    bg:'post',bugAlpha:.96,bugThickness:1.0,
  },
  {
    t:CUTS.garden,
    camera:{pos:[3.9,1.35,4.9],target:[1.4,-0.1,0]},
    body:[[174,126],[200,128],[226,140],[267,158],[308,181]],
    legs:[
      [[184,127],[169,153],[151,188]],
      [[199,130],[191,159],[180,189]],
      [[226,140],[214,164],[205,190]],
      [[246,151],[239,171],[233,191]],
      [[267,158],[269,178],[266,194]],
      [[301,177],[306,188],[311,201]],
    ],
    railTop:[[0,189],[329,188],[408,237],[408,259],[0,244]],
    railFront:[[0,244],[408,259],[408,322],[0,322]],
    bg:'forest',bugAlpha:.42,bugThickness:.62,
  },
];

function lerpCamera(a,b,t,camera){
  camera.position.set(mix(a.pos[0],b.pos[0],t),mix(a.pos[1],b.pos[1],t),mix(a.pos[2],b.pos[2],t));
  const target=new THREE.Vector3(mix(a.target[0],b.target[0],t),mix(a.target[1],b.target[1],t),mix(a.target[2],b.target[2],t));
  camera.lookAt(target);camera.updateMatrixWorld(true);
}
function keySpan(t){
  if(t<=KEYS[0].t)return [KEYS[0],KEYS[0],0];
  for(let i=0;i<KEYS.length-1;i++) if(t<=KEYS[i+1].t){const a=KEYS[i],b=KEYS[i+1];return [a,b,smooth((t-a.t)/(b.t-a.t))];}
  return [KEYS.at(-1),KEYS.at(-1),0];
}
function screenToWorld(px,py,depth,camera){
  const ndc=new THREE.Vector3(px/REF_W*2-1,1-py/REF_H*2,0.0);
  ndc.unproject(camera);
  const dir=ndc.sub(camera.position).normalize();
  return camera.position.clone().add(dir.multiplyScalar(depth));
}
function setSegment(mesh,a,b,radius=1){
  const dir=new THREE.Vector3().subVectors(b,a);const len=dir.length();
  mesh.position.copy(a).add(b).multiplyScalar(.5);
  mesh.quaternion.setFromUnitVectors(Y_AXIS,dir.clone().normalize());
  mesh.scale.set(radius,len,radius);
}
function makeSegment(material,r=.022){
  const g=new THREE.CylinderGeometry(r,r,1,8,1,false);const m=new THREE.Mesh(g,material);m.renderOrder=5;return m;
}
function updatePoly(mesh,pts,camera,depth){
  const world=pts.map(p=>screenToWorld(p[0],p[1],depth,camera));
  const arr=mesh.geometry.attributes.position.array;
  const src=mesh.userData.indices;
  for(let i=0;i<src.length;i++){const p=world[src[i]];arr[i*3]=p.x;arr[i*3+1]=p.y;arr[i*3+2]=p.z;}
  mesh.geometry.attributes.position.needsUpdate=true;mesh.geometry.computeVertexNormals();
}
function polygonMesh(n,material){
  const indices=[];for(let i=1;i<n-1;i++)indices.push(0,i,i+1);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(indices.length*3),3));
  const m=new THREE.Mesh(g,material);m.userData.indices=indices;m.renderOrder=2;return m;
}

function drawMauve(ctx){
  ctx.fillStyle='#8f858c';ctx.fillRect(0,0,REF_W,REF_H);
  const g=ctx.createLinearGradient(300,0,390,0);g.addColorStop(0,'rgba(245,236,225,0)');g.addColorStop(.55,'rgba(247,239,224,.26)');g.addColorStop(1,'rgba(245,237,220,0)');ctx.fillStyle=g;ctx.fillRect(270,0,138,220);
  ctx.fillStyle='rgba(67,59,64,.13)';ctx.fillRect(0,0,75,190);
}
function drawPost(ctx){
  ctx.fillStyle='#81777f';ctx.fillRect(0,0,REF_W,REF_H);
  const g=ctx.createLinearGradient(0,0,REF_W,0);g.addColorStop(0,'rgba(70,65,69,.05)');g.addColorStop(.68,'rgba(123,111,116,.1)');g.addColorStop(.79,'#e9ddb8');g.addColorStop(1,'#f7e9b9');ctx.fillStyle=g;ctx.fillRect(0,0,REF_W,265);
  ctx.fillStyle='rgba(232,231,224,.55)';ctx.fillRect(67,214,32,146);
  ctx.fillStyle='rgba(85,77,80,.28)';ctx.fillRect(72,0,18,223);
}
function blurBlob(ctx,x,y,r,color,alpha){ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle=color;ctx.shadowColor=color;ctx.shadowBlur=r*.75;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.restore();}
function drawForest(ctx){
  const g=ctx.createLinearGradient(0,0,0,REF_H);g.addColorStop(0,'#d9e3ad');g.addColorStop(.52,'#aebd78');g.addColorStop(1,'#71884d');ctx.fillStyle=g;ctx.fillRect(0,0,REF_W,REF_H);
  ctx.save();ctx.filter='blur(18px)';
  blurBlob(ctx,195,50,80,'#ecf0bc',.55);blurBlob(ctx,286,56,95,'#779451',.55);blurBlob(ctx,360,110,90,'#94ac61',.62);blurBlob(ctx,245,155,78,'#dce7ac',.45);blurBlob(ctx,355,190,120,'#5f7b41',.42);ctx.restore();
  ctx.fillStyle='#18171b';ctx.fillRect(0,0,48,178);
  ctx.fillStyle='rgba(248,244,220,.75)';ctx.fillRect(58,0,58,155);
  ctx.fillStyle='rgba(45,39,37,.62)';ctx.fillRect(119,0,18,170);
}
function updateBackground(ctx,tex,t){
  const [a,b,u]=keySpan(t);ctx.clearRect(0,0,REF_W,REF_H);
  const ca=document.createElement('canvas'),cb=document.createElement('canvas');ca.width=cb.width=REF_W;ca.height=cb.height=REF_H;
  const da=ca.getContext('2d'),db=cb.getContext('2d');
  ({mauve:drawMauve,post:drawPost,forest:drawForest}[a.bg])(da);
  ({mauve:drawMauve,post:drawPost,forest:drawForest}[b.bg])(db);
  ctx.globalAlpha=1;ctx.drawImage(ca,0,0);ctx.globalAlpha=u;ctx.drawImage(cb,0,0);ctx.globalAlpha=1;tex.needsUpdate=true;
}

export function createStickBug3D(canvas){
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(28,REF_W/REF_H,.1,30);camera.position.set(0,0,7);
  const bgCanvas=document.createElement('canvas');bgCanvas.width=REF_W;bgCanvas.height=REF_H;const bgCtx=bgCanvas.getContext('2d');const bgTex=new THREE.CanvasTexture(bgCanvas);bgTex.colorSpace=THREE.SRGBColorSpace;scene.background=bgTex;
  scene.add(new THREE.HemisphereLight(0xfff9e8,0x3b3537,2.2));const key=new THREE.DirectionalLight(0xfff3d7,3.0);key.position.set(-2,5,5);scene.add(key);

  const railTopMat=new THREE.MeshStandardMaterial({color:0xd7d0c1,roughness:.9,metalness:0,side:THREE.DoubleSide});
  const railFrontMat=new THREE.MeshStandardMaterial({color:0xbfb8aa,roughness:.95,metalness:0,side:THREE.DoubleSide});
  const railTop=polygonMesh(5,railTopMat),railFront=polygonMesh(4,railFrontMat);scene.add(railFront,railTop);
  const darkFront=polygonMesh(4,new THREE.MeshBasicMaterial({color:0x81717f,side:THREE.DoubleSide}));scene.add(darkFront);

  const bugMat=new THREE.MeshStandardMaterial({color:0xf7f1d8,roughness:.82,emissive:0x151207,emissiveIntensity:.10,transparent:true,opacity:.96});
  const body=[];for(let i=0;i<4;i++){const m=makeSegment(bugMat,.028);scene.add(m);body.push(m);}
  const head=new THREE.Mesh(new THREE.SphereGeometry(.050,10,8),bugMat);scene.add(head);
  const legs=[];for(let i=0;i<6;i++){const a=makeSegment(bugMat,.021),b=makeSegment(bugMat,.018);scene.add(a,b);legs.push([a,b]);}

  const postMat=new THREE.MeshBasicMaterial({color:0xf1e3b7,side:THREE.DoubleSide,transparent:true,opacity:0});
  const post=polygonMesh(4,postMat);scene.add(post);post.renderOrder=10;

  let lastW=0,lastH=0;
  function resize(){const r=canvas.getBoundingClientRect();const w=Math.max(2,Math.round(r.width)),h=Math.max(2,Math.round(r.height));if(w!==lastW||h!==lastH){lastW=w;lastH=h;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}}
  function renderTime(t){
    resize();
    const [a,b,u]=keySpan(t);lerpCamera(a.camera,b.camera,u,camera);updateBackground(bgCtx,bgTex,t);
    const bodyPts=mixPts(a.body,b.body,u);
    const legPts=a.legs.map((leg,i)=>leg.map((p,j)=>mix2(p,b.legs[i][j],u)));
    const railTopPts=mixPts(a.railTop,b.railTop,u), railFrontPts=mixPts(a.railFront,b.railFront,u);
    const bugThickness=mix(a.bugThickness,b.bugThickness,u);bugMat.opacity=mix(a.bugAlpha,b.bugAlpha,u);
    const between=Math.sin(Math.PI*u)**2;const phase=(t-CUTS.reveal)*BPM/60*Math.PI*2;const dx=between*3.2*Math.sin(phase),dy=between*4.2*Math.cos(phase);
    bodyPts.forEach((p,i)=>{p[0]+=dx*(i/Math.max(1,bodyPts.length-1));p[1]+=dy;});
    for(let i=0;i<body.length;i++) setSegment(body[i],screenToWorld(bodyPts[i][0],bodyPts[i][1],5.4-.05*i,camera),screenToWorld(bodyPts[i+1][0],bodyPts[i+1][1],5.4-.05*(i+1),camera),bugThickness);
    head.position.copy(screenToWorld(bodyPts.at(-1)[0],bodyPts.at(-1)[1],5.18,camera));
    legPts.forEach((leg,i)=>{
      const base=leg[0].slice(),knee=leg[1].slice(),foot=leg[2].slice();base[0]+=dx*.45;base[1]+=dy*.75;knee[0]+=dx*.20*Math.sin(i+phase);knee[1]+=dy*.35;
      const z=5.38+(i%2?0.13:-0.10);setSegment(legs[i][0],screenToWorld(base[0],base[1],z,camera),screenToWorld(knee[0],knee[1],z+.03,camera),bugThickness);setSegment(legs[i][1],screenToWorld(knee[0],knee[1],z+.03,camera),screenToWorld(foot[0],foot[1],5.55,camera),bugThickness);
    });
    updatePoly(railTop,railTopPts,camera,5.62);updatePoly(railFront,railFrontPts,camera,5.66);
    updatePoly(darkFront,[[0,322],[408,322],[408,360],[0,360]],camera,5.70);darkFront.visible=t>=CUTS.garden-.03;
    const postOpacity=1-smooth(Math.abs(t-CUTS.preWhip)/0.55);postMat.opacity=.92*postOpacity;post.visible=postOpacity>.01;updatePoly(post,[[321,-5],[410,-5],[410,223],[321,205]],camera,4.7);
    renderer.render(scene,camera);
  }
  return {renderTime,resize,dispose(){renderer.dispose();bgTex.dispose();}};
}
