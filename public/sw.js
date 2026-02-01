const CACHE_NAME = 'app-frases-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/app.html',
  '/css/style.css',
  '/js/script.js',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;800&display=swap'
];

// 1. Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching arquivos estáticos');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting(); // Força o SW a ativar imediatamente
});

// 2. Ativação e Limpeza de Caches Antigos
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Ativando...');
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removendo cache antigo', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim(); // Controla a página imediatamente
});

// 3. Interceptação de Requisições (Estratégia: Cache First, falling back to Network)
self.addEventListener('fetch', (event) => {
  // Ignora requisições que não sejam GET ou sejam externas (analytics, etc)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Se achou no cache, retorna. Se não, busca na rede.
      return cachedResponse || fetch(event.request);
    })
  );
});