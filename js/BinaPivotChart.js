/* BINA PivotChart 2.10 — independent Designer / Viewer (MIT). Requires BinaPivotRenderer.js */
(function(global){
'use strict';
const R=global.BinaPivotRenderer;if(!R)throw Error('ابتدا BinaPivotRenderer.js را اضافه کنید.');
const E=R.esc,K=R.valueKey,deep=x=>JSON.parse(JSON.stringify(x));
const defaultFields=[{name:'salmali',label:'سال مالی',type:'number'},{name:'SharhNesbat',label:'شرح نسبت',type:'string'},{name:'MeghdarNesbat',label:'مقدار نسبت',type:'number'},{name:'EsmSherkat',label:'نام شرکت',type:'string'}];
const COMPONENT_VERSION="2.12.0";
const FONT_COLORS=["#1f2937","#ffffff","#d62828","#ff6b00","#f2c400","#138a36","#1473d3","#3032ae","#8436b9","#d63384","#52616b","#996633"];
const basicStyle={background:'#d1bbb3',plotBackground:'#f8f8f6',textColor:'#232323',gridColor:'#7c8481',titleSize:22,axisSize:16,labelSize:15,valueSize:15,depth:56,rotationHorizontal:45,rotationVertical:35,floorColor:'#c9c9c2',titleLineGap:1.25,barWidthPct:72,verticalLabels:true,labelOrientation:"vertical",showValues:true,valueBold:false,valueLabelOffset:14,grid:true,legend:true,titleShow:true,showSeries:false,colors:['#b3887b','#628fcb','#72a65a','#c59d44']};
const defaults={schema:'bina-pivotchart',version:2,chartId:'finance-demo',name:'نمودار نسبت‌های مالی',dataSource:{id:'finance-demo'},fields:defaultFields,xFields:['salmali','SharhNesbat'],seriesField:null,filterFields:[],measures:[{id:'m1',field:'MeghdarNesbat',aggregate:'sum',alias:'مجموع مقدار نسبت'}],type:'bar',mode:'3d',fieldStyles:{x:{},y:{}},titleTemplate:'مقایسه نسبت‌های مالی - {EsmSherkat}',regression:false,style:basicStyle,defaultFilters:{},interaction:{reorder:true,reassign:true,filter:true,color:true,measureVisibility:true}};
const panelHTML=(head,body)=>`<section class="bpc-panel"><h3>${head}</h3>${body}</section>`;
const button=(name,text,cls='')=>`<button type="button" class="bpc-btn ${cls}" data-action="${name}">${text}</button>`;
const opts=(fields,selected,blank=false)=>`${blank?'<option value="">بدون فیلد</option>':''}${fields.map(f=>`<option value="${E(f.name)}" ${f.name===selected?'selected':''}>${E(f.label||f.name)}</option>`).join('')}`;
const fieldName=(c,k)=>c.fields.find(f=>f.name===k)?.label||k;
const uniq=a=>[...new Set(a)];
const allowedColor=v=>/^#[0-9a-f]{6}$/i.test(String(v))?String(v):'#b3887b';
function validate(raw){
 if(!raw||typeof raw!=='object')throw Error('ساختار JSON معتبر نیست.');
 if(raw.schema!=='bina-pivotchart'||Number(raw.version)!==2)throw Error('فرمت JSON این نمودارساز باید نسخه ۲ باشد.');
 const cfg=deep(raw);cfg.fields=Array.isArray(cfg.fields)?cfg.fields.filter(f=>f&&typeof f.name==='string'&&f.name.length<128).slice(0,150):[];
 if(!cfg.fields.length)throw Error('تعریف فیلدها خالی است.');
 const names=new Set(cfg.fields.map(f=>f.name));
 // Backward compatibility: legacy Filters disappear from the UI. Their fields
 // become visible X categories (unless already used as Series), retaining the
 // existing defaultFilters selections as editable X-field filters.
 const previousX=uniq((cfg.xFields||[]).filter(f=>names.has(f)));
 const previousSeries=names.has(cfg.seriesField)&&!previousX.includes(cfg.seriesField)?cfg.seriesField:null;
 const previousFilters=uniq((cfg.filterFields||[]).filter(f=>names.has(f)&&f!==previousSeries));
 cfg.xFields=uniq([...previousX,...previousFilters]).slice(0,12);
 if(!cfg.xFields.length)throw Error('حداقل یک فیلد برای محور X لازم است.');
 cfg.seriesField=previousSeries;
 cfg.filterFields=[]; // kept only in the JSON schema for older integrations

 cfg.measures=(cfg.measures||[]).filter(m=>names.has(m.field)&&['sum','avg','count','min','max'].includes(m.aggregate)).slice(0,8).map((m,i)=>({...m,id:String(m.id||'m'+(i+1)),alias:String(m.alias||fieldName(cfg,m.field))}));
 if(!cfg.measures.length)throw Error('حداقل یک فیلد مقدار Y لازم است.');
 cfg.type=['bar','cylinder','cone','pyramid','truncatedCone','truncatedPyramid','horizontalBar','line','scatter','pie'].includes(cfg.type)?cfg.type:'bar';cfg.mode=cfg.mode==='2d'?'2d':'3d';
 const oldStyle=cfg.style||{};cfg.style={...basicStyle,...oldStyle};if(!['vertical','horizontal'].includes(oldStyle.labelOrientation))cfg.style.labelOrientation=oldStyle.verticalLabels===false?'horizontal':'vertical';cfg.style.barWidthPct=Math.min(100,Math.max(10,Number(cfg.style.barWidthPct)||72));cfg.style.depth=Math.min(160,Math.max(4,Number(cfg.style.depth) || 56));cfg.style.rotationHorizontal=Math.min(70,Math.max(-70,Number(cfg.style.rotationHorizontal) || 0));cfg.style.rotationVertical=Math.min(75,Math.max(5,Number(cfg.style.rotationVertical) || 35));cfg.style.floorColor=allowedColor(cfg.style.floorColor||'#c9c9c2');cfg.style.yTitle=String(cfg.style.yTitle??'').slice(0,180);cfg.style.titleLineGap=Math.min(2,Math.max(1,Number(cfg.style.titleLineGap)||1.25));
 if(typeof oldStyle.showSeries!=='boolean')cfg.style.showSeries=Boolean(cfg.seriesField);
 cfg.fieldStyles={x:{},y:{},series:{},filter:{},global:{},...(cfg.fieldStyles||{})};
 const safeFonts=['BinaYekan','Tahoma','Arial','Vazirmatn'];
 for(const kind of ['x','y','series','filter','global']){
  for(const [id,typ] of Object.entries(cfg.fieldStyles[kind]||{})){
   if(!typ||typeof typ!=='object'){delete cfg.fieldStyles[kind][id];continue;}
   const ori=typ.orientation==='vertical'?'V':typ.orientation==='horizontal'?'H':typ.orientation;
   cfg.fieldStyles[kind][id]={
    fontFamily:safeFonts.includes(typ.fontFamily)?typ.fontFamily:'BinaYekan',
    fontSize:Math.max(8,Math.min(64,Number(typ.fontSize)||((kind==='global'&&id==='title')?Number(cfg.style.titleSize)||22:15))),
    bold:typeof typ.bold==='boolean'?typ.bold:(kind==='global'&&id==='title'),
    color:/^#[0-9a-f]{6}$/i.test(String(typ.color))?typ.color:(cfg.style.textColor||'#232323'),
    orientation:['H','V','inherit'].includes(ori)?ori:'inherit',
    ...((kind==='y'||(kind==='global'&&id==='values'))&&Number.isFinite(Number(typ.offset))?{offset:Math.max(2,Math.min(80,Number(typ.offset)))}:{})
   };
  }
 }
 cfg.interaction={...defaults.interaction,...(cfg.interaction||{})};
 cfg.defaultFilters=cfg.defaultFilters||{};
 cfg.chartId=String(cfg.chartId||'chart').replace(/[^a-zA-Z0-9_-]/g,'-').slice(0,90);
 cfg.titleTemplate=String(cfg.titleTemplate||'').slice(0,300);
 return cfg;
}
function distinctValues(rows,field){return [...new Map(rows.map(row=>[K(row[field]),row[field]])).values()].sort((a,b)=>{const aa=Number(a),bb=Number(b);return Number.isFinite(aa)&&Number.isFinite(bb)?aa-bb:String(a).localeCompare(String(b),'fa',{numeric:true});});}
function autoColorPalette(base){return base.map(allowedColor);}
function localStoreKey(id){return 'BinaPivotChart::'+id;}
let serial=0;
class BinaPivotChart{
 constructor(target,options={}){
  this.root=typeof target==='string'?document.querySelector(target):target;if(!this.root)throw Error('المان مقصد پیدا نشد.');
  this.uid='bpc'+(++serial);this.previewUrl=options.previewUrl||'preview.html';this.previewWindow=null;this.previewToken=null;this.mode=options.mode==='viewer'?'viewer':'designer';this.screen=this.mode;
  this.cfg=validate(options.config||defaults);
  this.rows=Array.isArray(options.data)?options.data:[];this.bucketData=null;
  this.dataProvider=options.dataProvider||null;this.storage=options.storage||null;this.storageEndpoint=options.storageEndpoint||null;
  this.session={filters:deep(this.cfg.defaultFilters),colors:{},hiddenMeasures:[],xFields:this.cfg.xFields.slice(),seriesField:this.cfg.seriesField,filterFields:this.cfg.filterFields.slice()};
  this.propertiesOpen=true;this.propertiesTab='axes';this.selectedObject=null;this.activeTitleLine=0;this.popup=null;this.lastDraw=null;this.colorIndex=0;this.distinctCache=new Map();this.waiting=false;this.status='';this.statusKind='ok';this.dragInfo=null;
  this.handleClick=e=>this.onClick(e);this.handleDblClick=e=>this.onDblClick(e);this.handleChange=e=>this.onChange(e);this.handleInput=e=>this.onInput(e);
  this.handlePointerDown=e=>this.outsideFontClick(e);this.handleViewportResize=()=>this.positionOpenFonts();this.handleScroll=e=>{if(this.root.querySelector('.bpc-inline-type[open]'))requestAnimationFrame(()=>this.positionOpenFonts());};this.handleWheel=e=>this.fontWheel(e);this.handleDragStart=e=>this.dragStart(e);this.handleDragOver=e=>this.dragOver(e);this.handleDrop=e=>this.drop(e);this.handleKey=e=>{if(e.key==='Escape'){if(this.popup)this.closePopup();this.closeFontDetails();this.clearSelection();}};
  this.root.addEventListener('click',this.handleClick);this.root.addEventListener('dblclick',this.handleDblClick);this.root.addEventListener('change',this.handleChange);this.root.addEventListener('input',this.handleInput);
  this.root.addEventListener('dragstart',this.handleDragStart);this.root.addEventListener('dragover',this.handleDragOver);this.root.addEventListener('drop',this.handleDrop);this.root.addEventListener('keydown',this.handleKey);document.addEventListener('pointerdown',this.handlePointerDown,true);window.addEventListener('resize',this.handleViewportResize);document.addEventListener('scroll',this.handleScroll,true);this.root.addEventListener('wheel',this.handleWheel,{passive:false});
  this.render();if(this.dataProvider)this.refresh();
 }
 destroy(){this.root.removeEventListener('click',this.handleClick);this.root.removeEventListener('dblclick',this.handleDblClick);this.root.removeEventListener('change',this.handleChange);this.root.removeEventListener('input',this.handleInput);this.root.removeEventListener('dragstart',this.handleDragStart);this.root.removeEventListener('dragover',this.handleDragOver);this.root.removeEventListener('drop',this.handleDrop);this.root.removeEventListener('keydown',this.handleKey);this.root.removeEventListener('wheel',this.handleWheel);document.removeEventListener('pointerdown',this.handlePointerDown,true);window.removeEventListener('resize',this.handleViewportResize);document.removeEventListener('scroll',this.handleScroll,true);if(this.previewRequestHandler)window.removeEventListener('message',this.previewRequestHandler);this.root.innerHTML='';}
 getConfig(){return deep(this.cfg);}exportJSON(){return JSON.stringify(this.getConfig(),null,2);}
 loadConfig(raw){this.cfg=validate(typeof raw==='string'?JSON.parse(raw):raw);this.selectedObject=null;this.resetSession();this.render();if(this.dataProvider)this.refresh();}
 resetSession(){this.session={filters:deep(this.cfg.defaultFilters),colors:{},hiddenMeasures:[],xFields:this.cfg.xFields.slice(),seriesField:this.cfg.seriesField,filterFields:this.cfg.filterFields.slice()};this.distinctCache.clear();}
 setData(rows){this.dataProvider=null;this.bucketData=null;this.rows=Array.isArray(rows)?rows:[];this.distinctCache.clear();this.render();}
 setFields(fields){this.cfg.fields=deep(fields);this.cfg=validate(this.cfg);this.render();}
 async refresh(){if(!this.dataProvider?.getRows&&!this.dataProvider?.getBuckets)return;const tick=this.waitTick=(this.waitTick||0)+1;this.waiting=true;this.drawOnly();try{
  // Contract: rows returned for the active configuration/filters, or a sufficiently small sample.
  if(this.dataProvider.getBuckets){const data=await this.dataProvider.getBuckets(this.activeConfig(),deep(this.session.filters));if(tick!==this.waitTick)return;
   if(!data||!Array.isArray(data.buckets))throw Error('getBuckets باید شیء دارای آرایه buckets برگرداند.');this.bucketData=data;this.rows=[];
  }else{const rows=await this.dataProvider.getRows(this.activeConfig(),deep(this.session.filters));if(tick!==this.waitTick)return;
   if(!Array.isArray(rows))throw Error('getRows باید آرایه‌ای از رکوردها برگرداند.');this.rows=rows;this.bucketData=null;}
  this.distinctCache.clear();this.waiting=false;this.render();
 }catch(e){if(tick===this.waitTick){this.waiting=false;this.message('خطای دریافت داده: '+e.message,'error');}}}
 activeConfig(){return {...this.cfg,xFields:this.screen==='designer'?this.cfg.xFields:this.session.xFields,seriesField:(this.cfg.style.showSeries&&this.cfg.type!=='pie')?(this.screen==='designer'?this.cfg.seriesField:this.session.seriesField):null,filterFields:[]};}
 message(msg,kind='ok'){this.status=msg;this.statusKind=kind;const el=this.root.querySelector('.bpc-status');if(el){el.textContent=msg;el.dataset.kind=kind;}}
 render(){
  if(this.screen==='designer'&&this.selectedObject&&!this.fontTargets().some(x=>x.kind===this.selectedObject.kind&&x.id===this.selectedObject.id))this.selectedObject=null;
  const isDesign=this.screen==='designer';this.root.innerHTML=`<div class="bpc-app" dir="rtl">
   <header class="bpc-head"><div class="bpc-brand"><strong>BINA</strong><span>PivotChart ${isDesign?'Designer':'Viewer'}</span></div>
    <div class="bpc-actions">${isDesign?`${button('preview','<span>◉</span> پیش‌نمایش','primary')}${button('localSave','ذخیره آزمایشی')}${button('jsonExport','دریافت JSON')}${button('jsonImport','بارگذاری JSON')}${button('serverSave','ذخیره در سرور')}${button('serverLoad','خواندن از سرور')}`:`${this.mode==='designer'?button('backDesign','بازگشت به طراحی'):''}${button('exportSVG','خروجی SVG')}${button('exportPNG','خروجی PNG')}${button('printChart','چاپ')}${button('resetView','بازنشانی نمایش')}`}</div>
   </header><div class="bpc-status" data-kind="${this.statusKind}">${E(this.status||'')}</div>
   ${isDesign?`<div class="bpc-designer ${this.propertiesOpen?'':'bpc-props-collapsed'}"><aside class="bpc-editor" aria-label="Properties">${this.designerHTML()}</aside><main class="bpc-workarea">${this.viewerHTML(true)}</main></div>`:`<main class="bpc-viewer">${this.viewerHTML(false)}</main>`}
   <input type="file" class="bpc-hidden-file" accept=".json,application/json" hidden />
   <div class="bpc-popover-host"></div><div class="bpc-version" dir="ltr">VER: ${COMPONENT_VERSION}</div></div>`;
  this.drawOnly();
 }
 // A single context-aware editor reads the effective, persisted font of the selected chart object.
 fontTargets(){const c=this.cfg;return [
  {kind:'global',id:'title1',label:'عنوان نمودار - سطر اول'},
  {kind:'global',id:'title2',label:'عنوان نمودار - سطر دوم'},
  {kind:'global',id:'yTitle',label:'عنوان محور Y'},
  {kind:'global',id:'yTicks',label:'اعداد محور Y'},
  ...c.xFields.map(f=>({kind:'x',id:f,label:'برچسب‌های X: '+fieldName(c,f)})),
  ...c.measures.map(m=>({kind:'y',id:m.id,label:'اعداد روی نمودار: '+(m.alias||fieldName(c,m.field))})),
  {kind:'global',id:'legend',label:'راهنمای رنگ‌ها'}
 ];}
 effectiveSelectedFont(){
  if(!this.selectedObject)return null;
  const sel=this.selectedObject,c=this.cfg,st=c.style;
  const stored=c.fieldStyles?.[sel.kind]?.[sel.id]||{};
  const values=c.fieldStyles?.global?.values||{};
  const inherited=sel.kind==='y'?values:{};
  const obj={...inherited,...stored};
  const isTitle=sel.kind==='global'&&(sel.id==='title1'||sel.id==='title2'||sel.id==='title');
  const isYTitle=sel.kind==='global'&&sel.id==='yTitle';
  const isXTier=sel.kind==='x';
  const isValue=sel.kind==='y';
  const size=isTitle?st.titleSize:isXTier?st.labelSize:isValue?st.valueSize:st.axisSize;
  const fallbackV=isXTier?(sel.id===c.xFields[c.xFields.length-1]?st.labelOrientation==='vertical':false):isYTitle;
  let ori=obj.orientation;
  if(ori==='vertical')ori='V';if(ori==='horizontal')ori='H';
  return {fontFamily:obj.fontFamily||'BinaYekan',fontSize:Math.max(8,Math.min(64,Number(obj.fontSize)||Number(size)||15)),bold:typeof obj.bold==='boolean'?obj.bold:(isTitle||isYTitle||(isValue&&!!st.valueBold)),color:allowedColor(obj.color||st.textColor||'#232323'),orientation:ori==='V'?'V':ori==='H'?'H':fallbackV?'V':'H',offset:Math.max(2,Math.min(80,Number(obj.offset??st.valueLabelOffset??14)))};
 }
 smartFontHTML(){
  if(!this.selectedObject)return `<div class="bpc-smart-font bpc-smart-empty"><div class="bpc-smart-head"><b>فونت آبجکت</b></div><select aria-label="انتخاب آبجکت" data-smart-target="true"><option value="" selected>بدون انتخاب</option>${this.fontTargets().map(x=>`<option value="${E(x.kind+'|'+x.id)}">${E(x.label)}</option>`).join('')}</select><span>برای ویرایش فونت، یکی از نوشته‌های نمودار را انتخاب کنید.</span></div>`;
  const selected=this.selectedObject,label=this.fontTargets().find(x=>x.kind===selected.kind&&x.id===selected.id)?.label||'آبجکت نمودار',f=this.effectiveSelectedFont();
  const optsList=this.fontTargets().map(x=>`<option value="${E(x.kind+'|'+x.id)}" ${x.kind===selected.kind&&x.id===selected.id?'selected':''}>${E(x.label)}</option>`).join('');
  const fontOptions=[['BinaYekan','ایران یکان'],['Tahoma','Tahoma'],['Arial','Arial'],['Vazirmatn','وزیرمتن']].map(([id,name])=>`<option value="${id}" ${id===f.fontFamily?'selected':''}>${name}</option>`).join('');
  const offsetNeeded=selected.kind==='y';
  return `<div class="bpc-smart-font"><div class="bpc-smart-head"><b>فونت آبجکت</b></div>
   <select aria-label="آبجکت انتخابی" data-smart-target="true">${optsList}</select>
   <div class="bpc-smart-controls"><select aria-label="نوع قلم" data-smart-font="fontFamily">${fontOptions}</select><input type="number" min="8" max="64" step="1" aria-label="اندازه قلم" data-smart-font="fontSize" value="${f.fontSize}" /></div>
   <div class="bpc-smart-actions"><button type="button" data-action="smartBold" class="bpc-smart-bold ${f.bold?'is-active':''}" title="ضخیم">B</button>
    <button type="button" data-action="smartOrientation" data-orientation="H" class="${f.orientation==='H'?'is-active':''}" title="افقی">H</button>
    <button type="button" data-action="smartOrientation" data-orientation="V" class="${f.orientation==='V'?'is-active':''}" title="عمودی">V</button>
    <input type="color" aria-label="رنگ دلخواه" data-smart-font="color" value="${f.color}" /></div>
   <div class="bpc-smart-colors">${FONT_COLORS.map(v=>`<button type="button" title="${v}" data-action="smartSwatch" data-color="${v}" style="background:${v}" class="${v.toLowerCase()===f.color.toLowerCase()?'is-active':''}"></button>`).join('')}</div>
   ${offsetNeeded?`<label class="bpc-smart-offset">فاصله عدد از ستون <input aria-label="فاصله عدد از ستون" type="number" min="2" max="80" step="1" data-smart-font="offset" value="${f.offset}" /></label>`:''}
  </div>`;
 }
 selectObject(kind,id,focus=false){
  if(this.screen!=='designer'||!this.fontTargets().some(x=>x.kind===kind&&x.id===id))return;
  this.selectedObject={kind,id};this.updateFontInspector();this.paintSelectedObjects();
  if(focus){const panel=this.root.querySelector('.bpc-props-body');const font=this.root.querySelector('.bpc-smart-font');if(panel&&font){panel.scrollTo({top:0,behavior:'smooth'});font.classList.add('bpc-focus-pulse');setTimeout(()=>font.classList.remove('bpc-focus-pulse'),700);}}
 }
 clearSelection(){
  if(this.screen!=='designer'||!this.selectedObject)return;
  this.selectedObject=null;this.updateFontInspector();this.paintSelectedObjects();
 }
 onDblClick(e){if(this.screen!=='designer')return;const el=e.target.closest?.('[data-bpc-edit-kind]');if(el&&this.root.contains(el))this.selectObject(el.dataset.bpcEditKind,el.dataset.bpcEditId,true);}
 paintSelectedObjects(){
  const plot=this.root.querySelector('.bpc-chart-canvas');if(!plot)return;
  plot.querySelectorAll('[data-bpc-edit-kind]').forEach(node=>{
   const sel=this.selectedObject;const active=this.screen==='designer'&&sel&&sel.kind===node.dataset.bpcEditKind&&sel.id===node.dataset.bpcEditId;
   node.classList.toggle('bpc-svg-selected',!!active);
  });
 }
 updateFontInspector(){const host=this.root.querySelector('.bpc-smart-font-host');if(host)host.innerHTML=this.smartFontHTML();}
 changeSelectedFont(prop,value,rerender=true){
  if(this.screen!=='designer')return;
  const selected=this.selectedObject;if(!selected)return;
  const target=(this.cfg.fieldStyles[selected.kind]||={});const font=target[selected.id]||{};
  if(prop==='fontSize'){if(value==='')return;font.fontSize=Math.max(8,Math.min(64,Number(value)||15));}
  else if(prop==='offset'){if(value==='')return;font.offset=Math.max(2,Math.min(80,Number(value)||14));}
  else if(prop==='fontFamily'){if(!['BinaYekan','Tahoma','Arial','Vazirmatn'].includes(value))return;font.fontFamily=value;}
  else if(prop==='bold')font.bold=!!value;
  else if(prop==='orientation')font.orientation=value==='V'?'V':'H';
  else if(prop==='color')font.color=allowedColor(value);
  else return;
  target[selected.id]=font;this.drawOnly();
  // Do not replace an active text input while the user is typing or turning the mouse wheel.
  if(rerender)this.updateFontInspector();
 }
 fontControls(kind,id){
  const c=this.cfg,old=c.fieldStyles?.[kind]?.[id]||{},family=old.fontFamily||'BinaYekan',size=old.fontSize||(kind==='global'&&(id==='title'||id==='title1'||id==='title2')?c.style.titleSize:(kind==='x'?c.style.labelSize:c.style.valueSize));
  const color=allowedColor(old.color||c.style.textColor||'#232323'),bold=typeof old.bold==='boolean'?old.bold:(kind==='global'&&id==='title');
  const orientation=old.orientation==='vertical'?'V':old.orientation==='horizontal'?'H':(old.orientation||'inherit');
  const attrs=`data-font-kind="${kind}" data-font-id="${E(id)}"`;
  return `<details class="bpc-inline-type"><summary title="فونت و رنگ">Aa</summary><div class="bpc-font-options">
   <div class="bpc-font-top"><select aria-label="نوع فونت" ${attrs} data-font-prop="fontFamily">${[['BinaYekan','ایران یکان'],['Tahoma','Tahoma'],['Arial','Arial'],['Vazirmatn','وزیرمتن']].map(([v,l])=>`<option value="${v}" ${family===v?'selected':''}>${l}</option>`).join('')}</select>
   <input type="number" aria-label="اندازه فونت" min="8" max="44" step="1" ${attrs} data-font-prop="fontSize" value="${size}" title="اندازه با چرخ موس تغییر می‌کند"/></div>
   <div class="bpc-font-toggle-row"><button type="button" class="bpc-font-bold ${bold?'is-active':''}" data-action="fontBold" ${attrs} aria-pressed="${!!bold}" title="Bold"><b>B</b></button>
   <div class="bpc-font-orientation-pair" role="group" aria-label="جهت نوشته"><button type="button" data-action="fontOrientation" data-orientation="H" class="${orientation==='H'?'is-active':''}" ${attrs} title="افقی">H</button><button type="button" data-action="fontOrientation" data-orientation="V" class="${orientation==='V'?'is-active':''}" ${attrs} title="عمودی">V</button></div>
   <input type="color" aria-label="انتخاب رنگ دلخواه" ${attrs} data-font-prop="color" value="${color}" title="پالت رنگ"/></div>
   <div class="bpc-font-color-grid" role="group" aria-label="رنگ‌های آماده">${FONT_COLORS.map(v=>`<button type="button" class="bpc-font-swatch ${v.toLowerCase()===color.toLowerCase()?'is-active':''}" data-action="fontSwatch" ${attrs} data-color="${v}" title="${v}" style="background:${v}"></button>`).join('')}</div>
  </div></details>`;
 }


 chartShapeGallery(){
  const entries=[['bar','ستونی','box'],['cylinder','استوانه‌ای','cylinder'],['cone','مخروطی','cone'],['pyramid','هرمی','pyramid'],['truncatedCone','مخروط ناقص','trcone'],['truncatedPyramid','هرم ناقص','trpyramid'],['horizontalBar','میله‌ای افقی','horizontal'],['line','خطی','line'],['scatter','نقطه‌ای','scatter'],['pie','دایره‌ای Pie','pie']];
  const icon=shape=>{const base='#668fc2',pale='#9ec0e6',dark='#4772ab';const rect=(x,y,w,h)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${base}" stroke="${dark}" stroke-width="1"/>`;const poly=(pts,fill)=>`<polygon points="${pts}" fill="${fill}" stroke="${dark}" stroke-width=".8"/>`;const shapes={box:rect(11,21,13,24)+rect(32,11,13,34),cylinder:`<path d="M11 21 L11 45 Q17 49 23 45 L23 21Z" fill="${base}" stroke="${dark}"/><ellipse cx="17" cy="21" rx="6" ry="3" fill="${pale}"/><path d="M32 13 L32 45 Q38 49 44 45 L44 13Z" fill="${base}" stroke="${dark}"/><ellipse cx="38" cy="13" rx="6" ry="3" fill="${pale}"/>`,cone:poly('11,45 17,19 23,45',base)+poly('31,45 38,8 45,45',base),pyramid:poly('10,45 18,19 25,45',base)+poly('30,45 39,8 47,45',pale),trcone:poly('10,45 14,24 20,24 24,45',base)+poly('30,45 34,15 43,15 47,45',base),trpyramid:poly('10,45 14,24 21,24 25,45',base)+poly('30,45 34,15 43,15 48,45',pale),horizontal:rect(8,13,35,9)+rect(8,30,27,9),line:`<polyline points="8,34 20,19 33,27 46,8" stroke="${dark}" stroke-width="3" fill="none"/>`,pie:`<circle cx="28" cy="26" r="19" fill="${base}"/><path d="M28 26 L28 7 A19 19 0 0 1 47 26 Z" fill="${pale}" stroke="${dark}"/><path d="M28 26 L47 26 A19 19 0 0 1 24 44 Z" fill="${dark}"/>`,scatter:`<circle cx="12" cy="34" r="4" fill="${base}"/><circle cx="22" cy="16" r="4" fill="${dark}"/><circle cx="36" cy="28" r="4" fill="${base}"/><circle cx="44" cy="9" r="4" fill="${dark}"/>`};return `<svg viewBox="0 0 56 52" width="45" height="42" aria-hidden="true">${shapes[shape]}</svg>`;};
  return `<details class="bpc-shape-gallery-wrap"><summary>نمونه‌های تصویری نوع نمودار</summary><div class="bpc-shape-gallery" aria-label="نمونه‌های شکل نمودار">${entries.map(([type,label,shape])=>`<button type="button" data-action="setChartType" data-chart-type="${type}" class="bpc-shape-choice ${this.cfg.type===type?'is-active':''}" title="${label}" aria-pressed="${this.cfg.type===type}">${icon(shape)}<span>${label}</span></button>`).join('')}</div></details>`;
 }
 designerHTML(){const c=this.cfg;
  const addBox=(zone)=>`<div class="bpc-add-row"><select aria-label="فیلد جدید" data-add-choice="${zone}"><option value="">انتخاب فیلد...</option>${opts(c.fields,'')}</select><button class="bpc-add-btn" data-action="addFieldZone" data-zone="${zone}">＋ افزودن فیلد</button></div>`;
  const fieldRow=(field,zone)=>`<div class="bpc-design-row" draggable="true" data-field="${E(field)}" data-from="${zone}"><span class="bpc-grip" title="جابه‌جایی فیلد">⠿</span><select class="bpc-design-field-select" data-design-field="${E(field)}" data-zone="${zone}" title="انتخاب فیلد">${opts(c.fields,field)}</select><button type="button" class="bpc-remove-word" data-action="removeDesignField" data-field="${E(field)}" data-zone="${zone}">حذف</button></div>`;
  const catZone=(key,title,ids)=>`<div class="bpc-design-zone bpc-zone-${key} bpc-dropzone" data-zone="${key}"><div class="bpc-zone-title">${title}</div><div class="bpc-design-rows">${ids.length?ids.map(f=>fieldRow(f,key)).join(''):'<small class="bpc-empty-field">فیلدی تعریف نشده است</small>'}</div>${addBox(key)}</div>`;
  const measureRows=c.measures.map(m=>`<div class="bpc-measure-line" data-measure="${E(m.id)}"><div class="bpc-measure-main"><select data-measure-field="${E(m.id)}">${opts(c.fields,m.field)}</select><select data-measure-agg="${E(m.id)}">${['sum','avg','count','min','max'].map(a=>`<option value="${a}" ${m.aggregate===a?'selected':''}>${a.toUpperCase()}</option>`).join('')}</select><button type="button" class="bpc-remove-word" data-action="removeMeasure" data-id="${E(m.id)}">حذف</button></div></div>`).join('');
  const color=(id,label,val)=>`<label class="bpc-color-control"><span>${label}</span><input type="color" data-style="${id}" value="${allowedColor(val)}" /></label>`;
  const [title1='',...rest]=String(c.titleTemplate||'').split('\n'),title2=rest.join(' ');
  const tab=(id,label)=>`<button type="button" class="bpc-props-tab ${this.propertiesTab===id?'is-active':''}" data-action="propsTab" data-tab="${id}" role="tab" aria-selected="${this.propertiesTab===id}">${label}</button>`;
  const axes=`${catZone('x','محور X / دسته‌بندی',c.xFields)}<label class="bpc-check bpc-series-switch"><input type="checkbox" data-style="showSeries" ${c.style.showSeries?'checked':''}/> نمایش بخش Series (اختیاری)</label>${c.style.showSeries?catZone('series','Series / سری‌ها',c.seriesField?[c.seriesField]:[]):''}<div class="bpc-design-zone bpc-zone-y"><div class="bpc-zone-title">محور Y / شاخص و محاسبه</div>${measureRows}${button('addMeasure','＋ افزودن مقدار Y')}<div class="bpc-axis-title-edit"><label class="bpc-full-label">عنوان مشترک محور Y<input type="text" list="${this.uid}-ytitle-choices" data-style="yTitle" value="${E(c.style.yTitle||c.measures.map(m=>m.alias||fieldName(c,m.field)).join(' / '))}" placeholder="عنوان محور Y" title="می‌توانید عنوان پیشنهادی را ویرایش کنید" /><datalist id="${this.uid}-ytitle-choices">${[...new Set([...c.measures.map(m=>m.alias||fieldName(c,m.field)),...c.measures.map(m=>fieldName(c,m.field))])].map(v=>`<option value="${E(v)}"></option>`).join('')}</datalist></label></div></div>`;
  const chart=`<div class="bpc-settings-card bpc-settings-geometry"><div class="bpc-settings-caption">نوع نمودار و نمای سه‌بعدی</div><div class="bpc-chart-select-row"><label>نوع نمودار<select data-setting="type">${[['bar','ستونی'],['cylinder','استوانه‌ای'],['cone','مخروطی'],['pyramid','هرمی'],['truncatedCone','مخروط ناقص'],['truncatedPyramid','هرم ناقص'],['horizontalBar','میله‌ای افقی'],['line','خطی'],['scatter','نقطه‌ای'],['pie','دایره‌ای Pie']].map(([v,l])=>`<option value="${v}" ${c.type===v?'selected':''}>${l}</option>`).join('')}</select></label><label>حالت<select data-setting="mode"><option value="3d" ${c.mode==='3d'?'selected':''}>3D</option><option value="2d" ${c.mode==='2d'?'selected':''}>2D</option></select></label></div>${this.chartShapeGallery()}<div class="bpc-camera-controls"><div class="bpc-camera-head">تنظیم نمای سه‌بعدی</div>${[['depth','عمق افقی (محور عمق)',4,160],['rotationHorizontal','چرخش افقی',-70,70],['rotationVertical','چرخش عمودی',5,75]].map(([key,label,min,max])=>`<div class="bpc-camera-field"><label>${label}</label><div class="bpc-depth-row"><input type="range" min="${min}" max="${max}" step="1" data-style="${key}" aria-label="${label}" value="${c.style[key]}"/><input type="number" min="${min}" max="${max}" step="1" data-style="${key}" aria-label="عدد ${label}" value="${c.style[key]}"/></div></div>`).join('')}</div><label class="bpc-full-label">پهنای شکل / میله (%)<input type="number" min="10" max="100" step="5" data-style="barWidthPct" value="${c.style.barWidthPct}"/></label><label class="bpc-check"><input type="checkbox" data-setting="regression" ${c.regression?'checked':''}/> نمایش خط رگرسیون، معادله و R²</label></div>`;
  const appearance=`<div class="bpc-settings-card bpc-settings-title"><div class="bpc-settings-caption">عنوان نمودار (تا دو سطر)</div><label class="bpc-full-label">سطر اول<input data-title-line="0" value="${E(title1)}" placeholder="عنوان اول یا {نام‌فیلد}" /></label><label class="bpc-full-label">سطر دوم<input data-title-line="1" value="${E(title2)}" placeholder="عنوان دوم - اختیاری" /></label><div class="bpc-two"><label>فاصله دو سطر<select data-style="titleLineGap">${[['1','1'],['1.5','1.5'],['2','2'],['2.5','2.5'],['3','3']].map(([v,l])=>`<option value="${v}" ${Number(c.style.titleLineGap)===Number(v)?'selected':''}>${l}</option>`).join('')}</select></label></div></div><div class="bpc-settings-card bpc-settings-colors"><div class="bpc-settings-caption">رنگ‌ها و خطوط</div><div class="bpc-colors">${color('background','زمینه نمودار',c.style.background)}${color('floorColor','کف سه‌بعدی',c.style.floorColor)}${color('gridColor','همه خطوط',c.style.gridColor)}${color('colors.0','رنگ اصلی',c.style.colors[0])}</div>${[['showValues','نمایش مقدار روی نمودار'],['grid','خطوط راهنمای نمودار'],['legend','راهنمای رنگ‌ها']].map(([a,b])=>`<label class="bpc-check"><input type="checkbox" data-style="${a}" ${c.style[a]?'checked':''} />${b}</label>`).join('')}</div><details class="bpc-settings-card bpc-settings-storage"><summary>ذخیره و شناسنامه نمودار</summary><div class="bpc-storage-fields"><label class="bpc-full-label">شناسه نمودار<input data-setting="chartId" value="${E(c.chartId)}" /></label><label class="bpc-full-label">عنوان داخلی<input data-setting="name" value="${E(c.name)}" /></label></div></details>`;
  const body={axes,chart,appearance}[this.propertiesTab]||axes;
  return `<div class="bpc-props-head"><strong>Properties</strong><button type="button" class="bpc-props-arrow" data-action="toggleProps" title="${this.propertiesOpen?'بستن Properties':'بازکردن Properties'}" aria-label="${this.propertiesOpen?'بستن Properties':'بازکردن Properties'}" aria-expanded="${this.propertiesOpen}">${this.propertiesOpen?'◂':'▸'}</button></div><div class="bpc-tabs" role="tablist" aria-label="بخش تنظیمات">${tab('axes','محورها X / Y')}${tab('chart','نوع و سه‌بعدی')}${tab('appearance','ظاهر و عنوان')}</div><div class="bpc-props-body" role="tabpanel"><div class="bpc-smart-font-host">${this.smartFontHTML()}</div>${body}</div>`;
 }

 pill(field,zone,design){const c=this.cfg;let label=fieldName(c,field);const cs=c.fieldStyles?.[zone]?.[field]||{};const pillStyle=`font-family:${['BinaYekan','Tahoma','Arial','Vazirmatn'].includes(cs.fontFamily)?cs.fontFamily:'BinaYekan'};font-size:${Math.min(44,Math.max(8,Number(cs.fontSize)||12))}px;font-weight:${cs.bold?700:400};writing-mode:${cs.orientation==='V'?'vertical-rl':'horizontal-tb'};color:${allowedColor(cs.color||'#163e66')}`;const canDrag=design||((c.interaction.reorder!==false)&&(this.screen!=='designer'));
  return `<span class="bpc-pill" style="${pillStyle}" ${canDrag?'draggable="true"':''} data-field="${E(field)}" data-from="${E(zone)}"><span class="bpc-grip" title="جابجایی فیلد">⠿</span><span class="bpc-pill-name">${E(label)}</span><button type="button" class="bpc-drop-btn" data-action="openFilter" data-field="${E(field)}" title="فیلتر مقادیر ${E(label)}">▾</button></span>`;
 }
 viewerHTML(compact){const a=this.activeConfig(), inter=this.cfg.interaction, allowDrag=compact||inter.reorder!==false;const hasSeries=Boolean(this.cfg.style.showSeries);
  const pills=(zone,fs)=>fs.map(f=>this.pill(f,zone,compact)).join('');
  const isPreview=!compact;
  const previewModel=!compact?(this.bucketData?R.summarizeBuckets(this.bucketData,a,this.session.hiddenMeasures):R.summarize(R.filterRows(this.rows,this.session.filters),a,this.session.hiddenMeasures)):null;
  const previewSeries=previewModel?(a.type==='pie'?previewModel.cats.map((c,i)=>({label:c[1].map(R.pretty).join(' / '),key:String(i)})):previewModel.meta):[];
  const drop=`${isPreview&&inter.reassign!==false?'bpc-dropzone':''}`;
  return `<div class="bpc-chart-shell ${compact?'bpc-compact':''}">
  ${!compact?`<div class="bpc-view-toolbar"><div class="bpc-view-toolbar-left"><strong>${E(this.cfg.name)}</strong></div><div class="bpc-view-controls">${inter.color!==false?`<label>رنگ سریع ${previewSeries.length>1?`<select class="bpc-color-series" data-action="colorSeries">${previewSeries.map((m,i)=>`<option value="${i}" ${i===this.colorIndex?'selected':''}>${E(m.label||m.measure.alias||'سری '+(i+1))}</option>`).join('')}</select>`:''}<input type="color" data-action="quickColor" value="${allowedColor(this.session.colors[String(this.colorIndex)]||this.cfg.style.colors[this.colorIndex%this.cfg.style.colors.length]||this.cfg.style.colors[0])}" /></label>${['#b3887b','#628fcb','#72a65a','#c59d44','#917db9'].map(v=>`<button type="button" class="bpc-swatch" data-action="quickSwatch" data-color="${v}" style="background:${v}" title="تغییر رنگ"></button>`).join('')}`:''}</div></div>`:''}
  <div class="bpc-chart-mid ${hasSeries?'bpc-series-on':'bpc-series-off'}"><div class="bpc-chart-canvas"></div>${hasSeries?`<div class="bpc-chart-side bpc-dropzone ${drop}" data-zone="series"><small>Series</small>${a.seriesField?pills('series',[a.seriesField]):'<span class="bpc-drop-placeholder">سری‌ها</span>'}</div>`:''}</div>
  <div class="bpc-chart-bottom bpc-dropzone ${drop}" data-zone="x"><span class="bpc-hint">محور X</span>${pills('x',a.xFields)}</div>
  ${!compact&&inter.measureVisibility!==false&&this.cfg.measures.length>1?`<div class="bpc-measure-toggles"><span>شاخص‌های قابل نمایش:</span>${this.cfg.measures.map(m=>`<label><input type="checkbox" data-visible-measure="${E(m.id)}" ${this.session.hiddenMeasures.includes(m.id)?'':'checked'}/> ${E(m.alias||fieldName(a,m.field))}</label>`).join('')}</div>`:''}
  <div class="bpc-chart-foot"><span></span><span class="bpc-count"></span></div></div>`;
 }
 drawOnly(){const plot=this.root.querySelector('.bpc-chart-canvas');if(!plot)return;
  const config=this.activeConfig();const view=this.session;
  if(this.waiting){plot.innerHTML='<div class="bpc-empty">در حال دریافت اطلاعات...</div>';return;}
  try{this.lastDraw=R.draw(plot,config,this.rows,view,this.bucketData);this.paintSelectedObjects();const foot=this.root.querySelector('.bpc-count');if(foot)foot.textContent=`${R.fmt(this.lastDraw.count,0)} رکورد · ${R.fmt(this.lastDraw.model.cats.length,0)} گروه`;
  }catch(e){plot.innerHTML=`<div class="bpc-empty">${E(e.message)}</div>`;this.message(e.message,'error');}
 }
 onClick(e){
  if(this.screen==='designer'){
   const hit=e.target.closest?.('[data-bpc-edit-kind]');
   if(hit&&this.root.contains(hit)){this.selectObject(hit.dataset.bpcEditKind,hit.dataset.bpcEditId);return;}
   if(e.target.closest?.('.bpc-chart-canvas,.bpc-chart-shell,.bpc-workarea')&&!e.target.closest?.('button,input,select,[data-action]'))this.clearSelection();
   const designRow=e.target.closest?.('.bpc-design-row[data-field],.bpc-measure-line[data-measure]');
   if(designRow&&!e.target.closest('select,input,button')){this.selectObject(designRow.dataset.measure?'y':designRow.dataset.from,designRow.dataset.measure||designRow.dataset.field);return;}
  }
  const el=e.target.closest('[data-action]');if(!el||!this.root.contains(el))return;
  const act=el.dataset.action,field=el.dataset.field,zone=el.dataset.zone;
  switch(act){case 'smartBold':if(this.selectedObject)this.changeSelectedFont('bold',!this.effectiveSelectedFont().bold);break;
   case 'smartOrientation':this.changeSelectedFont('orientation',el.dataset.orientation);break;
   case 'smartSwatch':this.changeSelectedFont('color',el.dataset.color);break;
   case 'fontBold':{const f=(this.cfg.fieldStyles[el.dataset.fontKind][el.dataset.fontId]||={});f.bold=!(typeof f.bold==='boolean'?f.bold:(el.dataset.fontKind==='global'&&(el.dataset.fontId==='title'||el.dataset.fontId==='title1'||el.dataset.fontId==='title2')));el.classList.toggle('is-active',f.bold);el.setAttribute('aria-pressed',String(f.bold));this.syncPillFont(el.dataset.fontKind,el.dataset.fontId);this.drawOnly();break;}
   case 'fontOrientation':{const f=(this.cfg.fieldStyles[el.dataset.fontKind][el.dataset.fontId]||={});f.orientation=el.dataset.orientation;el.closest('.bpc-font-orientation-pair')?.querySelectorAll('button').forEach(b=>b.classList.toggle('is-active',b===el));this.syncPillFont(el.dataset.fontKind,el.dataset.fontId);this.drawOnly();break;}
   case 'fontSwatch':{const f=(this.cfg.fieldStyles[el.dataset.fontKind][el.dataset.fontId]||={});f.color=allowedColor(el.dataset.color);const p=el.closest('.bpc-font-options');if(p){p.querySelector('[data-font-prop=color]').value=f.color;p.querySelectorAll('.bpc-font-swatch').forEach(b=>b.classList.toggle('is-active',b===el));}this.syncPillFont(el.dataset.fontKind,el.dataset.fontId);this.drawOnly();break;}
   case 'setChartType':this.cfg.type=el.dataset.chartType;this.render();break;
   case 'propsTab':this.propertiesTab=el.dataset.tab||'axes';this.render();break;
   case 'toggleProps':this.propertiesOpen=!this.propertiesOpen;this.render();break;
   case 'preview':this.openPreviewPage();break;
   case 'backDesign':this.popup=null;this.screen='designer';this.render();if(this.dataProvider)this.refresh();break;
   case 'addFieldZone':{const pick=this.root.querySelector(`[data-add-choice="${zone}"]`);if(!pick?.value){this.message('ابتدا نام فیلد را از کمبو انتخاب کنید.','error');break;}this.moveField(pick.value,'available',zone);break;}
   case 'removeDesignField':this.removeField(field,zone);break;
   case 'insertToken':{const inp=this.root.querySelector(`[data-title-line="${this.activeTitleLine}"]`);if(inp){inp.value+=`{${field}}`;this.updateTitleFromInputs();}break;}
   case 'addMeasure':{const f=this.cfg.fields.find(f=>f.type==='number')||this.cfg.fields[0];let id='m'+Date.now().toString(36);this.cfg.measures.push({id,field:f.name,aggregate:'sum',alias:f.label||f.name});this.render();if(this.dataProvider)this.refresh();break;}
   case 'removeMeasure':{if(this.cfg.measures.length<2){this.message('حداقل یک شاخص Y باید باقی بماند.','error');return;}this.cfg.measures=this.cfg.measures.filter(m=>m.id!==el.dataset.id);this.render();if(this.dataProvider)this.refresh();break;}
   case 'openFilter':this.openPopup(field,el);break;
   case 'popupApply':this.applyPopup();break;case 'popupCancel':this.closePopup();break;
   case 'popupAll':this.popup.draft=new Set(this.popup.values.map(K));this.paintPopup();break;
   case 'popupNone':this.popup.draft.clear();this.paintPopup();break;
   case 'quickSwatch':this.session.colors[String(this.colorIndex)]=el.dataset.color;this.drawOnly();this.renderSwatchInput();break;
   case 'resetView':this.resetSession();this.render();if(this.dataProvider)this.refresh();break;
   case 'localSave':this.saveLocal();break;case 'jsonExport':this.downloadJSON();break;
   case 'jsonImport':this.root.querySelector('.bpc-hidden-file').click();break;
   case 'serverSave':this.saveServer();break;case 'serverLoad':this.loadServer();break;
   case 'exportSVG':this.exportSVG();break;
   case 'exportPNG':this.exportPNG();break;case 'printChart':window.print();break;
  }
 }
 onChange(e){const el=e.target;const c=this.cfg;
  if(el.matches('.bpc-hidden-file')){const file=el.files[0];if(!file)return;file.text().then(t=>{this.loadConfig(t);this.message('تنظیمات از JSON بارگذاری شد.');}).catch(err=>this.message(err.message,'error'));el.value='';return;}
  if(el.dataset.action==='quickColor'){this.session.colors[String(this.colorIndex)]=allowedColor(el.value);this.drawOnly();return;}
  if(el.dataset.action==='colorSeries'){this.colorIndex=Number(el.value)||0;this.renderSwatchInput();return;}
  if(el.dataset.visibleMeasure){const id=el.dataset.visibleMeasure;this.session.hiddenMeasures=el.checked?this.session.hiddenMeasures.filter(x=>x!==id):uniq([...this.session.hiddenMeasures,id]);this.drawOnly();return;}
  if(el.dataset.popupKey!==undefined){if(!this.popup)return;el.checked?this.popup.draft.add(el.dataset.popupKey):this.popup.draft.delete(el.dataset.popupKey);this.refreshAllCheckbox();return;}
  if(el.dataset.designField){this.replaceDesignField(el.dataset.designField,el.value,el.dataset.zone);return;}
  if(el.dataset.titleLine!==undefined){this.activeTitleLine=Number(el.dataset.titleLine)||0;this.updateTitleFromInputs();return;}
  if(el.dataset.smartTarget!==undefined){if(!el.value)this.clearSelection();else{const [kind,id]=el.value.split('|');this.selectObject(kind,id);}return;}
  if(el.dataset.smartFont){if(this.selectedObject)this.changeSelectedFont(el.dataset.smartFont,el.value,false);return;}
  if(el.dataset.setting){const k=el.dataset.setting;c[k]=el.type==='checkbox'?el.checked:el.value;if(k==='mode'||k==='type'){this.render();}else if(k==='titleTemplate'){this.drawOnly();}else if(k==='chartId')c.chartId=c.chartId.replace(/[^a-zA-Z0-9_-]/g,'-');else this.drawOnly();return;}
  if(el.dataset.style){const path=el.dataset.style;const val=el.type==='checkbox'?el.checked:el.type==='number'?Number(el.value):el.value;
   if(path==='barWidthPct')c.style.barWidthPct=Math.min(100,Math.max(10,Number(val)||72));else if(path==='depth')c.style.depth=Math.min(160,Math.max(4,Number(val)||56));else if(path==='rotationHorizontal')c.style.rotationHorizontal=Math.min(70,Math.max(-70,Number(val)||0));else if(path==='rotationVertical')c.style.rotationVertical=Math.min(75,Math.max(5,Number(val)||35));else if(path==='yTitle')c.style.yTitle=String(val).slice(0,180);else if(path==='titleLineGap')c.style.titleLineGap=Math.max(1,Math.min(2,Number(val)||1.25));else if(path.startsWith('colors.'))c.style.colors[Number(path.split('.')[1])]=allowedColor(val);else c.style[path]=el.type==='color'?allowedColor(val):val;if(path==='labelOrientation')c.style.verticalLabels=val==='vertical';this.syncStyleInputs(path,c.style[path]);if(path==='showSeries')this.render();else this.drawOnly();return;}
  if(el.dataset.measureField){const m=c.measures.find(m=>m.id===el.dataset.measureField);if(m){m.field=el.value;m.alias=fieldName(c,el.value);this.syncAutoYTitle();if(this.dataProvider)this.refresh();else this.drawOnly();}return;}
  if(el.dataset.measureAgg){const m=c.measures.find(m=>m.id===el.dataset.measureAgg);if(m){m.aggregate=el.value;if(this.dataProvider)this.refresh();else this.drawOnly();}return;}
  if(el.dataset.measureAlias){const m=c.measures.find(m=>m.id===el.dataset.measureAlias);if(m){m.alias=el.value;this.drawOnly();}return;}
 }
 onInput(e){const el=e.target;
  if(el.dataset.popupSearch!==undefined){if(this.popup){this.popup.search=el.value;this.paintPopup(true);}return;}
  if(el.dataset.titleLine!==undefined){this.activeTitleLine=Number(el.dataset.titleLine)||0;this.updateTitleFromInputs();return;}
  if(el.dataset.smartFont){if(el.value!=='')this.changeSelectedFont(el.dataset.smartFont,el.value,false);return;}
  if(el.dataset.fontKind){this.updateFont(el);return;}
  if(el.dataset.style&&(['number','range','color','text'].includes(el.type))){this.updateStyleLive(el);return;}
  if(el.dataset.setting==='titleTemplate'){this.cfg.titleTemplate=el.value;this.drawOnly();}
  if(el.dataset.measureAlias){const m=this.cfg.measures.find(m=>m.id===el.dataset.measureAlias);if(m){m.alias=el.value;this.drawOnly();}}
 }
 closeFontDetails(except){this.root.querySelectorAll('.bpc-inline-type[open]').forEach(d=>{if(d!==except){d.open=false;const p=d.querySelector('.bpc-font-options');if(p){p.style.position='';p.style.left='';p.style.top='';}}});}
 positionFontPopup(detail){
  if(!detail?.open||!this.root.contains(detail))return;
  const summary=detail.querySelector('summary'),popup=detail.querySelector('.bpc-font-options');if(!summary||!popup)return;
  popup.style.position='fixed';popup.style.width='254px';popup.style.maxHeight=`${Math.max(125,window.innerHeight-16)}px`;popup.style.overflowY='auto';
  const w=popup.getBoundingClientRect().width||254,h=popup.getBoundingClientRect().height||200,r=summary.getBoundingClientRect(),gap=6;
  const x=Math.max(8,Math.min(window.innerWidth-w-8,r.right-w));
  const y=r.bottom+gap+h<=window.innerHeight-8?r.bottom+gap:Math.max(8,Math.min(r.top-h-gap,window.innerHeight-h-8));
  popup.style.left=`${Math.round(x)}px`;popup.style.top=`${Math.round(y)}px`;popup.style.right='auto';popup.style.bottom='auto';
 }
 positionOpenFonts(){this.root.querySelectorAll('.bpc-inline-type[open]').forEach(d=>this.positionFontPopup(d));}
 outsideFontClick(e){if(!this.root.isConnected)return;const item=e.target.closest?.('.bpc-inline-type');if(item&&this.root.contains(item))this.closeFontDetails(item);else this.closeFontDetails();}
 updateFont(el){const kind=el.dataset.fontKind,id=el.dataset.fontId,prop=el.dataset.fontProp;
  if(!['x','y','series','filter','global'].includes(kind)||!id)return;const obj=(this.cfg.fieldStyles[kind][id]||={});
  if(prop==='fontSize'){if(el.value==='')return;obj.fontSize=Math.max(8,Math.min(44,Number(el.value)||15));}
  else if(prop==='fontFamily'){if(!['BinaYekan','Tahoma','Arial','Vazirmatn'].includes(el.value))return;obj.fontFamily=el.value;}
  else if(prop==='color'){obj.color=allowedColor(el.value);el.closest('.bpc-font-options')?.querySelectorAll('.bpc-font-swatch').forEach(b=>b.classList.toggle('is-active',b.dataset.color.toLowerCase()===obj.color.toLowerCase()));}
  else return;this.syncPillFont(kind,id);this.drawOnly();
 }
 syncPillFont(kind,id){if(!['x','series','filter'].includes(kind))return;const st=this.cfg.fieldStyles?.[kind]?.[id]||{};
  this.root.querySelectorAll('.bpc-pill').forEach(p=>{if(p.dataset.from!==kind||p.dataset.field!==id)return;
   p.style.fontSize=(Math.max(8,Math.min(44,Number(st.fontSize)||12)))+'px';p.style.fontFamily=st.fontFamily||'BinaYekan';
   p.style.fontWeight=st.bold?'700':'400';p.style.color=allowedColor(st.color||'#163e66');
   p.style.writingMode=st.orientation==='V'?'vertical-rl':'horizontal-tb';
  });
 }

 updateStyleLive(el){let key=el.dataset.style,val=(el.type==='number'||el.type==='range')?Number(el.value):el.value;if(el.value==='')return;
  if(key==='barWidthPct')val=Math.max(10,Math.min(100,val));
  if(key==='depth')val=Math.max(4,Math.min(160,Number(val)||56));if(key==='rotationHorizontal')val=Math.max(-70,Math.min(70,Number(val)||0));if(key==='rotationVertical')val=Math.max(5,Math.min(75,Number(val)||35));
  if(key==='titleLineGap')val=Math.max(1,Math.min(2,Number(val)||1.25));
  if(key.startsWith('colors.'))this.cfg.style.colors[Number(key.split('.')[1])]=allowedColor(val);
  else this.cfg.style[key]=el.type==='color'?allowedColor(val):val;
  this.syncStyleInputs(key,val);this.drawOnly();
 }
 syncAutoYTitle(){if(this.cfg.style.yTitle)return;const el=this.root.querySelector('[data-style="yTitle"]');if(el)el.value=this.cfg.measures.map(m=>m.alias||fieldName(this.cfg,m.field)).join(' / ');}
 syncStyleInputs(key,val){this.root.querySelectorAll(`[data-style="${key}"]`).forEach(input=>{if(input.value!==String(val))input.value=String(val);});}
 updateTitleFromInputs(){const a=this.root.querySelector('[data-title-line="0"]'),b=this.root.querySelector('[data-title-line="1"]');if(!a||!b)return;this.cfg.titleTemplate=[a.value,b.value].filter((t,i)=>i===0||t.trim()).join('\n');this.drawOnly();}
 fontWheel(e){const el=e.target.closest?.('input[type="number"][data-smart-font],input[type="number"][data-font-prop="fontSize"],input[type="number"][data-style]');if(!el||!this.root.contains(el))return;
  e.preventDefault();const min=Number(el.min)||1,max=Number(el.max)||50,step=Number(el.step)||1,current=Number(el.value)||min;
  el.value=String(Math.max(min,Math.min(max,current+(e.deltaY<0?step:-step))));
  if(el.dataset.smartFont)this.changeSelectedFont(el.dataset.smartFont,el.value,false);else if(el.dataset.fontKind)this.updateFont(el);else this.updateStyleLive(el);
 }
 openPreviewPage(){
  if(this.mode!=='designer')return;const token='bpc-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
  const url=this.previewUrl+(this.previewUrl.includes('?')?'&':'?')+'draft='+encodeURIComponent(token);
  const w=window.open(url,'_blank');if(!w){this.message('مرورگر باز شدن پنجره Preview را مسدود کرده است؛ اجازه باز شدن پنجره جدید را بدهید.','error');return;}
  this.previewWindow=w;this.previewToken=token;
  if(this.previewRequestHandler)window.removeEventListener('message',this.previewRequestHandler);
  this.previewRequestHandler=e=>{
   if(e.source!==w||e.data?.type!=='BINA_PIVOT_PREVIEW_READY'||e.data?.token!==token)return;
   const rows=this.rows.length<=50000?this.rows:[];
   w.postMessage({type:'BINA_PIVOT_PREVIEW_DATA',token,config:this.getConfig(),rows,requiresProvider:!!this.dataProvider||this.rows.length>50000},'*');
  };
  window.addEventListener('message',this.previewRequestHandler);
  // Preview runs independently without an explanatory status banner.
 }
 renderSwatchInput(){const input=this.root.querySelector('[data-action="quickColor"]');if(input)input.value=this.session.colors[String(this.colorIndex)]||this.cfg.style.colors[this.colorIndex%this.cfg.style.colors.length];}
 replaceDesignField(oldField,newField,zone){
  if(!newField||newField===oldField)return;if(!this.cfg.fields.some(f=>f.name===newField))return;
  const c=this.cfg, used=[...c.xFields,...c.filterFields,...(c.seriesField?[c.seriesField]:[])];
  if(used.includes(newField)){this.message('این فیلد قبلاً در نمودار انتخاب شده است؛ آن را با Drag & Drop جابه‌جا کنید.','error');this.render();return;}
  if(zone==='x'){const i=c.xFields.indexOf(oldField);if(i<0)return;c.xFields[i]=newField;}
  else if(zone==='filter'){const i=c.filterFields.indexOf(oldField);if(i<0)return;c.filterFields[i]=newField;}
  else if(zone==='series')c.seriesField=newField;
  this.resetSession();this.render();if(this.dataProvider)this.refresh();
 }
 removeField(field,zone){const c=this.cfg;if(zone==='x'){if(c.xFields.length<=1){this.message('حداقل یک فیلد محور X لازم است.','error');return;}c.xFields=c.xFields.filter(x=>x!==field);}if(zone==='series')c.seriesField=null;if(zone==='filter')c.filterFields=c.filterFields.filter(x=>x!==field);this.render();}
 dragStart(e){let el=e.target.closest('[draggable="true"][data-field]');if(!el)return;
  this.dragInfo={field:el.dataset.field,from:el.dataset.from};try{e.dataTransfer.setData('text/plain',JSON.stringify(this.dragInfo));e.dataTransfer.effectAllowed='move';}catch(_){}}
 dragOver(e){if(e.target.closest('[data-zone]')){e.preventDefault();e.dataTransfer.dropEffect='move';}}
 drop(e){const el=e.target.closest('[data-zone]');if(!el)return;e.preventDefault();let d=this.dragInfo;try{d=JSON.parse(e.dataTransfer.getData('text/plain'))||d;}catch(_){ }this.dragInfo=null;
  if(!d?.field)return;const target=el.dataset.zone;
  // Insert before the pill hovered over, when available. This supports actual reordering.
  const candidate=e.target.closest('.bpc-pill[data-field],.bpc-design-row[data-field]');this.moveField(d.field,d.from,target,candidate?.dataset.field);
 }
 moveField(field,from,target,before){const preview=this.screen!=='designer',c=this.cfg;
  if(target!=='x'&&target!=='series')return;
  if(preview&&c.interaction.reorder===false)return;
  if(preview&&from==='available')return;
  if(preview&&c.interaction.reassign===false&&from!==target)return;
  if(preview&&!uniq([...c.xFields,...(c.seriesField?[c.seriesField]:[])]).includes(field))return;
  if(!c.fields.some(f=>f.name===field))return;
  const state=preview?this.session:c,xx=state.xFields.slice();let ss=state.seriesField;
  const oldPosition=xx.indexOf(field);
  const nextX=xx.filter(v=>v!==field);
  if(ss===field)ss=null;
  if(target==='x'){
   const idx=before&&before!==field?nextX.indexOf(before):-1;
   if(idx>=0)nextX.splice(idx,0,field);else nextX.push(field);
  }else if(target==='series'){
   if(ss&&ss!==field){nextX.splice(oldPosition>=0?Math.min(oldPosition,nextX.length):nextX.length,0,ss);}
   ss=field;
  }
  if(!nextX.length){this.message('محور X نمی‌تواند بدون فیلد باشد.','error');return;}
  state.xFields=uniq(nextX);state.filterFields=[];state.seriesField=ss;
  this.render();if(this.dataProvider)this.refresh();
 }
 async openPopup(field,anchor){if(this.cfg.interaction.filter===false&&this.screen==='viewer')return;
  const r=anchor.getBoundingClientRect(),current=this.session.filters[field]||{all:true};
  const initial=(!current||current.all!==false)?null:new Set(current.values||[]);
  this.popup={field,values:[],draft:initial,search:'',loading:true,x:Math.max(12,Math.min(window.innerWidth-305,r.left)),y:Math.min(window.innerHeight-390,Math.max(12,r.bottom+3))};this.paintPopup();
  try{let vals;if(this.dataProvider?.getDistinctValues)vals=await this.dataProvider.getDistinctValues(field,'');else vals=distinctValues(this.rows,field);
   if(!this.popup||this.popup.field!==field)return;this.popup.values=Array.isArray(vals)?vals.map(v=>v&&typeof v==='object'&&'value'in v?v.value:v):[];
   // For all mode, all currently loaded options are checked.
   if(this.popup.draft===null)this.popup.draft=new Set(this.popup.values.map(K));this.popup.loading=false;this.paintPopup();
  }catch(err){this.popup.loading=false;this.popup.error=err.message;this.paintPopup();}
 }
 paintPopup(keepFocus=false){const host=this.root.querySelector('.bpc-popover-host');if(!host||!this.popup)return;const p=this.popup;
  const shown=p.values.map(v=>({k:K(v),label:R.pretty(v)})).filter(v=>v.label.toLocaleLowerCase('fa').includes(p.search.toLocaleLowerCase('fa')));
  const visible=shown.slice(0,700);host.innerHTML=`<div class="bpc-pop-overlay" data-action="popupCancel"></div><div class="bpc-pop" style="left:${p.x}px;top:${Math.max(10,p.y)}px"><div class="bpc-pop-title">فیلتر ${E(fieldName(this.cfg,p.field))}</div><input class="bpc-pop-search" data-popup-search placeholder="جست‌وجو در مقادیر..." value="${E(p.search)}"/><div class="bpc-pop-shortcuts">${button('popupAll','(All) همه')}${button('popupNone','هیچ‌کدام')}</div><div class="bpc-pop-list">${p.loading?'در حال دریافت مقادیر...':p.error?E(p.error):visible.map(v=>`<label><input type="checkbox" data-popup-key="${E(v.k)}" ${(p.draft||new Set()).has(v.k)?'checked':''}/> <span>${E(v.label)}</span></label>`).join('')||'<i>موردی پیدا نشد.</i>'}</div>${shown.length>700?'<div class="bpc-tip">فقط ۷۰۰ مورد اول نمایش داده می‌شود. جست‌وجو کنید.</div>':''}<div class="bpc-pop-foot">${button('popupApply','OK','primary')}${button('popupCancel','Cancel')}</div></div>`;
  if(keepFocus){const inp=host.querySelector('[data-popup-search]');inp.focus();inp.setSelectionRange(inp.value.length,inp.value.length);}
 }
 refreshAllCheckbox(){} // Checkbox states are already controlled by the draft Set.
 closePopup(){this.popup=null;const p=this.root.querySelector('.bpc-popover-host');if(p)p.innerHTML='';}
 applyPopup(){const p=this.popup;if(!p||p.loading)return;const s=p.draft||new Set();const all=p.values.length&&p.values.every(v=>s.has(K(v)));
  this.session.filters[p.field]=all?{all:true}:{all:false,values:[...s]};this.closePopup();this.drawOnly();if(this.dataProvider)this.refresh();
 }
 saveLocal(){try{localStorage.setItem(localStoreKey(this.cfg.chartId),this.exportJSON());this.message(`نمودار «${this.cfg.chartId}» در مرورگر ذخیره شد. برای سرور، دکمه ذخیره در سرور را بزنید.`);}catch(e){this.message('ذخیره محلی ناموفق: '+e.message,'error');}}
 loadLocal(id){const t=localStorage.getItem(localStoreKey(id));if(!t)throw Error('نمودار با این شناسه در مرورگر موجود نیست.');this.loadConfig(t);}
 downloadJSON(){const b=new Blob([this.exportJSON()],{type:'application/json;charset=utf-8'}),u=URL.createObjectURL(b);let a=document.createElement('a');a.href=u;a.download=this.cfg.chartId+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),2000);this.message('فایل JSON دریافت شد.');}
 async exportPNG(){const svg=this.root.querySelector('.bpc-chart-canvas svg');if(!svg){this.message('نموداری برای خروجی وجود ندارد.','error');return;}
  const markup=new XMLSerializer().serializeToString(svg);const blob=new Blob([markup],{type:'image/svg+xml;charset=utf-8'}),url=URL.createObjectURL(blob),img=new Image();
  try{await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=url;});const canvas=document.createElement('canvas');canvas.width=Math.min(8192,Math.max(800,Math.round(svg.viewBox.baseVal.width*1.5)));canvas.height=Math.min(8192,Math.max(500,Math.round(svg.viewBox.baseVal.height*1.5)));canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);const data=canvas.toDataURL('image/png');const a=document.createElement('a');a.href=data;a.download=(this.cfg.chartId||'chart')+'.png';a.click();this.message('تصویر PNG ایجاد شد.');}catch(e){this.message('خروجی PNG ناموفق: '+e.message,'error');}finally{URL.revokeObjectURL(url);} }
 exportSVG(){const svg=this.root.querySelector('.bpc-chart-canvas svg');if(!svg){this.message('نموداری برای خروجی وجود ندارد.','error');return;}const b=new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml;charset=utf-8'});const u=URL.createObjectURL(b);let a=document.createElement('a');a.href=u;a.download=(this.cfg.chartId||'chart')+'.svg';a.click();setTimeout(()=>URL.revokeObjectURL(u),2000);}
 async storageCall(method,args){if(this.storage&&typeof this.storage[method]==='function')return this.storage[method](...args);
  if(!this.storageEndpoint)throw Error('آدرس Web Service تعریف نشده است؛ از storageEndpoint یا storage استفاده کنید.');
  const map=method==='save'?['SaveChart',{chartId:args[0],definition:args[1]}]:['GetChart',{chartId:args[0]}];
  const resp=await fetch(this.storageEndpoint.replace(/\/$/,'')+'/'+map[0],{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json; charset=utf-8'},body:JSON.stringify(map[1])});
  if(!resp.ok)throw Error('HTTP '+resp.status+' - '+(await resp.text()).slice(0,180));const obj=await resp.json();return Object.prototype.hasOwnProperty.call(obj,'d')?obj.d:obj;
 }
 async saveServer(){try{this.message('در حال ذخیره در سرور...');await this.storageCall('save',[this.cfg.chartId,this.exportJSON()]);this.message('تعریف نمودار روی سرور ذخیره شد.');}catch(e){this.message('ذخیره سرور ناموفق: '+e.message,'error');}}
 async loadServer(){try{this.message('در حال خواندن از سرور...');const raw=await this.storageCall('load',[this.cfg.chartId]);this.loadConfig(raw);this.message('تعریف نمودار از سرور خوانده شد.');}catch(e){this.message('خواندن سرور ناموفق: '+e.message,'error');}}
}
BinaPivotChart.defaults=()=>deep(defaults);BinaPivotChart.validate=validate;
BinaPivotChart.loadFromServer=async function(endpoint,id){const r=await fetch(endpoint.replace(/\/$/,'')+'/GetChart',{method:'POST',headers:{'Content-Type':'application/json; charset=utf-8'},credentials:'same-origin',body:JSON.stringify({chartId:id})});if(!r.ok)throw Error('خطای سرور '+r.status);const res=await r.json();return validate(JSON.parse(res.d||res));};
global.BinaPivotChart=BinaPivotChart;
})(window);
