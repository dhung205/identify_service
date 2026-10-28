// Date and greeting use the same Vietnam timezone, independent of browser locale.
(() => {
  const formatter = new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    weekday: "long", day: "2-digit", month: "2-digit",
    hour: "2-digit", hourCycle: "h23",
  });
  function updateWelcome() {
    const parts = Object.fromEntries(
      formatter.formatToParts(new Date()).map(({ type, value }) => [type, value]),
    );
    const hour = Number(parts.hour);
    const period = hour >= 5 && hour < 12 ? "sáng" : hour >= 12 && hour < 18 ? "chiều" : "tối";
    document.getElementById("welcomeDate").textContent =
      `${parts.weekday}, ${parts.day} tháng ${parts.month}`.toLocaleUpperCase("vi-VN");
    document.getElementById("welcomeHeading").firstChild.nodeValue = `Chào buổi ${period}, `;
  }
  updateWelcome();
  setInterval(updateWelcome, 30000);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) updateWelcome();
  });
  window.addEventListener("focus", updateWelcome);
})();
