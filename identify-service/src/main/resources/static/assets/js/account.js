(async () => {
await PharmacyCart.ready;
await (window.LongChauBackend?.ensure?.() || Promise.resolve()).catch(() => {});
const commercePage = document.body.dataset.commerce || "";
const API = window.LongChauBackend?.apiRoot || `http://${window.location.hostname || "localhost"}:8080/api`;
const signedInUser = (() => {
  try {
    return JSON.parse(sessionStorage.getItem("pharmacyUser"));
  } catch {
    return null;
  }
})();

const money = (value) => new Intl.NumberFormat("vi-VN").format(value || 0) + "đ";
const escapeHtml = (value) =>
  String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

function safeConsultImage(value) {
  const image = String(value || "");
  return /^data:image\/(png|jpe?g|webp|gif);base64,/i.test(image) ? image : "";
}

function renderMessageText(value) {
  return escapeHtml(value)
    .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
    .replace(/\n/g, "<br>");
}

function consultQuestionText(value) {
  const text = String(value || "").trim();
  return text === "Khách hàng đã gửi ảnh cần tư vấn." ? "" : text;
}

function readImageFile(file) {
  if (!file) return Promise.resolve("");
  if (!/^image\/(png|jpe?g|webp|gif)$/i.test(file.type)) {
    return Promise.reject(new Error("Vui lòng chọn ảnh PNG, JPG, WEBP hoặc GIF."));
  }
  if (file.size > 2 * 1024 * 1024) {
    return Promise.reject(new Error("Ảnh quá lớn. Vui lòng chọn ảnh dưới 2MB."));
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Không đọc được ảnh đã chọn."));
    reader.readAsDataURL(file);
  });
}

function renderConsultMessages(rows) {
  return [...rows]
    .reverse()
    .map((c) => {
      const image = safeConsultImage(c.questionImage);
      const question = consultQuestionText(c.question);
      const time = c.createdAt ? new Date(c.createdAt).toLocaleString("vi-VN") : "";
      return `<article class="consult-message is-customer">
  <div class="consult-bubble"><b>Bạn</b>${question ? `<p>${renderMessageText(question)}</p>` : ""}${
    image ? `<img class="consult-attachment" src="${image}" alt="Ảnh khách hàng gửi tư vấn">` : ""
  }${time ? `<small>${time}</small>` : ""}</div>
</article>
<article class="consult-message is-staff ${c.answer ? "" : "is-pending"}">
  <div class="consult-bubble"><b>Dược sĩ Long Châu</b><p>${
    c.answer ? renderMessageText(c.answer) : "Dược sĩ sẽ phản hồi tin nhắn của bạn sớm nhất."
  }</p></div>
</article>`;
    })
    .join("");
}

// Giỏ hàng dùng chung khóa lưu trữ với trang chủ (index.html) theo từng tài khoản khách hàng.
function cartStorageKey() {
  return signedInUser?.id
    ? `pharmacyCart:customer:${signedInUser.id}`
    : "pharmacyCart:guest";
}
function loadCart() { return PharmacyCart.read(); }
function selectedCart() { return cart.filter(item => item.selected !== false); }
async function validateCartAvailability() {
  for (const item of selectedCart()) {
    let response;
    let result;
    try {
      response = await fetch(API + "/medicines/" + encodeURIComponent(item.id));
      result = await response.json();
    } catch {
      throw new Error("Không thể kết nối máy chủ kiểm tra sản phẩm. Vui lòng kiểm tra backend và MySQL rồi thử lại.");
    }
    if (response.status === 404) throw new Error(`Sản phẩm ${item.name} không còn tồn tại. Vui lòng xóa khỏi giỏ hàng.`);
    if (!response.ok || !result.success || !result.data) {
      throw new Error("Máy chủ chưa kiểm tra được sản phẩm. Vui lòng kiểm tra backend và kết nối MySQL rồi thử lại.");
    }
    if (result.data.active === false) throw new Error(`Sản phẩm ${item.name} đã ngừng bán. Vui lòng xóa khỏi giỏ hàng.`);
    const quantity = Number(item.quantity);
    const stock = Number(result.data.stock);
    if (!Number.isSafeInteger(quantity) || quantity < 1) throw new Error(`Số lượng ${item.name} phải là số nguyên lớn hơn 0.`);
    if (result.data.stock == null || !Number.isSafeInteger(stock) || stock < 0) throw new Error(`Máy chủ trả về tồn kho không hợp lệ cho ${item.name}. Vui lòng thử lại sau.`);
    if (quantity > stock) throw new Error(`${item.name} không đủ số lượng đáp ứng. Vui lòng quay lại giỏ hàng để điều chỉnh.`);
    item.quantity = quantity;
  }
}
function saveCart() {
  return PharmacyCart.save(cart).catch(error => { cart = PharmacyCart.read(); renderCart(); alert(error.message); });
}
let cart = loadCart();

/* ---------------- Thông báo popup ---------------- */
const noticeModal = document.querySelector("#noticeModal");
const noticeTitle = document.querySelector("#noticeTitle");
const noticeMessage = document.querySelector("#noticeMessage");
const noticeIcon = document.querySelector("#noticeIcon");
const noticeButton = document.querySelector("#noticeButton");
const noticeClose = document.querySelector("#noticeClose");
function showNotice(message, type = "success", title) {
  noticeTitle.textContent = title || (type === "error" ? "Có lỗi xảy ra" : "Thông báo");
  noticeMessage.textContent = message;
  noticeIcon.textContent = type === "error" ? "!" : "✓";
  noticeModal.dataset.type = type;
  noticeModal.hidden = false;
  return new Promise((resolve) => {
    const close = () => {
      noticeModal.hidden = true;
      noticeButton.onclick = null;
      noticeClose.onclick = null;
      resolve();
    };
    noticeButton.onclick = close;
    noticeClose.onclick = close;
  });
}

/* ---------------- Header: số lượng giỏ hàng ---------------- */
const cartCount = document.querySelector("#cartCount");
function updateCartCount() {
  cartCount.textContent = PharmacyCart.quantity();
  const tabCount = document.querySelector("#cartTabCount");
  if (tabCount) tabCount.textContent = isCustomer && cart.length ? cart.reduce((s, i) => s + i.quantity, 0) : "";
  saveCart();
}
document.querySelector("#cartButton").addEventListener("click", async () => {
  try { await PharmacyCart.flush(); } catch(e) { return alert(e.message); }
  if (isCustomer) location.href = "cart.html?v=44";
  else location.href = "staff/login.html";
});

/* ---------------- Khu vực khách chưa đăng nhập / đã đăng nhập ---------------- */
const guestArea = document.querySelector("#guestArea");
const accountArea = document.querySelector("#accountArea");
// Nhân viên và quản lý cũng có thể mua thuốc; quyền quản trị của họ không thay đổi.
const isCustomer = Boolean(signedInUser?.id);
guestArea.hidden = isCustomer;
accountArea.hidden = !isCustomer;

if (signedInUser) {
  const accountLabel = document.querySelector("#accountLabel");
  const accountLink = document.querySelector("#accountLink");
  accountLabel.textContent = signedInUser.fullName || "Tài khoản";
  accountLink.href = isCustomer ? "account.html" : "staff/index.html";
}

/* ---------------- Combo chọn Tỉnh/Thành, Quận/Huyện (kiểu lướt để tìm) ---------------- */
class SearchCombo {
  constructor(container, options = [], placeholder = "Chọn", onChange = () => {}) {
    this.container = container;
    this.placeholder = placeholder;
    this.onChange = onChange;
    this.options = options;
    this.value = "";
    this.container.classList.add("combo");
    this.container.innerHTML = `
      <button type="button" class="combo-toggle">
        <span class="combo-toggle-text">${escapeHtml(placeholder)}</span><b>⌄</b>
      </button>
      <div class="combo-panel" hidden>
        <input type="text" class="combo-search" placeholder="Gõ để tìm nhanh..." />
        <div class="combo-list" role="listbox"></div>
      </div>`;
    this.toggleBtn = this.container.querySelector(".combo-toggle");
    this.toggleText = this.container.querySelector(".combo-toggle-text");
    this.panel = this.container.querySelector(".combo-panel");
    this.searchInput = this.container.querySelector(".combo-search");
    this.list = this.container.querySelector(".combo-list");
    this.renderList(this.options);
    this.toggleBtn.disabled = !options.length;
    this.toggleBtn.setAttribute("aria-expanded", "false");
    this.container.addEventListener("keydown", e => { if (e.key === "Escape") { this.close(); this.toggleBtn.focus(); } });

    this.toggleBtn.addEventListener("click", () => this.panel.hidden ? this.open() : this.close());
    this.searchInput.addEventListener("input", () =>
      this.renderList(
        this.options.filter((o) =>
          o.toLocaleLowerCase("vi").includes(this.searchInput.value.trim().toLocaleLowerCase("vi")),
        ),
      ),
    );
    this.list.addEventListener("click", (e) => {
      const item = e.target.closest("[data-value]");
      if (!item) return;
      this.setValue(item.dataset.value, true);
      this.close();
    });
    document.addEventListener("click", (e) => {
      if (!this.container.contains(e.target)) this.close();
    });
  }
  renderList(options) {
    this.list.innerHTML = options.length
      ? options
          .map(
            (o) =>
              `<button type="button" class="combo-item${o === this.value ? " selected" : ""}" data-value="${escapeHtml(o)}" role="option" aria-selected="${o === this.value}">${escapeHtml(o)}</button>`,
          )
          .join("")
      : '<div class="combo-empty">Không tìm thấy kết quả phù hợp.</div>';
  }
  open() {
    this.panel.hidden = false;
    this.toggleBtn.setAttribute("aria-expanded", "true");
    this.container.classList.add("open");
    this.searchInput.value = "";
    this.renderList(this.options);
    this.searchInput.focus();
  }
  close() {
    this.panel.hidden = true;
    this.toggleBtn.setAttribute("aria-expanded", "false");
    this.container.classList.remove("open");
  }
  setOptions(options) {
    this.options = options;
    this.toggleBtn.disabled = !options.length;
    this.setValue("");
    this.renderList(options);
  }
  setValue(value, fireChange) {
    this.value = value || "";
    this.toggleText.textContent = this.value || this.placeholder;
    this.toggleText.classList.toggle("is-placeholder", !this.value);
    if (fireChange) this.onChange(this.value);
  }
  getValue() {
    return this.value;
  }
}

const cityNames = VN_ADDRESS_DATA.map((p) => p.city);
const districtCombo = new SearchCombo(
  document.querySelector("#districtCombo"),
  [],
  "Chọn quận / huyện (chọn tỉnh trước)",
);
const cityCombo = new SearchCombo(
  document.querySelector("#cityCombo"),
  cityNames,
  "Chọn tỉnh / thành phố",
  (city) => {
    const found = VN_ADDRESS_DATA.find((p) => p.city === city);
    districtCombo.setOptions(found ? found.districts : []);
    districtCombo.toggleText.textContent = found
      ? "Chọn quận / huyện"
      : "Chọn tỉnh trước";
  },
);

/* ---------------- Hình thức nhận hàng ---------------- */
let deliveryMethod = "ONLINE";
const addressFields = document.querySelector("#addressFields");
const pickupNote = document.querySelector("#pickupNote");
document.querySelector("#deliveryMethod").addEventListener("click", (e) => {
  const btn = e.target.closest(".method-option");
  if (!btn) return;
  deliveryMethod = btn.dataset.method;
  document
    .querySelectorAll(".method-option")
    .forEach((b) => { b.classList.toggle("active", b === btn); b.setAttribute("aria-pressed", String(b === btn)); });
  addressFields.hidden = deliveryMethod !== "ONLINE";
  pickupNote.hidden = deliveryMethod !== "PICKUP";
});

/* Product photos are provided by the medicine record in every order detail. */
function orderProductImage(medicine) {
  const image = medicine.image;
  const valid = typeof image === 'string' && (/^https?:\/\//i.test(image) || /^data:image\/(png|jpe?g|webp|gif);base64,/i.test(image));
  return `<div class="order-card-item-thumb order-product-photo">${valid ? `<img data-order-photo src="${escapeHtml(image)}" alt="${escapeHtml(medicine.name || 'Sản phẩm')}" loading="lazy">` : '<span>Chưa có ảnh</span>'}</div>`;
}
document.addEventListener('error', event => {
  if (event.target.matches?.('img[data-order-photo]')) event.target.parentElement.textContent = 'Chưa có ảnh';
}, true);
let voucherCatalog = [];
let selectedVoucher = sessionStorage.getItem(cartStorageKey() + ":voucher") || "";
let voucherLoadState = 'loading';
const voucherDialog = document.querySelector('#voucherDialog');
const voucherOptions = document.querySelector('#voucherOptions');
function voucherSubtotal() { return selectedCart().reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0); }
function voucherAmount(v, subtotal) { return Math.min(subtotal, Math.round(v.percent ? subtotal * v.percent / 100 : v.amount)); }
function updateVoucherTotals(subtotal) {
  let selected = voucherCatalog.find(v => v.code === selectedVoucher);
  let removed = false;
  if (selectedVoucher && voucherLoadState === "ready" && (!selected || subtotal < selected.minSubtotal)) {
    selectedVoucher = ''; selected = null; removed = true;
  }
  sessionStorage.setItem(cartStorageKey() + ':voucher', selectedVoucher);
  const discount = selected ? voucherAmount(selected, subtotal) : 0;
  document.querySelector('#voucherDiscount').textContent = discount ? '−' + money(discount) : money(0);
  document.querySelector('#voucherGrandTotal').textContent = money(subtotal - discount);
  document.querySelector('#cartTotal').textContent = money(subtotal - discount);
  document.querySelector('#voucherStatus').textContent = removed ? 'Đã bỏ voucher vì đơn hàng không còn đủ điều kiện.' : selected ? `Đã chọn ${selected.code} · ${selected.title}` : 'Chưa áp dụng voucher';
  document.querySelector('#chooseVoucher').disabled = !selectedCart().length;
}
function renderVoucherOptions() {
  const subtotal = voucherSubtotal();
  voucherOptions.innerHTML = '<legend>Chọn một ưu đãi</legend><label class="voucher-choice"><input type="radio" name="orderVoucher" value="" ' + (!selectedVoucher ? 'checked' : '') + '><span><b>Không dùng voucher</b><small>Thanh toán theo giá sản phẩm</small></span></label>' + voucherCatalog.map(v => {
    const eligible = subtotal >= v.minSubtotal;
    return `<label class="voucher-choice ${eligible ? '' : 'unavailable'}"><input type="radio" name="orderVoucher" value="${escapeHtml(v.code)}" ${selectedVoucher === v.code ? 'checked' : ''} ${eligible ? '' : 'disabled'}><span><b>${escapeHtml(v.title)}</b><small>${escapeHtml(v.code)} · Đơn từ ${money(v.minSubtotal)}</small><small>${eligible ? 'Tiết kiệm ' + money(voucherAmount(v, subtotal)) : 'Mua thêm ' + money(v.minSubtotal - subtotal) + ' để sử dụng'}</small></span></label>`;
  }).join('');
  document.querySelector('#voucherDialogStatus').textContent = voucherLoadState === 'loading' ? 'Đang tải ưu đãi…' : voucherLoadState === 'error' ? 'Chưa tải được voucher. Đóng và mở lại để thử lại.' : '';
}
async function loadVouchers() {
  voucherLoadState = 'loading';
  try {
    const response = await fetch(API + '/vouchers', {signal:AbortSignal.timeout(8000)});
    const result = await response.json();
    if (!response.ok || !result.success || !Array.isArray(result.data)) throw Error('Voucher unavailable');
    voucherCatalog = result.data; voucherLoadState = 'ready';
  } catch { voucherLoadState = 'error'; }
  updateVoucherTotals(voucherSubtotal());
  if (voucherDialog.open) renderVoucherOptions();
}
document.querySelector('#chooseVoucher').addEventListener('click', () => {
  renderVoucherOptions(); voucherDialog.showModal();
  if (voucherLoadState === 'error') loadVouchers();
});
document.querySelector('#closeVoucher').addEventListener('click', () => voucherDialog.close());
document.querySelector('#applyVoucher').addEventListener('click', () => {
  const code = voucherOptions.querySelector('input:checked')?.value || '';
  const candidate = voucherCatalog.find(v => v.code === code);
  if (code && (!candidate || voucherSubtotal() < candidate.minSubtotal)) {
    renderVoucherOptions(); return;
  }
  selectedVoucher = code; updateVoucherTotals(voucherSubtotal()); voucherDialog.close();
});
loadVouchers();

/* ---------------- Giỏ hàng & Thanh toán ---------------- */
const cartRows = document.querySelector("#cartRows");
const cartSubtotal = document.querySelector("#cartSubtotal");
const cartTotal = document.querySelector("#cartTotal");
const checkoutForm = document.querySelector("#checkoutForm");
const checkoutSection = document.querySelector("#checkoutSection");
const buyNowButton = document.querySelector("#buyNowButton");

function renderCart() {
  buyNowButton.disabled = !selectedCart().length;
  updateCartCount();
  saveCart();
  if (!cart.length || (commercePage === "checkout" && !selectedCart().length)) {
    if (document.querySelector("#cartSelection")) document.querySelector("#cartSelection").innerHTML = "";
    cartRows.innerHTML = cart.length ? '<div class="empty-cart-state"><p>Chưa có sản phẩm được chọn để thanh toán.</p><a class="continue-shopping" href="cart.html">Quay lại giỏ hàng →</a></div>' : '<div class="empty-cart-state"><p>Giỏ hàng đang trống. Hãy chọn sản phẩm bạn cần nhé.</p><a class="continue-shopping" href="index.html">Về trang chủ chọn mua →</a></div>';
    cartSubtotal.textContent = money(0);
    cartTotal.textContent = money(0);
    updateVoucherTotals(0);
    checkoutSection.hidden = true; // Giỏ hàng trống thì ẩn luôn form nhận hàng.
    return;
  }
  const visibleCart = commercePage === "checkout" ? selectedCart() : cart;
  const selection = document.querySelector('#cartSelection');
  if (selection) selection.innerHTML = `<label><input type="checkbox" id="selectAllCart" ${selectedCart().length === cart.length ? 'checked' : ''}> Chọn tất cả (${selectedCart().length}/${cart.length})</label>`;
  const selectAll = document.querySelector('#selectAllCart');
  if (selectAll) selectAll.indeterminate = selectedCart().length > 0 && selectedCart().length < cart.length;
  checkoutSection.hidden = commercePage !== "checkout" || !selectedCart().length;
  cartRows.innerHTML = visibleCart
    .map(
      (item) =>
        `<div class="cart-row" data-id="${item.id}"><div class="cart-product-info">${commercePage !== "checkout" ? `<input class="cart-select" type="checkbox" data-select-id="${item.id}" aria-label="Chọn ${escapeHtml(item.name)}" ${item.selected !== false ? "checked" : ""}>` : ""}${orderProductImage(item)}<div><b>${escapeHtml(item.name)}</b><small>${money(item.price)} / ${escapeHtml(item.unit || "sản phẩm")}</small></div></div>${commercePage === "checkout" ? `<div class="qty qty-readonly" aria-label="Số lượng">${item.quantity}</div>` : `<div class="qty"><button type="button" data-action="decrease">−</button><input type="number" min="1" max="${item.stock}" value="${item.quantity}" /><button type="button" data-action="increase">+</button></div>`}<strong class="cart-line-total"><span class="line-total-label">Thành tiền:</span> ${money(item.price * item.quantity)}</strong>${commercePage !== "checkout" ? `<button type="button" data-action="remove" class="remove" aria-label="Xóa ${escapeHtml(item.name)} khỏi giỏ hàng" title="Xóa sản phẩm"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M3 6h18M9 6V4h6v2M5 6l1 14h12l1-14M10 10v6M14 10v6"/></svg></button>` : ""}</div>`,
    )
    .join("");
  const total = voucherSubtotal();
  cartSubtotal.textContent = money(total);
  updateVoucherTotals(total);
}
cartRows.addEventListener("click", (e) => {
  if (commercePage === "checkout") return;
  const actionButton = e.target.closest("button[data-action]");
  if (!actionButton) return;
  const row = e.target.closest(".cart-row");
  if (!row) return;
  const item = cart.find((x) => x.id == row.dataset.id);
  if (!item) return;
  if (actionButton.dataset.action === "decrease") item.quantity--;
  if (actionButton.dataset.action === "increase") {
    if (Number(item.quantity) >= Number(item.stock)) return showNotice("Số lượng đã chọn vượt quá tồn kho. Vui lòng xem lại.", "error");
    item.quantity = Number(item.quantity) + 1;
  }
  if (actionButton.dataset.action === "remove" || item.quantity < 1) cart = cart.filter((x) => x.id !== item.id);
  renderCart();
});
cartRows.addEventListener("change", (e) => {
  if (commercePage === "checkout") return;
  if (e.target.matches('[data-select-id]')) {
    const item = cart.find(x => String(x.id) === e.target.dataset.selectId);
    if (item) item.selected = e.target.checked;
    renderCart(); return;
  }
  if (!e.target.matches('input[type="number"]')) return;
  const row = e.target.closest(".cart-row");
  const item = cart.find((x) => x.id == row.dataset.id);
  if (Number(e.target.value) > Number(item.stock)) {
    e.target.value = item.quantity;
    return showNotice("Số lượng đã chọn vượt quá tồn kho. Vui lòng xem lại.", "error");
  }
  item.quantity = Math.max(1, Math.floor(+e.target.value) || 1);
  renderCart();
});

document.querySelector('#cartSelection')?.addEventListener('change', e => {
  if (e.target.id !== 'selectAllCart') return;
  cart.forEach(item => { item.selected = e.target.checked; });
  renderCart();
});
buyNowButton.addEventListener("click", async () => {
  try { await PharmacyCart.flush(); } catch(error) { return showNotice(error.message,"error"); }
  if (!selectedCart().length) return showNotice("Vui lòng chọn ít nhất một sản phẩm để thanh toán.", "error");
  location.href = "checkout.html?v=44";
});

checkoutForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!selectedCart().length) return showNotice("Vui lòng chọn ít nhất một sản phẩm để thanh toán.", "error");
  const phone = document.querySelector("#customerPhone").value.trim();
  if (!phone) return showNotice("Vui lòng nhập số điện thoại nhận hàng.", "error");

  let deliveryAddress;
  const methodLabel = deliveryMethod === "PICKUP" ? "Nhận tại cửa hàng" : "Giao hàng tận nơi (đặt hàng online)";
  if (deliveryMethod === "ONLINE") {
    const city = cityCombo.getValue();
    const district = districtCombo.getValue();
    const houseAddress = document.querySelector("#houseAddress").value.trim();
    if (!city || !district || !houseAddress) {
      return showNotice("Vui lòng chọn Tỉnh/Thành, Quận/Huyện và nhập địa chỉ cụ thể.", "error");
    }
    deliveryAddress = `${houseAddress}, ${district}, ${city}`;
  } else {
    deliveryAddress = "Khách hàng nhận thuốc tại cửa hàng gần nhất";
  }

  const orderNote = document.querySelector("#orderNote").value.trim();
  const paymentMethod = document.querySelector("#paymentMethod").value;
  const note =
    `Người nhận: ${document.querySelector("#recipientName").value.trim()} | SĐT liên hệ: ${phone} | Hình thức: ${methodLabel} | Phí vận chuyển: Miễn phí` +
    (orderNote ? ` | Ghi chú: ${orderNote}` : "");

  const submitButton = checkoutForm.querySelector('button[type="submit"]');
  if (submitButton.disabled) return;
  submitButton.disabled = true;
  try {
    await PharmacyCart.flush();
    await validateCartAvailability();
    const response = await fetch(API + "/cart/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + signedInUser.token },
      body: JSON.stringify({
        version: PharmacyCart.version,
        deliveryAddress,
        paymentMethod,
        voucherCode: selectedVoucher || null,
        note,
        details: selectedCart().map((m) => ({ medicine: { id: m.id }, quantity: m.quantity })),
      }),
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || `Máy chủ trả lỗi HTTP ${response.status}.`);
    PharmacyCart.checkoutDone();
    cart = PharmacyCart.read();
    renderCart();
    checkoutForm.reset();
    cityCombo.setValue("");
    districtCombo.setOptions([]);
    await loadOrderHistory();
    if (paymentMethod === "TRANSFER") {
      openDemoPayment(result.data.id, async () => { await loadOrderHistory(); });
      return;
    }
    await showNotice("Đặt đơn thành công! Mã đơn: #" + result.data.id, "success", "Đặt đơn thành công");
    showProfileTab("orders");
  } catch (error) {
    await showNotice("Không thể đặt đơn: " + (error.message || "Kiểm tra Backend MySQL."), "error");
  } finally { submitButton.disabled = false; }
});

/* ---------------- Đơn hàng của tôi (chỉ tải khi bấm vào tab) ---------------- */
const orderHistoryRows = document.querySelector("#orderHistoryRows");
const historyHint = document.querySelector("#historyHint");
let allOrders = [];
let activeOrderFilter = "ALL";

function statusMeta(status) {
  return (
    {
      PENDING: { label: "Chờ xác nhận", cls: "st-pending" },
      CONFIRMED: { label: "Đang giao", cls: "st-confirmed" },
      COMPLETED: { label: "Đã giao", cls: "st-completed" },
      CANCELLED: { label: "Đã hủy", cls: "st-cancelled" },
    }[status] || { label: status, cls: "" }
  );
}
function paymentText(value) {
  return value === "TRANSFER" ? "Chuyển khoản" : "Tiền mặt";
}
function paymentStatus(value) {
  return { PAID: "Đã thanh toán", UNPAID: "Chưa thanh toán", CANCELLED: "Đã hủy" }[value] || "Chưa thanh toán";
}
// Đơn "Nhận tại cửa hàng" được lưu địa chỉ cố định lúc đặt hàng (xem checkoutForm submit).
function isPickupOrder(order) {
  return order.deliveryAddress === "Khách hàng nhận thuốc tại cửa hàng gần nhất";
}
function isCounterOrder(order) {
  return order.orderSource === "COUNTER" || Boolean(order.employee?.id);
}
function deliveryMethodLabel(order) {
  if (isCounterOrder(order)) return "Mua trực tiếp";
  return isPickupOrder(order) ? "Nhận tại cửa hàng" : "Giao hàng tận nơi";
}
// SĐT nhận hàng được ghi kèm trong ghi chú đơn hàng lúc đặt (xem checkoutForm submit).
function orderContactPhone(order) {
  const match = /SĐT liên hệ:\s*([^|]+)/.exec(order.note || "");
  return (match ? match[1].trim() : "") || order.customer?.phone || "—";
}
function orderNoteExtra(order) {
  const match = /Ghi chú:\s*(.+)$/.exec(order.note || "");
  return match ? match[1].trim() : "";
}

function renderOrderCardItem(d) {
  const medicine = d.medicine || {};
  return `<div class="order-card-item">
    ${orderProductImage(medicine)}
    <div class="order-card-item-info">
      <b>${escapeHtml(medicine.name || "Sản phẩm")}</b>
      <span>${escapeHtml(medicine.type || "")}</span>
    </div>
    <div class="order-card-item-price">
      ${money((d.price ?? medicine.price ?? 0) * d.quantity)}
      <small>x${d.quantity} ${escapeHtml(medicine.unit || "sản phẩm")}</small>
    </div>
  </div>`;
}
function renderOrderCard(order) {
  const meta = statusMeta(order.status);
  return `<article class="order-card" data-order-id="${order.id}">
    <div class="order-card-head">
      <div class="order-card-head-left">
        <b>Đơn hàng ${new Date(order.orderDate).toLocaleDateString("vi-VN")}</b>
        <span>· ${deliveryMethodLabel(order)} · #${order.id}</span>
      </div>
      <span class="order-status ${meta.cls}">${meta.label}</span>
    </div>
    <div class="order-card-items">${order.details.map(renderOrderCardItem).join("")}</div>
    <div class="order-card-foot">
      <div class="order-card-foot-left">
        <button type="button" class="order-view-detail" data-view-id="${order.id}">Xem chi tiết ›</button>
        <span class="order-card-total">Thành tiền: <b>${money(order.total)}</b></span>
      </div>
      <div class="order-card-actions">
        ${order.paymentMethod === "TRANSFER" && order.paymentStatus !== "PAID" && order.status !== "CANCELLED" ? `<button type="button" class="btn-buy-again" data-qr-id="${order.id}">Thanh toán QR</button>` : ""}
        ${order.status === "PENDING" ? `<button type="button" class="btn-cancel-order" data-cancel-id="${order.id}">Hủy đơn</button>` : ""}
        <button type="button" class="btn-buy-again" data-buyagain-id="${order.id}">Mua lại</button>
      </div>
    </div>
  </article>`;
}

function applyOrderFilter() {
  const filtered =
    activeOrderFilter === "ALL"
      ? allOrders
      : allOrders.filter((o) => o.status === activeOrderFilter);
  historyHint.textContent = `Tổng đơn hàng: ${allOrders.length}`;
  orderHistoryRows.innerHTML =
    filtered.map(renderOrderCard).join("") ||
    '<p class="empty-mini">Không có đơn hàng nào ở trạng thái này.</p>';
}
document.querySelector("#orderFilterTabs").addEventListener("click", (event) => {
  const tabBtn = event.target.closest(".order-filter-tab");
  if (!tabBtn) return;
  activeOrderFilter = tabBtn.dataset.status;
  document.querySelectorAll(".order-filter-tab").forEach((b) => b.classList.toggle("active", b === tabBtn));
  applyOrderFilter();
});

async function loadOrderHistory() {
  historyHint.textContent = "Đang tải lịch sử đơn hàng...";
  try {
    const response = await fetch(API + "/orders?customerId=" + signedInUser.id);
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message);
    allOrders = result.data || [];
    applyOrderFilter();
  } catch (error) {
    historyHint.textContent = "Chưa tải được lịch sử mua hàng.";
    console.error("Không tải được lịch sử đơn hàng:", error);
    orderHistoryRows.innerHTML = `<p class="empty-mini">Lỗi tải đơn hàng: ${escapeHtml(error.message || String(error))}. Vui lòng gửi lại thông báo này để kiểm tra.</p>`;
  }
}

/* ---------------- Modal xem chi tiết đơn hàng ---------------- */
const orderDetailModal = document.querySelector("#orderDetailModal");
const orderDetailBody = document.querySelector("#orderDetailBody");

const ETA_TEXT = {
  PENDING: { title: "Đơn hàng đang chờ xác nhận", desc: "Chúng tôi sẽ liên hệ xác nhận đơn hàng sớm nhất." },
  CONFIRMED: { title: "Đơn hàng đang được giao", desc: "Đơn hàng của bạn đang trên đường giao đến bạn." },
  COMPLETED: { title: "Giao hàng thành công", desc: "Rất vui vì bạn đã tin tưởng và mua hàng." },
  CANCELLED: { title: "Đơn hàng đã bị hủy", desc: "Đơn hàng này đã được hủy theo yêu cầu." },
};
function paymentMethodIcon(order) {
  return order.paymentMethod === "TRANSFER" ? "🏦" : "💵";
}
function openOrderDetail(orderId) {
  const order = allOrders.find((o) => String(o.id) === String(orderId));
  if (!order) return;
  const meta = statusMeta(order.status);
  const eta = ETA_TEXT[order.status] || ETA_TEXT.PENDING;
  const pickup = isPickupOrder(order);
  const note = orderNoteExtra(order);
  orderDetailBody.innerHTML = `
    <div class="order-detail-grid">
      <div class="order-detail-main">
        <div class="order-detail-head">
          <div>
            <h3>Đơn hàng ${new Date(order.orderDate).toLocaleDateString("vi-VN")}</h3>
            <small>Mã đơn #${order.id} · ${deliveryMethodLabel(order)}</small>
          </div>
          <span class="order-status ${meta.cls}">${meta.label}</span>
        </div>

        <div class="order-detail-eta">
          <b>${eta.title}</b>
          <span>${eta.desc}</span>
        </div>

        <div class="order-detail-recipient">
          <div>
            <b>Thông tin người nhận</b>
            <p>${escapeHtml(order.note?.match(/(?:^|\|)\s*Người nhận:\s*([^|]+)/)?.[1]?.trim() || order.customer?.fullName || signedInUser.fullName)}<br />${escapeHtml(orderContactPhone(order))}</p>
          </div>
          <div>
            <b>${pickup ? "Nhận hàng tại" : "Giao đến địa chỉ"}</b>
            <p>${escapeHtml(order.deliveryAddress || "—")}</p>
          </div>
        </div>

        ${note ? `<div class="order-detail-recipient"><div><b>Ghi chú đơn hàng</b><p>${escapeHtml(note)}</p></div></div>` : ""}

        <div class="order-detail-products">
          <h4>Danh sách sản phẩm</h4>
          <div class="order-card-items">${order.details.map(renderOrderCardItem).join("")}</div>
        </div>
      </div>

      <aside class="payment-info-card">
        <h4>Thông tin thanh toán</h4>
        <div class="payment-row"><span>Tổng tiền</span><b>${money(order.subtotal ?? order.total)}</b></div>
        <div class="payment-row"><span>Giảm giá trực tiếp</span><b>0đ</b></div>
        <div class="payment-row"><span>Giảm giá voucher${order.voucherCode ? " (" + escapeHtml(order.voucherCode) + ")" : ""}</span><b>${money(order.discountAmount || 0)}</b></div>
        <div class="payment-row"><span>Phí vận chuyển</span><b>Miễn phí</b></div>
        <div class="payment-row total"><span>Thành tiền</span><b>${money(order.total)}</b></div>
        <div class="payment-method-row">${paymentMethodIcon(order)} <span>${paymentText(order.paymentMethod)} · ${paymentStatus(order.paymentStatus)}</span></div>
        <button type="button" class="btn-buy-again" data-buyagain-id="${order.id}">Mua lại</button>
      </aside>
    </div>`;
  orderDetailModal.hidden = false;
}
function closeOrderDetail() {
  orderDetailModal.hidden = true;
  orderDetailBody.innerHTML = "";
}
document.querySelector("#orderDetailClose").addEventListener("click", closeOrderDetail);
document.querySelector("#orderDetailBackdrop").addEventListener("click", closeOrderDetail);
orderDetailBody.addEventListener("click", (event) => {
  const buyAgainBtn = event.target.closest("[data-buyagain-id]");
  if (buyAgainBtn) buyAgain(buyAgainBtn.dataset.buyagainId);
});

/* ---------------- Mua lại: thêm toàn bộ sản phẩm của đơn cũ vào giỏ hàng ---------------- */
async function buyAgain(orderId) {
  const order = allOrders.find((o) => String(o.id) === String(orderId));
  if (!order) return;
  order.details.forEach((d) => {
    const medicine = d.medicine || {};
    if (!medicine.id) return;
    const existing = cart.find((item) => item.id === medicine.id);
    const stock = medicine.stock ?? Infinity;
    if (existing) {
      existing.quantity = Math.min(existing.quantity + d.quantity, stock);
    } else {
      cart.push({ ...medicine, quantity: Math.min(d.quantity, stock) });
    }
  });
  await saveCart();
  try { await PharmacyCart.flush(); } catch(error) { return showNotice(error.message,"error"); }
  renderCart();
  closeOrderDetail();
  showNotice("Đã thêm sản phẩm từ đơn hàng cũ vào giỏ hàng.");
  showProfileTab("cart");
}

/* ---------------- Sự kiện trên danh sách đơn hàng: xem chi tiết / hủy đơn / mua lại ---------------- */
orderHistoryRows.addEventListener("click", async (event) => {
  const qrButton = event.target.closest("[data-qr-id]");
  if (qrButton) return openDemoPayment(qrButton.dataset.qrId, loadOrderHistory);
  const viewBtn = event.target.closest("[data-view-id]");
  if (viewBtn) return openOrderDetail(viewBtn.dataset.viewId);

  const buyAgainBtn = event.target.closest("[data-buyagain-id]");
  if (buyAgainBtn) return buyAgain(buyAgainBtn.dataset.buyagainId);

  const cancelBtn = event.target.closest("[data-cancel-id]");
  if (!cancelBtn) return;
  if (!confirm("Hủy đơn hàng đang chờ xác nhận?")) return;
  try {
    const response = await fetch(
      API + "/orders/" + cancelBtn.dataset.cancelId + "/cancel?customerId=" + signedInUser.id,
      { method: "PUT" },
    );
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message);
    await loadOrderHistory();
    await showNotice("Đã hủy đơn hàng.");
  } catch (error) {
    await showNotice("Không thể hủy đơn: " + (error.message || "Kiểm tra backend."), "error");
  }
});

/* ---------------- Thông tin cá nhân ---------------- */
// Lưu lại dữ liệu đầy đủ của user hiện tại (được nạp từ API) để dùng khi gửi cập nhật,
// vì API PUT /users/{id} cần gửi lại toàn bộ thông tin, không phải chỉ trường đã đổi.
let currentProfileUser = null;

function setProfileValue(id, value, fallback = "Chưa cập nhật") {
  document.querySelector(id).textContent = value || fallback;
}
function renderProfile(user) {
  currentProfileUser = user;
  const name = user.fullName || user.username;
  const initial = name.trim().charAt(0).toLocaleUpperCase("vi") || "K";
  document.querySelector("#profileAvatar").textContent = initial;
  setProfileValue("#profileSummaryName", name);
  setProfileValue("#profileSummaryPhone", user.phone, "Chưa cập nhật số điện thoại");
  const fullNameInput = document.querySelector("#profileFullNameInput");
  if (fullNameInput) fullNameInput.value = user.fullName || "";
  setProfileValue("#infoFullNameText", user.fullName || user.username);
  setProfileValue("#infoUsername", user.username);
  setProfileValue("#infoPhone", user.phone);
  setProfileValue("#infoEmail", user.email);
  setProfileValue("#profileAddressTitle", user.address ? "Địa chỉ nhận thuốc" : "Chưa có địa chỉ mặc định");
  setProfileValue("#profileAddress", user.address || "Bạn có thể nhập địa chỉ ở bước đặt đơn hàng.");
  const phoneField = document.querySelector("#customerPhone");
  if (phoneField && !phoneField.value) phoneField.value = user.phone || "";
}
async function loadProfile() {
  try {
    const response = await fetch(API + "/users/" + signedInUser.id);
    const result = await response.json();
    if (!response.ok || !result.success || !result.data) throw new Error();
    renderProfile(result.data);
  } catch {
    renderProfile(signedInUser);
  }
}

/* ---------------- Sửa thông tin cá nhân (họ và tên) ---------------- */
function showFormMsg(id, message, type) {
  const el = document.querySelector(id);
  el.textContent = message;
  el.hidden = !message;
  el.classList.toggle("success", type === "success");
  el.classList.toggle("error", type === "error");
}
// Bấm "Sửa" mở form đổi họ tên ngay dưới danh sách, ẩn nút Sửa đi cho gọn.
const editFullNameBtn = document.querySelector("#editFullNameBtn");
const cancelEditNameBtn = document.querySelector("#cancelEditName");
const profileInfoForm = document.querySelector("#profileInfoForm");
function openEditName() {
  document.querySelector("#profileFullNameInput").value = currentProfileUser?.fullName || "";
  document.querySelector('#profilePhoneInput').value = currentProfileUser?.phone || '';
  document.querySelector('#profileUsernameInput').value = currentProfileUser?.username || '';
  document.querySelector('#profileEmailInput').value = currentProfileUser?.email || '';
  showFormMsg("#profileInfoMsg", "", null);
  profileInfoForm.hidden = false;
  editFullNameBtn.hidden = true;
  document.querySelector("#profileFullNameInput").focus();
}
function closeEditName() {
  profileInfoForm.hidden = true;
  editFullNameBtn.hidden = false;
}
if (editFullNameBtn) editFullNameBtn.addEventListener("click", openEditName);
if (cancelEditNameBtn) cancelEditNameBtn.addEventListener("click", closeEditName);
if (profileInfoForm) {
  profileInfoForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    showFormMsg("#profileInfoMsg", "", null);
    const newFullName = document.querySelector("#profileFullNameInput").value.trim();
    if (!newFullName) {
      showFormMsg("#profileInfoMsg", "Vui lòng nhập họ và tên.", "error");
      return;
    }
    const phone = document.querySelector('#profilePhoneInput').value.trim();
    const username = document.querySelector('#profileUsernameInput').value.trim();
    const email = document.querySelector('#profileEmailInput').value.trim();
    if (!username || !/^[0-9+() .-]{9,20}$/.test(phone)) return showFormMsg('#profileInfoMsg', 'Vui lòng nhập tên đăng nhập và số điện thoại hợp lệ.', 'error');
    const submitBtn = document.querySelector("#profileInfoSubmit");
    submitBtn.disabled = true;
    try {
      // Giữ các thông tin khác, cập nhật bốn trường khách hàng được sửa,
      // vì API cập nhật user thay thế toàn bộ bản ghi (trừ mật khẩu).
      const payload = { ...(currentProfileUser || signedInUser), fullName: newFullName, phone, username, email };
      const response = await fetch(API + "/users/" + signedInUser.id, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message);
      renderProfile(result.data);
      // Cập nhật lại tên hiển thị trên header + phiên đăng nhập hiện tại.
      Object.assign(signedInUser, result.data);
      sessionStorage.setItem("pharmacyUser", JSON.stringify(signedInUser));
      const accountLabel = document.querySelector("#accountLabel");
      if (accountLabel) accountLabel.textContent = signedInUser.fullName || "Tài khoản";
      closeEditName();
      showNotice("Đã lưu thông tin cá nhân. Lần đăng nhập sau, hãy dùng tên đăng nhập mới nếu bạn đã thay đổi.");
    } catch (error) {
      showFormMsg("#profileInfoMsg", error.message || "Không thể cập nhật thông tin.", "error");
    } finally {
      submitBtn.disabled = false;
    }
  });
}

/* ---------------- Đổi mật khẩu ---------------- */
const passwordForm = document.querySelector("#passwordForm");
if (passwordForm) {
  passwordForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    showFormMsg("#passwordMsg", "", null);
    const oldPassword = document.querySelector("#oldPassword").value;
    const newPassword = document.querySelector("#newPassword").value;
    const confirmPassword = document.querySelector("#confirmPassword").value;
    if (!oldPassword || !newPassword || !confirmPassword) {
      showFormMsg("#passwordMsg", "Vui lòng nhập đầy đủ các trường.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showFormMsg("#passwordMsg", "Mật khẩu xác nhận không khớp.", "error");
      return;
    }
    const submitBtn = document.querySelector("#passwordSubmit");
    submitBtn.disabled = true;
    try {
      const params = new URLSearchParams({ oldPassword, newPassword });
      const response = await fetch(API + "/users/" + signedInUser.id + "/password?" + params.toString(), {
        method: "PUT",
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message);
      showFormMsg("#passwordMsg", "Đổi mật khẩu thành công!", "success");
      passwordForm.reset();
    } catch (error) {
      showFormMsg("#passwordMsg", error.message || "Không thể đổi mật khẩu.", "error");
    } finally {
      submitBtn.disabled = false;
    }
  });
}

/* ---------------- Chuyển tab (mỗi mục là một bước riêng, không cuộn trang) ---------------- */
const panes = {
  personal: document.querySelector("#profilePersonalPane"),
  cart: document.querySelector("#profileCartPane"),
  orders: document.querySelector("#profileOrdersPane"),
  address: document.querySelector("#profileAddressPane"),
  consult: document.querySelector("#profileConsultPane"),
};
const tabLabels = {
  personal: "Thông tin cá nhân",
  cart: "Giỏ hàng & Thanh toán",
  orders: "Lịch sử đơn hàng",
  address: "Quản lý sổ địa chỉ",
  consult: "Tin nhắn tư vấn",
};
function showProfileTab(tab) {
  if (tab === "cart" && !commercePage) { location.href = "cart.html?v=44"; return; }
  if (commercePage && tab !== "cart") { location.href = "account.html#" + tab; return; }
  Object.entries(panes).forEach(([name, pane]) => (pane.hidden = name !== tab));
  const breadcrumb = document.querySelector("#breadcrumbTab");
  if (breadcrumb) breadcrumb.textContent = tabLabels[tab] || tab;
  // Đánh dấu mục đang chọn trên sidebar tài khoản.
  document.querySelectorAll("#accountSidebarNav [data-nav]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.nav === tab);
  });
  // Lịch sử đơn hàng chỉ được tải và hiển thị khi khách bấm vào mục này.
  if (tab === "orders") loadOrderHistory();
  // Tin nhắn tư vấn: tải lại mỗi lần mở để luôn thấy câu trả lời mới nhất của dược sĩ.
  if (tab === "consult") loadAccountConsultations();
  if (!commercePage) history.replaceState(null, "", "#" + tab);
}

/* ---------------- Sidebar tài khoản: điều hướng + đăng xuất ---------------- */
const accountSidebarNav = document.querySelector("#accountSidebarNav");
if (accountSidebarNav) {
  accountSidebarNav.addEventListener("click", (event) => {
    const navButton = event.target.closest("[data-nav]");
    if (navButton) showProfileTab(navButton.dataset.nav);
  });
}
const sidebarLogout = document.querySelector("#sidebarLogout");
if (sidebarLogout) {
  sidebarLogout.addEventListener("click", () => {
    sessionStorage.removeItem("pharmacyUser");
    location.href = "index.html";
  });
}

/* ---------------- Menu tài khoản (dropdown khi bấm vào tên trên header) ---------------- */
const accountMenu = document.querySelector("#accountMenu");
const accountDropdown = document.querySelector("#accountDropdown");
if (isCustomer) {
  document.querySelector("#accountLink").addEventListener("click", (event) => {
    event.preventDefault();
    accountDropdown.hidden = !accountDropdown.hidden;
  });
  accountDropdown.addEventListener("click", (event) => {
    const navButton = event.target.closest("[data-nav]");
    if (navButton) {
      showProfileTab(navButton.dataset.nav);
      accountDropdown.hidden = true;
    }
    if (event.target.closest("#headerLogout")) {
      sessionStorage.removeItem("pharmacyUser");
      location.href = "index.html";
    }
  });
  document.addEventListener("click", (event) => {
    if (!accountMenu.contains(event.target)) accountDropdown.hidden = true;
  });
}

/* ---------------- Tin nhắn tư vấn (sidebar chat trong trang tài khoản) ---------------- */
const accountConsultMessages = document.querySelector("#accountConsultMessages");
const accountConsultForm = document.querySelector("#accountConsultForm");
const accountConsultQuestion = document.querySelector("#accountConsultQuestion");
const accountConsultImageInput = document.querySelector("#accountConsultImageInput");
const accountConsultImagePreview = document.querySelector("#accountConsultImagePreview");
const accountConsultImageClear = document.querySelector("#accountConsultImageClear");
let accountConsultImage = "";

function clearAccountConsultImage() {
  accountConsultImage = "";
  if (accountConsultImageInput) accountConsultImageInput.value = "";
  if (accountConsultImagePreview) {
    accountConsultImagePreview.hidden = true;
    accountConsultImagePreview.querySelector("img").removeAttribute("src");
  }
  if (accountConsultImageClear) accountConsultImageClear.hidden = true;
}

if (accountConsultImageInput) {
  accountConsultImageInput.addEventListener("change", async () => {
    try {
      accountConsultImage = await readImageFile(accountConsultImageInput.files?.[0]);
      if (accountConsultImagePreview) {
        accountConsultImagePreview.querySelector("img").src = accountConsultImage;
        accountConsultImagePreview.hidden = false;
      }
      if (accountConsultImageClear) accountConsultImageClear.hidden = false;
    } catch (error) {
      await showNotice(error.message, "error");
      clearAccountConsultImage();
    }
  });
}
if (accountConsultImageClear) accountConsultImageClear.addEventListener("click", clearAccountConsultImage);

async function loadAccountConsultations() {
  if (!accountConsultMessages) return;
  accountConsultMessages.innerHTML = '<p class="consult-empty">Đang tải tin nhắn tư vấn...</p>';
  try {
    const response = await fetch(API + "/consultations?customerId=" + signedInUser.id);
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message);
    const rows = result.data || [];
    accountConsultMessages.innerHTML = rows.length
      ? renderConsultMessages(rows)
      : '<p class="consult-empty">Chưa có câu hỏi tư vấn nào. Hãy gửi câu hỏi đầu tiên cho dược sĩ.</p>';
    accountConsultMessages.scrollTop = accountConsultMessages.scrollHeight;
  } catch (error) {
    accountConsultMessages.innerHTML =
      '<p class="consult-empty">Chưa tải được nội dung tư vấn. Hãy thử lại sau.</p>';
  }
}

if (accountConsultForm) {
  accountConsultForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const question = accountConsultQuestion.value.trim();
    if (!question && !accountConsultImage) {
      await showNotice("Vui lòng nhập nội dung hoặc chọn ảnh cần tư vấn.", "error");
      return;
    }
    const submitBtn = accountConsultForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    try {
      const response = await fetch(API + "/consultations?customerId=" + signedInUser.id, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, questionImage: accountConsultImage }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message);
      accountConsultQuestion.value = "";
      clearAccountConsultImage();
      await loadAccountConsultations();
    } catch (error) {
      showNotice("Không thể gửi tư vấn: " + (error.message || "Kiểm tra backend."), "error");
    } finally {
      submitBtn.disabled = false;
    }
  });
}

/* ---------------- Khởi động ---------------- */
renderCart();
if (isCustomer) {
  loadProfile();
  const initialTab = ["personal", "cart", "orders", "address", "consult"].includes(location.hash.slice(1))
    ? location.hash.slice(1)
    : "personal";
  showProfileTab(commercePage ? "cart" : initialTab);
  if (commercePage === "checkout") {
    document.querySelector("#commerceTitle").textContent = "Hoàn tất đơn hàng";
    document.querySelector("#commerceSubtitle").textContent = "Kiểm tra sản phẩm và chọn cách nhận hàng phù hợp.";
    checkoutSection.hidden = commercePage !== "checkout" || !selectedCart().length;
  }
  document.querySelector("#recipientName").value = signedInUser.fullName || "";
}

})().catch(error => alert(error.message || "Không tải được giỏ hàng. Vui lòng tải lại trang."));

