// VERSÃO 6 - MUDANÇA OBRIGATÓRIA PARA LIMPAR O CACHE DO CELULAR
const CACHE_NAME = 'app-frases-v6';

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  // Note que NÃO colocamos o script.js nem style.css aqui 
  // para forçar o navegador a verificar a versão na rede
  '/manifest.json',
  '/img/icon-192.png',
  '/img/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;800&display=swap'
];

// 1. INSTALAÇÃO
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Força o SW novo a entrar imediatamente
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. ATIVAÇÃO (AQUI ELE APAGA O ARQUIVO VELHO DO SEU CELULAR)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('🗑️ Apagando cache antigo:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim(); // Assume o controle da página na hora
});

// 3. INTERCEPTAÇÃO DE REDE
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // REGRA 1: API nunca usa cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // REGRA 2: Se tiver ?v=... na URL, ignora o cache e vai na rede
  if (url.search.includes('v=')) {
     event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
     );
     return;
  }

  // REGRA 3: Padrão (Cache First) para imagens e fontes
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});