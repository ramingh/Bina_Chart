/* BINA PivotChart SVG engine v2.10 — standalone, MIT. No third-party chart runtime. */
(function (global) {
'use strict';
const NS='http://www.w3.org/2000/svg';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pretty=v=>v==null||v===''?'(خالی)':String(v);
const num=v=>typeof v==='number'?v:(v==null||v===''?NaN:Number(String(v).replace(/,/g,'')));
const fmt=(n,dec=2)=>Number.isFinite(n)?new Intl.NumberFormat('fa-IR',{maximumFractionDigits:dec}).format(n):'—';
const colors=['#b3887b','#628fcb','#72a65a','#c59d44','#927abc','#46a7a5','#bc6b83','#78939f'];
const tint=(hex,offset)=>{let v=String(hex||'#888888').replace('#','');if(!/^[0-9a-f]{6}$/i.test(v))return '#888888';let n=parseInt(v,16);return '#'+[16,8,0].map(k=>Math.max(0,Math.min(255,((n>>k)&255)+offset)).toString(16).padStart(2,'0')).join('');};
const cmp=(a,b)=>{const an=num(a),bn=num(b);return Number.isFinite(an)&&Number.isFinite(bn)?an-bn:String(a).localeCompare(String(b),'fa',{numeric:true});};
const valueKey=v=>JSON.stringify(v===undefined?null:v);
const fieldLabel=(fields,id)=>fields.find(f=>f.name===id)?.label||id;
function calcRegression(points){
 if(points.length<2)return null; const n=points.length, mx=points.reduce((s,p)=>s+p[0],0)/n, my=points.reduce((s,p)=>s+p[1],0)/n;
 const d=points.reduce((s,p)=>s+(p[0]-mx)**2,0); if(d<1e-12)return null;
 const slope=points.reduce((s,p)=>s+(p[0]-mx)*(p[1]-my),0)/d, intercept=my-slope*mx;
 const total=points.reduce((s,p)=>s+(p[1]-my)**2,0),err=points.reduce((s,p)=>s+(p[1]-(slope*p[0]+intercept))**2,0);
 return {slope,intercept,r2:total<1e-10?1:1-err/total};
}
function filterRows(rows,filters){return rows.filter(row=>Object.entries(filters||{}).every(([k,v])=>!v||v.all!==false||(v.values||[]).includes(valueKey(row[k]))));}
function summarize(rows,cfg,hiddenMeasures=[]){
 const x=cfg.xFields||[], sf=cfg.seriesField, measures=(cfg.measures||[]).filter(m=>!hiddenMeasures.includes(m.id));
 const groups=new Map(), categories=new Map(), series=new Map();
 for(const row of rows){const tuple=x.map(k=>row[k]??null),ck=JSON.stringify(tuple),sval=sf?row[sf]??null:null,sk=valueKey(sval);
  if(!categories.has(ck))categories.set(ck,tuple);
  if(!series.has(sk))series.set(sk,sval);
  for(const m of measures){const k=JSON.stringify([ck,sk,m.id]);if(!groups.has(k))groups.set(k,{ck,sk,id:m.id,count:0,rows:0,sum:0,min:Infinity,max:-Infinity});let g=groups.get(k);g.rows++;const n=num(row[m.field]);if(Number.isFinite(n)){g.count++;g.sum+=n;g.min=Math.min(g.min,n);g.max=Math.max(g.max,n);}}
 }
 const cats=[...categories.entries()].sort((a,b)=>{for(let i=0;i<a[1].length;i++){const c=cmp(a[1][i],b[1][i]);if(c)return c;}return 0;});
 const ss=[...series.entries()].sort((a,b)=>cmp(a[1],b[1]));
 const vals=new Map();for(const g of groups.values()){const m=measures.find(t=>t.id===g.id);if(!m)continue;const a=m.aggregate;let v=a==='count'?g.rows:a==='avg'?(g.count?g.sum/g.count:NaN):a==='min'?g.min:a==='max'?g.max:g.sum; if((a!=='count'&&!g.count)||!Number.isFinite(v))continue; vals.set(JSON.stringify([g.ck,g.sk,g.id]),v);}
 const meta=[];for(const [sk,s] of ss){for(const m of measures){meta.push({key:JSON.stringify([sk,m.id]),sk,seriesValue:s,measure:m,label:(sf?pretty(s):'')+(sf&&measures.length>1?' · ':'')+(measures.length>1?m.alias||fieldLabel(cfg.fields||[],m.field):''),color:colors[meta.length%colors.length]});}}
 if(meta.length===1&&!meta[0].label)meta[0].label=measures[0]?.alias||'مقدار';
 return {cats,series:ss,measures,meta,vals,filteredCount:rows.length};
}
// Data-provider optimization: server returns small aggregate buckets, not millions of raw records.
// Each bucket contains {x:[...],series:null,measures:{id:{sum,count,rows,min,max}}}.
function summarizeBuckets(data,cfg,hidden=[]){
 const input=Array.isArray(data?.buckets)?data.buckets:[],ms=(cfg.measures||[]).filter(m=>!hidden.includes(m.id)),xfields=cfg.xFields||[],sf=cfg.seriesField;
 const fake=input.map(b=>Object.assign(Object.fromEntries(xfields.map((f,i)=>[f,b.x?.[i]??null])),sf?{[sf]:b.series??null}:{}));
 const model=summarize(fake,cfg,hidden);model.vals.clear();
 const combined=new Map();
 for(const b of input){const ck=JSON.stringify(b.x||[]),sk=valueKey(sf?(b.series??null):null);
  for(const m of ms){const v=b.measures?.[m.id];if(!v)continue;const key=JSON.stringify([ck,sk,m.id]);
   if(!combined.has(key))combined.set(key,{sum:0,count:0,rows:0,min:Infinity,max:-Infinity});
   const g=combined.get(key);g.sum+=Number(v.sum)||0;g.count+=Number(v.count)||0;g.rows+=Number(v.rows)||0;
   if(Number.isFinite(Number(v.min)))g.min=Math.min(g.min,Number(v.min));
   if(Number.isFinite(Number(v.max)))g.max=Math.max(g.max,Number(v.max));
  }
 }
 for(const [key,g] of combined){const id=JSON.parse(key)[2],m=ms.find(m=>m.id===id);if(!m)continue;
  const a=m.aggregate,val=a==='count'?g.rows:a==='avg'?(g.count?g.sum/g.count:NaN):a==='min'?g.min:a==='max'?g.max:g.sum;
  if(Number.isFinite(val))model.vals.set(key,val);
 }
 model.filteredCount=Number(data.totalRows)||input.length;return model;
}
// Compact SVG text wrapping. Use word boundaries first, then split unusually long words.
// Never truncate X category labels: adjust the line budget (up to five lines),
// and let the SVG grow/scroll when categories would otherwise collide.
function wrapLabel(value,maxChars,maxLines=5){
 const raw=pretty(value).trim(),words=raw.split(/\s+/).filter(Boolean);
 const limit=Math.max(1,Math.min(5,Math.floor(maxLines)||5));
 let chars=Math.max(2,Math.floor(maxChars));
 function build(cap){
  const lines=[];let line='';
  for(const word of words){
   if(word.length>cap){if(line){lines.push(line);line='';}
    for(let i=0;i<word.length;i+=cap)lines.push(word.slice(i,i+cap));
   }else if(!line)line=word;
   else if((line+' '+word).length<=cap)line+=' '+word;
   else{lines.push(line);line=word;}
  }
  if(line)lines.push(line);
  return lines.length?lines:[''];
 }
 let result=build(chars);
 while(result.length>limit&&chars<raw.length){chars++;result=build(chars);}
 return result;
}
function textSpans(lines,x,size){return lines.map((line,i)=>`<tspan x="${x}" dy="${i?size*1.23:0}">${esc(line)}</tspan>`).join('');}
// Horizontal grouped bar variant. Grouping/filtering and regression use the same
// summarized model as the vertical variants; only coordinates are transposed.
function makeHorizontalSVG({width=1200,height=690,cfg,model,title,viewColors}){
 const st=cfg.style||{},d3=cfg.mode==='3d';const {cats,meta,vals}=model;
 const count=cats.length,levels=(cfg.xFields||[]).length;
 const styles=cfg.fieldStyles?.global||{};const fg=st.textColor||'#222';
 const labelSize=Math.max(9,Math.min(64,...(cfg.xFields||[]).map(f=>Number(cfg.fieldStyles?.x?.[f]?.fontSize)||Number(st.labelSize)||15)));
 const maxLabel=cats.reduce((s,[,t])=>Math.max(s,t.map(pretty).join(' / ').length),0);
 const left=Math.min(width*.42,Math.max(90,Math.ceil(Math.min(maxLabel,42)*labelSize*.53+23)));
 const W=Math.max(340,width),H=Math.max(320,height);
 const top=70+String(title||'').split('\n').length*15,bottom=H-57,right=W-55;
 const valsAll=[];cats.forEach(([ck])=>meta.forEach(m=>{const v=vals.get(JSON.stringify([ck,m.sk,m.measure.id]));if(Number.isFinite(v))valsAll.push(v);}));
 let min=Math.min(0,...valsAll),max=Math.max(1,...valsAll),extra=(max-min)*.10;min=min<0?min-extra:0;max+=extra;
 const pos=n=>left+(n-min)/(max-min)*(right-left),rowH=(bottom-top)/Math.max(count,1),zero=pos(0);
 const widthPct=Math.min(100,Math.max(10,Number(st.barWidthPct)||72))/100;
 const colorsLocal=meta.map((m,i)=>viewColors?.[m.key]||viewColors?.[String(i)]||st.colors?.[i%st.colors?.length]||colors[i%colors.length]);
 const global=(key)=>styles[key]||{},fattr=(style,size)=>`font-family="${esc(style.fontFamily||'Tahoma')}" font-size="${Math.max(8,Number(style.fontSize)||size)}" fill="${esc(style.color||fg)}" font-weight="${style.bold?'bold':'normal'}"`;
 const pick=(kind,id)=>`class="bpc-editable-text" data-bpc-edit-kind="${esc(kind)}" data-bpc-edit-id="${esc(id)}"`;
 const out=[`<svg xmlns="${NS}" viewBox="0 0 ${W} ${H}" class="bpc-svg" style="width:100%;height:100%;max-width:100%" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(title)}"><defs>`];
 colorsLocal.forEach((color,i)=>out.push(`<linearGradient id="hb${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${tint(color,38)}"/><stop offset="1" stop-color="${tint(color,-27)}"/></linearGradient>`));
 out.push(`</defs><rect width="${W}" height="${H}" fill="${esc(st.background||'#d1bbb3')}"/>`);
 String(title||'').split(/\r?\n/).slice(0,2).forEach((txt,i)=>{const gid=i===0?'title1':'title2',sty=Object.keys(global(gid)).length?global(gid):global('title');const ts=Math.max(8,Number(sty.fontSize)||23);if(st.titleShow!==false)out.push(`<text x="${W/2}" y="${28+i*ts*Math.max(1,Math.min(3,Number(st.titleLineGap)||1.5))}" text-anchor="middle" direction="rtl" ${pick('global',gid)} ${fattr(sty,ts)}>${esc(txt)}</text>`);});
 out.push(`<rect x="${left}" y="${top}" width="${right-left}" height="${bottom-top}" fill="${esc(st.plotBackground||'#f8f8f6')}" stroke="${esc(st.gridColor||'#8e948f')}"/>`);
 for(let i=0;i<=5;i++){const tick=min+(max-min)*i/5,x=pos(tick);out.push(`<line x1="${x}" y1="${top}" x2="${x}" y2="${bottom}" stroke="${esc(st.gridColor||'#8e948f')}" opacity="${st.grid===false?0:.60}"/><text x="${x}" y="${bottom+22}" text-anchor="middle" ${pick('global','yTicks')} ${fattr(global('yTicks'),13)}>${fmt(tick)}</text>`);}
 // Preserve multiline group labels in the left caption band.
 for(let ci=0;ci<count;ci++){
  const [ck,tuple]=cats[ci],cy=top+(ci+.5)*rowH;
  const full=tuple.map(pretty).join(' / '),label=wrapLabel(full,Math.max(8,Math.floor((left-20)/(labelSize*.60))),5);
  const fs=Math.min(labelSize,Math.max(9,(rowH-5)/Math.max(label.length,1)/1.18));
  out.push(`<text x="${left-12}" y="${cy-(label.length-1)*fs*.58}" text-anchor="end" direction="ltr" ${pick('x',cfg.xFields?.[levels-1]||'')} ${fattr(cfg.fieldStyles?.x?.[cfg.xFields?.[levels-1]]||{},fs)}>${textSpans(label,left-12,fs)}</text>`);
  meta.forEach((m,mi)=>{const v=vals.get(JSON.stringify([ck,m.sk,m.measure.id]));if(!Number.isFinite(v))return;
   const rh=Math.min(31,Math.max(3,rowH*widthPct/Math.max(meta.length,1))),yy=cy+(mi-(meta.length-1)/2)*rh-(rh/2),x=pos(v),bx=Math.min(x,zero),bw=Math.max(1,Math.abs(x-zero));
   const col=colorsLocal[mi],edge=tint(col,-55);out.push(`<rect x="${bx}" y="${yy}" width="${bw}" height="${rh}" fill="${d3?`url(#hb${mi})`:col}" stroke="${edge}" stroke-width=".7"/>`);
   if(d3){const dep=Math.min(12,Number(st.depth||56)*.13),back=dep*.50;out.push(`<polygon points="${bx},${yy} ${bx+dep},${yy-back} ${bx+bw+dep},${yy-back} ${bx+bw},${yy}" fill="${tint(col,35)}" stroke="${edge}" stroke-width=".4"/><polygon points="${bx+bw},${yy} ${bx+bw+dep},${yy-back} ${bx+bw+dep},${yy+rh-back} ${bx+bw},${yy+rh}" fill="${tint(col,-48)}" stroke="${edge}" stroke-width=".5"/>`);}
   if(st.showValues!==false){const fsStyle=cfg.fieldStyles?.y?.[m.measure.id]||{},xx=v>=0?x+14:x-14;out.push(`<text x="${xx}" y="${yy+rh*.74}" text-anchor="${v>=0?'start':'end'}" ${pick('y',m.measure.id)} ${fattr(fsStyle,13)}>${fmt(v)}</text>`);}
  });
 }
 if(cfg.regression){meta.forEach((m,mi)=>{const points=[];cats.forEach(([ck],i)=>{const v=vals.get(JSON.stringify([ck,m.sk,m.measure.id]));if(Number.isFinite(v))points.push([i+1,v,i]);});const reg=calcRegression(points.map(([x,y])=>[x,y]));if(!reg||points.length<2)return;
  out.push(`<polyline points="${points.map(([x,,i])=>`${pos(reg.slope*x+reg.intercept)},${top+(i+.5)*rowH}`).join(' ')}" stroke="${tint(colorsLocal[mi],-72)}" stroke-width="2" stroke-dasharray="7 4" fill="none"/>`);
  out.push(`<text x="${right-2}" y="${top-8-mi*18}" text-anchor="end" font-size="12" fill="${tint(colorsLocal[mi],-65)}">y=${reg.slope.toFixed(3)}x ${reg.intercept<0?'−':'+'} ${Math.abs(reg.intercept).toFixed(3)} | R²=${reg.r2.toFixed(3)}</text>`);
 });}
 out.push(`</svg>`);return out.join('');
}
// Responsive 2D/3D Pie: slices use the first visible measure and X-category totals.
// Pie slices require positive values; negative/zero groups are excluded.
function makePieSVG({width,height,cfg,model,title,viewColors}){
 const st=cfg.style||{},W=Math.max(360,width),H=Math.max(340,height),is3d=cfg.mode==='3d';
 const {cats,meta,vals,measures}=model,first=measures[0];
 if(!first)return `<svg xmlns="${NS}" viewBox="0 0 ${W} ${H}"><text x="${W/2}" y="${H/2}" text-anchor="middle">شاخص Y وجود ندارد.</text></svg>`;
 const titleLines=String(title||'').split(/\r?\n/).slice(0,2);
 const titleStyle1=cfg.fieldStyles?.global?.title1||cfg.fieldStyles?.global?.title||{};
 const titleStyle2=cfg.fieldStyles?.global?.title2||cfg.fieldStyles?.global?.title||titleStyle1;
 const topTitleSize=Math.min(42,Math.max(12,Number(titleStyle1.fontSize)||Number(st.titleSize)||21));
 const headingHeight=st.titleShow===false?18:Math.max(72,34+titleLines.length*topTitleSize*Math.max(1,Math.min(3,Number(st.titleLineGap)||1.5)));
 const xField=(cfg.xFields||[])[(cfg.xFields||[]).length-1]||'';
 const xStyle=cfg.fieldStyles?.x?.[xField]||{};
 const yStyle=cfg.fieldStyles?.y?.[first.id]||{};
 const xFont=Math.min(20,Math.max(9,Number(xStyle.fontSize)||Number(st.labelSize)||14));
 const yFont=Math.min(18,Math.max(9,Number(yStyle.fontSize)||Number(st.valueSize)||13));
 const slices=[]; for(const [ck,tuple] of cats){ let value=0; for(const m of meta){ if(m.measure.id!==first.id)continue; const v=vals.get(JSON.stringify([ck,m.sk,m.measure.id])); if(Number.isFinite(v)) value+=v; } if(value>0) slices.push({name:tuple.map(pretty).join(' / '), value, tuple}); }
 const total=slices.reduce((s,d)=>s+d.value,0);
 const out=[`<svg xmlns="${NS}" class="bpc-svg" viewBox="0 0 ${W} ${H}" style="width:100%;height:100%;max-width:100%" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(title)}">`,`<rect width="${W}" height="${H}" fill="${esc(st.background||'#d1bbb3')}"/>`];
 const choose=(kind,id)=>`class="bpc-editable-text" data-bpc-edit-kind="${esc(kind)}" data-bpc-edit-id="${esc(id)}"`;
 if(st.titleShow!==false)titleLines.forEach((line,i)=>{const sty=i===0?titleStyle1:titleStyle2; const ts=Math.min(42,Math.max(12,Number(sty.fontSize)||Number(st.titleSize)||21)); const yy=28+i*ts*Math.max(1,Math.min(3,Number(st.titleLineGap)||1.5)); out.push(`<text x="${W/2}" y="${yy}" text-anchor="middle" direction="rtl" ${choose('global',i===0?'title1':'title2')} font-family="${esc(sty.fontFamily||'BinaYekan')}" font-size="${ts}" font-weight="${sty.bold===false?'normal':'bold'}" fill="${esc(sty.color||st.textColor||'#222')}">${esc(line)}</text>`);});
 if(total<=0){ out.push(`<text x="${W/2}" y="${H/2}" text-anchor="middle" font-size="15">برای نمودار دایره‌ای مقادیر مثبت وجود ندارد.</text></svg>`); return out.join(''); }
 const flatten=is3d?Math.max(.42,Math.min(.95,.18+(Number(st.rotationVertical)||38)/90)):1;
 const depth=is3d?Math.max(10,Math.min(90,Number(st.depth||56)*.42)):0;
 const sidePad=Math.max(120,Math.min(210,W*0.22));
 const plotTop=headingHeight+4, plotBottom=H-20;
 const availH=Math.max(180,plotBottom-plotTop-depth);
 const radius=Math.max(65,Math.min((W/2)-sidePad-12,(availH)/(2*flatten), Math.min(W,H)*0.33));
 const cx=W/2, cy=plotTop+(availH)*0.48;
 const palette=st.colors?.length?st.colors:colors;
 const rot=((Number(st.rotationHorizontal)||0)-90)*Math.PI/180;
 let theta=rot; const arcs=slices.map((d,i)=>{const start=theta; theta+=d.value/total*2*Math.PI; return {...d,i,start,end:theta,mid:(start+theta)/2,fill:viewColors?.[String(i)]||palette[i%palette.length]};});
 const rx=radius, ry=radius*flatten; const cTopY=cy, cBottomY=cy+depth;
 const pt=(ang,which='top')=>[cx+Math.cos(ang)*rx,(which==='top'?cTopY:cBottomY)+Math.sin(ang)*ry];
 const arcPath=(start,end,which='top')=>{const [x1,y1]=pt(start,which),[x2,y2]=pt(end,which),large=(end-start)>Math.PI?1:0; return `M ${cx} ${which==='top'?cTopY:cBottomY} L ${x1} ${y1} A ${rx} ${ry} 0 ${large} 1 ${x2} ${y2} Z`;};
 const outerArc=(start,end,which='top')=>{const [x1,y1]=pt(start,which),[x2,y2]=pt(end,which),large=(end-start)>Math.PI?1:0; return `M ${x1} ${y1} A ${rx} ${ry} 0 ${large} 1 ${x2} ${y2}`;};
 const frontSegs=[]; const segParts=42;
 function visibleIntervals(start,end){ const arr=[]; for(let k=0;k<segParts;k++){const a1=start+(end-start)*k/segParts, a2=start+(end-start)*(k+1)/segParts, mid=(a1+a2)/2; if(Math.sin(mid)>0) arr.push([a1,a2]); } if(!arr.length) return []; const merged=[arr[0].slice()]; for(let i=1;i<arr.length;i++){ if(Math.abs(arr[i][0]-merged[merged.length-1][1])<1e-6) merged[merged.length-1][1]=arr[i][1]; else merged.append(arr[i]); } return merged; }
 out.push(`<g>`);
 if(is3d){
  const drawList=[...arcs].sort((a,b)=>Math.sin(a.mid)-Math.sin(b.mid));
  for(const d of drawList){
   const intervals=(function(){ const arr=[]; for(let k=0;k<segParts;k++){const a1=d.start+(d.end-d.start)*k/segParts, a2=d.start+(d.end-d.start)*(k+1)/segParts, mid=(a1+a2)/2; if(Math.sin(mid)>0) arr.push([a1,a2]); } if(!arr.length) return []; const m=[arr[0].slice()]; for(let i=1;i<arr.length;i++){ if(Math.abs(arr[i][0]-m[m.length-1][1])<1e-6) m[m.length-1][1]=arr[i][1]; else m.push(arr[i]); } return m; })();
   intervals.forEach(([a1,a2])=>{ const [tx1,ty1]=pt(a1,'top'), [tx2,ty2]=pt(a2,'top'), [bx1,by1]=pt(a1,'bottom'), [bx2,by2]=pt(a2,'bottom'); const large=(a2-a1)>Math.PI?1:0; out.push(`<path d="M ${tx1} ${ty1} A ${rx} ${ry} 0 ${large} 1 ${tx2} ${ty2} L ${bx2} ${by2} A ${rx} ${ry} 0 ${large} 0 ${bx1} ${by1} Z" fill="${esc(tint(d.fill,-26))}" stroke="${esc(tint(d.fill,-42))}" stroke-width="0.6"/>`); });
   // radial side if front-facing
   [[d.start, Math.sin(d.start) > 0],[d.end, Math.sin(d.end) > 0]].forEach(([a,show])=>{ if(!show) return; const [tx,ty]=pt(a,'top'), [bx,by]=pt(a,'bottom'); out.push(`<path d="M ${cx} ${cTopY} L ${tx} ${ty} L ${bx} ${by} L ${cx} ${cBottomY} Z" fill="${esc(tint(d.fill,-18))}" stroke="${esc(tint(d.fill,-38))}" stroke-width="0.6"/>`); });
  }
 }
 // top faces
 [...arcs].sort((a,b)=>Math.sin(a.mid)-Math.sin(b.mid)).forEach(d=>out.push(`<path d="${arcPath(d.start,d.end,'top')}" fill="${esc(d.fill)}" stroke="${esc(st.background||'#fff')}" stroke-width="1.4"><title>${esc(d.name)}: ${fmt(d.value)} (${(d.value/total*100).toFixed(1)}%)</title></path>`));
 out.push(`</g>`);
 // callout labels
 const lineColor=st.gridColor||'#6d7679'; const left=[], right=[]; const labelGap=Math.max(26, xFont*1.85);
 arcs.forEach(d=>{ const a=d.mid; const edgeX=cx+Math.cos(a)*rx, edgeY=cTopY+Math.sin(a)*ry; const elbowX=cx+Math.cos(a)*(rx+18), elbowY=cTopY+Math.sin(a)*(ry+18*flatten); const item={d,edgeX,edgeY,elbowX,elbowY,side:Math.cos(a)>=0?'R':'L'}; (item.side==='R'?right:left).push(item); });
 function place(arr){ arr.sort((a,b)=>a.elbowY-b.elbowY); const top=plotTop+6, bottom=H-26-yFont; let prev=top-labelGap; arr.forEach(it=>{ it.labelY=Math.max(top,Math.max(it.elbowY,prev+labelGap)); prev=it.labelY; }); const overflow=arr.length?arr[arr.length-1].labelY-bottom:0; if(overflow>0){ for(let i=arr.length-1;i>=0;i--) arr[i].labelY=Math.max(top,arr[i].labelY-overflow); for(let i=arr.length-2;i>=0;i--) arr[i].labelY=Math.min(arr[i].labelY,arr[i+1].labelY-labelGap);} }
 place(left); place(right);
 function draw(arr,side){ const tx=side==='R'?W-sidePad+12:sidePad-12, anchor=side==='R'?'start':'end'; arr.forEach(it=>{ const midX=side==='R'?Math.max(it.edgeX+10,it.elbowX):Math.min(it.edgeX-10,it.elbowX); const lineEnd=side==='R'?tx-8:tx+8; out.push(`<polyline points="${it.edgeX.toFixed(1)},${it.edgeY.toFixed(1)} ${midX.toFixed(1)},${it.labelY.toFixed(1)} ${lineEnd.toFixed(1)},${it.labelY.toFixed(1)}" fill="none" stroke="${esc(lineColor)}" stroke-width="1.1"/>`); const catLines=wrapLabel(it.d.name,Math.max(7,Math.floor(sidePad/(xFont*.62))),4); out.push(`<text x="${tx}" y="${(it.labelY-(catLines.length-1)*xFont*0.55).toFixed(1)}" text-anchor="${anchor}" direction="rtl" ${choose('x',xField)} font-family="${esc(xStyle.fontFamily||'BinaYekan')}" font-size="${xFont}" font-weight="${xStyle.bold?'bold':'normal'}" fill="${esc(xStyle.color||st.textColor||'#222')}">${textSpans(catLines,tx,xFont)}</text>`); if(st.showValues!==false){ out.push(`<text x="${tx}" y="${(it.labelY+yFont*1.35).toFixed(1)}" text-anchor="${anchor}" ${choose('y',first.id)} font-family="${esc(yStyle.fontFamily||'BinaYekan')}" font-size="${yFont}" font-weight="${yStyle.bold?'bold':'normal'}" fill="${esc(yStyle.color||tint(st.textColor||'#222',-8))}">${esc(fmt(it.d.value))} · ${esc(fmt(it.d.value/total*100,1))}%</text>`);} }); }
 draw(left,'L'); draw(right,'R');
 out.push('</svg>'); return out.join('');
}
function makeSVG({width=1200,height=690,cfg,model,title,viewColors,hiddenMeasures}){
 const st=cfg.style||{},bar3d=cfg.mode==='3d',type=cfg.type||'bar',columnChart=['bar','cylinder','cone','pyramid','truncatedCone','truncatedPyramid'].includes(type);
 if(type==='horizontalBar')return makeHorizontalSVG({width,height,cfg,model,title,viewColors});
 if(type==='pie')return makePieSVG({width,height,cfg,model,title,viewColors});
 let W=width,H=height;const bg=st.background||'#d1bbb3';
 const depth=bar3d?Math.max(4,Math.min(160,Number(st.depth)||56)):0;
 const yaw=Math.max(-70,Math.min(70,Number(st.rotationHorizontal)??45));
 const tilt=Math.max(5,Math.min(75,Number(st.rotationVertical)??35));
 const yawRad=yaw*Math.PI/180,tiltRad=tilt*Math.PI/180;
 // An Access-style axonometric projection: independently controlled depth,
 // horizontal viewing angle (including reverse direction), and vertical tilt.
 const depthX=bar3d?depth*1.22*Math.sin(yawRad):0;
 const depthY=bar3d?-depth*.68*Math.sin(tiltRad):0;
 const left=88+Math.max(0,-depthX),right=26+Math.max(0,depthX);
 const {cats,meta,vals}=model, count=cats.length;
 const levels=Math.max(1,(cfg.xFields||[]).length);
 const xStyle=(id)=>cfg.fieldStyles?.x?.[id]||{};
 const globalStyle=(id)=>cfg.fieldStyles?.global?.[id]||{};
 const yStyle=(id)=>({...globalStyle('values'),...(cfg.fieldStyles?.y?.[id]||{})});
 const pick=(kind,id)=>`data-bpc-edit-kind="${esc(kind)}" data-bpc-edit-id="${esc(id)}" class="bpc-editable-text"`;
 const fcolor=(style)=>esc(style.color||st.textColor||'#222');
 const fb=(style,def=false)=>style.bold===undefined?(def?'bold':'normal'):(style.bold?'bold':'normal');
 const fo=(v)=>v==='vertical'?'V':v==='horizontal'?'H':v;
 const rotate=(style,x,y)=>fo(style.orientation)==='V'?`transform="rotate(-90 ${x} ${y})"`:'';
 const fontAttrs=(style,defSize,defBold=false)=>`font-family="${esc(style.fontFamily||'BinaYekan')}" font-size="${Math.max(8,Number(style.fontSize)||defSize)}" font-weight="${fb(style,defBold)}" fill="${fcolor(style)}"`;

 const labelDirection=(id,level)=>{const chosen=xStyle(id).orientation;return fo(chosen)==='H'?'horizontal':fo(chosen)==='V'?'vertical':(level===levels-1?(st.labelOrientation||(st.verticalLabels===false?'horizontal':'vertical')):'horizontal');};
 const axisFontSize=(id)=>Math.max(8,Number(xStyle(id).fontSize)||Number(st.labelSize)||15);
 const tierHeight=(level)=>{
  const id=cfg.xFields?.[level],size=axisFontSize(id),direction=labelDirection(id,level);
  if(direction==='horizontal'){
   const longest=cats.reduce((m,[,tuple])=>Math.max(m,pretty(tuple[level]).length),0);
   const groups=new Set(cats.map(([,tuple])=>JSON.stringify(tuple.slice(0,level+1)))).size||1;
   const perGroup=(Math.max(220,W-left-right-40)/groups);
   const charFit=Math.max(3,Math.floor((perGroup-12)/(size*.60)));
   const lines=Math.min(5,Math.max(1,Math.ceil(longest/charFit)));
   return Math.max(34,Math.ceil(size*1.26*lines+14));
  }
  // Vertical labels need room along their rotated baseline.
  const maxLength=cats.reduce((m,[,tuple])=>Math.max(m,pretty(tuple[level]).length),0);
  return Math.min(230,Math.max(73,Math.ceil(size*.65*Math.ceil(maxLength/4)+20)));
 };
 const tierHeights=Array.from({length:levels},(_,i)=>tierHeight(i));
 let labelHeight=tierHeights[levels-1],labelBottom=tierHeights.reduce((s,v)=>s+v,0)+32;
 // Reserve enough horizontal space to wrap each X label into 1–5 COMPLETE lines.
 // For a dense chart, expand the SVG and allow horizontal scrolling rather
 // than hiding parts of the label with an ellipsis.
 let desiredBand=38;
 for(let level=0;level<levels;level++){
  const field=cfg.xFields?.[level],fs=axisFontSize(field),direction=labelDirection(field,level);
  const maxText=cats.reduce((m,[,values])=>Math.max(m,pretty(values[level]).length),0);
  const perLine=Math.max(2,Math.ceil(maxText/5));
  if(direction==='horizontal')desiredBand=Math.max(desiredBand,perLine*fs*.63+14);
  else desiredBand=Math.max(desiredBand,fs*3.2+10);
 }
 // Responsive no-scroll layout: keep the SVG inside the allocated viewport.
 // Do not grow the drawing width for dense categories.
 W=Math.max(340,W);
 const plotX=left+27,plotR=W-right-12;
 const gridColor=st.gridColor||'#8e948f';
 const seriesColors=meta.map((m,i)=>viewColors?.[m.key]||viewColors?.[String(i)]||st.colors?.[i%st.colors?.length]||colors[i%colors.length]);
 const records=[];
 cats.forEach(([ck,tuple],ci)=>meta.forEach((m,mi)=>{const v=vals.get(JSON.stringify([ck,m.sk,m.measure.id]));if(Number.isFinite(v))records.push({ci,mi,v,ck,tuple,m});}));
 const values=records.map(r=>r.v);let min=Math.min(0,...values),max=Math.max(1,...values);
 // A separate trend line is fitted per visible series, across visible category slots.
 // Numeric X uses the actual X values only when there is exactly one numeric X field.
 // Otherwise the displayed category order is 1,2,3,... (Access-style category trend).
 const regressions=[];
 if(cfg.regression){for(let mi=0;mi<meta.length;mi++){
   const group=records.filter(r=>r.mi===mi).sort((a,b)=>a.ci-b.ci);
   if(group.length<2)continue;
   const numericX=cfg.xFields?.length===1&&group.every(r=>Number.isFinite(num(r.tuple[0])))&&new Set(group.map(r=>num(r.tuple[0]))).size===group.length;
   const points=group.map(r=>[numericX?num(r.tuple[0]):r.ci+1,r.v]);
   const reg=calcRegression(points);if(!reg)continue;
   const fits=points.map(([x])=>reg.slope*x+reg.intercept);
   fits.forEach(v=>{min=Math.min(min,v);max=Math.max(max,v);});
   regressions.push({mi,group,points,reg,fits,indexed:!numericX});
  }}
 // The title accepts one or two independently editable lines; reserve real space
 // before regression annotations and the chart so no labels overlap.
 const titleLines=String(title||'').split(/\r?\n/).slice(0,2),titleSize=Math.max(14,Math.min(44,Number((globalStyle('title1').fontSize||globalStyle('title').fontSize))||Number(st.titleSize)||22));
 const titleGap=Math.max(1,Math.min(3,Number(st.titleLineGap)||1.5));
 // Reserve headroom for vertical numbers, so their glyphs grow *away* from the columns.
 const verticalValueLength=records.reduce((n,r)=>Math.max(n,fmt(r.v).length),0);
 const anyVerticalValues=records.some(r=>fo(yStyle(r.m.measure.id).orientation)==='V');
 const verticalHeadroom=anyVerticalValues?Math.min(155,verticalValueLength*Math.max(11,...records.map(r=>Number(yStyle(r.m.measure.id).fontSize)||Number(st.valueSize)||14))*.65+24):0;
 const titleBottom=st.titleShow===false?12:37+(titleLines.length-1)*titleSize*titleGap+titleSize*.7;
 const regressionStart=Math.max(66,titleBottom+17);
 const padTop=Math.max(77,regressions.length?regressionStart+Math.min(6,regressions.length)*17+24:titleBottom+29)+Math.max(0,-depthY)+verticalHeadroom;
 // Reserve at least some of the drawing for actual data, not the captions.
 const maxLabelBlock=Math.max(85,H-padTop-185);
 if(labelBottom>maxLabelBlock){const ratio=maxLabelBlock/labelBottom;for(let i=0;i<tierHeights.length;i++)tierHeights[i]=Math.max(19,tierHeights[i]*ratio);labelBottom=tierHeights.reduce((s,v)=>s+v,0)+Math.min(30,65*ratio);labelHeight=tierHeights[levels-1];}
 H=Math.max(320,H);
 const plotY=Math.min(padTop,H-200), plotB=Math.max(plotY+120,H-labelBottom-10), plotW=plotR-plotX, plotH=plotB-plotY;
 const span=max-min||1,extra=span*.1;min=min<0?min-extra:0;max=max+extra;
 const valY=n=>plotB-((n-min)/(max-min))*plotH;
 const zeroY=valY(0),band=plotW/Math.max(count,1);
 const widthPct=Math.min(100,Math.max(10,Number(st.barWidthPct)||72))/100;
 const parts=[`<svg xmlns="${NS}" viewBox="0 0 ${W} ${H}" class="bpc-svg" style="width:100%;height:100%;max-width:100%" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(title)}" preserveAspectRatio="xMidYMid meet">`, '<defs>',
 `<linearGradient id="bpc-wall" x1="0" x2="1"><stop offset="0%" stop-color="#f9faf8"/><stop offset="90%" stop-color="#a7ada7"/></linearGradient>`,
 `<linearGradient id="bpc-side" x1="0" x2="1"><stop offset="0%" stop-color="#858a83"/><stop offset="100%" stop-color="#b1b5af"/></linearGradient>`];
 seriesColors.forEach((c,i)=>{parts.push(`<linearGradient id="bpc-bar${i}" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="${tint(c,55)}"/><stop offset="52%" stop-color="${c}"/><stop offset="100%" stop-color="${tint(c,-27)}"/></linearGradient>`);});
 parts.push('</defs>',`<rect width="${W}" height="${H}" fill="${esc(bg)}"/>`);
 if(st.titleShow!==false){titleLines.forEach((line,i)=>{const gid=i===0?'title1':'title2';const gsty=globalStyle(gid).fontFamily?globalStyle(gid):globalStyle('title');const gsize=Math.min(40,Math.max(12,Number(gsty.fontSize)||titleSize));parts.push(`<text x="${W/2}" y="${37+i*gsize*titleGap}" text-anchor="middle" direction="rtl" ${pick('global',gid)} ${rotate(gsty,W/2,37+i*gsize*titleGap)} ${fontAttrs(gsty,gsize,true)}>${esc(line)}</text>`);});}
 if(bar3d){
  const x2=plotX+depthX,r2=plotR+depthX,t2=plotY+depthY,b2=plotB+depthY;
  // Back wall and side wall sit in the same projected 3D coordinate system.
  parts.push(`<polygon points="${x2},${t2} ${r2},${t2} ${r2},${b2} ${x2},${b2}" fill="url(#bpc-wall)" stroke="#68716c" stroke-width="1"/>`);
  if(depthX>=0){parts.push(`<polygon points="${plotX},${plotY} ${x2},${t2} ${x2},${b2} ${plotX},${plotB}" fill="url(#bpc-side)" stroke="#68716c" stroke-width=".8"/>`);}
  else{parts.push(`<polygon points="${plotR},${plotY} ${r2},${t2} ${r2},${b2} ${plotR},${plotB}" fill="url(#bpc-side)" stroke="#68716c" stroke-width=".8"/>`);}
  parts.push(`<polygon class="bpc-floor" points="${plotX},${plotB} ${plotR},${plotB} ${r2},${b2} ${x2},${b2}" fill="${esc(st.floorColor||'#c9c9c2')}" stroke="${esc(gridColor)}" stroke-width="1"/>`);
  if(count<=32){for(let i=0;i<=count;i++){const x=plotX+i*plotW/Math.max(count,1);parts.push(`<line x1="${x}" y1="${plotB}" x2="${x+depthX}" y2="${plotB+depthY}" stroke="#757d76" stroke-width=".55" opacity=".48"/>`);}}
 }else{parts.push(`<rect x="${plotX}" y="${plotY}" width="${plotW}" height="${plotH}" fill="${esc(st.plotBackground||'#f9f9f8')}" stroke="${esc(gridColor)}"/>`);}
 for(let i=0;i<=5;i++){let tick=min+(max-min)*i/5,yy=valY(tick);
  parts.push(`<line x1="${plotX+(bar3d?depthX:0)}" y1="${yy+(bar3d?depthY:0)}" x2="${plotR+(bar3d?depthX:0)}" y2="${yy+(bar3d?depthY:0)}" stroke="${esc(gridColor)}" stroke-width=".8" opacity="${st.grid===false?0:.8}"/>`,
  `<text x="${plotX-19}" y="${yy+5}" ${pick('global','yTicks')} ${fontAttrs(globalStyle('yTicks'),Number(st.axisSize)||15)} ${rotate(globalStyle('yTicks'),plotX-19,yy+5)} text-anchor="end">${fmt(tick)}</text>`);}
 const yAxisTitle=String(st.yTitle||model.measures.map(m=>m.alias||fieldLabel(cfg.fields||[],m.field)).join(' / '));
 const ytf=globalStyle('yTitle'),yVertical=fo(ytf.orientation)!=='H';
 if(yAxisTitle){parts.push(`<text ${yVertical?`transform="translate(28 ${plotY+plotH/2}) rotate(-90)"`:`x="${plotX}" y="${plotY-7}"`} text-anchor="middle" direction="rtl" ${pick('global','yTitle')} ${fontAttrs(ytf,Number(st.axisSize)||15,true)}>${esc(yAxisTitle)}</text>`);}
 const px=(ci,mi)=>plotX+ci*band+(mi+.5)*band/Math.max(meta.length,1);
 if(columnChart){
  records.forEach(r=>{const n=Math.max(1,meta.length),slot=band/n,bw=Math.min(78,Math.max(2,slot*widthPct)),cx=px(r.ci,r.mi),x=cx-bw/2,y=Math.min(valY(r.v),zeroY),h=Math.max(.5,Math.abs(zeroY-valY(r.v))),ci=r.mi,clr=seriesColors[ci];
   const stroke=tint(clr,-50);parts.push('<g>');
   if(type==='cylinder'){
    const ry=Math.max(1.5,Math.min(23,bw*(.15+.14*Math.sin(tiltRad)),2+Math.abs(depthY)*.18,h*.43+1.5));
    const baseY=y+h-Math.min(ry*.6,h*.35),bulge=ry*4/3;
    parts.push(`<path d="M ${x} ${y} L ${x} ${baseY} C ${x} ${baseY+bulge} ${x+bw} ${baseY+bulge} ${x+bw} ${baseY} L ${x+bw} ${y} Z" fill="url(#bpc-bar${ci})" stroke="${stroke}" stroke-width=".6"/>`,
     `<path d="M ${x} ${baseY} C ${x} ${baseY+bulge} ${x+bw} ${baseY+bulge} ${x+bw} ${baseY}" fill="none" stroke="${tint(clr,-31)}" stroke-width=".75" opacity=".75"/>`);
    parts.push(`<ellipse cx="${cx}" cy="${r.v>=0?y:y+h}" rx="${bw/2}" ry="${ry}" fill="${tint(clr,37)}" stroke="${stroke}" stroke-width=".8"/>`);
   }else if(['cone','truncatedCone','pyramid','truncatedPyramid'].includes(type)){
    const isCone=type.toLowerCase().includes('cone'),isTruncated=type.startsWith('truncated');
    const neg=r.v<0,topY=neg?y+h:y,baseY=neg?y:y+h;
    const lip=isTruncated?Math.max(bw*.25,2):.5,tl=cx-lip/2,tr=cx+lip/2;
    if(isCone){
     // Conical tapered body with lighter near-face and a real curved base.
     const ry=Math.min(13,Math.max(2,bw*.19));
     const profile=`M ${x} ${baseY} Q ${cx} ${baseY+ry*.9} ${x+bw} ${baseY} L ${tr} ${topY} Q ${cx} ${topY-ry*.3} ${tl} ${topY} Z`;
     parts.push(`<path d="${profile}" fill="url(#bpc-bar${ci})" stroke="${stroke}" stroke-width=".9"/>`);
     if(isTruncated)parts.push(`<ellipse cx="${cx}" cy="${topY}" rx="${lip/2}" ry="${ry*.48}" fill="${tint(clr,42)}" stroke="${stroke}" stroke-width=".7"/>`);
     parts.push(`<path d="M ${x} ${baseY} Q ${cx} ${baseY+ry*.9} ${x+bw} ${baseY}" fill="none" stroke="${tint(clr,-32)}" stroke-width=".6"/>`);
    }else{
     const tiltDepth=bar3d?Math.max(2,Math.min(12,Math.abs(depthY)*.23)):0;
     const leftTip=isTruncated?x+bw*.32:cx,rightTip=isTruncated?x+bw*.68:cx;
     parts.push(`<polygon points="${x},${baseY} ${leftTip},${topY} ${rightTip},${topY} ${x+bw},${baseY}" fill="url(#bpc-bar${ci})" stroke="${stroke}" stroke-width=".85"/>`);
     if(bar3d){parts.push(`<polygon points="${x+bw},${baseY} ${rightTip},${topY} ${cx+Math.max(1,tiltDepth*.55)},${topY-tiltDepth} ${x+bw+Math.min(8,tiltDepth)},${baseY-tiltDepth}" fill="${tint(clr,-48)}" opacity=".9" stroke="${stroke}" stroke-width=".6"/>`);
      if(isTruncated)parts.push(`<polygon points="${leftTip},${topY} ${rightTip},${topY} ${rightTip+tiltDepth*.55},${topY-tiltDepth} ${leftTip+tiltDepth*.55},${topY-tiltDepth}" fill="${tint(clr,44)}" stroke="${stroke}" stroke-width=".65"/>`);
     }
    }
   }else{
    parts.push(`<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${bw.toFixed(2)}" height="${h.toFixed(2)}" fill="${bar3d?`url(#bpc-bar${ci})`:clr}" stroke="${stroke}" stroke-width=".7"/>`);
    if(bar3d){const dx=Math.sign(depthX||1)*Math.min(Math.abs(depthX)*.30,bw*.33+9),dy=Math.abs(depthY)*.28;parts.push(`<polygon points="${dx>=0?x+bw:x},${y} ${dx>=0?x+bw+dx:x+dx},${y-dy} ${dx>=0?x+bw+dx:x+dx},${y+h-dy} ${dx>=0?x+bw:x},${y+h}" fill="${tint(clr,-60)}" stroke="${tint(clr,-70)}" stroke-width=".7"/>`,
    `<polygon points="${x},${y} ${x+dx},${y-dy} ${x+bw+dx},${y-dy} ${x+bw},${y}" fill="${tint(clr,37)}" stroke="${tint(clr,-38)}" stroke-width=".7"/>`);}
   }
   if(st.showValues!==false&&band/meta.length>=16){
    const font=yStyle(r.m.measure.id),isVert=fo(font.orientation)==='V';
    const gap=Math.max(2,Math.min(80,Number(font.offset??st.valueLabelOffset??14)));
    const capAllowance=type==='cylinder'?Math.max(6,Math.min(23,bw*.30)):bar3d?Math.abs(depthY)*.16:0;
    const anchorY=r.v>=0?y-gap-capAllowance:y+h+gap;
    // Rotation -90 with a START anchor extends text above the cap instead of centering across it.
    const anchor=isVert?(r.v>=0?'start':'end'):'middle';
    parts.push(`<text x="${cx}" y="${anchorY}" text-anchor="${anchor}" ${pick('y',r.m.measure.id)} ${rotate(font,cx,anchorY)} ${fontAttrs(font,Number(st.valueSize)||14,st.valueBold)}>${fmt(r.v)}</text>`);
   }
   parts.push(`<title>${esc(r.tuple.map(pretty).join(' / '))}: ${fmt(r.v)}</title></g>`);
  });
 }else{
   meta.forEach((m,mi)=>{const group=records.filter(r=>r.mi===mi).sort((a,b)=>a.ci-b.ci);if(!group.length)return;
    const clr=seriesColors[mi], coords=group.map(r=>[px(r.ci,0)-band*.25,valY(r.v)]);
    if(type==='line'&&coords.length>1)parts.push(`<polyline points="${coords.map(p=>p.join(',')).join(' ')}" fill="none" stroke="${clr}" stroke-width="3.2" stroke-linejoin="round"/>`);
    group.forEach((r,ix)=>{const [x,y]=coords[ix];parts.push(`<circle cx="${x}" cy="${y}" r="${type==='scatter'?6:4.5}" fill="${clr}" stroke="#fff" stroke-width="1.3"><title>${esc(r.tuple.map(pretty).join(' / '))}: ${fmt(r.v)}</title></circle>`);
      if(st.showValues!==false&&band>=37){const font=yStyle(r.m.measure.id),distance=Math.max(2,Math.min(80,Number(font.offset??st.valueLabelOffset??14)));const yy=y-distance;parts.push(`<text x="${x}" y="${yy}" text-anchor="${fo(font.orientation)==='V'?'start':'middle'}" ${pick('y',r.m.measure.id)} ${rotate(font,x,yy)} ${fontAttrs(font,Number(st.valueSize)||14,st.valueBold)}>${fmt(r.v)}</text>`);}
    });
   });
 }
 // Trend lines are drawn on top of bars/cylinders/lines/scatter for every visible series.
 regressions.forEach((g,j)=>{
  const clr=tint(seriesColors[g.mi],-75);
  const path=g.group.map((r,i)=>`${px(r.ci,g.mi)} ${valY(g.fits[i])}`).join(' ');
  if(g.group.length>=2)parts.push(`<polyline points="${path}" fill="none" stroke="${clr}" stroke-width="2.5" stroke-dasharray="9 5" stroke-linecap="round"/>`);
  if(j<6){const yy=regressionStart+j*17,reg=g.reg;
   const desc=`${meta[g.mi].label||meta[g.mi].measure.alias||'سری '+(g.mi+1)}: y = ${reg.slope.toFixed(3)}x ${reg.intercept<0?'−':'+'} ${Math.abs(reg.intercept).toFixed(3)}  |  R² = ${reg.r2.toFixed(3)}${g.indexed?' (x=شماره گروه)':''}`;
   parts.push(`<text x="${plotR-9}" y="${yy}" text-anchor="end" direction="ltr" font-family="Tahoma,Arial" font-size="13" fill="${clr}">${esc(desc)}</text>`);
  }
 });
 // Compact, multi-tier category labels. Both orientations wrap within reserved space;
 // long text is clipped with an ellipsis instead of shrinking the main plot indefinitely.
 if(count){
  const cy=plotB+14, innerField=cfg.xFields?.[levels-1],innerSize=axisFontSize(innerField);
  const innerDirection=labelDirection(innerField,levels-1),innerFamily=esc(xStyle(innerField).fontFamily||'BinaYekan');
  cats.forEach(([ck,tup],ci)=>{
   const cx=plotX+(ci+.5)*band,inner=pretty(tup[tup.length-1]);
   parts.push(`<line x1="${plotX+ci*band}" y1="${plotB+5}" x2="${plotX+ci*band}" y2="${cy+labelHeight}" stroke="#8e8178" stroke-width=".55"/>`);
   if(band>=14){
    if(innerDirection==='vertical'){
     const maxChars=Math.max(3,Math.floor((labelHeight-10)/(innerSize*.62))),lines=wrapLabel(inner,maxChars,5);
     const sideways=(lines.length-1)*innerSize*1.12/2;
     parts.push(`<text transform="translate(${cx+sideways} ${cy+4}) rotate(90)" ${pick('x',innerField)} ${fontAttrs(xStyle(innerField),innerSize)} text-anchor="start" direction="ltr">${textSpans(lines,0,innerSize)}</text>`);
    }else{
     const maxChars=Math.max(2,Math.floor((band-7)/(innerSize*.57))),maxLines=5,lines=wrapLabel(inner,maxChars,maxLines);
     parts.push(`<text x="${cx}" y="${cy+innerSize}" ${pick('x',innerField)} ${fontAttrs(xStyle(innerField),innerSize)} text-anchor="middle" direction="rtl">${textSpans(lines,cx,innerSize)}</text>`);
    }
   }
  });
  parts.push(`<line x1="${plotR}" y1="${plotB+5}" x2="${plotR}" y2="${cy+labelHeight}" stroke="#8e8178" stroke-width=".55"/>`);
  let tierY=cy+labelHeight;
  for(let level=levels-2;level>=0;level--){
   const id=cfg.xFields?.[level],size=axisFontSize(id),family=esc(xStyle(id).fontFamily||'BinaYekan'),direction=labelDirection(id,level),height=tierHeights[level];
   let start=0;
   while(start<count){
    let end=start+1;const prefix=JSON.stringify(cats[start][1].slice(0,level+1));
    while(end<count&&JSON.stringify(cats[end][1].slice(0,level+1))===prefix)end++;
    const x1=plotX+start*band,x2=plotX+end*band,cx=(x1+x2)/2,cellWidth=x2-x1;
    parts.push(`<line x1="${x1}" y1="${tierY}" x2="${x1}" y2="${tierY+height}" stroke="#8e8178" stroke-width=".65"/>`);
    if(direction==='vertical'){
     const chars=Math.max(2,Math.floor((height-12)/(size*.61))),lines=wrapLabel(cats[start][1][level],chars,5);
     parts.push(`<text transform="translate(${cx+(lines.length-1)*size*.55} ${tierY+6}) rotate(90)" ${pick('x',id)} ${fontAttrs(xStyle(id),size)} text-anchor="start" direction="ltr">${textSpans(lines,0,size)}</text>`);
    }else{
     const chars=Math.max(2,Math.floor((cellWidth-9)/(size*.57))),lines=wrapLabel(cats[start][1][level],chars,5);
     parts.push(`<text x="${cx}" y="${tierY+size+4}" ${pick('x',id)} ${fontAttrs(xStyle(id),size)} text-anchor="middle" direction="rtl">${textSpans(lines,cx,size)}</text>`);
    }
    start=end;
   }
   parts.push(`<line x1="${plotR}" y1="${tierY}" x2="${plotR}" y2="${tierY+height}" stroke="#8e8178" stroke-width=".65"/>`);
   tierY+=height;
  }
 }
 if(meta.length>1&&st.legend!==false){let lineX=plotX,ly=H-13;meta.forEach((m,i)=>{const name=m.label||m.measure.alias||fieldLabel(cfg.fields||[],m.measure.field);const word=name.length>19?name.slice(0,18)+'…':name;const need=Math.max(95,word.length*9+25);if(lineX+need>W-20){lineX=plotX;ly-=22;}
  parts.push(`<rect x="${lineX}" y="${ly-12}" width="14" height="11" rx="2" fill="${seriesColors[i]}"/><text x="${lineX+20}" y="${ly-2}" ${pick('global','legend')} ${rotate(globalStyle('legend'),lineX+20,ly-2)} ${fontAttrs(globalStyle('legend'),12.5)}>${esc(word)}</text>`);lineX+=need;});}
 parts.push(`<desc>${esc('محور Y: '+yAxisTitle)}</desc>`,'</svg>');return parts.join('');
}
function draw(el,cfg,rows,view={},bucketData=null){
 const state=bucketData?[]:filterRows(rows||[],view.filters||cfg.defaultFilters||{});
 const model=bucketData?summarizeBuckets(bucketData,cfg,view.hiddenMeasures||[]):summarize(state,cfg,view.hiddenMeasures||[]);
 const title=(cfg.titleTemplate||'نمودار گزارش').replace(/\{([^}]+)\}/g,(_,key)=>{if(bucketData?.titleFields&&Object.prototype.hasOwnProperty.call(bucketData.titleFields,key))return String(bucketData.titleFields[key]);const unique=[...new Set(state.map(r=>pretty(r[key])))];return unique.length===1?unique[0]:(unique.length?`چند ${fieldLabel(cfg.fields||[],key)}`:'—');});
 const bounds=el.getBoundingClientRect(),width=Math.max(340,Math.round(bounds.width)||1140),height=Math.max(320,Math.round(bounds.height)||670);
 if(!model.cats.length||!model.meta.length){el.innerHTML=`<div class="bpc-empty">برای فیلترهای انتخاب‌شده داده‌ای وجود ندارد؛ یا هیچ شاخصی برای نمایش فعال نیست.</div>`;return {model,title,rows:state,count:model.filteredCount};}
 el.innerHTML=makeSVG({width,height,cfg,model,title,viewColors:view.colors,hiddenMeasures:view.hiddenMeasures});return {model,title,rows:state,count:model.filteredCount};
}
global.BinaPivotRenderer={draw,filterRows,summarize,summarizeBuckets,calcRegression,valueKey,pretty,fmt,esc,colors};
})(window);
