import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';
import { BPM, CUTS } from './scene.mjs';

const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const mix=(a,b,t)=>a+(b-a)*t;
const smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
const TAU=Math.PI*2;
const Y_AXIS=new THREE.Vector3(0,1,0);

function makeGardenTexture(){
  const c=document.createElement('canvas');
  c.width=512;c.height=512;
  const x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,0,512);
  g.addColorStop(0,'#d9dfad');g.addColorStop(.48,'#9eae72');g.addColorStop(1,'#607247');
  x.fillStyle=g;x.fillRect(0,0,512,512);
  const blobs=[
    [80,70,130,'rgba(67,91,46,.72)'],[220,95,115,'rgba(211,221,159,.72)'],
    [380,90,150,'rgba(89,112,59,.72)'],[470,210,135,'rgba(222,227,168,.68)'],
    [120,330,145,'rgba(135,155,87,.75)'],[300,300,95,'rgba(239,235,183,.56)'],
    [420,395,155,'rgba(83,107,59,.72)'],[240,500,150,'rgba(183,198,126,.68)']
  ];
  for(const [cx,cy,r,color] of blobs){
    const q=x.createRadialGradient(cx,cy,5,cx,cy,r);
    q.addColorStop(0,color);q.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=q;x.fillRect(cx-r,cy-r,r*2,r*2);
  }
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.needsUpdate=true;
  return tex;
}

function segmentMesh(material,radius=0.04,radial=8){
  const m=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,1,radial,1,false),material);
  m.castShadow=true;m.receiveShadow=false;
  return m;
}
function setSegment(mesh,a,b){
  const dir=new THREE.Vector3().subVectors(b,a);const len=dir.length();
  mesh.position.copy(a).add(b).multiplyScalar(.5);
  mesh.quaternion.setFromUnitVectors(Y_AXIS,dir.normalize());
  mesh.scale.set(1,len,1);
}

function createBug(){
  const ivory=new THREE.MeshStandardMaterial({color:0xf8f1d3,roughness:.84,metalness:0,emissive:0x17140b,emissiveIntensity:.11});
  const jointMat=new THREE.MeshStandardMaterial({color:0xeee6c7,roughness:.9,metalness:0,emissive:0x0d0b06,emissiveIntensity:.08});
  const root=new THREE.Group();
  const bodyRoot=new THREE.Group();root.add(bodyRoot);

  const abdomen=segmentMesh(ivory,.085,10), thorax=segmentMesh(ivory,.105,10);
  bodyRoot.add(abdomen,thorax);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.125,10,8),ivory);bodyRoot.add(head);
  const neck=new THREE.Mesh(new THREE.SphereGeometry(.08,8,6),jointMat);bodyRoot.add(neck);

  const antennae=[];
  for(const side of [-1,1]){
    const a=segmentMesh(ivory,.018,6),b=segmentMesh(ivory,.014,6);bodyRoot.add(a,b);antennae.push({side,a,b});
  }

  const legBases=[-.67,-.08,.52];
  const legDefs=[];
  for(let pair=0;pair<3;pair++) for(const side of [-1,1]){
    const upper=segmentMesh(ivory,.035,7),lower=segmentMesh(ivory,.029,7);
    const kneeJoint=new THREE.Mesh(new THREE.SphereGeometry(.045,7,5),jointMat);
    bodyRoot.add(upper,lower,kneeJoint);
    legDefs.push({pair,side,baseX:legBases[pair],upper,lower,kneeJoint});
  }

  const bodyA=new THREE.Vector3(-1.18,.13,0), bodyB=new THREE.Vector3(.50,.10,0), bodyC=new THREE.Vector3(.50,.10,0), bodyD=new THREE.Vector3(1.12,.04,0);
  setSegment(abdomen,bodyA,bodyB);setSegment(thorax,bodyC,bodyD);
  head.position.set(1.25,.02,0);neck.position.set(.53,.10,0);

  function update(rel){
    const beat=rel*BPM/60*TAU;
    const eighth=beat*2;
    root.position.y=.055*Math.sin(eighth+.35)+.018*Math.sin(beat*.5);
    root.rotation.z=.058*Math.sin(beat+.55)+.018*Math.sin(eighth*.5);
    root.rotation.y=.024*Math.sin(beat*.5+.9);
    bodyRoot.rotation.x=.022*Math.sin(eighth+.4);

    for(const l of legDefs){
      const phase=[0,Math.PI*.72,Math.PI*1.36][l.pair] + (l.side<0?0:Math.PI);
      const s=Math.sin(eighth+phase), c=Math.cos(eighth+phase);
      const base=new THREE.Vector3(l.baseX,.06,l.side*.09);
      const dirX=[-1.00,-.28,.92][l.pair];
      const spread=[1.12,.82,1.08][l.pair];
      const foot=new THREE.Vector3(
        l.baseX+dirX+(.20+.04*l.pair)*s,
        -.93 + .22*Math.pow(Math.max(0,c),2),
        l.side*(spread+.12*Math.sin(beat+phase))
      );
      const knee=new THREE.Vector3(
        mix(base.x,foot.x,.50)+.12*Math.sin(eighth+phase+.5),
        mix(base.y,foot.y,.44)+.34+.06*Math.cos(eighth+phase),
        mix(base.z,foot.z,.48)
      );
      setSegment(l.upper,base,knee);setSegment(l.lower,knee,foot);l.kneeJoint.position.copy(knee);
    }

    head.position.y=.02+.025*Math.sin(eighth+1.1);
    antennae.forEach(({side,a,b})=>{
      const p0=new THREE.Vector3(1.31,.05,side*.045);
      const p1=new THREE.Vector3(1.70,.17+.035*Math.sin(eighth+side),side*.22);
      const p2=new THREE.Vector3(2.10,.10+.05*Math.sin(beat+side*.8),side*.38);
      setSegment(a,p0,p1);setSegment(b,p1,p2);
    });
  }
  update(0);
  return {root,update};
}

export function createStickBug3D(canvas){
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x93868f,1);
  const scene=new THREE.Scene();scene.fog=new THREE.Fog(0x92878e,8.5,17);
  const camera=new THREE.PerspectiveCamera(23,408/360,.1,50);

  scene.add(new THREE.HemisphereLight(0xfff9e9,0x51474d,2.25));
  const key=new THREE.DirectionalLight(0xfff2d0,3.4);key.position.set(-3,5,6);key.castShadow=true;key.shadow.mapSize.set(1024,1024);scene.add(key);
  const fill=new THREE.DirectionalLight(0xb8c9ff,.65);fill.position.set(4,1,2);scene.add(fill);

  const world=new THREE.Group();scene.add(world);
  const mauveMat=new THREE.MeshBasicMaterial({color:0x93868f,transparent:true,opacity:1});
  const gardenMat=new THREE.MeshBasicMaterial({map:makeGardenTexture(),transparent:true,opacity:0});
  const mauve=new THREE.Mesh(new THREE.PlaneGeometry(24,16),mauveMat);mauve.position.set(0,2,-6);world.add(mauve);
  const garden=new THREE.Mesh(new THREE.PlaneGeometry(24,16),gardenMat);garden.position.set(0,2,-5.95);world.add(garden);

  const ledgeMat=new THREE.MeshStandardMaterial({color:0xd8d1bd,roughness:.92});
  const ledge=new THREE.Mesh(new THREE.BoxGeometry(9,.42,2.7),ledgeMat);ledge.position.set(.2,-1.12,.2);ledge.receiveShadow=true;world.add(ledge);
  const edgeMat=new THREE.MeshStandardMaterial({color:0xb8afb0,roughness:.95});
  const edge=new THREE.Mesh(new THREE.BoxGeometry(9,.18,2.73),edgeMat);edge.position.set(.2,-1.37,.2);edge.receiveShadow=true;world.add(edge);

  const bug=createBug();world.add(bug.root);
  const target=new THREE.Vector3();
  let width=0,height=0;

  function resize(){
    const rect=canvas.getBoundingClientRect();
    const w=Math.max(2,Math.round(rect.width)),h=Math.max(2,Math.round(rect.height));
    if(w!==width||h!==height){
      width=w;height=h;renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
    }
  }

  function renderTime(t){
    resize();
    const rel=Math.max(0,t-CUTS.reveal);bug.update(rel);
    const whip=smooth((t-CUTS.whipStart)/(CUTS.gardenStart-CUTS.whipStart));
    const gardenSettle=smooth((t-CUTS.gardenStart)/.42);
    const q=Math.max(whip,gardenSettle);

    mauveMat.opacity=1-q;gardenMat.opacity=q;
    scene.fog.color.set(q>.5?0x8fa06b:0x92878e);
    ledge.material.color.setRGB(mix(.847,.76,q),mix(.82,.75,q),mix(.74,.64,q));

    if(t<CUTS.whipStart){
      bug.root.position.x=-.15;bug.root.position.z=.05;bug.root.scale.setScalar(1.08);
      camera.position.set(.15,.74,7.25);target.set(.08,-.03,0);
      ledge.position.x=.2;edge.position.x=.2;world.rotation.z=-.012;
    }else if(t<CUTS.gardenStart){
      const j=Math.sin(whip*Math.PI*6)*(1-whip);
      bug.root.position.x=mix(-.15,1.55,whip)+j*.36;bug.root.position.z=mix(.05,-.30,whip);bug.root.scale.setScalar(mix(1.08,.72,whip));
      camera.position.set(mix(.15,-2.75,whip)+j*.65,mix(.74,1.42,whip),mix(7.25,7.0,whip));
      target.set(mix(.08,1.3,whip),mix(-.03,-.16,whip),0);
      ledge.position.x=mix(.2,1.7,whip);edge.position.x=ledge.position.x;world.rotation.z=mix(-.012,-.038,whip)+j*.025;
    }else{
      bug.root.position.x=1.58;bug.root.position.z=-.32;bug.root.scale.setScalar(.72);
      camera.position.set(-2.75,1.42,7.0);target.set(1.30,-.16,0);
      ledge.position.x=1.7;edge.position.x=1.7;world.rotation.z=-.038;
    }
    camera.lookAt(target);
    renderer.render(scene,camera);
  }

  function dispose(){
    scene.traverse(o=>{if(o.geometry)o.geometry.dispose?.();if(o.material){const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>{m.map?.dispose?.();m.dispose?.();});}});renderer.dispose();
  }
  return {renderTime,resize,dispose};
}
