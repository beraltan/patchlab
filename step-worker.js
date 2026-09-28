import init from './vendor/cad/occt.js';
import * as R from './vendor/cad/replicad.js';
import './joints.js';
import './model.js';
import {buildCAD} from './cad-model.js';
async function resource(path){
 const response=await fetch(new URL(path,import.meta.url));
 if(!response.ok)throw Error('Could not load '+path+' (HTTP '+response.status+').');
 return response.arrayBuffer();
}
self.onmessage=async({data})=>{
 try{
  const progress=message=>self.postMessage({type:'progress',message});
  progress('Loading the CAD engine (23 MB on first use)...');
  const wasmBinary=new Uint8Array(await resource('./vendor/cad/replicad_single.wasm'));
  R.setOC(await init({wasmBinary}));
  await R.loadFont(await resource('./vendor/openscad/LiberationSans-Bold.ttf'),'patchlab');
  const shapes=buildCAD(data.state,R,self.Panel,progress);
  progress('Writing analytic STEP solids...');
  const bytes=new Uint8Array(await R.exportSTEP(shapes,{unit:'MM',modelUnit:'MM'}).arrayBuffer());
  self.postMessage({type:'done',bytes},[bytes.buffer]);
 }catch(e){self.postMessage({type:'error',message:'CAD export failed: '+(e.message||String(e))});}
};
