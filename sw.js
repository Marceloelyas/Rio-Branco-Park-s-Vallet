// Service Worker para Rio Branco Vallet PWA

const CACHE_NAME = 'vallet-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/login.html',
  '/css/style.css',
  '/css/auth.css',
  '/css/responsive.css',
  '/js/app.js',
  '/js/auth.js',
  '/js/charts.js',
  '/js/reports.js',
  '/js/pwa.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// Instalar Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Ativar Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Interceptar requisições
self.addEventListener('fetch', event => {
  // Ignorar requisições do Chrome DevTools
  if (event.request.url.includes('chrome-extension')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - retornar resposta do cache
        if (response) {
          return response;
        }
        
        // Clonar a requisição
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then(response => {
          // Verificar se a resposta é válida
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clonar a resposta
          const responseToCache = response.clone();
          
          // Adicionar ao cache
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        }).catch(() => {
          // Fallback para página offline
          if (event.request.headers.get('accept').includes('text/html')) {
            return caches.match('/offline.html');
          }
        });
      })
  );
});

// Sincronização em background
self.addEventListener('sync', event => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

// Push notifications
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Nova notificação do Vallet',
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Abrir',
        icon: 'icon-192.png'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: 'icon-192.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Rio Branco Vallet', options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/index.html')
    );
  }
});

// Função de sincronização
async function syncData() {
  try {
    // Aqui você implementaria a sincronização com um servidor
    console.log('Sincronizando dados em background...');
    
    // Simular sincronização
    const cars = JSON.parse(localStorage.getItem('parkingCars')) || [];
    
    if (cars.length > 0) {
      // Em produção, enviaria para um servidor
      console.log(`${cars.length} veículos para sincronizar`);
      
      // Mostrar notificação
      self.registration.showNotification('Vallet Sync', {
        body: `${cars.length} veículos sincronizados`,
        icon: 'icon-192.png'
      });
    }
  } catch (error) {
    console.error('Erro na sincronização:', error);
  }
}
