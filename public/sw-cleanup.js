// Pre-hydration zombie service worker eviction. Runs before React mounts and
// before any SW can intercept app bundles. Version the guard key so a new
// deploy forces re-cleanup even for users who already ran v1.
(function () {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  try {
    if (sessionStorage.getItem('sw-cleanup-v2') === '1') return;
  } catch (e) {
    return;
  }

  navigator.serviceWorker.getRegistrations().then(function (regs) {
    if (regs.length === 0) {
      try { sessionStorage.setItem('sw-cleanup-v2', '1'); } catch (e) {}
      return;
    }
    Promise.all([
      Promise.all(regs.map(function (r) { return r.unregister(); })),
      (typeof caches !== 'undefined'
        ? caches.keys().then(function (keys) {
            return Promise.all(keys.map(function (k) { return caches.delete(k); }));
          })
        : Promise.resolve()),
    ]).then(function () {
      try { sessionStorage.setItem('sw-cleanup-v2', '1'); } catch (e) {}
      location.reload();
    }).catch(function () {
      try { sessionStorage.setItem('sw-cleanup-v2', '1'); } catch (e) {}
    });
  }).catch(function () {});
})();
