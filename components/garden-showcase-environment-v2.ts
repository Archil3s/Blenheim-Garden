import * as THREE from "three";

/**
 * Environment V2: deterministic, locally generated garden environment.
 * Purely a rendering prototype. No D1, R2, HTTP, saved-plan or PlantGen access.
 *
 * Shared 2 × 4m demo-bed measurements and soil-height contract:
 *   x ±1m, z ±2m, frame top y≈0.42m, soil top y≈0.30m, crops at y=0.31m.
 *
 * Uses instancing for stones, ground cover, hedge/trees and mulch.
 * The materials are original procedural textures, NOT photo-scanned/PBR atlases.
 */
type EnvironmentStats = {
  grassBlades: number;
  gravelStones: number;
  foliageCards: number;
  drawCallsEstimate: number;
};
export type EnvironmentMode = "current" | "v2";

function rand(seed: number) {
  let state = seed >>> 0;
  return () => ((state = (Math.imul(1664525, state) + 1013904223) >>> 0) / 4294967296);
}
const clamp = (x: number, min = 0, max = 1) => Math.max(min, Math.min(max, x));
const lerp = THREE.MathUtils.lerp;

function noise(x: number, y: number, seed: number) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const hash = (a: number, b: number) => {
    const n = Math.sin((a * 127.1 + b * 311.7 + seed * 23.53) * 1.37) * 43758.545;
    return n - Math.floor(n);
  };
  const fx = x - xi, fy = y - yi;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  return lerp(lerp(hash(xi, yi), hash(xi + 1, yi), u),
    lerp(hash(xi, yi + 1), hash(xi + 1, yi + 1), u), v);
}

function surfaceTexture(kind: "grass" | "gravel" | "soil" | "timber" | "stone") {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 384;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Environment V2 requires Canvas 2D");
  const img = ctx.createImageData(384, 384);
  const palette: Record<typeof kind, [number, number, number]> = {
    grass: [89, 105, 68],
    gravel: [158, 143, 120],
    soil: [60, 48, 35],
    timber: [147, 112, 77],
    stone: [141, 134, 117],
  };
  const base = palette[kind];
  const rng = rand(kind.length * 787 + 19);
  for (let y = 0; y < 384; y++) {
    for (let x = 0; x < 384; x++) {
      const broad = noise(x / 48, y / 48, 42);
      const grain = noise(x / 7, y / 7, 61);
      const fine = rng();
      const timberGrain = Math.sin(y * 0.34 + Math.sin(x * .032) * 2 + broad * 4)
        + Math.sin(y * .095 + Math.sin(x * .017) * 3);
      let delta = (broad - .5) * 35 + (grain - .5) * 31 + (fine - .5) * 13;
      if (kind === "timber") delta = (broad - .5) * 22 + timberGrain * 12 + (fine - .5) * 8;
      if (kind === "gravel" || kind === "stone") delta = (broad - .5) * 38 + (grain - .5) * 26 + (fine - .5) * 15;
      const i = (y * 384 + x) * 4;
      img.data[i] = clamp(base[0] + delta, 0, 255);
      img.data[i + 1] = clamp(base[1] + delta * .9, 0, 255);
      img.data[i + 2] = clamp(base[2] + delta * .75, 0, 255);
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  if (kind === "timber") {
    const rng2 = rand(7444);
    for (let i = 0; i < 190; i++) {
      const y = rng2() * 384;
      ctx.beginPath();
      ctx.moveTo(-10, y);
      ctx.bezierCurveTo(130, y + rng2() * 5 - 2, 280, y + rng2() * 6 - 3, 400, y + rng2() * 3);
      ctx.strokeStyle = i % 3 ? "rgba(54,31,17,.15)" : "rgba(235,212,169,.18)";
      ctx.lineWidth = .35 + rng2() * 1.7;
      ctx.stroke();
    }
    // One offset knot helps the planks read as timber rather than smooth plastic.
    ctx.save();
    ctx.translate(232, 198);
    ctx.scale(1.9, .5);
    for (let radius = 7; radius < 40; radius += 5) {
      ctx.beginPath();
      ctx.ellipse(0, 0, radius, radius, .06, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(59,36,22,.13)";
      ctx.stroke();
    }
    ctx.restore();
  }
  if (kind === "gravel") {
    const rng2 = rand(193);
    for (let i = 0; i < 6000; i++) {
      ctx.fillStyle = i % 4 ? "rgba(230,220,197,.16)" : "rgba(61,55,48,.13)";
      ctx.beginPath();
      ctx.ellipse(rng2() * 384, rng2() * 384,
        .8 + rng2() * 2.4, .6 + rng2() * 1.6, rng2() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const result = new THREE.CanvasTexture(canvas);
  result.colorSpace = THREE.SRGBColorSpace;
  result.wrapS = result.wrapT = THREE.RepeatWrapping;
  result.anisotropy = 4;
  result.repeat.set(kind === "grass" ? 4 : kind === "gravel" ? 2 : 1, kind === "grass" ? 4 : kind === "gravel" ? 3 : 1);
  return result;
}

function leafTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128; canvas.height = 192;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Environment foliage requires Canvas 2D");
  ctx.clearRect(0, 0, 128, 192);
  ctx.beginPath();
  ctx.moveTo(64, 186);
  ctx.bezierCurveTo(19, 142, 14, 65, 65, 5);
  ctx.bezierCurveTo(117, 67, 109, 150, 64, 186);
  ctx.closePath();
  const grad = ctx.createLinearGradient(14, 0, 114, 190);
  grad.addColorStop(0, "#304f2c");
  grad.addColorStop(.47, "#628547");
  grad.addColorStop(1, "#a0ac6a");
  ctx.fillStyle = grad; ctx.fill();
  ctx.beginPath();
  ctx.moveTo(64, 184);
  ctx.quadraticCurveTo(66, 100, 65, 12);
  ctx.strokeStyle = "rgba(201,220,150,.63)";
  ctx.lineWidth = 2; ctx.stroke();
  for (let i = 0; i < 8; i++) {
    const y = 165 - i * 17;
    const w = Math.sin((1 - y / 192) * Math.PI) * 37;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(64, y + 6);
      ctx.quadraticCurveTo(64 + side * w * .5, y - 5, 64 + side * w, y - 18);
      ctx.strokeStyle = "rgba(212,231,164,.33)";
      ctx.lineWidth = 1.3; ctx.stroke();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function standard(color: THREE.ColorRepresentation, roughness = .9, map?: THREE.Texture) {
  return new THREE.MeshStandardMaterial({ color, roughness, map });
}
function addBox(
  group: THREE.Group, material: THREE.Material,
  width: number, height: number, depth: number,
  x: number, y: number, z: number, cast = true,
) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = cast; mesh.receiveShadow = true; group.add(mesh);
  return mesh;
}
function rod(group: THREE.Group, a: THREE.Vector3, b: THREE.Vector3, thickness: number, material: THREE.Material) {
  const delta = new THREE.Vector3().subVectors(b, a);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(thickness * .88, thickness, delta.length(), 6), material);
  mesh.position.copy(a).add(b).multiplyScalar(.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), delta.normalize());
  mesh.castShadow = true;
  group.add(mesh);
  return mesh;
}
function instances(
  group: THREE.Group, geometry: THREE.BufferGeometry, material: THREE.Material,
  count: number, fill: (obj: THREE.Object3D, i: number) => void, shadows = false,
) {
  const inst = new THREE.InstancedMesh(geometry, material, count);
  const obj = new THREE.Object3D();
  for (let i = 0; i < count; i++) {
    obj.position.set(0,0,0); obj.rotation.set(0,0,0); obj.scale.set(1,1,1);
    fill(obj, i);
    obj.updateMatrix();
    inst.setMatrixAt(i, obj.matrix);
  }
  inst.instanceMatrix.needsUpdate = true;
  inst.castShadow = shadows;
  inst.receiveShadow = false;
  group.add(inst);
  return inst;
}
function plane(group: THREE.Group, w: number, h: number, material: THREE.Material, x: number, y: number, z: number) {
  const surface = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
  surface.rotation.x = -Math.PI/2;
  surface.position.set(x,y,z);
  surface.receiveShadow = true;
  group.add(surface);
  return surface;
}

function terrain(group: THREE.Group, mobile: boolean) {
  const grassTex = surfaceTexture("grass");
  const grassMat = standard("#c4c7ae", .97, grassTex);
  const pathMat = standard("#f1e7d2", 1, surfaceTexture("gravel"));
  const stoneMat = standard("#d4cbbb", 1, surfaceTexture("stone"));
  const ground = new THREE.PlaneGeometry(13, 13, mobile ? 24 : 44, mobile ? 24 : 44);
  const pos = ground.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i);
    pos.setZ(i, (noise(x * 1.3, y * 1.3, 7) - .5) * .06 - .082);
  }
  ground.computeVertexNormals();
  const field = new THREE.Mesh(ground, grassMat);
  field.rotation.x = -Math.PI / 2;
  field.receiveShadow = true;
  group.add(field);

  // Existing bed dimensions stay unchanged. Paths are outside the 2m bed width.
  plane(group, 1.02, 5.75, pathMat, -1.63, -.026, 0);
  plane(group, 1.02, 5.75, pathMat, 1.63, -.026, 0);
  plane(group, 5.45, .91, pathMat, 0, -.022, 2.63);
  plane(group, 5.45, .84, pathMat, 0, -.024, -2.68);

  const stoneGeo = new THREE.DodecahedronGeometry(1, 0);
  const rng = rand(6007);
  const count = mobile ? 380 : 1100;
  instances(group, stoneGeo, stoneMat, count, obj => {
    const channel = Math.floor(rng() * 4);
    const x = channel === 0 ? -1.15 - rng() * 1.1 :
      channel === 1 ? 1.15 + rng() * 1.1 :
      -2.7 + rng() * 5.4;
    const z = channel === 2 ? 2.3 + rng() * .7 :
      channel === 3 ? -2.3 - rng() * .7 :
      -2.77 + rng() * 5.54;
    obj.position.set(x, -.007, z);
    const size = .008 + rng() * .029;
    obj.scale.set(size * 1.2, size * .29, size * (.7 + rng() * .7));
    obj.rotation.y = rng() * 6.28;
  });
  // Straight but non-uniform timber path edging.
  const edge = standard("#80684b", .95, surfaceTexture("timber"));
  for (const x of [-1.1, 1.1]) {
    addBox(group, edge, .055, .05, 5.48, x, -.006, 0);
  }
  for (const z of [-2.22, 2.22]) {
    addBox(group, edge, 2.25, .05, .055, 0, -.006, z);
  }
  return { gravelStones: count };
}

function bed(group: THREE.Group, mobile: boolean) {
  const wood = standard("#e2cfb0", .85, surfaceTexture("timber"));
  const endgrain = standard("#886849", .93);
  const timberSeam = standard("#775c42", .93);
  const soilMaterial = standard("#eee4d5", 1, surfaceTexture("soil"));
  const metal = new THREE.MeshStandardMaterial({color:"#718079",metalness:.32,roughness:.49});
  const drip = standard("#282f2b", .64);

  addBox(group, soilMaterial, 1.86, .26, 3.85, 0, .165, 0);
  // Individual weathered planks and fine seams: 0.42 m tall bed.
  for (const z of [-2, 2]) {
    for (const y of [.105, .305]) {
      addBox(group, wood, 2.13, .185, .132, 0, y, z);
      addBox(group, timberSeam, 2.15, .012, .135, 0, y + .097, z);
    }
    addBox(group, wood, 2.26, .052, .21, 0, .435, z);
  }
  for (const x of [-1, 1]) {
    for (const y of [.105, .305]) {
      addBox(group, wood, .128, .185, 4, x, y, 0);
      addBox(group, timberSeam, .132, .012, 4, x, y + .097, 0);
    }
    addBox(group, wood, .21, .052, 4.22, x, .435, 0);
  }
  for (const x of [-1, 1]) for (const z of [-2, 2]) {
    addBox(group, endgrain, .17, .46, .17, x, .23, z);
    addBox(group, wood, .2, .035, .2, x, .48, z);
  }
  // Soil aggregates and straw mulch, deterministic and instanced.
  const rng = rand(2223);
  const flakes = mobile ? 260 : 670;
  const mulchMat = standard("#b59a71", 1);
  const mulchMesh = instances(group, new THREE.BoxGeometry(1, 1, 1), mulchMat, flakes, obj => {
    obj.position.set(-.89 + rng() * 1.78, .301 + rng() * .005, -1.89 + rng() * 3.78);
    obj.rotation.y = rng() * 6.28;
    obj.scale.set(.02 + rng() * .07, .004, .004 + rng() * .012);
  });
  mulchMesh.castShadow = false;

  // A minimal irrigation line grounds the scene in real gardening practice.
  rod(group, new THREE.Vector3(.76,.325,-1.83), new THREE.Vector3(.76,.325,1.84), .008, drip);
  for (const z of [-1.62,-1.22,-.82,-.42,-.02,.38,.78,1.18,1.58]) {
    addBox(group, drip, .022, .013, .022, .76, .325, z, false);
  }

  // Actual 1.8m pea support: same position and height in both environments.
  const wireFrame = new THREE.Group();
  wireFrame.position.z = -1.62;
  group.add(wireFrame);
  for (const x of [-.73, 0, .73]) {
    addBox(wireFrame, wood, .055, 1.8, .056, x, .9, 0);
  }
  for (const y of [.42,.77,1.12,1.47,1.75]) {
    addBox(wireFrame, metal, 1.47, .009, .009, 0, y, 0, false);
  }
  for (const x of [-.5,-.25,.25,.5]) {
    addBox(wireFrame, metal, .009, 1.45, .009, x, 1.07, 0, false);
  }
}

function gardenFence(group: THREE.Group, mobile: boolean) {
  const wood = standard("#c8af87", .91, surfaceTexture("timber"));
  const posts = standard("#85684a", .9);
  // Back fence sits behind the bed and avoids covering the trellis.
  const fence = new THREE.Group();
  fence.position.z = -4.58;
  group.add(fence);
  const count = mobile ? 25 : 37;
  const width = 10.2 / count;
  instances(fence, new THREE.BoxGeometry(.97, 1, 1), wood, count, (obj, i) => {
    const rng = rand(i + 191);
    obj.position.set(-5.1 + width * (i+.5), .69 + rng() * .018, .01);
    obj.scale.set(width * .91, 1.33 + rng() * .11, .043);
    obj.rotation.z = (rng() - .5) * .02;
  }, false);
  for (const y of [.35,1.08]) {
    addBox(fence, posts, 10.35, .095, .09, 0, y, -.095, false);
  }
  for (const x of [-5.05,-3.65,-2.25,-.85,.55,1.95,3.35,4.75]) {
    addBox(fence, posts, .12, 1.62, .14, x, .81, -.09);
    addBox(fence, wood, .17, .045, .17, x, 1.64, -.09);
  }
}

function borderVegetation(group: THREE.Group, mobile: boolean) {
  const grassMat = new THREE.MeshStandardMaterial({
    color:"#7e9461", roughness:1, side:THREE.DoubleSide,
    alphaTest:.45, map:leafTexture(),
  });
  const shrubMat = new THREE.MeshStandardMaterial({
    color:"#d1dab1", roughness:.98, side:THREE.DoubleSide,
    alphaTest:.38, map:leafTexture(),
  });
  const branchMat = standard("#6e7352", 1);
  const flowerWhite = standard("#e8ddae", .92);
  const flowerPurple = standard("#a59cc1", .88);
  const rng = rand(998);
  const grasses = mobile ? 420 : 1250;
  const grassGeometry = new THREE.PlaneGeometry(.09, .16, 1, 1);
  grassGeometry.translate(0, .08, 0);
  instances(group, grassGeometry, grassMat, grasses, obj => {
    const side = Math.floor(rng() * 4);
    const x = side === 0 ? -2.56 - rng() * 3.0 :
      side === 1 ? 2.56 + rng() * 3 :
      -5.6 + rng() * 11.2;
    const z = side === 2 ? 3.16 + rng() * 2.7 :
      side === 3 ? -3.05 - rng() * 1.1 :
      -4.1 + rng() * 9.3;
    obj.position.set(x,-.039,z);
    obj.rotation.set((rng()-.5)*.3,rng()*Math.PI*2,(rng()-.5)*.35);
    const s = .42 + rng() * 1.2;
    obj.scale.set(s*.6,s,s*.6);
  });

  // Eight distinct low hedge bushes. Foliage is placed on a volumetric
  // envelope with independent colors, not represented by solid spheres.
  const shrubs: Array<{x:number,z:number,w:number,h:number}> = [];
  for (let i = 0; i < 9; i++) {
    const x = -4.5 + i * 1.09;
    shrubs.push({x,z:-3.85-(i%3)*.15,w:.5+(i%3)*.08,h:.95+(i%4)*.13});
  }
  for (const item of shrubs) {
    rod(group,new THREE.Vector3(item.x,-.03,item.z),
      new THREE.Vector3(item.x+.05,item.h*.86,item.z-.02),.024,branchMat);
    for (const j of [-1,1]) {
      rod(group,new THREE.Vector3(item.x,.34,item.z),
        new THREE.Vector3(item.x+j*item.w*.67,item.h*.62,item.z+(j*.13)),.011,branchMat);
    }
  }
  const leavesPerShrub = mobile ? 72 : 165;
  const totalLeaves = leavesPerShrub * shrubs.length;
  const leafGeometry = new THREE.PlaneGeometry(.14,.2);
  leafGeometry.translate(0,.07,0);
  const leaves = instances(group,leafGeometry,shrubMat,totalLeaves,(obj,i)=>{
    const shrub=shrubs[Math.floor(i/leavesPerShrub)];
    const r=rand(i*97+276);
    const phi=r()*Math.PI*2;
    const v=r()*2-1;
    const ellipse=Math.sqrt(1-v*v);
    const radial=(.35+r()*.65);
    obj.position.set(
      shrub.x+Math.cos(phi)*ellipse*shrub.w*radial,
      .22+(v+1)*.5*shrub.h*.76,
      shrub.z+Math.sin(phi)*ellipse*.33*radial
    );
    obj.rotation.set((r()-.5)*.6,phi+(r()-.5)*1.2,(r()-.5)*1.5);
    const size=.6+r()*.9;
    obj.scale.set(size*.9,size,size);
  });
  const colors=[new THREE.Color("#9da95e"),new THREE.Color("#6f8c51"),
    new THREE.Color("#bac38c"),new THREE.Color("#799a58")];
  for(let i=0;i<totalLeaves;i++){
    const r=rand(i*17+61);
    leaves.setColorAt(i,colors[Math.floor(r()*colors.length)]);
  }
  if(leaves.instanceColor) leaves.instanceColor.needsUpdate=true;

  // Unpretentious herbaceous flowers outside the bed, not over crops or paths.
  const blooms=mobile?30:100;
  const flowerGeometry=new THREE.IcosahedronGeometry(1,0);
  for (const [offset,material] of [[0,flowerWhite],[1,flowerPurple]] as const) {
    instances(group,flowerGeometry,material,Math.floor(blooms/2),(obj,i)=>{
      const r=rand(520+i*3+offset*4000);
      const left=i%2===0;
      obj.position.set((left?-1:1)*(2.7+r()*2.7),.035+r()*.045,
        -3.5+r()*6.7);
      const size=.018+r()*.023;
      obj.scale.set(size,size*.45,size);
    });
  }
  return {grassBlades:grasses,foliageCards:totalLeaves};
}

function greenhouse(group: THREE.Group, mobile: boolean) {
  if (mobile) return;
  // Background visual context, behind the right-hand gravel path. Small
  // transparent planes keep the structure legible without a fake solid shell.
  const root=new THREE.Group();
  root.position.set(3.83,-.04,-2.72);
  group.add(root);
  const steel=new THREE.MeshStandardMaterial({color:"#73847b",metalness:.57,roughness:.44});
  const poly=new THREE.MeshPhysicalMaterial({
    color:"#d1e1d8",metalness:0,roughness:.17,transparent:true,
    opacity:.22,side:THREE.DoubleSide,depthWrite:false,
  });
  const w=1.75,d=1.85,h=1.15,peak=1.89;
  const p=(x:number,y:number,z:number)=>new THREE.Vector3(x,y,z);
  for(const x of [-w/2,w/2])for(const z of [-d/2,d/2]){
    rod(root,p(x,0,z),p(x,h,z),.021,steel);
    rod(root,p(x,h,z),p(0,peak,z),.019,steel);
  }
  for(const y of [.07,.9,h])for(const z of [-d/2,d/2]){
    rod(root,p(-w/2,y,z),p(w/2,y,z),.012,steel);
  }
  for(const x of [-w/2,w/2])for(const y of [.07,h]){
    rod(root,p(x,y,-d/2),p(x,y,d/2),.014,steel);
  }
  rod(root,p(0,peak,-d/2),p(0,peak,d/2),.022,steel);
  for(const z of [-d/2,d/2]) {
    for(const x of [-w/2,w/2]) {
      rod(root,p(x,0,z),p(x,h,z),.016,steel);
    }
  }
  const quad=(a:THREE.Vector3,b:THREE.Vector3,c:THREE.Vector3,d:THREE.Vector3)=>{
    const geom=new THREE.BufferGeometry();
    geom.setAttribute("position",new THREE.Float32BufferAttribute([...a.toArray(),...b.toArray(),...c.toArray(),...d.toArray()],3));
    geom.setIndex([0,1,2,0,2,3]);
    geom.computeVertexNormals();
    const mesh=new THREE.Mesh(geom,poly); root.add(mesh);
  };
  quad(p(-w/2,.1,-d/2),p(w/2,.1,-d/2),p(w/2,h,-d/2),p(-w/2,h,-d/2));
  quad(p(-w/2,.1,d/2),p(w/2,.1,d/2),p(w/2,h,d/2),p(-w/2,h,d/2));
  for(const x of [-w/2,w/2]) {
    quad(p(x,.1,-d/2),p(x,.1,d/2),p(x,h,d/2),p(x,h,-d/2));
    quad(p(x,h,-d/2),p(0,peak,-d/2),p(0,peak,d/2),p(x,h,d/2));
  }
}

export function createShowcaseEnvironmentV2(mobile: boolean) {
  const group=new THREE.Group();
  group.name="Environment V2 — gravel, timber, groundcover and garden context";
  group.userData.environmentV2=true;
  const a=terrain(group,mobile);
  bed(group,mobile);
  gardenFence(group,mobile);
  const b=borderVegetation(group,mobile);
  greenhouse(group,mobile);
  const stats:EnvironmentStats={
    gravelStones:a.gravelStones,
    grassBlades:b.grassBlades,
    foliageCards:b.foliageCards,
    drawCallsEstimate:0,
  };
  group.traverse(o=>{if(o instanceof THREE.Mesh)stats.drawCallsEstimate++;});
  group.userData.environmentStats=stats;
  return group;
}

export function disposeShowcaseEnvironmentV2(group: THREE.Group) {
  const geometries=new Set<THREE.BufferGeometry>();
  const materials=new Set<THREE.Material>();
  const textures=new Set<THREE.Texture>();
  group.traverse(o=>{
    if(!(o instanceof THREE.Mesh))return;
    geometries.add(o.geometry);
    const list=Array.isArray(o.material)?o.material:[o.material];
    for(const material of list){
      materials.add(material);
      if(material instanceof THREE.MeshStandardMaterial) {
        for(const value of [material.map,material.normalMap,material.roughnessMap,material.bumpMap])if(value)textures.add(value);
      }
    }
  });
  geometries.forEach(g=>g.dispose());
  materials.forEach(m=>m.dispose());
  textures.forEach(t=>t.dispose());
}
