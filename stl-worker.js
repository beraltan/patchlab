import OpenSCAD from './vendor/openscad/openscad.js';
self.onmessage=async({data})=>{
 const log=[];
 try{
  self.postMessage({type:'progress',message:'Loading the rendering engine...'});
  const wasmResponse=await fetch(new URL('./vendor/openscad/openscad.wasm',import.meta.url));
  if(!wasmResponse.ok)throw Error('Could not load the STL rendering engine.');
  const wasmBinary=new Uint8Array(await wasmResponse.arrayBuffer());
  const engine=await OpenSCAD({wasmBinary,noInitialRun:true,print:t=>log.push(String(t)),printErr:t=>log.push(String(t))});
  const fontResponse=await fetch(new URL('./vendor/openscad/LiberationSans-Bold.ttf',import.meta.url));
  if(!fontResponse.ok)throw Error('Could not load the lettering font.');
  engine.FS.mkdir('/fonts');
  engine.FS.writeFile('/fonts/LiberationSans-Bold.ttf',new Uint8Array(await fontResponse.arrayBuffer()));
  const config='<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "fonts.dtd"><fontconfig><dir>/fonts</dir><cachedir>/tmp/fontconfig</cachedir></fontconfig>';
  engine.FS.writeFile('/fonts/fonts.conf',config);
  engine.FS.writeFile('/input.scad',data.source);
  self.postMessage({type:'progress',message:'Building the STL geometry...'});
  const code=engine.callMain(['/input.scad','--backend=Manifold','--export-format=binstl','-o','/output.stl']);
  if(code!==0&&code!==undefined)throw Error('The geometry renderer could not finish this part.');
  const bytes=engine.FS.readFile('/output.stl');
  if(bytes.length<84)throw Error('This part has no printable geometry.');
  if(log.some(t=>/^ERROR:|Can.t open font|No fonts found/i.test(t)))throw Error(log.filter(t=>/^ERROR:|Can.t open font|No fonts found/i.test(t)).join(' '));
  const copy=new Uint8Array(bytes);
  self.postMessage({type:'done',bytes:copy,log:log.slice(-100)},[copy.buffer]);
 }catch(error){self.postMessage({type:'error',message:error.message,log:log.slice(-100)});}
};
