(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.ListenEngine=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const DAY=86400000,KEY='listen-path.progress.v1',intervals=[1,3,7,14,30,60];
 function fresh(){return {version:1,lessons:{},phrases:{},notes:{},settings:{speed:1},last:null};}
 function normalise(s){
  if(!s||s.version!==1||typeof s.lessons!=='object'||typeof s.phrases!=='object'||Array.isArray(s.lessons)||Array.isArray(s.phrases))throw new Error('Неверный формат копии Listen Path');
  const out=fresh();
  for(const [id,r]of Object.entries(s.lessons||{}))if(/^l\d{2}$/.test(id)&&r&&typeof r==='object')out.lessons[id]={completed:r.completed===true,step:Math.min(4,Math.max(0,Number(r.step)||0)),lastAt:Number(r.lastAt)||0};
  for(const [id,r]of Object.entries(s.phrases||{}))if(/^l\d{2}:\d{1,2}$/.test(id)&&r&&typeof r==='object'&&Number.isFinite(r.due))out.phrases[id]={due:r.due,level:Math.max(0,Math.min(6,Number(r.level)||0)),lastAt:Number(r.lastAt)||0,lastRating:['again','hint','good'].includes(r.lastRating)?r.lastRating:null};
  for(const [k,v]of Object.entries(s.notes||{}))if(/^[\w:-]{1,80}$/.test(k)&&typeof v==='string')out.notes[k]=v.slice(0,50000);
  if([.75,.85,1,1.1,1.25].includes(s.settings?.speed))out.settings.speed=s.settings.speed;
  if(/^l\d{2}$/.test(s.last||''))out.last=s.last;
  return out;
 }
 function add(s,id,now=Date.now()){if(!s.phrases[id])s.phrases[id]={due:now,level:0,lastAt:0,lastRating:null};return s;}
 function rate(s,id,rating,now=Date.now()){
  add(s,id,now);const r=s.phrases[id];
  if(rating==='again'){r.due=now+600000;r.level=0;}
  else if(rating==='hint'){r.due=now+DAY;r.level=Math.max(0,r.level-1);}
  else if(rating==='good'){
   if(!r.lastAt||now>=r.due){r.due=now+intervals[Math.min(r.level,intervals.length-1)]*DAY;r.level=Math.min(intervals.length,r.level+1);}
  }else throw new Error('Unknown rating');
  r.lastAt=now;r.lastRating=rating;return r;
 }
 function due(s,now=Date.now()){return Object.keys(s.phrases).filter(k=>s.phrases[k].due<=now).sort((a,b)=>s.phrases[a].due-s.phrases[b].due);}
 function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
 return {KEY,DAY,fresh,normalise,add,rate,due,escapeHTML};
});
