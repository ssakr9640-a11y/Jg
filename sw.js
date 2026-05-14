const cacheName = 'vibes-v4';
const staticAssets = [
  './',
  './index.html',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

self.addEventListener('install', async e => {
  const cache = await caches.open(cacheName);
  await cache.addAll(staticAssets);
  return self.skipWaiting();
});

self.addEventListener('activate', e => {
  self.clients.claim();
});

// هنا التعديل السحري اللي هيحل المشكلة
self.addEventListener('fetch', e => {
  const req = e.request;
  
  // لو الطلب ده عبارة عن "رفع" (POST) أو رايح لكلاوديناري/فايربيز.. سيبه يعدي بدون تدخل
  if (req.method !== 'GET' || req.url.includes('cloudinary') || req.url.includes('firebase')) {
      e.respondWith(fetch(req));
      return;
  }

  const url = new URL(req.url);
  if (url.origin === location.origin) {
    e.respondWith(cacheFirst(req));
  } else {
    e.respondWith(networkAndCache(req));
  }
});

async function cacheFirst(req) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  return cached || fetch(req);
}

async function networkAndCache(req) {
  const cache = await caches.open(cacheName);
  try {
    const refresh = await fetch(req);
    // نتأكد إنه بيحفظ ملفات العرض بس مش أوامر الرفع
    if (req.method === 'GET') {
        await cache.put(req, refresh.clone());
    }
    return refresh;
  } catch (e) {
    const cached = await cache.match(req);
    return cached;
  }
}
