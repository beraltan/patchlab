(function(root){
'use strict';
function jobsFor(s,Panel){
 const source=Panel.scad(s),plan=Panel.splitPlan(s),jobs=[];
 for(let i=0;i<plan.segments.length;i++){
  const segment=plan.segments[i],prefix=plan.segments.length>1?'section-'+String(i+1).padStart(2,'0'):'panel';
  const make=(part)=>source.replace('part = "assembly"','part = "'+part+'"').replace('segment = 1;','segment = '+(i+1)+';');
  jobs.push({name:prefix+'-body.stl',source:make('body'),title:prefix+' body'});
  if(s.ports.some(p=>p.label.trim()&&p.x>=segment.start&&p.x<=segment.end))jobs.push({name:prefix+'-labels.stl',source:make('labels'),title:prefix+' labels'});
 }
 if(plan.seams.length)jobs.push({name:'joining-key-print-'+plan.seams.length+'-copies.stl',source:source.replace('part = "assembly"','part = "key"'),title:'joining key'});
 return jobs;
}
const crcTable=Array.from({length:256},(_,n)=>{for(let j=0;j<8;j++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
function crc32(bytes){let crc=0xffffffff;for(const b of bytes)crc=crcTable[(crc^b)&255]^(crc>>>8);return (crc^0xffffffff)>>>0;}
function zip(files){
 const enc=new TextEncoder(),locals=[],central=[];let offset=0;
 for(const file of files){const name=enc.encode(file.name),data=typeof file.bytes==='string'?enc.encode(file.bytes):file.bytes,crc=crc32(data);const local=new Uint8Array(30+name.length),l=new DataView(local.buffer);l.setUint32(0,0x04034b50,true);l.setUint16(4,20,true);l.setUint16(6,0x800,true);l.setUint16(12,33,true);l.setUint32(14,crc,true);l.setUint32(18,data.length,true);l.setUint32(22,data.length,true);l.setUint16(26,name.length,true);local.set(name,30);locals.push(local,data);
 const header=new Uint8Array(46+name.length),c=new DataView(header.buffer);c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x800,true);c.setUint16(14,33,true);c.setUint32(16,crc,true);c.setUint32(20,data.length,true);c.setUint32(24,data.length,true);c.setUint16(28,name.length,true);c.setUint32(42,offset,true);header.set(name,46);central.push(header);offset+=local.length+data.length;
 }
 const size=central.reduce((sum,c)=>sum+c.length,0),end=new Uint8Array(22),e=new DataView(end.buffer);e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,size,true);e.setUint32(16,offset,true);return new Blob([...locals,...central,end],{type:'application/zip'});
}
function init(getState){
 const $=id=>document.getElementById(id);let active=null,cancelled=false,busy=false,url=null;
 function clearResult(){if(url){URL.revokeObjectURL(url);url=null;}$('stlDownload').hidden=true;}
 function render(job,index,total){return new Promise((resolve,reject)=>{let settled=false;const worker=new Worker(new URL('./stl-worker.js',document.baseURI),{type:'module'});const timer=setTimeout(()=>finish(Error('Rendering took too long. Try one section at a time or use the OpenSCAD export.')),300000);function finish(error,bytes){if(settled)return;settled=true;clearTimeout(timer);worker.terminate();active=null;error?reject(error):resolve(bytes);}active={cancel:()=>finish(Error('Cancelled.'))};worker.onmessage=({data})=>{if(data.type==='progress')$('stlStatus').textContent=(index+1)+' / '+total+' - '+job.title+': '+data.message;if(data.type==='done')finish(null,data.bytes);if(data.type==='error'){console.error((data.log||[]).join("\n"));finish(Error(data.message));}};worker.onerror=e=>finish(Error(e.message||'The STL renderer could not load. Use a recent browser and try again.'));worker.postMessage({source:job.source});});}
 async function generate(){if(busy)return;clearResult();let jobs,s;
  try{if(location.protocol==='file:')throw Error('Direct STL export needs the hosted site or a local server. Run npm start, then open localhost:4173.');s=JSON.parse(JSON.stringify(getState()));jobs=jobsFor(s,root.Panel);if($('stlPart').value!=='all')jobs=jobs.filter(j=>j.name===$('stlPart').value);if(!jobs.length)throw Error('Choose a printable part.');}catch(e){$('stlStatus').textContent=e.message;return;}
  busy=true;cancelled=false;$('generateSTL').disabled=true;$('cancelSTL').hidden=false;$('stlPart').disabled=true;const files=[];
  try{for(let i=0;i<jobs.length;i++){if(cancelled)throw Error('Cancelled.');const bytes=await render(jobs[i],i,jobs.length);files.push({name:jobs[i].name,bytes});}
   const all=$('stlPart').value==='all';let blob,name;
   if(all){files.push({name:'PRINTING.txt',bytes:'PATCHLAB PRINT KIT\n\nImport each section body and matching labels together as ONE object with multiple material parts. Preserve their shared coordinates; do not center or drop labels separately. Assign filaments per part.\n\n'+((s.reinforce||root.Panel.splitPlan(s).seams.length)?'Sections are already face-down for printing.':'The plain panel exports face-up.')+'\n\nThe joining-key filename tells you how many copies to print. Print the tolerance test before a full panel. STL files use millimeters.\n\nYour project settings are included as project.json.\n'});files.push({name:'project.json',bytes:JSON.stringify(s,null,2)});blob=zip(files);name=(s.name.replace(/[^a-z0-9_-]+/gi,'-')||'panel')+'-print-kit.zip';}
   else{blob=new Blob([files[0].bytes],{type:'model/stl'});name=files[0].name;}
   url=URL.createObjectURL(blob);$('stlDownload').href=url;$('stlDownload').download=name;$('stlDownload').textContent=all?'Download print kit (.zip)':'Download '+name;$('stlDownload').hidden=false;$('stlStatus').textContent='Ready - '+jobs.length+' STL file'+(jobs.length===1?'':'s')+' generated.';
  }catch(e){$('stlStatus').textContent=cancelled?'Cancelled. Your design is unchanged.':e.message;}finally{busy=false;$('generateSTL').disabled=false;$('cancelSTL').hidden=true;$('stlPart').disabled=false;}
 }
 $('generateSTL').onclick=generate;$('cancelSTL').onclick=()=>{cancelled=true;active?.cancel();};
 const refresh=()=>{if(busy)return;clearResult();try{const jobs=jobsFor(getState(),root.Panel);$('stlPart').replaceChildren();for(const [value,label]of [['all','All parts (ZIP print kit)'],...jobs.map(j=>[j.name,j.title])]){const o=document.createElement('option');o.value=value;o.textContent=label;$('stlPart').append(o);}$('generateSTL').disabled=false;$('stlStatus').textContent='Generate STLs here, then download. The first run loads about 12 MB; detailed panels may take a few minutes.';}catch(e){$('generateSTL').disabled=true;$('stlStatus').textContent=e.message;}};
 refresh();return {refresh};
}
const api={jobsFor,zip,crc32,init};if(typeof module!=='undefined')module.exports=api;else root.STLExport=api;
})(typeof window!=='undefined'?window:globalThis);
