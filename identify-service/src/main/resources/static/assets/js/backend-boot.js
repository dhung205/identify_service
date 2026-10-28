(() => {
  const base = new URL('../../', document.currentScript.src).pathname.replace(/\/$/, '');
  window.LongChauBackend = { apiRoot: base, apiOrigin: location.origin, commerceAvailable: false, ensure: async () => true };
})();

