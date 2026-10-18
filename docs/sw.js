'use strict';
const VERSION='listen-path-v1-20261018-3',CORE=['./','index.html','style.css','content.js','engine.js','app.js','offline.js','manifest.webmanifest','precache.json','assets/icon.svg','assets/icon-180.png','assets/icon-192.png','assets/icon-512.png'];
const base=self.registration.scope;const absolute=p=>new URL(p,base).href;let preparing=null;
self.addEventListener('install',e=>e.waitUntil((async()=>{const c=await caches.open(VERSION);await c.addAll(CORE.map(absolute));await self.skipWaiting();})()));
self.addEventListener('activate',e=>e.waitUntil((async()=>{for(const k of await caches.keys())if(k.startsWith('listen-path-v')&&k!==VERSION)await caches.delete(k);await self.clients.claim();})()));
async function broadcast(data){for(const c of await self.clients.matchAll({type:'window',includeUncontrolled:true}))c.postMessage({type:'LISTEN_OFFLINE',...data});}
async function getFiles(c){const r=await c.match(absolute('precache.json'))||await fetch(absolute('precache.json'));return (await r.json()).files;}
async function status(){const c=await caches.open(VERSION),files=await getFiles(c);let done=0;for(const f of files)if(await c.match(absolute(f)))done++;const data={ready:done===files.length,done,total:files.length};await broadcast(data);return data;}
async function prepare(){
 if(preparing)return preparing;
 preparing=(async()=>{const c=await caches.open(VERSION),files=await getFiles(c);let done=0;const missing=[];for(const f of files){if(await c.match(absolute(f)))done++;else missing.push(f);}await broadcast({ready:missing.length===0,done,total:files.length});
  let failed=0,index=0;await Promise.all(Array.from({length:4},async()=>{while(index<missing.length){const f=missing[index++];try{const r=await fetch(absolute(f),{cache:'reload'});if(!r.ok||r.status!==200)throw new Error('Fetch failed');await c.put(absolute(f),r);done++;}catch{failed++;}await broadcast({ready:done===files.length,done,total:files.length,failed});}}));await broadcast({ready:done===files.length,done,total:files.length,failed});
 })().finally(()=>{preparing=null;});return preparing;
}
self.addEventListener('message',e=>{if(e.data?.type==='PREPARE')e.waitUntil(prepare());if(e.data?.type==='STATUS')e.waitUntil(status());});
async function fromCache(req){const c=await caches.open(VERSION),url=new URL(req.url);url.search='';const cached=await c.match(url.href);if(cached){const range=req.headers.get('range');if(range&&url.pathname.endsWith('.mp3')){const data=await cached.arrayBuffer(),size=data.byteLength,m=/^bytes=(\d*)-(\d*)$/i.exec(range);if(!m)return new Response(null,{status:416,headers:{'Content-Range':'bytes */'+size}});let start=m[1]?Number(m[1]):Math.max(0,size-Number(m[2])),end=m[1]?(m[2]?Math.min(Number(m[2]),size-1):size-1):size-1;if(start>=size||end<start)return new Response(null,{status:416,headers:{'Content-Range':'bytes */'+size}});return new Response(data.slice(start,end+1),{status:206,headers:{'Content-Type':'audio/mpeg','Content-Range':`bytes ${start}-${end}/${size}`,'Content-Length':String(end-start+1),'Accept-Ranges':'bytes'}});}return cached;}
 try{return await fetch(req);}catch(e){if(req.mode==='navigate')return await c.match(absolute('index.html'));throw e;}}
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method==='GET'&&u.origin===self.location.origin&&u.href.startsWith(base))e.respondWith(fromCache(e.request));});
