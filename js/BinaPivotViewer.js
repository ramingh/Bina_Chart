/* BINA Pivot Viewer — public, viewer-only entry point. MIT.
   Depends on BinaPivotRenderer.js + BinaPivotChart.js (shared runtime).
   No designer features are exposed by this wrapper. */
(function(global){
'use strict';
if(typeof global.BinaPivotChart!=='function')throw Error('ابتدا BinaPivotChart.js را بارگذاری کنید.');
class BinaPivotViewer{
 #chart;
 constructor(target,options={}){this.#chart=new global.BinaPivotChart(target,{...options,mode:'viewer'});}
 setData(rows){this.#chart.setData(rows);}
 loadConfig(definition){this.#chart.loadConfig(definition);}
 refresh(){return this.#chart.refresh();}
 exportSVG(){return this.#chart.exportSVG();}
 exportPNG(){return this.#chart.exportPNG();}
 destroy(){this.#chart.destroy();}
}
global.BinaPivotViewer=BinaPivotViewer;
})(window);
