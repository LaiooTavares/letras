// Mudei para v3 para obrigar o celular a atualizar esse arquivo
const CACHE_NAME = 'app-frases-v3';

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  // Não cacheamos mais o app.html dinâmico para evitar bugs de versão
  '/css/style.css',
  '/js/script.js',
  '/manifest.json',
  '/img/icon-192.png', // Certifique-se que as imagens existem
  '/img/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;800&display=swap'
];

// 1. Instalação
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando v3...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// 2. Ativação (Limpeza de caches antigos)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Interceptação (AQUI ESTÁ A CORREÇÃO DE SINCRONIA)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // REGRA DE OURO: Se for uma chamada para a API (/api/...), 
  // NUNCA use o cache. Vá sempre na rede (Network Only).
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Para o resto (CSS, JS, Imagens), usa a estratégia Cache First
  if (event.request.method === 'GET') {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        return cachedResponse || fetch(event.request);
      })
    );
  }
});