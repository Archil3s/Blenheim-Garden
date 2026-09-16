import * as THREE from "three";

const timber = new THREE.MeshStandardMaterial({ color: 0x9a6742, roughness: 0.86 });
const timberEdge = new THREE.MeshStandardMaterial({ color: 0x69452f, roughness: 0.92 });
const soil = new THREE.MeshStandardMaterial({ color: 0x4b3024, roughness: 1 });
const mulch = new THREE.MeshStandardMaterial({ color: 0xb58a54, roughness: 0.96 });
const leaf = new THREE.MeshStandardMaterial({ color: 0x3e7d43, roughness: 0.82 });
const leafLight = new THREE.MeshStandardMaterial({ color: 0x67a653, roughness: 0.86 });
const stem = new THREE.MeshStandardMaterial({ color: 0x557842, roughness: 0.9 });
const redRoot = new THREE.MeshStandardMaterial({ color: 0xb9363e, roughness: 0.78 });
const metal = new THREE.MeshStandardMaterial({ color: 0x6f7976, roughness: 0.48, metalness: 0.32 });

type InspectItem = { title: string; subtitle?: string; lines: Array<{ label: string; value: string }> };

function seededRandom(seed: number) { let value = seed >>> 0; return () => { value = (value * 1664525 + 1013904223) >>> 0; return value / 0x100000000; }; }
function box(width:number,height:number,depth:number,material:THREE.Material,x:number,y:number,z:number){const mesh=new THREE.Mesh(new THREE.BoxGeometry(width,height,depth),material.clone());mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;return mesh;}
function inspectable(root:THREE.Object3D,item:InspectItem){root.traverse((object)=>{if(!object.userData.inspect){object.userData.inspect=item;object.userData.selectionRoot=root;}});}
function addLeafRing(root:THREE.Group,count:number,radius:number,y:number,scale:number){for(let i=0;i<count;i+=1){const angle=i/count*Math.PI*2;const mesh=new THREE.Mesh(new THREE.SphereGeometry(0.11*scale,10,7),(i%2?leaf:leafLight).clone());mesh.scale.set(1.6,0.24,0.82);mesh.position.set(Math.cos(angle)*radius,y,Math.sin(angle)*radius);mesh.rotation.y=-angle;mesh.castShadow=true;root.add(mesh);}}
function lettuce(seed:number){const r=seededRandom(seed),root=new THREE.Group();addLeafRing(root,12,.13,.08,1.25);addLeafRing(root,8,.07,.15,.95);root.rotation.y=r()*Math.PI*2;inspectable(root,{title:"Lettuce",lines:[{label:"Spacing",value:"28 cm"}]});return root;}
function spinach(seed:number){const r=seededRandom(seed),root=new THREE.Group();addLeafRing(root,10,.105,.09,.95);addLeafRing(root,6,.055,.15,.72);root.rotation.y=r()*Math.PI*2;inspectable(root,{title:"Spinach",lines:[{label:"Spacing",value:"20 cm"}]});return root;}
function carrot(seed:number){const r=seededRandom(seed),root=new THREE.Group();for(let i=0;i<8;i++){const blade=new THREE.Mesh(new THREE.ConeGeometry(.018,.32+r()*.08,6),(i%2?leaf:leafLight).clone());const a=i/8*Math.PI*2;blade.position.set(Math.cos(a)*.045,.17,Math.sin(a)*.045);blade.rotation.z=(r()-.5)*.32;root.add(blade);}inspectable(root,{title:"Carrot",lines:[{label:"Spacing",value:"7 cm"}]});return root;}
function radish(seed:number){const r=seededRandom(seed),root=new THREE.Group();const bulb=new THREE.Mesh(new THREE.SphereGeometry(.045,9,7),redRoot.clone());bulb.scale.y=.8;bulb.position.y=.025;root.add(bulb);addLeafRing(root,6,.05,.11,.55);root.rotation.y=r()*Math.PI*2;inspectable(root,{title:"Radish",lines:[{label:"Spacing",value:"8 cm"}]});return root;}
function springOnion(seed:number){const r=seededRandom(seed),root=new THREE.Group();for(let i=0;i<5;i++){const blade=new THREE.Mesh(new THREE.CylinderGeometry(.008,.012,.34+r()*.08,6),(i%2?leaf:leafLight).clone());blade.position.set((i-2)*.012,.18,(r()-.5)*.025);blade.rotation.z=(r()-.5)*.18;root.add(blade);}inspectable(root,{title:"Spring onion",lines:[{label:"Spacing",value:"6 cm"}]});return root;}
function climbingBean(seed:number){const r=seededRandom(seed),root=new THREE.Group();const vine=new THREE.Mesh(new THREE.CylinderGeometry(.012,.016,1.55,7),stem.clone());vine.position.y=.775;vine.rotation.z=(r()-.5)*.12;root.add(vine);for(let i=0;i<8;i++){const a=i*1.9,m=new THREE.Mesh(new THREE.SphereGeometry(.085,9,6),(i%2?leaf:leafLight).clone());m.scale.set(1.45,.23,.76);m.position.set(Math.cos(a)*.1,.24+i*.16,Math.sin(a)*.08);m.rotation.y=-a;root.add(m);}inspectable(root,{title:"Climbing bean",lines:[{label:"Spacing",value:"18 cm"}]});return root;}
function addTrellis(root:THREE.Group){const t=new THREE.Group();for(const x of[-.86,0,.86])t.add(box(.045,1.85,.045,timberEdge,x,.925,-1.72));for(const y of[.35,.7,1.05,1.4,1.75])t.add(box(1.76,.018,.018,metal,0,y,-1.72));for(const x of[-.58,-.29,.29,.58])t.add(box(.014,1.42,.014,metal,x,1.03,-1.72));root.add(t);}
function addMulch(root:THREE.Group,mobile:boolean){root.add(box(1.72,.018,3.7,mulch,0,.255,0));const count=mobile?36:90,r=seededRandom(0x2a4bed);for(let i=0;i<count;i++){const straw=box(.1+r()*.14,.009,.012,mulch,(r()-.5)*1.58,.268,(r()-.5)*3.55);straw.rotation.y=r()*Math.PI;root.add(straw);}}
function addFullRow(root:THREE.Group,z:number,spacing:number,maker:(seed:number)=>THREE.Group,seed:number,mobile:boolean){const width=1.56,effective=mobile?Math.max(spacing,.13):spacing,count=Math.floor(width/effective)+1;for(let i=0;i<count;i++){const plant=maker(seed+i),x=count===1?0:-width/2+i*width/(count-1);plant.position.set(x,.27,z);root.add(plant);}}

export function addDemonstrationBed3D(group:THREE.Group,mobile:boolean){const root=new THREE.Group(),width=2,depth=4,wallHeight=.28,rail=.1;root.add(box(width-.18,.18,depth-.18,soil,0,.16,0));root.add(box(width+rail,wallHeight,rail,timber,0,wallHeight/2,-depth/2));root.add(box(width+rail,wallHeight,rail,timberEdge,0,wallHeight/2,depth/2));root.add(box(rail,wallHeight,depth,timber,-width/2,wallHeight/2,0));root.add(box(rail,wallHeight,depth,timberEdge,width/2,wallHeight/2,0));addMulch(root,mobile);addTrellis(root);
  addFullRow(root,-1.48,.18,climbingBean,200,mobile);
  addFullRow(root,-.88,.28,lettuce,300,mobile);
  addFullRow(root,-.28,.20,spinach,400,mobile);
  addFullRow(root,.32,.07,carrot,500,mobile);
  addFullRow(root,.92,.08,radish,600,mobile);
  addFullRow(root,1.52,.06,springOnion,700,mobile);
  inspectable(root,{title:"2 × 4 m demonstration bed",subtitle:"Full-row vegetable planting benchmark",lines:[{label:"Size",value:"2.0 × 4.0 m"},{label:"Rows",value:"6 complete crop rows"},{label:"Planting",value:"Bean, lettuce, spinach, carrot, radish, spring onion"}]});group.add(root);return root;}
