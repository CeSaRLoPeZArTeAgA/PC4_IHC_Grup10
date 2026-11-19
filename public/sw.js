const cache='triagevoz-pc4-selector-aq-profesional-v3';
const assets=['/','/index.html','/app.js','/vui.js','/navigation.js','/i18n.js','/i18n-dictionary.js','/personality.js','/personality-ui.js','/styles.css','/doctor-avatar.jpg','/icon.svg','/icono-idiomas-aq.png','/manifest.webmanifest'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(cache).then(store=>store.addAll(assets)));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(
    keys.filter(key=>key!==cache).map(key=>caches.delete(key))
  )));
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET'||new URL(event.request.url).pathname.startsWith('/api/'))return;
  event.respondWith(fetch(event.request).catch(()=>caches.match(event.request)));
});
