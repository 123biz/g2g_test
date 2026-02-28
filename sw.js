// 군산 강소특구 설문조사 PWA - Service Worker
const CACHE_NAME = 'gunsan-survey-v1';
const urlsToCache = [
  './',
  './index.html',
  './dashboard.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700&display=swap'
];

// 설치 이벤트 - 캐시에 파일 저장
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('캐시 열림');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.log('캐시 실패:', err);
      })
  );
  // 즉시 활성화
  self.skipWaiting();
});

// 활성화 이벤트 - 오래된 캐시 삭제
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('오래된 캐시 삭제:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // 모든 클라이언트 즉시 제어
  self.clients.claim();
});

// 요청 가로채기 - 네트워크 우선, 실패 시 캐시
self.addEventListener('fetch', event => {
  // Supabase API 요청은 항상 네트워크로
  if (event.request.url.includes('supabase.co')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // 그 외 요청: 네트워크 우선, 실패 시 캐시
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 성공한 응답은 캐시에 저장
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseClone);
            });
        }
        return response;
      })
      .catch(() => {
        // 네트워크 실패 시 캐시에서 반환
        return caches.match(event.request)
          .then(response => {
            if (response) {
              return response;
            }
            // 캐시에도 없으면 오프라인 페이지 (선택사항)
            if (event.request.mode === 'navigate') {
              return caches.match('./index.html');
            }
          });
      })
  );
});


