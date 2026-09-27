(function(root){
'use strict';
const defaults={autoSplit:true,bedMargin:5,fitClearance:0.15,reinforce:true,ribDepth:8,ribWidth:3,hardwareClearance:4};
const spec={bossWidth:36,bossDepth:6,keyWidth:28,keyDepth:8.5,stop:3,clearance:3};
function settings(s){return {...defaults,...s};}
function plan(input,cutoutBoxes=[],labelBoxes=[]){
 const s=settings(input),usable=s.bed-2*s.bedMargin;
 const result={enabled:s.autoSplit,usable,seams:[],segments:[{start:0,end:s.width,width:s.width}],error:null};
 if(!s.autoSplit)return result;
 if(s.height>usable){result.error='Panel height exceeds the usable bed. Width splitting cannot fix this; increase the bed size or reduce panel height.';return result;}
 if(s.width<=usable)return result;
 if(s.height<24){result.error='The snap-key joint needs a panel at least 24 mm high.';return result;}
 const half=spec.bossWidth/2;
 const allowed=x=>x>=half+4&&x<=s.width-half-4&&!cutoutBoxes.some(b=>x>b.x-half-s.hardwareClearance&&x<b.x+b.w+half+s.hardwareClearance)&&!labelBoxes.some(b=>x>b.x-2&&x<b.x+b.w+2);
 const xs=[0,s.width];for(let x=half+4;x<s.width-half-4;x+=1)if(allowed(x))xs.push(x);
 for(let count=Math.ceil(s.width/usable);count<=Math.ceil(s.width/usable)+4;count++)for(let j=1;j<count;j++){const x=s.width*j/count;if(allowed(x))xs.push(x);}
 const candidates=[...new Set(xs)].sort((a,b)=>a-b),dp=candidates.map(()=>({count:Infinity,cost:Infinity,prev:-1}));dp[0]={count:0,cost:0,prev:-1};
 for(let i=1;i<candidates.length;i++)for(let j=i-1;j>=0;j--){const width=candidates[i]-candidates[j];if(width>usable+1e-8)break;if(width<spec.bossWidth+4||!Number.isFinite(dp[j].count))continue;const count=dp[j].count+1,cost=dp[j].cost+width*width;if(count<dp[i].count||(count===dp[i].count&&cost<dp[i].cost))dp[i]={count,cost,prev:j};}
 let index=candidates.length-1;if(dp[index].prev<0){result.error='Export blocked: the '+s.bed+' mm bed minus '+s.bedMargin+' mm per side leaves '+Number(usable.toFixed(2))+' mm usable width. This '+s.width+' mm panel needs a split, but its ports or labels leave no clear joining-key position. '+(s.width<=s.bed&&s.height<=s.bed?'For a one-piece panel, set Bed margin / side to '+Math.floor((s.bed-Math.max(s.width,s.height))*5)/10+' mm or less, if your printable bed area allows it. Leave room for any brim.':'Move ports apart around a join, reduce the margin, or use a larger bed.');return result;}
 const edges=[];while(index>=0){edges.unshift(candidates[index]);index=dp[index].prev;}
 result.seams=edges.slice(1,-1);result.segments=edges.slice(1).map((end,i)=>({start:edges[i],end,width:end-edges[i]}));return result;
}
function scad(s,plan){
 s=settings(s);const c=s.fitClearance,edges=[0,...plan.seams,s.width];
 return `
// Rear twin-dovetail snap keys. A printed key bridges two complete channels.
// Prototype joint: print the coupon before a full panel; no rated load capacity.
// segment is 1-based. body/labels exports are face-down and share coordinates.
segment = 1;
seams = ${JSON.stringify(plan.seams)};
edges = ${JSON.stringify(edges)};
fit_clearance = ${c};
panel_height = ${s.height};
assert(segment >= 1 && segment < len(edges) && floor(segment)==segment,"Invalid segment number");
module groove_profile(){polygon([[-4,-2.5],[4,-2.5],[2.5,-6.02],[-2.5,-6.02]]);}
module channel_pair(h){for(dx=[-9,9])translate([dx,h-3,0])rotate([90,0,0])linear_extrude(height=h-3+0.1)groove_profile();}
module latch_pocket(){translate([-4,13,-6.1])cube([8,5,1.5]);}
module rear_boss(h){difference(){translate([-18,0,-6])cube([36,h,6.05]);channel_pair(h);latch_pocket();}}
module rear_bosses(){for(x=seams)translate([x,0,0])rear_boss(panel_height);}
module rail_profile(c){union(){offset(delta=-c)groove_profile();translate([-2.5+c,-6.5])square([5-2*c,1.1]);}}
module snap_key(h,clearance=fit_clearance,marked=false){
fit_clearance=clearance;
 length=h-3-fit_clearance;
 difference(){union(){
  // Two dovetail rails, connected by one backing strip.
  for(dx=[-9,9])translate([dx,length,0])rotate([90,0,0])linear_extrude(height=length-0.3)rail_profile(clearance);
  difference(){translate([-14,0.3,-8.5])cube([28,length-0.3,2.25]);translate([-3,3,-8.6])cube([6,16,2.6]);}
  // Integral spring tongue: push inward through the opening to release.
  translate([-2.3,1,-8.5])cube([4.6,16,1.2]);
  // Sloping leading face flexes the tongue during insertion.
  translate([-2.3,0,0])rotate([0,90,0])linear_extrude(height=4.6)polygon([[7.35,14],[5.2,14],[7.35,17]]);
 }
 if(marked)translate([0,h-7,-8.1])rotate([180,0,0])linear_extrude(height=0.5)text(str(clearance),size=2.4,halign="center",valign="center");
 }
}
module joint_body(){difference(){union(){body();reinforcement();rack_ears();rear_bosses();}for(x=seams)translate([x,0,0]){channel_pair(panel_height);latch_pocket();}}}
module section_clip(){translate([edges[segment-1],-3,-25])cube([edges[segment]-edges[segment-1],panel_height+6,thickness+50]);}
module face_down(){translate([-edges[segment-1],panel_height,thickness])rotate([180,0,0])children();}
module coupon_half(right=false){translate([right?22:0,26,thickness])rotate([180,0,0])intersection(){union(){translate([-18,0,0])cube([36,26,thickness]);rear_boss(26);}translate([right?0:-18,-1,-10])cube([18,28,thickness+20]);}}
module tolerance_test(){for(i=[0:4])translate([(i%2)*82,floor(i/2)*32,0]){translate([18,0,0])coupon_half();coupon_half(true);translate([60,0,8.5])snap_key(26,0.1+i*0.05,true);}}
if(part=="tolerance")tolerance_test();
else if(part=="body") face_down()intersection(){joint_body();section_clip();}
else if(part=="labels") face_down()intersection(){labels();section_clip();}
else if(part=="key") translate([14,0,8.5])snap_key(panel_height);
else if(part=="coupon") {translate([18,0,0])coupon_half();coupon_half(true);translate([60,0,8.5])snap_key(26);}
else {color("${s.bodyColor}")joint_body();color("${s.labelColor}")labels();for(x=seams)color("#aaaaaa")translate([x,0,0])snap_key(panel_height);}
`;
}
const api={defaults,spec,settings,plan,scad};if(typeof module!=='undefined')module.exports=api;else root.Joints=api;
})(typeof window!=='undefined'?window:globalThis);
