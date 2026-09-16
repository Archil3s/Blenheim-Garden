import * as THREE from "three";

const wood = new THREE.MeshStandardMaterial({ color: 0xb47b4f, roughness: 0.9 });
const woodDark = new THREE.MeshStandardMaterial({ color: 0x765039, roughness: 0.96 });
const soil = new THREE.MeshStandardMaterial({ color: 0x20150f, roughness: 1 });
const soilRow = new THREE.MeshStandardMaterial({ color: 0x34231a, roughness: 1 });
const stem = new THREE.MeshStandardMaterial({ color: 0x355f30, roughness: 0.95 });
const cane = new THREE.MeshStandardMaterial({ color: 0xb6925d, roughness: 0.94 });
const radishRed = new THREE.MeshStandardMaterial({ color: 0xb5293d, roughness: 0.88 });
const leafMats = [0x285d2d,0x39783a,0x4d8a43,0x65984e,0x78a858].map(color=>new THREE.MeshStandardMaterial({color,roughness:.96,side:THREE.DoubleSide}));
type InspectItem={title:string;subtitle?:string;lines:Array<{label:string;value:string}>};
function rng(seed:number){let v=seed>>>0;return()=>{v=(v*1664525+1013904223)>>>0;return v/0x100000000;};}
function box(w:number,h:number,d:number,m:THREE.Material,x:number,y:number,z:number){const q=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m.clone());q.position.set(x,y,z);q.castShadow=true;q.receiveShadow=true;return q;}
function inspectable(root:THREE.Object3D,item:InspectItem){root.traverse(o=>{if(!o.userData.inspect){o.userData.inspect=item;o.userData.selectionRoot=root;}});}
function leaf(length:number,width:number,mat:number){const q=new THREE.Mesh(new THREE.SphereGeometry(.5,10,6),leafMats[mat%leafMats.length].clone());q.scale.set(width,length*.11,length);q.castShadow=true;return q;}
function rosette(seed:number,size:number,layers:number){const r=rng(seed),root=new THREE.Group();for(let layer=0;layer<layers;layer++){const n=11-layer*2;for(let i=0;i<n;i++){const a=i/n*Math.PI*2+r()*.25,l=size*(.8-layer*.12)*(.9+r()*.18),q=leaf(l,size*.24*(.9+r()*.18),Math.floor(r()*5));q.position.set(Math.cos(a)*size*(.25-layer*.04),size*(.1+layer*.065),Math.sin(a)*size*(.25-layer*.04));q.rotation.set(-.25-r()*.28,-a,(r()-.5)*.22);root.add(q);}}root.rotation.y=r()*Math.PI*2;return root;}
function lettuce(seed:number){const g=rosette(seed,.36,3);inspectable(g,{title:"Lettuce (mixed)",lines:[{label:"Spacing",value:"28 cm"}]});return g;}
function spinach(seed:number){const g=rosette(seed,.29,3);g.scale.y=.78;inspectable(g,{title:"Spinach",lines:[{label:"Spacing",value:"20 cm"}]});return g;}
function carrot(seed:number){const r=rng(seed),g=new THREE.Group();for(let i=0;i<14;i++){const q=leaf(.26+r()*.13,.018+r()*.013,i),a=r()*Math.PI*2;q.position.set(Math.cos(a)*.035,.13,Math.sin(a)*.035);q.rotation.set(-.08-r()*.14,-a,(r()-.5)*.5);g.add(q);}inspectable(g,{title:"Carrot",lines:[{label:"Spacing",value:"7 cm"}]});return g;}
function radish(seed:number){const g=rosette(seed,.17,2),bulb=new THREE.Mesh(new THREE.SphereGeometry(.043,10,7),radishRed.clone());bulb.scale.y=.8;bulb.position.y=.025;g.add(bulb);inspectable(g,{title:"Radish",lines:[{label:"Spacing",value:"8 cm"}]});return g;}
function onion(seed:number){const r=rng(seed),g=new THREE.Group();for(let i=0;i<5;i++){const h=.34+r()*.18,q=new THREE.Mesh(new THREE.CylinderGeometry(.004,.009,h,7),leafMats[i%4].clone());q.position.set((r()-.5)*.035,h/2,(r()-.5)*.035);q.rotation.z=(r()-.5)*.14;g.add(q);}inspectable(g,{title:"Spring onions",lines:[{label:"Spacing",value:"6 cm"}]});return g;}
function bean(seed:number){const r=rng(seed),g=new THREE.Group();const vine=new THREE.Mesh(new THREE.CylinderGeometry(.008,.013,1.45,7),stem.clone());vine.position.y=.72;g.add(vine);for(let i=0;i<18;i++){const a=i*1.48+r()*.4,q=leaf(.2+r()*.09,.065+r()*.02,i);q.position.set(Math.cos(a)*(.07+r()*.055),.14+i*.075,Math.sin(a)*.07);q.rotation.set((r()-.5)*.35,-a,(r()-.5)*.25);g.add(q);}inspectable(g,{title:"Climbing beans",lines:[{label:"Spacing",value:"18 cm"},{label:"Support",value:"Bamboo trellis"}]});return g;}
function bambooTrellis(root:THREE.Group){const t=new THREE.Group(),z=-1.63;for(const x of[-.72,-.24,.24,.72]){const left=box(.025,1.72,.025,cane,x-.13,.88,z),right=box(.025,1.72,.025,cane,x+.13,.88,z);left.rotation.z=-.1;right.rotation.z=.1;t.add(left,right);}for(const y of[.65,1.15,1.58])t.add(box(1.72,.022,.022,cane,0,y,z));root.add(t);}
function rowMound(root:THREE.Group,z:number){root.add(box(1.66,.035,.31,soilRow,0,.305,z));}
function fullRow(root:THREE.Group,z:number,spacing:number,maker:(s:number)=>THREE.Group,seed:number,mobile:boolean){const width=1.62,effective=mobile?Math.max(spacing,.11):spacing,count=Math.floor(width/effective)+1,r=rng(seed*31);for(let i=0;i<count;i++){const p=maker(seed+i),x=count===1?0:-width/2+i*width/(count-1);p.position.set(x+(r()-.5)*.025,.32,z+(r()-.5)*.025);p.scale.multiplyScalar(.92+r()*.15);root.add(p);}}
function sign(root:THREE.Group,z:number,label:string){const g=new THREE.Group();g.add(box(.28,.105,.025,wood,.68,.47,z));g.add(box(.018,.23,.018,woodDark,.68,.35,z));g.userData.cropLabel=label;root.add(g);}
export function addDemonstrationBed3D(group:THREE.Group,mobile:boolean){
 const root=new THREE.Group(),width=2,depth=4,wall=.29,rail=.11;
 root.add(box(width-.18,.2,depth-.18,soil,0,.18,0));
 root.add(box(width+rail,wall,rail,wood,0,wall/2,-depth/2));root.add(box(width+rail,wall,rail,wood,0,wall/2,depth/2));root.add(box(rail,wall,depth,wood,-width/2,wall/2,0));root.add(box(rail,wall,depth,wood,width/2,wall/2,0));
 // Reference-photo proportions: warm timber, dark soil, six dense transverse rows, bamboo support at rear.
 bambooTrellis(root);
 const rows:[number,number,(s:number)=>THREE.Group,number,string][]=[[-1.47,.18,bean,200,"BEANS"],[-.88,.28,lettuce,300,"LETTUCE"],[-.29,.08,radish,400,"RADISH"],[.30,.07,carrot,500,"CARROT"],[.89,.20,spinach,600,"SPINACH"],[1.48,.06,onion,700,"SPRING ONIONS"]];
 rows.forEach(([z,spacing,maker,seed,label])=>{rowMound(root,z);fullRow(root,z,spacing,maker,seed,mobile);sign(root,z,label);});
 inspectable(root,{title:"2 × 4 m demonstration bed",subtitle:"Reference-photo reconstruction",lines:[{label:"Size",value:"2.0 × 4.0 m"},{label:"Layout",value:"6 full crop rows"},{label:"Reference",value:"Warm timber, dark soil, mature planting, bamboo trellis"}]});
 group.add(root);return root;
}
