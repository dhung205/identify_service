(function () {
  const host = window.location.hostname || "localhost";
  const apiOrigin = `http://${host}:8080`;
  const apiRoot = `${apiOrigin}/api`;
  const frontendIndex = window.location.pathname.toLowerCase().indexOf("/frontend/");
  const appBase = frontendIndex >= 0 ? window.location.pathname.slice(0, frontendIndex + 1) : "/";
  const startUrl = `${window.location.origin}${appBase}start-backend.php`;
  let ensurePromise = null;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  async function fetchWithTimeout(url, timeout) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      return await fetch(url, { cache: "no-store", signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  }

  async function ping() {
    try {
      const response = await fetchWithTimeout(`${apiOrigin}/`, 1200);
      return response.ok;
    } catch {
      return false;
    }
  }

  async function ensure() {
    if (ensurePromise) return ensurePromise;
    ensurePromise = (async () => {
      if (await ping()) return true;

      try {
        await fetchWithTimeout(`${startUrl}?t=${Date.now()}`, 5000);
      } catch {
        // The next poll still handles slow Apache/PHP responses.
      }

      const deadline = Date.now() + 25000;
      while (Date.now() < deadline) {
        if (await ping()) return true;
        await sleep(700);
      }

      ensurePromise = null;
      throw new Error("Không thể tự khởi động backend. Hãy mở CHAY-WEB-XAMPP.bat rồi thử lại.");
    })();
    return ensurePromise;
  }

  window.LongChauBackend = { apiOrigin, apiRoot, ensure, ping };
  if (window.location.protocol === "http:" && window.location.port !== "4173") {
    ensure().catch(() => {});
  }
})();
