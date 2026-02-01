// ATENÇÃO: Mudei para v2 para forçar a atualização do design no celular do usuário
const CACHE_NAME = 'app-frases-v2';

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/app.html',
  '/css/style.css',
  '/js/script.js',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;800&display=swap'
];

// 1. Instalação: Baixa os arquivos para deixar offline
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando v2...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting(); // Força a ativação imediata
});

// 2. Ativação: Limpa a versão antiga (v1) para não mostrar o design velho
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Ativando e limpando caches antigos...');
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removendo cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Busca: Tenta o Cache primeiro, se não tiver, vai na Internet
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});