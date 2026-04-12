self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  // PWA braucht einen Fetch-Listener, um als "installierbar" zu gelten.
  // Wir cachen hier absichtlich nichts aggressiv, um API-Probleme zu vermeiden.
});
