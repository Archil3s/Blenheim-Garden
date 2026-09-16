import * as THREE from "three";

const timber = new THREE.MeshStandardMaterial({ color: 0xa8754e, roughness: 0.94 });
const timberDark = new THREE.MeshStandardMaterial({ color: 0x68432e, roughness: 1 });
const soil = new THREE.MeshStandardMaterial({ color: 0x241b16, roughness: 1 });
const soilRaised = new THREE.MeshStandardMaterial({ color: 0x33251d, roughness: 1 });
const stem = new THREE.MeshStandardMaterial({ color: 0x315a2f, roughness: 0.95 });
const wire = new THREE.MeshStandardMaterial({ color: 0x59615d, roughness: 0.55, metalness: 0.35 });
const radishRed = new THREE.MeshStandardMaterial({ color: 0x8e2732, roughness: 0.9 });
const leafMats = [0x315f32,0x3d733a,0x4b8244,0x557f3d,0x668d49].map(color => new THREE.MeshStandardMaterial({ color, roughness: 0.96, side: THREE.DoubleSide }));

type InspectItem={title:string;subtitle?:string;lines:Array<{label:string;value:string}>};
function rng(seed:number){let v=seed>>>0;return()=>{v=(v*1664525+1013904223)>>>0;return v/0x100000000;};}
function box(w:number,h:number,d:number,m:THREE.Material,x:number,y:number,z:number){const q=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m.clone());q.position.set(x,y,z);q.castShadow=true;q.receiveShadow=true;return q;}
function inspectable(root:THREE.Object3D,item:InspectItem){root.traverse(o=>{if(!o.userData.inspect){o.userData.inspect=item;o.userData.selectionRoot=root;}});}
function leafMesh(length:number,width:number,mat:number){const g=new THREE.SphereGeometry(0.5,8,5);const m=new THREE.Mesh(g,leafMats[mat%leafMats.length].clone());m.scale.set(width,length*0.12,length);m.castShadow=true;return m;}
function rosette(seed:number,size:number,layers:number){const r=rng(seed),root=new THREE.Group();for(let layer=0;layer<layers;layer++){const count=9-layer*2;const radius=size*(0.28-layer*0.055);for(let i=0;i<count;i++){const a=i/count*Math.PI*2+r()*.35;const l=size*(0.75-layer*.12)*(0.88+r()*.22);const q=leafMesh(l,size*.24*(.9+r()*.2),Math.floor(r()*leafMats.length));q.position.set(Math.cos(a)*radius,size*(.11+layer*.07),Math.sin(a)*radius);q.rotation.set(-.2-r()*.3,-a,(r()-.5)*.25);root.add(q);}}root.rotation.y=r()*Math.PI*2;root.scale.setScalar(.9+r()*.2);return root;}
function lettuce(seed:number){const root=rosette(seed,.34,3);inspectable(root,{title:"Lettuce",subtitle:"Mature leafy head",lines:[{label:"Spacing",value:"28 cm"}]});return root;}
function spinach(seed:number){const root=rosette(seed,.25,2);root.scale.y=.82;inspectable(root,{title:"Spinach",subtitle:"Mature leafy row",lines:[{label:"Spacing",value:"20 cm"}]});return root;}
function carrot(seed:number){const r=rng(seed),root=new THREE.Group();for(let i=0;i<11;i++){const q=leafMesh(.28+r()*.13,.025+r()*.014,i);const a=r()*Math.PI*2;q.position.set(Math.cos(a)*.035,.14,Math.sin(a)*.035);q.rotation.set(-.08-r()*.15,-a,(r()-.5)*.45);root.add(q);}root.rotation.y=r()*Math.PI*2;inspectable(root,{title:"Carrot",subtitle:"Fine mature foliage",lines:[{label:"Spacing",value:"7 cm"}]});return root;}
function radish(seed:number){const r=rng(seed),root=rosette(seed,.17,2);const bulb=new THREE.Mesh(new THREE.SphereGeometry(.04,10,7),radishRed.clone());bulb.scale.set(1,.78,1);bulb.position.y=.025;root.add(bulb);root.rotation.y=r()*Math.PI*2;inspectable(root,{title:"Radish",subtitle:"Dense root-crop row",lines:[{label:"Spacing",value:"8 cm"}]});return root;}
function springOnion(seed:number){const r=rng(seed),root=new THREE.Group();for(let i=0;i<4;i++){const h=.28+r()*.16;const q=new THREE.Mesh(new THREE.CylinderGeometry(.005,.009,h,7),leafMats[i%3].clone());q.position.set((r()-.5)*.035,h/2,(r()-.5)*.035);q.rotation.z=(r()-.5)*.18;root.add(q);}inspectable(root,{title:"Spring onion",subtitle:"Mature upright row",lines:[{label:"Spacing",value:"6 cm"}]});return root;}
function climbingBean(seed:number){const r=rng(seed),root=new THREE.Group();const vine=new THREE.Mesh(new THREE.CylinderGeometry(.009,.014,1.55,7),stem.clone());vine.position.y=.775;vine.rotation.z=(r()-.5)*.08;root.add(vine);for(let i=0;i<15;i++){const a=i*1.55+r()*.5;const q=leafMesh(.22+r()*.08,.07+r()*.025,i);q.position.set(Math.cos(a)*(.08+r()*.06),.18+i*.09,Math.sin(a)*.07);q.rotation.set((r()-.5)*.4,-a,(r()-.5)*.25);root.add(q);}inspectable(root,{title:"Climbing bean",subtitle:"Full trellis vine",lines:[{label:"Spacing",value:"18 cm"},{label:"Height",value:"1.8 m"}]});return root;}
function trellis(root:THREE.Group){const t=new THREE.Group();for(const x of[-.86,0,.86])t.add(box(.045,1.85,.045,timberDark,x,.925,-1.72));for(const y of[.35,.7,1.05,1.4,1.75])t.add(box(1.76,.012,.012,wire,0,y,-1.72));for(const x of[-.58,-.29,.29,.58])t.add(box(.01,1.42,.01,wire,x,1.03,-1.72));root.add(t);}
function furrow(root:THREE.Group,z:number){root.add(box(1.62,.018,.24,soilRaised,0,.276,z));}
function fullRow(root:THREE.Group,z:number,spacing:number,maker:(s:number)=>THREE.Group,seed:number,mobile:boolean){const width=1.58;const effective=mobile?Math.max(spacing,.12):spacing;const count=Math.floor(width/effective)+1;const r=rng(seed*13);for(let i=0;i<count;i++){const p=maker(seed+i);const x=count===1?0:-width/2+i*width/(count-1);p.position.set(x+(r()-.5)*.025,.29,z+(r()-.5)*.035);p.scale.multiplyScalar(.92+r()*.16);root.add(p);}}
function rowMarker(root:THREE.Group,z:number){const sign=new THREE.Group();sign.add(box(.18,.09,.018,timber,.76,.48,z));sign.add(box(.018,.22,.018,timberDark,.76,.37,z));root.add(sign);}

export function addDemonstrationBed3D(group:THREE.Group,mobile:boolean){
 const root=new THREE.Group(),width=2,depth=4,wall=.3,rail=.11;
 root.add(box(width-.18,.2,depth-.18,soil,0,.17,0));
 root.add(box(width+rail,wall,rail,timber,0,wall/2,-depth/2));root.add(box(width+rail,wall,rail,timber,0,wall/2,depth/2));
 root.add(box(rail,wall,depth,timber,-width/2,wall/2,0));root.add(box(rail,wall,depth,timber,width/2,wall/2,0));
 // subtle timber caps give the demo bed the heavier photographic raised-bed profile
 root.add(box(width+.12,.055,.15,timberDark,0,.31,-depth/2));root.add(box(width+.12,.055,.15,timberDark,0,.31,depth/2));
 trellis(root);
 const rows:[number,number,(s:number)=>THREE.Group,number][]=[[-1.48,.18,climbingBean,200],[-.88,.28,lettuce,300],[-.28,.20,spinach,400],[.32,.07,carrot,500],[.92,.08,radish,600],[1.52,.06,springOnion,700]];
 rows.forEach(([z,spacing,maker,seed])=>{furrow(root,z);fullRow(root,z,spacing,maker,seed,mobile);rowMarker(root,z);});
 inspectable(root,{title:"2 × 4 m demonstration bed",subtitle:"Natural mature full-row benchmark",lines:[{label:"Size",value:"2.0 × 4.0 m"},{label:"Rows",value:"6 mature crop rows"},{label:"Style",value:"Natural foliage, dark soil, timber raised bed"}]});
 group.add(root);return root;
}
