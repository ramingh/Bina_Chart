/* Sample records only. Replace with an authorized dataProvider in production. */
(function(global){
 const names=['شرکت آریا','شرکت پارس','شرکت سپهر'], ratios=['آنی','بازده حقوق صاحبان سهام','جاری','سرمایه در گردش به دارایی'];
 const rows=[];for(let c=0;c<names.length;c++)for(let year=1400;year<=1404;year++)for(let i=0;i<ratios.length;i++){
  let v=[1.8,.71,1.2,1.9][i]+(year-1400)*[.14,-.07,.03,.09][i]+c*[.19,.11,.06,-.04][i];
  v+=(year%3)*.025;if(year===1404&&i===0)v=2.4-c*.12;
  rows.push({id:rows.length+1,EsmSherkat:names[c],salmali:year,SharhNesbat:ratios[i],MeghdarNesbat:Math.round(v*100)/100,Foroosh:(120+c*40+(year-1400)*15+i*7)*1000000,Hazineh:(85+c*30+(year-1400)*8+i*4)*1000000});
 }
 global.BinaPivotDemoRows=rows;
 global.BinaPivotDemoConfig=(function(){const c=global.BinaPivotChart.defaults();c.fields.push({name:'Foroosh',label:'فروش',type:'number'},{name:'Hazineh',label:'هزینه',type:'number'});
  c.titleTemplate='نمودار نسبت‌های مالی - {EsmSherkat}';c.defaultFilters={};
  c.style.background='#d1bbb3';c.style.colors=['#b3887b','#628fcb','#72a65a','#c59d44'];return c;})();
})(window);
