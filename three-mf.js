(function(root){
'use strict';
const xml=s=>String(s).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
function mesh(bytes){
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 if(bytes.length<84)throw Error('Incomplete STL mesh.');
 const count=view.getUint32(80,true);if(!count||bytes.length!==84+count*50)throw Error('Invalid binary STL mesh.');
 const vertices=[],triangles=[],lookup=new Map();
 for(let i=0;i<count;i++){const ids=[];for(let v=0;v<3;v++){const point=[];for(let a=0;a<3;a++){const value=view.getFloat32(84+i*50+12+v*12+a*4,true);if(!Number.isFinite(value))throw Error('Invalid mesh coordinate.');point.push(value===0?0:value);}const key=point.join(',');let id=lookup.get(key);if(id===undefined){id=vertices.length;lookup.set(key,id);vertices.push(point);}ids.push(id);}if(new Set(ids).size!==3)throw Error('Degenerate STL triangle.');triangles.push(ids);}
 return '<mesh><vertices>'+vertices.map(p=>'<vertex x="'+p[0]+'" y="'+p[1]+'" z="'+p[2]+'"/>').join('')+'</vertices><triangles>'+triangles.map(t=>'<triangle v1="'+t[0]+'" v2="'+t[1]+'" v3="'+t[2]+'"/>').join('')+'</triangles></mesh>';
}
function filesFor(files,s,Panel){
 const plan=Panel.splitPlan(s);if(plan.error)throw Error(plan.error);
 let id=2;const resources=[],build=[],parts=new Map();
 const transform=(x,y)=>'1 0 0 0 1 0 0 0 1 '+x+' '+y+' 0';
 for(const file of files){const material=file.name.endsWith('-labels.stl')?1:0,objectId=id++;parts.set(file.name,objectId);resources.push('<object id="'+objectId+'" type="model" name="'+xml(file.name.replace(/\.stl$/,''))+'" pid="1" pindex="'+material+'">'+mesh(file.bytes)+'</object>');}
 for(let i=0;i<plan.segments.length;i++){
  const prefix=plan.segments.length>1?'section-'+String(i+1).padStart(2,'0'):'panel',body=parts.get(prefix+'-body.stl'),labels=parts.get(prefix+'-labels.stl');
  if(!body)throw Error('Missing section body for 3MF.');const group=id++;
  resources.push('<object id="'+group+'" type="model" name="'+prefix+'"><components><component objectid="'+body+'"/>'+(labels?'<component objectid="'+labels+'"/>':'')+'</components></object>');
  build.push('<item objectid="'+group+'" transform="'+transform(0,i*(s.height+10))+'"/>');
 }
 if(plan.seams.length){const key=parts.get('joining-key-print-'+plan.seams.length+'-copies.stl');if(!key)throw Error('Missing joining key for 3MF.');for(let i=0;i<plan.seams.length;i++)build.push('<item objectid="'+key+'" transform="'+transform(i*38,plan.segments.length*(s.height+10))+'"/>');}
 const model='<?xml version="1.0" encoding="UTF-8"?><model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02"><metadata name="Title">'+xml(s.name)+'</metadata><metadata name="Application">Patchlab</metadata><metadata name="Description">Body and label components share coordinates. Assign filaments per part. Arrange sections and keys across print plates as needed. No printer settings or G-code included.</metadata><resources><basematerials id="1"><base name="Panel and keys" displaycolor="'+xml(s.bodyColor)+'"/><base name="Port labels" displaycolor="'+xml(s.labelColor)+'"/></basematerials>'+resources.join('')+'</resources><build>'+build.join('')+'</build></model>';
 return [
  {name:'[Content_Types].xml',bytes:'<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/></Types>'},
  {name:'_rels/.rels',bytes:'<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>'},
  {name:'3D/3dmodel.model',bytes:model}
 ];
}
const api={mesh,filesFor};if(typeof module!=='undefined')module.exports=api;else root.ThreeMF=api;
})(typeof window!=='undefined'?window:globalThis);
