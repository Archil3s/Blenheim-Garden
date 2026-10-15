// Render planner artwork from the production plant geometry without a build-time browser dependency.
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { chromium } from 'playwright';
const root = path.resolve(import.meta.dirname, '..');
const source = process.argv[2];
if (!source) throw new Error('Pass the saved /3d-audit records JSON as the first argument.');
const vegetables = new Set(['pumpkin','zucchini','cucumber','melon','lettuce','spinach','chard','broccoli','cauliflower','cabbage','kale','bush-bean','climbing-bean','pea','broad-bean','carrot','beet','radish','onion','garlic','leek','corn','pepper','potato','brussels-sprout']);
const records = JSON.parse(fs.readFileSync(source, 'utf8')).filter(r => r.kind === 'plant' && vegetables.has(r.inferredKind));
const normal = s => s.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
(async () => {
 const browser = await chromium.launch();
 const page = await browser.newPage();
 await page.route('http://botanical.local/**', async route => {
  const url = new URL(route.request().url());
  if (url.pathname === '/') return route.fulfill({contentType:'text/html',body:'<html><body></body></html>'});
  let target;
  if (url.pathname === '/three') target = path.join(root,'node_modules/three/build/three.module.js');
  else if (url.pathname === '/three.core.js') target = path.join(root,'node_modules/three/build/three.core.js');
  else if (url.pathname.startsWith('/three/addons/')) target = path.join(root,'node_modules/three/examples/jsm',url.pathname.slice(14));
  else target = path.join(root,url.pathname.replace(/^\//,'').replace(/\.js$/,'.ts'));
  let code = fs.readFileSync(target,'utf8');
  if (target.endsWith('.ts')) code = ts.transpileModule(code,{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.ES2020}}).outputText;
  code = code.replace(/(["'])three\1/g,'"/three"').replace(/(["'])three\/addons\//g,'$1/three/addons/').replace(/(["'])@\//g,'$1/');
  code = code.replace(/(from\s+["'])([^"']+)(["'])/g,(all,a,b,c) => a+b+(!b.endsWith('.js') && b !== '/three' ? '.js':'')+c);
  await route.fulfill({contentType:'application/javascript',body:code});
 });
 await page.goto('http://botanical.local/');
 await page.evaluate(async () => {
  const THREE = await import('/three');
  const {createLowpolyPlant3D} = await import('/components/garden-lowpoly-plants.js');
  const renderer = new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});
  renderer.setSize(1024,1024); renderer.setClearColor(0x000000,0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xfff5df,0x486239,2.4));
  const key = new THREE.DirectionalLight(0xfff4dc,3); key.position.set(-3,5,5);scene.add(key);
  const fill = new THREE.DirectionalLight(0xe2efff,.8);fill.position.set(3,2,-3);scene.add(fill);
  window.renderPlant = (crop,variety) => {
   const plant = createLowpolyPlant3D(crop,variety,false,173-crop.length*31-variety.length*17);
   plant.rotation.y=.35;scene.add(plant);
   const box=new THREE.Box3().setFromObject(plant), center=box.getCenter(new THREE.Vector3()), size=box.getSize(new THREE.Vector3());
   const span=Math.max(size.x,size.y,size.z)*1.2;
   const camera=new THREE.OrthographicCamera(-span/2,span/2,span/2,-span/2,.01,50);
   camera.position.copy(center).add(new THREE.Vector3(1.2,1.3,3).normalize().multiplyScalar(5));camera.lookAt(center);
   renderer.render(scene,camera);const image=renderer.domElement.toDataURL('image/webp',.95);
   scene.remove(plant);plant.traverse(o=>{if(o.isMesh)o.geometry.dispose();});
   return image;
  };
 });
 const manifest={};
 for(const record of records) {
  const crop=record.name,variety=record.variety==='Default'?'':record.variety;
  const key=normal(crop)+'|'+normal(variety), filename=key.replace(/\|/g,'--').replace(/ /g,'-')+'.webp';
  const data=await page.evaluate(({crop,variety})=>window.renderPlant(crop,variety),{crop,variety});
  fs.writeFileSync(path.join(root,'public/plant-icons/botanical',filename),Buffer.from(data.split(',')[1],'base64'));
  manifest[key]='/plant-icons/botanical/'+filename;
 }
 fs.writeFileSync(path.join(root,'lib/garden/botanical-artwork.json'),JSON.stringify(manifest,null,2)+'\n');
 console.log('Rendered '+Object.keys(manifest).length+' vegetable icons from production geometry.');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});

