(async () => {
await PharmacyCart.ready;
await (window.LongChauBackend?.ensure?.() || Promise.resolve()).catch(() => {});
const API = window.LongChauBackend?.apiRoot || `http://${window.location.hostname || "localhost"}:8080/api`;
const API_URL = API + "/medicines";
const signedInUser = (() => {
  try {
    return JSON.parse(sessionStorage.getItem("pharmacyUser"));
  } catch {
    return null;
  }
})();
const fallbackMedicines = [
  {
    id: 1,
    name: "Panadol Extra giảm đau, hạ sốt",
    type: "Thuốc không kê đơn",
    price: 62000,
    stock: 40,
    brand: "PANADOL",
    description: "Hỗ trợ giảm đau, hạ sốt khi cảm sốt nhẹ.",
  },
  {
    id: 2,
    name: "Vitamin C 1000mg tăng đề kháng",
    type: "Vitamin & Khoáng chất",
    price: 125000,
    stock: 25,
    brand: "VITAMIN C",
    description: "Bổ sung vitamin C, hỗ trợ sức đề kháng.",
  },
  {
    id: 3,
    name: "Siro ho thảo dược cho người lớn",
    type: "Thuốc không kê đơn",
    price: 89000,
    stock: 31,
    brand: "THẢO DƯỢC",
    description: "Làm dịu họng, hỗ trợ giảm ho do kích ứng.",
  },
  {
    id: 4,
    name: "Omega 3 hỗ trợ tim mạch và thị lực",
    type: "Thực phẩm chức năng",
    price: 219000,
    stock: 18,
    brand: "OMEGA 3",
    description: "Bổ sung EPA/DHA, hỗ trợ tim mạch và thị lực.",
  },
  {
    id: 5,
    name: "Dung dịch sát khuẩn tay 500ml",
    type: "Chăm sóc cá nhân",
    price: 49000,
    stock: 53,
    brand: "LONG CHÂU",
    description: "Làm sạch tay nhanh, hỗ trợ giảm vi khuẩn trên da.",
  },
  {
    id: 6,
    name: "Nhiệt kế điện tử đo nhanh",
    type: "Thiết bị y tế",
    price: 135000,
    stock: 20,
    brand: "MEDICAL",
    description: "Thiết bị đo thân nhiệt nhanh tại gia đình.",
  },
  {
    id: 7,
    name: "Men vi sinh hỗ trợ tiêu hóa",
    type: "Thực phẩm chức năng",
    price: 159000,
    stock: 28,
    brand: "PROBIO",
    description: "Bổ sung lợi khuẩn, hỗ trợ cân bằng hệ vi sinh đường ruột.",
  },
  {
    id: 8,
    name: "Khẩu trang y tế 4 lớp",
    type: "Thiết bị y tế",
    price: 45000,
    stock: 80,
    brand: "LONG CHÂU",
    description: "Hỗ trợ bảo vệ đường hô hấp, dùng một lần tiện lợi.",
  },
];
let medicines = fallbackMedicines,
  activeCategory = "",
  query = "",
  cart = loadCart();
const money = (value) => new Intl.NumberFormat("vi-VN").format(value || 0) + "đ";
const escapeHtml = (value) =>
  String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
const productGrid = document.querySelector("#productGrid");
const cartButton = document.querySelector("#cartButton");
const cartCount = document.querySelector("#cartCount");

const noticeModal = document.querySelector("#noticeModal");
const noticeTitle = document.querySelector("#noticeTitle");
const noticeMessage = document.querySelector("#noticeMessage");
const noticeIcon = document.querySelector("#noticeIcon");
const noticeButton = document.querySelector("#noticeButton");
const noticeClose = document.querySelector("#noticeClose");
const consultPanel = document.querySelector("#consultPanel");
const consultMessages = document.querySelector("#consultMessages");
const consultToggle = document.querySelector("#consultToggle");
const consultClose = document.querySelector("#consultClose");
const consultForm = document.querySelector("#consultForm");
const consultQuestion = document.querySelector("#consultQuestion");
const consultImageInput = document.querySelector("#consultImageInput");
const consultImagePreview = document.querySelector("#consultImagePreview");
const consultImageClear = document.querySelector("#consultImageClear");
let consultImage = "";

function normalizeSearch(value) {
  return String(value || "")
    .toLocaleLowerCase("vi")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

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

function clearConsultImage() {
  consultImage = "";
  if (consultImageInput) consultImageInput.value = "";
  if (consultImagePreview) {
    consultImagePreview.hidden = true;
    consultImagePreview.querySelector("img").removeAttribute("src");
  }
  if (consultImageClear) consultImageClear.hidden = true;
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

if (consultImageInput) {
  consultImageInput.addEventListener("change", async () => {
    try {
      consultImage = await readImageFile(consultImageInput.files?.[0]);
      if (consultImagePreview) {
        consultImagePreview.querySelector("img").src = consultImage;
        consultImagePreview.hidden = false;
      }
      if (consultImageClear) consultImageClear.hidden = false;
    } catch (error) {
      alert(error.message);
      clearConsultImage();
    }
  });
}
if (consultImageClear) consultImageClear.addEventListener("click", clearConsultImage);

function loadCart() { return PharmacyCart.read(); }

// Mỗi khách hàng dùng một khóa lưu giỏ riêng. Thêm thuốc bằng tài khoản A sẽ không thể xuất
// hiện trong tài khoản B, kể cả hai tài khoản được dùng trên cùng một trình duyệt.
function cartStorageKey() {
  return signedInUser?.id
    ? `pharmacyCart:customer:${signedInUser.id}`
    : "pharmacyCart:guest";
}

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

function saveCart() {
  return PharmacyCart.save(cart).catch(error => { cart = PharmacyCart.read(); renderCart(); alert(error.message); });
}

function cartQuantity() {
  return PharmacyCart.quantity();
}

function updateCartCount() {
  cartCount.textContent = cartQuantity();
}

function render() {
  updateCategorySelection();
  const searchTerms = normalizeSearch(query).split(/\s+/).filter(Boolean);
  const rows = medicines.filter(
    (m) => {
      const searchable = normalizeSearch(
        [
          m.name,
          m.type,
          m.brand,
          m.description,
          m.ingredient,
          m.dosage,
          m.supplier,
        ].join(" "),
      );
      return (
        (!activeCategory || (m.type || "").trim() === activeCategory) &&
        (!searchTerms.length || searchTerms.every((term) => searchable.includes(term)))
      );
    },
  );
  productGrid.innerHTML = rows
    .map(
      (m, i) =>
        `<article class="product"><span class="badge">
  ${i < 3 ? "BÁN CHẠY" : "CHÍNH HÃNG"}
  </span>
  <a class="product-image product-link" href="product.html?id=${encodeURIComponent(m.id)}" aria-label="Xem chi tiết ${escapeHtml(m.name)}">${
    m.image
      ? `<img class="product-photo" src="${m.image}" alt="${escapeHtml(m.name)}" loading="lazy">`
      : `<div class="pill-box" style="--pill:${["#0757d9", "#f36b37", "#6c4cc7", "#03a878"][i % 4]}">
  ${escapeHtml(m.brand || "LONG CHÂU")}<b>✚</b><small>${escapeHtml((m.type || "").toUpperCase())}</small></div>`
  }</a><div class="product-content"><span class="product-type">${escapeHtml(m.type)}</span><h3><a class="product-link" href="product.html?id=${encodeURIComponent(m.id)}">${escapeHtml(m.name)}</a></h3><p class="product-desc">${escapeHtml(m.description || "Tra cứu giá bán, nhóm thuốc và công dụng trước khi đặt mua.")}</p><div class="price">${money(m.price)}</div></div><button class="add" data-id="${m.id}" ${m.stock > 0 ? "" : "disabled"} aria-label="Thêm ${escapeHtml(m.name)} vào giỏ">+</button></article>`,
    )
    .join("");
  document.querySelector("#emptyState").hidden = rows.length > 0;
  const filter = document.querySelector("#activeFilter");
  filter.hidden = !activeCategory && !query.trim();
  filter.textContent = activeCategory
    ? `Đang xem: ${activeCategory}`
    : query.trim()
      ? `Đang tìm: ${query.trim()}`
      : "";
}

function renderCart() {
  // Ở trang chủ, giỏ hàng chỉ cần cập nhật số lượng trên biểu tượng giỏ hàng.
  // Chi tiết giỏ hàng, chỉnh số lượng và thanh toán được thực hiện ở trang account.html.
  updateCartCount();
  saveCart();
}

function setCategory(category) {
  activeCategory = category;
  document.querySelector("#searchInput").value = "";
  query = "";
  render();
  document
    .querySelector("#products")
    .scrollIntoView({ behavior: "smooth", block: "start" });
}

function setSearchTerm(term) {
  query = String(term || "").trim();
  activeCategory = "";
  document.querySelector("#searchInput").value = query;
  render();
  document
    .querySelector("#products")
    .scrollIntoView({ behavior: "smooth", block: "start" });
}

const categoryGrid = document.querySelector('.category-grid');
const categoryNav = document.querySelector('.category-nav .wrap');
const categoryIcons = new Map([...categoryGrid.querySelectorAll('[data-category]')].map(button => [button.dataset.category, button.querySelector('.icon').outerHTML]));
const defaultCategoryIcon = categoryIcons.values().next().value;
function renderCategories() {
  const available = [...new Set(medicines.filter(m => m.active !== false).map(m => (m.type || '').trim()).filter(Boolean))];
  const preferred = [...categoryIcons.keys()];
  available.sort((a,b) => {
    const ai=preferred.indexOf(a),bi=preferred.indexOf(b);
    return (ai<0?999:ai)-(bi<0?999:bi) || a.localeCompare(b,'vi');
  });
  if(activeCategory && !available.includes(activeCategory)) activeCategory='';
  categoryNav.innerHTML = '<a href="#products" data-category="">Tất cả sản phẩm</a>' + available.map(type => `<a href="#products" data-category="${escapeHtml(type)}">${escapeHtml(type)}</a>`).join('') + '<a href="#advice">Bệnh &amp; Góc sức khỏe</a>';
  categoryGrid.innerHTML = available.map(type => `<button type="button" data-category="${escapeHtml(type)}">${categoryIcons.get(type) || defaultCategoryIcon}${escapeHtml(type)}</button>`).join('');
  updateCategorySelection();
}
function updateCategorySelection() {
  document.querySelectorAll('[data-category]').forEach(el => {
    const selected=el.dataset.category===activeCategory;
    el.classList.toggle('current',selected);
    if(el.tagName==='BUTTON') el.setAttribute('aria-pressed',String(selected));
    else if(selected) el.setAttribute('aria-current','true');
    else el.removeAttribute('aria-current');
  });
}
document.addEventListener('click', event => {
  const item=event.target.closest('[data-category]');
  if(!item)return;
  event.preventDefault();
  setCategory(item.dataset.category);
});
document
  .querySelectorAll("[data-search]")
  .forEach((link) =>
    link.addEventListener("click", (event) => {
      event.preventDefault();
      setSearchTerm(link.dataset.search || link.textContent);
    }),
  );
document.querySelector("#searchButton").addEventListener("click", () => {
  setSearchTerm(document.querySelector("#searchInput").value);
});
document.querySelector("#searchInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    document.querySelector("#searchButton").click();
  }
});
document.querySelector("#clearFilter").addEventListener("click", (e) => {
  e.preventDefault();
  activeCategory = "";
  query = "";
  document.querySelector("#searchInput").value = "";
  render();
});
productGrid.addEventListener("click", async (e) => {
  if (!e.target.matches(".add")) return;
  const medicine = medicines.find((m) => m.id == e.target.dataset.id);
  if (!medicine || medicine.stock <= 0) return alert("Thuốc này đang hết hàng.");
  const item = cart.find((m) => m.id === medicine.id);
  if (item && Number(item.quantity) >= Number(medicine.stock)) return alert("Số lượng đã chọn vượt quá tồn kho. Vui lòng xem lại giỏ hàng.");
  if (item) { item.quantity = Number(item.quantity) + 1; item.selected = true; }
  else cart.push({ ...medicine, quantity: 1 });
  await saveCart();
  renderCart();
  e.target.textContent = "✓";
  setTimeout(() => (e.target.textContent = "+"), 900);
});
cartButton.addEventListener("click", async () => {
  try { await PharmacyCart.flush(); } catch(error) { return alert(error.message); }
  // Bấm vào giỏ hàng sẽ chuyển sang trang khách hàng riêng thay vì cuộn trang.
  location.href = "cart.html?v=44";
});

async function loadConsultations() {
  if (!signedInUser || signedInUser.role !== "CUSTOMER") {
    consultMessages.innerHTML =
      '<p class="consult-empty">Bạn cần đăng nhập bằng tài khoản khách hàng để gửi tư vấn.</p>';
    return;
  }
  try {
    const response = await fetch(
      API + "/consultations?customerId=" + signedInUser.id,
    );
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message);
    const rows = result.data || [];
    consultMessages.innerHTML = rows.length
      ? renderConsultMessages(rows)
      : '<p class="consult-empty">Chưa có câu hỏi tư vấn nào.</p>';
    consultMessages.scrollTop = consultMessages.scrollHeight;
  } catch (error) {
    consultMessages.innerHTML =
      '<p class="consult-empty">Chưa tải được nội dung tư vấn. Hãy thử lại sau.</p>';
  }
}
consultToggle.addEventListener("click", () => {
  consultPanel.hidden = !consultPanel.hidden;
  if (!consultPanel.hidden) loadConsultations();
});
consultClose.addEventListener("click", () => {
  consultPanel.hidden = true;
});
consultForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!signedInUser || signedInUser.role !== "CUSTOMER") {
    alert("Bạn cần đăng nhập bằng tài khoản khách hàng để gửi tư vấn.");
    location.href = "staff/login.html";
    return;
  }
  const question = consultQuestion.value.trim();
  if (!question && !consultImage) return alert("Vui lòng nhập nội dung hoặc chọn ảnh cần tư vấn.");
  const submitButton = consultForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  try {
    const response = await fetch(
      API + "/consultations?customerId=" + signedInUser.id,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, questionImage: consultImage }),
      },
    );
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message);
    consultQuestion.value = "";
    clearConsultImage();
    await loadConsultations();
  } catch (error) {
    alert("Không thể gửi tư vấn: " + (error.message || "Kiểm tra backend."));
  } finally {
    submitButton.disabled = false;
  }
});
let loadingCatalog=false;
async function refreshCatalog() {
  if(loadingCatalog)return;
  loadingCatalog=true;
  try {
    const response=await fetch(API_URL,{cache:'no-store'});
    if(!response.ok)throw Error('Không tải được danh mục');
    const result=await response.json();
    if(result.success && Array.isArray(result.data)) {
      medicines=result.data;
      renderCategories();
      render();
    }
  } catch(error) { console.warn(error.message); }
  finally { loadingCatalog=false; }
}
renderCategories();
refreshCatalog();
window.addEventListener('focus',refreshCatalog);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshCatalog();});
render();
renderCart();
if (signedInUser) {
  const accountLabel = document.querySelector("#accountLabel");
  const accountLink = document.querySelector("#accountLink");
  accountLabel.textContent = signedInUser.fullName || "Tài khoản";
  accountLink.href =
    signedInUser.role === "CUSTOMER" ? "account.html" : "staff/index.html";
  if (signedInUser.role === "CUSTOMER") {

    /* ---------------- Menu tài khoản (dropdown khi bấm vào tên trên header) ---------------- */
    const accountMenu = document.querySelector("#accountMenu");
    const accountDropdown = document.querySelector("#accountDropdown");
    accountLink.addEventListener("click", (event) => {
      event.preventDefault();
      accountDropdown.hidden = !accountDropdown.hidden;
    });
    accountDropdown.addEventListener("click", (event) => {
      const navButton = event.target.closest("[data-nav]");
      if (navButton) location.href = "account.html#" + navButton.dataset.nav;
      if (event.target.closest("#headerLogout")) {
        sessionStorage.removeItem("pharmacyUser");
        location.href = "index.html";
      }
    });
    document.addEventListener("click", (event) => {
      if (!accountMenu.contains(event.target)) accountDropdown.hidden = true;
    });
  }
}

})().catch(error => alert(error.message || "Không tải được giỏ hàng. Vui lòng tải lại trang."));
