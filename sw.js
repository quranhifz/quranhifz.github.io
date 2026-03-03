// تغییر نام به v3 برای اجبار مرورگر به حذف نسخه‌های قبلی و خراب
const CACHE_NAME = 'quran-cache-v3';

// آدرس‌های دقیق برای گیت‌هاب پیجز
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/vazirmatn/33.0.0/Vazirmatn-font-face.min.css',
  'https://cdn.fontcdn.ir/Font/Persian/Vazir/Vazir.css'
];

// 1. نصب سرویس ورکر و کش کردن فایل‌های اولیه
self.addEventListener('install', event => {
  self.skipWaiting(); // نصب فوری نسخه جدید
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
});

// 2. پاک کردن حافظه‌های خراب قبلی
self.addEventListener('activate', event => {
  self.clients.claim(); // کنترل فوری صفحات
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName); 
          }
        })
      );
    })
  );
});

// 3. رهگیری هوشمند درخواست‌ها
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    // ابتدا چک می‌کنیم آیا فایل در حافظه هست؟ (با نادیده گرفتن پارامترهای اضافی آدرس)
    caches.match(event.request, { ignoreSearch: true }).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }

      // اگر در حافظه نبود، از اینترنت می‌گیریم و خودکار در حافظه ذخیره می‌کنیم
      return fetch(event.request).then(networkResponse => {
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      }).catch(() => {
        // اگر اینترنت کاملاً قطع بود و کاربر می‌خواست صفحه اصلی را باز کند
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
