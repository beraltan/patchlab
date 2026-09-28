// Analytic CAD geometry for STEP. Coordinates match the OpenSCAD model.
export function buildCAD(s,R,P,progress=()=>{}){
 if(s.inlay<=0||s.inlay>=s.thickness)throw Error('Inlay depth must be less than the face thickness.');
 P.scad(s); // Reuse mounting-limit and split-layout export checks.
 const plan=P.splitPlan(s),H=s.height,T=s.thickness,ear=P.rackEars(s,plan);
 const box=(x,y,z,w,h,d)=>R.makeBox([x,y,z],[x+w,y+h,z+d]);
 const fuse=shapes=>shapes.reduce((a,b)=>a?a.fuse(b):b,null);
 const polygon=points=>{let d=R.draw(points[0]);for(const p of points.slice(1))d=d.lineTo(p);return d.close();};
 const prism=(drawing,length,x,y)=>drawing.sketchOnPlane('XY').extrude(length).rotate(90,[0,0,0],[1,0,0]).translate([x,y,0]);
 const groove=()=>polygon([[-4,-2.5],[4,-2.5],[2.5,-6.02],[-2.5,-6.02]]);
 const channels=(x,h)=>fuse([-9,9].map(dx=>prism(groove(),h-3+.1,x+dx,h-3)));
 const latch=x=>box(x-4,13,-6.1,8,5,1.5);
 const allCuts=[...P.mounts(s),...s.ports.flatMap(P.cutouts)];
 const hole=(c,z,d)=>c.shape==='circle'?R.makeCylinder(c.w/2,d,[c.x,H-c.y,z]):box(-c.w/2,-c.h/2,z,c.w,c.h,d).rotate(-c.rotation,[0,0,0],[0,0,1]).translate([c.x,H-c.y,0]);
 const cutBounds=c=>{const a=c.rotation*Math.PI/180,w=c.shape==='circle'?c.w:Math.abs(c.w*Math.cos(a))+Math.abs(c.h*Math.sin(a)),h=c.shape==='circle'?c.h:Math.abs(c.w*Math.sin(a))+Math.abs(c.h*Math.cos(a));return {x:c.x-w/2,y:H-c.y-h/2,w,h};};
 progress('Building analytic panel and circular holes...');
 let panel=R.drawRoundedRectangle(s.width,H,2).sketchOnPlane('XY').extrude(T).translate([s.width/2,H/2,0]);
 for(const c of allCuts)panel=panel.cut(hole(c,-.1,T+.2));
 let body=panel.clone();const labels=[];
 for(const [i,p] of s.ports.entries()){if(!p.label.trim())continue;progress('Building label '+(i+1)+' / '+s.ports.length+'...');let text=R.drawText(p.label,{fontSize:s.fontSize*1.4,fontFamily:'patchlab'});const b=text.boundingBox.bounds;text=text.translate([p.x-(b[0][0]+b[1][0])/2,H-p.labelY-(b[0][1]+b[1][1])/2]);const solid=text.sketchOnPlane('XY',T-s.inlay).extrude(s.inlay);const clipped=solid.intersect(panel.clone());labels.push(clipped);body=body.cut(clipped.clone());}
 if(s.reinforce){progress('Adding ribs...');let ribs=fuse([box(0,0,-s.ribDepth,s.width,s.ribWidth,s.ribDepth+.05),box(0,H-s.ribWidth,-s.ribDepth,s.width,s.ribWidth,s.ribDepth+.05),box(0,0,-s.ribDepth,s.ribWidth,H,s.ribDepth+.05),box(s.width-s.ribWidth,0,-s.ribDepth,s.ribWidth,H,s.ribDepth+.05)]);for(const c of allCuts){const b=cutBounds(c),pad=s.hardwareClearance;ribs=ribs.cut(box(b.x-pad,b.y-pad,-s.ribDepth-1,b.w+pad*2,b.h+pad*2,s.ribDepth+2));}for(const x of plan.seams)ribs=ribs.cut(box(x-18,-1,-s.ribDepth-1,36,H+2,s.ribDepth+2));body=body.fuse(ribs);}
 if(ear.depth){let ears=fuse([box(0,0,-ear.depth,ear.width,H,ear.depth+.05),box(s.width-ear.width,0,-ear.depth,ear.width,H,ear.depth+.05)]);for(const c of P.mounts(s))ears=ears.cut(hole(c,-ear.depth-.1,ear.depth+.2));body=body.fuse(ears);}
 for(const x of plan.seams){body=body.fuse(box(x-18,0,-6,36,H,6.05));body=body.cut(channels(x,H)).cut(latch(x));}
 function key(){const c=s.fitClearance,len=H-3-c;const rail=groove().offset(-c).fuse(R.drawRectangle(5-2*c,1.1).translate([0,-5.95]));let shape=fuse([-9,9].map(x=>prism(rail.clone(),len-.3,x,len)));let backing=box(-14,.3,-8.5,28,len-.3,2.25).cut(box(-3,3,-8.6,6,16,2.6));shape=shape.fuse(backing).fuse(box(-2.3,1,-8.5,4.6,16,1.2));const tongue=polygon([[7.35,14],[5.2,14],[7.35,17]]).sketchOnPlane('XY').extrude(4.6).rotate(90,[0,0,0],[0,1,0]).translate([-2.3,0,0]);return shape.fuse(tongue).translate([14,0,8.5]);}
 progress('Separating printable sections...');const result=[],labelShape=labels.length?R.compoundShapes(labels):null,faceDown=s.reinforce||plan.seams.length;
 for(const [i,seg]of plan.segments.entries()){const clip=box(seg.start,-3,-25,seg.width,H+6,T+50);const orient=shape=>{let out=shape.translate([-seg.start,0,0]);if(faceDown)out=out.rotate(180,[0,0,0],[1,0,0]).translate([0,H,T]);return out.translate([0,i*(H+10),0]);};result.push({name:'Section '+(i+1)+' body',shape:orient(body.clone().intersect(clip.clone())),color:s.bodyColor});if(labelShape&&s.ports.some(p=>p.label.trim()&&p.x>=seg.start&&p.x<=seg.end))result.push({name:'Section '+(i+1)+' labels',shape:orient(labelShape.clone().intersect(clip)),color:s.labelColor});}
 if(plan.seams.length){const k=key();for(let i=0;i<plan.seams.length;i++)result.push({name:'Joining key '+(i+1),shape:k.clone().translate([i*38,plan.segments.length*(H+10),0]),color:s.bodyColor});}
 return result;
}
