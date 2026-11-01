// Folio offline shell. Only caches the public app files, never private documents.
const CACHE_NAME='folio-shell-v2';
const ROOT=self.registration.scope;
const SHELL=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./firebase-config.js','./auth.js','./payment-config.js','./payment.js'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(SHELL.map(path=>new URL(path,ROOT).href))).then(()=>self.skipWaiting()).catch(err=>console.warn('Offline cache unavailable',err)));
});
self.addEventListener('activate',event=>{
  event.waitUntil(Promise.all([
    caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('folio-shell-')&&key!==CACHE_NAME).map(key=>caches.delete(key)))),
    self.clients.claim()
  ]));
});
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin || !url.pathname.startsWith(new URL(ROOT).pathname))return;
  if(request.mode==='navigate'){
    event.respondWith(fetch(request).then(response=>{if(response.ok){const clone=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(new URL('./index.html',ROOT).href,clone)).catch(()=>{});}return response;}).catch(async()=>await caches.match(new URL('./index.html',ROOT).href)||Response.error()));
    return;
  }
  event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{if(response.ok){const clone=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(request,clone)).catch(()=>{});}return response;})));
});
