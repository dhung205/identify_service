const API = window.LongChauBackend?.apiRoot || `http://${window.location.hostname || "localhost"}:8080/api`;
var medicines = [],
  orders = [],
  users = [],
  customers = [],
  inventoryTransactions = [],
  cart = [],
  orderFilter = "",
  currentSaleOrder = null;
const money = (n) => new Intl.NumberFormat("vi-VN").format(n || 0) + "đ";
const me = () => JSON.parse(sessionStorage.getItem("pharmacyUser") || "null");
const isManager = () => me()?.role === "MANAGER";
const toast = (t) => {
  const e = document.querySelector("#toast");
  e.textContent = t;
  e.classList.add("show");
  setTimeout(() => e.classList.remove("show"), 2500);
};
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
function productLink(id) {
  return new URL("../product.html?id=" + encodeURIComponent(id), location.href).href;
}
function renderConsultThread(c) {
  const image = safeConsultImage(c.questionImage);
  const question = consultQuestionText(c.question);
  return `<div class="consult-summary">
  <section class="consult-summary-block">
    <span>Câu hỏi của khách</span>
    ${question ? `<p>${renderMessageText(question)}</p>` : ""}
    ${image ? `<a class="consult-image-link" href="${image}" target="_blank" rel="noopener"><img src="${image}" alt="Ảnh khách hàng gửi tư vấn"><b>Xem ảnh khách gửi</b></a>` : ""}
  </section>
  <section class="consult-summary-block ${c.answer ? "answered" : "pending"}">
    <span>Phản hồi nhân viên</span>
    <p>${c.answer ? renderMessageText(c.answer) : "Chưa có phản hồi."}</p>
  </section>
</div>`;
}
async function api(path, options = {}) {
  await window.LongChauBackend?.ensure?.();
  const r = await fetch(API + path, {...options, headers:{...options.headers, ...(me()?.token ? {Authorization:"Bearer " + me().token} : {})}}),
    x = r.status === 204 ? { success: true } : await r.json();
  if (!r.ok || !x.success) throw Error(x.message || "Không thể xử lý yêu cầu.");
  return x.data;
}
const json = (x) => ({
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(x),
});
const localToday = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
};
// Các màn hình tách riêng dùng chung API và tiện ích qua namespace này.
window.staffCore = { api, json, toast, openForm, me };

// Hiển thị form popup trong giao diện thay cho prompt() của trình duyệt.
function openForm(title, fields) {
  popupTitle.textContent = title;
  popupFields.innerHTML = fields
    .map(
      (f) =>
        `<div class="form-field ${f.image ? "image-field" : ""}"><label>${f.label}</label>${f.image ? `<label class="image-picker"><input name="${f.name}" type="file" accept="image/png,image/jpeg,image/webp"><span>＋ Chọn hình ảnh</span></label><img class="image-preview" data-image-preview="${f.name}" ${f.value ? `src="${escapeHtml(f.value)}"` : ""} alt="Xem trước ảnh thuốc" ${f.value ? "" : "hidden"}>` : f.options ? `<select name="${f.name}">${f.options.map((x) => `<option value="${x.value ?? x}" ${String(x.value ?? x) === String(f.value ?? "") ? "selected" : ""}>${x.label ?? x}</option>`).join("")}</select>` : f.textarea ? `<textarea name="${f.name}" ${f.required ? "required" : ""}>${f.value || ""}</textarea>` : `<input name="${f.name}" type="${f.type || "text"}" value="${f.value ?? ""}" ${f.required ? "required" : ""} ${f.min ? 'min="' + f.min + '"' : ""}>`}</div>`,
    )
    .join("");
  popupFields.querySelectorAll('input[type="file"]').forEach((input) => {
    input.addEventListener("change", () => {
      const preview = popupFields.querySelector(`[data-image-preview="${input.name}"]`);
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        preview.src = reader.result;
        preview.hidden = false;
      };
      reader.readAsDataURL(file);
    });
  });
  popup.hidden = false;
  return new Promise((resolve) => {
    const close = () => {
      popup.hidden = true;
      popupForm.onsubmit = null;
      resolve(null);
    };
    popupClose.onclick = close;
    popupCancel.onclick = close;
    popupForm.onsubmit = async (e) => {
      e.preventDefault();
      const out = Object.fromEntries(new FormData(popupForm));
      for (const field of fields.filter((field) => field.image)) {
        const file = out[field.name];
        out[field.name] = file?.size
          ? await new Promise((done) => {
              const reader = new FileReader();
              reader.onload = () => done(reader.result);
              reader.readAsDataURL(file);
            })
          : field.value || "";
      }
      popup.hidden = true;
      resolve(out);
    };
  });
}

function openConfirm({ title, message, confirmText = "Xác nhận" }) {
  confirmTitle.textContent = title;
  confirmMessage.textContent = message;
  confirmSubmit.textContent = confirmText;
  confirmPopup.hidden = false;

  return new Promise((resolve) => {
    const close = (answer) => {
      confirmPopup.hidden = true;
      confirmForm.onsubmit = null;
      confirmCancel.onclick = null;
      confirmClose.onclick = null;
      resolve(answer);
    };
    confirmCancel.onclick = () => close(false);
    confirmClose.onclick = () => close(false);
    confirmForm.onsubmit = (e) => {
      e.preventDefault();
      close(true);
    };
  });
}

function applyRole() {
  if (!me()) {
    location.replace("login.html");
    return;
  }
  if (me().role === "CUSTOMER") {
    location.replace("../account.html");
    return;
  }
  document
    .querySelectorAll(".manager-only")
    .forEach((e) => (e.style.display = isManager() ? "" : "none"));
  employeeName.textContent = me().fullName;
  welcomeName.textContent = me().fullName + "!";
  roleName.textContent = isManager()
    ? "Admin / Quản lý cửa hàng"
    : "Nhân viên bán hàng / Dược sĩ";
}

function activeMedicines() {
  return medicines.filter((m) => m.active !== false);
}

function statusText(status) {
  return (
    {
      PENDING: "Chờ xác nhận",
      CONFIRMED: "Đã xác nhận",
      COMPLETED: "Hoàn thành",
      CANCELLED: "Đã hủy",
      CON_HANG: "Còn hàng",
      SAP_HET_HANG: "Sắp hết hàng",
      SAP_HET_HAN: "Sắp hết hạn",
      HET_HANG: "Hết hàng",
      NGUNG_KINH_DOANH: "Ngưng kinh doanh",
      IMPORT: "Nhập kho",
      EXPORT: "Xuất kho",
    }[status] || status
  );
}

function tagClass(status) {
  if (status === "COMPLETED" || status === "CON_HANG") return "complete";
  if (status === "CANCELLED" || status === "HET_HANG" || status === "NGUNG_KINH_DOANH")
    return "danger-tag";
  return "processing";
}

function paymentText(value) {
  return value === "TRANSFER" ? "Chuyển khoản" : "Tiền mặt";
}

function paymentStatus(value) {
  return (
    {
      PAID: "Đã thanh toán",
      UNPAID: "Chưa thanh toán",
      CANCELLED: "Đã hủy",
    }[value] || "Chưa thanh toán"
  );
}

function sameDay(dateValue, compareDate) {
  return new Date(dateValue).toDateString() === compareDate.toDateString();
}

function renderOverview() {
  const today = new Date();
  const todayList = orders.filter((order) => sameDay(order.orderDate, today));
  const todayCompleted = todayList.filter((order) => order.status === "COMPLETED");
  todayOrders.textContent = todayList.length;
  todayRevenue.textContent = money(
    todayCompleted.reduce((sum, order) => sum + Number(order.total || 0), 0),
  );
  overviewLowStock.textContent = activeMedicines().filter(
    (m) => m.stock <= (m.minimumStock || 20),
  ).length;
  overviewEmployees.textContent = users.filter(
    (u) => ["EMPLOYEE", "MANAGER"].includes(u.role) && u.active !== false,
  ).length;
  recentOrderList.innerHTML =
    orders
      .slice(0, 4)
      .map(
        (o) =>
          `<div><b>#${o.id}</b><span>${escapeHtml(o.customer?.fullName || "Khách hàng")}</span><em class="tag ${tagClass(o.status)}">${statusText(o.status)}</em><strong>${money(o.total)}</strong></div>`,
      )
      .join("") || "<p>Chưa có đơn hàng.</p>";
}

function renderMedicine(rows = medicines) {
  medicineCount.textContent = `${rows.length} thuốc đang được quản lý`;
  medicineRows.innerHTML =
    rows
      .map(
        (m) =>
          `<tr><td>#T${String(m.id).padStart(4, "0")}</td><td><div class="medicine-name">${m.image ? `<img class="medicine-thumb" src="${escapeHtml(m.image)}" alt="${escapeHtml(m.name)}">` : '<span class="medicine-mini">✚</span>'}<div><b>${escapeHtml(m.name)}</b><small>${escapeHtml(m.unit || "Hộp")} · ${m.expiryDate || "Chưa có hạn dùng"}</small></div></div></td><td>${escapeHtml(m.type)}</td><td>${escapeHtml(m.brand || "—")}</td><td><b>${money(m.price)}</b></td><td><span class="${m.stock < 10 ? "danger" : ""}">${m.stock} sản phẩm</span></td><td><span class="tag ${tagClass(m.status)}">${statusText(m.status)}</span></td><td><button class="row-action edit-medicine" data-id="${m.id}">Sửa</button> <button class="row-action delete-medicine" data-id="${m.id}">Xóa</button></td></tr>`,
      )
      .join("") || '<tr><td colspan="8">Chưa có thuốc.</td></tr>';
}

function renderStock() {
  const low = activeMedicines()
    .filter((m) => m.stock <= (m.minimumStock || 20))
    .sort((a, b) => a.stock - b.stock);
  const expiring = activeMedicines()
    .filter((m) => m.expiryDate)
    .filter((m) => new Date(m.expiryDate) <= new Date(Date.now() + 30 * 86400000))
    .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
  lowStockList.innerHTML =
    low
      .slice(0, 4)
      .map(
        (m) =>
          `<div class="stock-item"><span class="stock-box">✚</span><div><b>${escapeHtml(m.name)}</b><small>${escapeHtml(m.brand || "LONG CHÂU")}</small></div><em>Còn ${m.stock}</em></div>`,
      )
      .join("") || "<p>Kho đang đủ hàng.</p>";
  inventoryCards.innerHTML =
    low
      .map(
        (m) =>
          `<article class="inventory-card"><b>${escapeHtml(m.name)}</b><p>${escapeHtml(m.type)}</p><div><i style="width:${Math.min((m.stock / (m.minimumStock || 20)) * 100, 100)}%"></i></div><strong>Còn ${m.stock} sản phẩm</strong><button type="button" class="primary import-one" data-id="${m.id}">+ Nhập thêm</button></article>`,
      )
      .join("") || "<p>Không có thuốc sắp hết.</p>";
  expiringCards.innerHTML =
    expiring
      .map(
        (m) =>
          `<article class="inventory-card expiry-card"><b>${escapeHtml(m.name)}</b><p>${escapeHtml(m.brand || "LONG CHÂU")}</p><strong>Hạn: ${m.expiryDate}</strong><button type="button" class="row-action edit-medicine" data-id="${m.id}">Kiểm tra</button></article>`,
      )
      .join("") || "<p>Không có thuốc sắp hết hạn.</p>";
  inventoryRows.innerHTML =
    inventoryTransactions
      .slice(0, 10)
      .map(
        (t) =>
          `<tr><td>${new Date(t.createdAt).toLocaleString("vi-VN")}</td><td>${escapeHtml(t.medicine?.name || "")}</td><td>${statusText(t.type)}</td><td>${t.quantity}</td><td>${t.stockAfter}</td><td>${escapeHtml(t.note || "")}</td></tr>`,
      )
      .join("") || '<tr><td colspan="6">Chưa có lịch sử nhập/xuất kho.</td></tr>';
  inventoryTotal.textContent = activeMedicines().length;
  lowStockNumber.textContent = low.length;
  expiringNumber.textContent = expiring.length;
}

function saleProductPhoto(medicine) {
  const src = medicine.image;
  const valid = typeof src === "string" && (/^https?:\/\//i.test(src) || /^data:image\/(png|jpe?g|webp|gif);base64,/i.test(src));
  return `<div class="sale-photo">${valid ? `<img data-sale-photo src="${escapeHtml(src)}" alt="${escapeHtml(medicine.name)}" loading="lazy">` : '<span>Chưa có ảnh</span>'}</div>`;
}
document.addEventListener("error", event => {
  if (event.target.matches?.("img[data-sale-photo]")) event.target.parentElement.textContent = "Chưa có ảnh";
}, true);

function renderSale() {
  const terms = (saleSearch.value || "").toLowerCase();
  const chosenCustomer = saleCustomer.value;
  saleCustomer.innerHTML =
    '<option value="">-- Chọn khách hàng --</option><option value="NEW">＋ Khách hàng mới</option>' +
    customers
      .filter((customer) => customer.active !== false)
      .map(
        (customer) =>
          `<option value="${customer.id}">${escapeHtml(customer.fullName)} - ${escapeHtml(customer.phone || customer.username)}</option>`,
      )
      .join("");
  saleCustomer.value =
    chosenCustomer && [...saleCustomer.options].some((option) => option.value === chosenCustomer)
      ? chosenCustomer
      : "";
  toggleNewCustomerFields();
  saleMedicineGrid.innerHTML = activeMedicines()
    .filter((m) => (m.name + m.type + (m.brand || "")).toLowerCase().includes(terms))
    .map(
      (m) =>
        `<article class="sale-product" data-id="${m.id}">${saleProductPhoto(m)}<b>${escapeHtml(m.name)}</b><span>${m.stock} sản phẩm còn lại</span><strong>${money(m.price)}</strong></article>`,
    )
    .join("");
  saleCart.innerHTML = cart.length
    ? cart
        .map(
          (m) =>
            `<div class="cart-line" data-id="${m.id}"><b>${escapeHtml(m.name)} × ${m.quantity}</b><span>${money(m.price * m.quantity)}</span><button type="button" data-action="decrease">−</button><button type="button" data-action="increase">+</button><button type="button" data-action="remove">Xóa</button></div>`,
        )
        .join("")
    : "<p>Chưa có sản phẩm trong hóa đơn.</p>";
  saleTotal.textContent = money(
    cart.reduce((s, m) => s + m.price * m.quantity, 0),
  );
  printInvoice.disabled = !currentSaleOrder;
}

function toggleNewCustomerFields() {
  newCustomerFields.hidden = saleCustomer.value !== "NEW";
  newCustomerName.required = saleCustomer.value === "NEW";
  if (saleCustomer.value !== "NEW") {
    newCustomerName.value = "";
    newCustomerPhone.value = "";
  }
}

async function createWalkInCustomer() {
  const fullName = newCustomerName.value.trim();
  if (!fullName) throw new Error("Vui lòng nhập họ và tên khách hàng mới.");
  const uniquePart = Date.now().toString().slice(-8);
  return api("/users", {
    method: "POST",
    ...json({
      fullName,
      phone: newCustomerPhone.value.trim(),
      username: "khach_quay_" + uniquePart,
      password: "Pos" + uniquePart,
      role: "CUSTOMER",
    }),
  });
}

function updateOrderTabCounts() {
  for (const [status, label] of [["PENDING", "Chờ xác nhận"], ["CONFIRMED", "Đã xác nhận"]]) {
    const count = orders.filter(order => order.status === status).length;
    orderTabs.querySelector(`[data-status="${status}"]`).textContent = `${label} (${count})`;
  }
}
let orderRefreshBusy = false;
let orderStatusSaving = false;
let orderRefreshVersion = 0;
async function refreshOrderList() {
  if (document.hidden || orderRefreshBusy || orderStatusSaving || document.activeElement?.matches("#orderRows .status")) return;
  orderRefreshBusy = true;
  const version = orderRefreshVersion;
  try {
    const latest = await api("/orders");
    if (version !== orderRefreshVersion || orderStatusSaving) return;
    orders = latest;
    updateOrderTabCounts();
    if (!document.activeElement?.matches("#orderRows .status")) renderOrders();
  } catch { /* Keep the last successful data when the connection is unavailable. */ }
  finally { orderRefreshBusy = false; }
}
setInterval(() => {
  if (document.querySelector("#orders.active")) refreshOrderList();
}, 15000);
window.addEventListener("focus", () => {
  if (document.querySelector("#orders.active")) refreshOrderList();
});
function renderOrders(rows = orders) {
  updateOrderTabCounts();
  const terms = (orderSearch.value || "").toLowerCase();
  const filtered = rows.filter((order) => {
    const orderSource = order.orderSource || (order.employee?.id ? "COUNTER" : "ONLINE");
    const sourceLabel = orderSource === "COUNTER" ? "Mua trực tiếp" : "Đơn online";
    const text =
      order.id +
      " " +
      sourceLabel +
      " " +
      (order.customer?.fullName || "") +
      " " +
      (order.customer?.phone || "") +
      " " +
      (order.details || []).map((d) => d.medicine?.name || "").join(" ");
    return (
      (!orderFilter || order.status === orderFilter) &&
      (!terms || text.toLowerCase().includes(terms))
    );
  });
  orderRows.innerHTML =
    filtered
      .map((o) => {
        const cancelled = o.status === "CANCELLED";
        const locked = cancelled ? ' disabled title="Đơn hàng đã hủy nên không thể thay đổi trạng thái."' : "";
        return `<tr><td>#${o.id}</td><td><span class="order-classification-badge ${(o.orderSource || (o.employee?.id ? "COUNTER" : "ONLINE")) === "COUNTER" ? "direct" : "online"}">${(o.orderSource || (o.employee?.id ? "COUNTER" : "ONLINE")) === "COUNTER" ? "Mua trực tiếp" : "Đơn online"}</span></td><td><b>${escapeHtml(o.customer?.fullName || "")}</b><small>${escapeHtml(o.customer?.phone || "")}</small></td><td>${(o.details || []).map((d) => escapeHtml(d.medicine.name) + " × " + d.quantity).join(", ")}</td><td>${new Date(o.orderDate).toLocaleString("vi-VN")}</td><td><b>${money(o.total)}</b><small>${paymentText(o.paymentMethod)} · ${paymentStatus(o.paymentStatus)}</small></td><td><select class="status order-status" data-state="${escapeHtml(o.status)}" aria-label="Trạng thái đơn #${o.id}" data-id="${o.id}"${locked}><option value="PENDING" ${o.status === "PENDING" ? "selected" : ""}>Chờ xác nhận</option><option value="CONFIRMED" ${o.status === "CONFIRMED" ? "selected" : ""}>Đã xác nhận</option><option value="COMPLETED" ${o.status === "COMPLETED" ? "selected" : ""}>Hoàn thành</option><option value="CANCELLED" ${o.status === "CANCELLED" ? "selected" : ""}>Đã hủy</option></select></td><td>${o.paymentMethod === "TRANSFER" && o.paymentStatus !== "PAID" && !cancelled ? `<button class="row-action qr-order" data-id="${o.id}">QR</button>` : ""}<button class="order-detail-trigger" data-id="${o.id}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg><span>Chi tiết</span></button></td></tr>`;
      })
      .join("") || '<tr><td colspan="8">Chưa có đơn hàng.</td></tr>';
}

function renderCustomers(rows = customers) {
  customerCount.textContent = `${rows.length} hồ sơ khách hàng`;
  customerRows.innerHTML =
    rows
      .map(
        (u) =>
          `<tr><td><b>${escapeHtml(u.fullName)}</b><small>Đang hoạt động</small></td><td>${escapeHtml(u.username)}</td><td>${escapeHtml(u.phone || "")}</td><td>${escapeHtml(u.email || "")}</td><td>${escapeHtml(u.address || "")}</td><td><button class="row-action edit-customer" data-id="${u.id}">Sửa</button> <button class="row-action delete-customer" data-id="${u.id}">Xóa</button></td></tr>`,
      )
      .join("") || '<tr><td colspan="6">Chưa có khách hàng.</td></tr>';
}

function showEmployeeDetails(id) {
  if (!canAccess("users")) return toast("Bạn không có quyền xem thông tin nhân viên.");
  const employee = users.find((user) => String(user.id) === String(id) && user.role !== "CUSTOMER");
  if (!employee) return toast("Không tìm thấy thông tin nhân viên. Vui lòng tải lại danh sách.");
  let dialog = document.querySelector("#employeeDetailDialog");
  if (!dialog) {
    dialog = document.createElement("dialog");
    dialog.id = "employeeDetailDialog";
    dialog.className = "employee-detail-dialog";
    dialog.setAttribute("aria-labelledby", "employeeDetailTitle");
    dialog.innerHTML = `<header class="order-detail-header"><div><p>HỒ SƠ NHÂN SỰ</p><h2 id="employeeDetailTitle">Thông tin nhân viên</h2></div><button type="button" aria-label="Đóng thông tin nhân viên" data-close>×</button></header><div class="employee-detail-body"></div><footer class="order-detail-footer"><button type="button" class="outline" data-close autofocus>Đóng</button></footer>`;
    document.body.appendChild(dialog);
    dialog.querySelectorAll("[data-close]").forEach(button => {
      button.onclick = () => dialog.close();
    });
    dialog.addEventListener("click", event => {
      const rect = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
    });
  }
  // Format the stored calendar date without converting time zones.
  const date = String(employee.startDate || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  const fields = [
    ["Mã nhân viên / tài khoản", employee.id],
    ["Họ và tên", employee.fullName],
    ["Tên đăng nhập", employee.username],
    ["Vai trò", roleText(employee.role)],
    ["Trạng thái", employee.active === false ? "Đang khóa" : "Đang hoạt động"],
    ["Số điện thoại", employee.phone],
    ["Email", employee.email],
    ["Chức vụ", employee.position],
    ["Bộ phận", employee.department],
    ["Ngày vào làm", date ? `${date[3]}/${date[2]}/${date[1]}` : ""],
    ["Địa chỉ", employee.address],
  ];
  dialog.querySelector(".employee-detail-body").innerHTML = `<dl class="employee-detail-grid">${fields.map(([label, value]) => `<div><dt>${label}</dt><dd>${escapeHtml(String(value ?? "").trim() || "Chưa cập nhật")}</dd></div>`).join("")}</dl>`;
  dialog.showModal();
}

function renderUsers(rows = users.filter((u) => u.role !== "CUSTOMER")) {
  if (!userRows) return;
  userRows.innerHTML =
    rows
      .map(
        (u) =>
          `<tr><td><b>${escapeHtml(u.fullName)}</b><small>${escapeHtml(u.position || u.department || "")}</small></td><td>${escapeHtml(u.username)}</td><td>${roleText(u.role)}<small>${u.active === false ? "Đang khóa" : "Đang hoạt động"}</small></td><td>${escapeHtml(u.phone || "")}<small>${escapeHtml(u.email || "")}</small></td><td><button type="button" class="row-action view-user" data-id="${u.id}">Xem thông tin</button> <button class="row-action edit-user" data-id="${u.id}">Sửa</button> <button class="row-action toggle-user" data-id="${u.id}" data-active="${u.active === false ? "true" : "false"}">${u.active === false ? "Mở khóa" : "Khóa"}</button></td></tr>`,
      )
      .join("") || '<tr><td colspan="5">Chưa có nhân sự.</td></tr>';
}

function roleText(role) {
  return role === "MANAGER" ? "Admin / Quản lý" : role === "EMPLOYEE" ? "Nhân viên / Dược sĩ" : "Khách hàng";
}

async function profile() {
  const p = await api("/users/" + me().id);
  profileName.textContent = p.fullName;
  profileUsername.textContent = "Username: " + p.username;
  profileContact.textContent = `Điện thoại: ${p.phone || "Chưa cập nhật"} · Email: ${p.email || "Chưa cập nhật"} · Địa chỉ: ${p.address || "Chưa cập nhật"}`;
  profileRole.textContent =
    p.role === "MANAGER" ? "Admin / Quản lý" : "Nhân viên / Dược sĩ đang hoạt động";
}

async function load() {
  try {
    await loadPermissions();
    medicines = await api("/medicines?includeInactive=true");
    orders = await api("/orders");
    customers = (await api("/users?role=CUSTOMER")).filter((u) => u.active !== false);
    users = await api("/users");
    inventoryTransactions = canAccess('inventory') ? await api("/inventory/transactions") : [];
    renderMedicine();
    renderStock();
    renderSale();
    renderOrders();
    renderCustomers();
    renderUsers();
    renderOverview();
    await profile();
    if (canAccess("reports")) await loadReport();
  } catch (e) {
    toast(e.message);
  }
}

function view(name) {
  if (
    !document.querySelector("#" + name) ||
    (name === "permissions" && !isManager()) || !canAccess(name)
  )
    return toast("Chức năng này chỉ dành cho admin/quản lý.");
  document
    .querySelectorAll(".view")
    .forEach((x) => x.classList.remove("active"));
  document.querySelector("#" + name).classList.add("active");
  document
    .querySelectorAll("#sideNav button")
    .forEach((x) => x.classList.toggle("active", x.dataset.view === name));
  document.body.dataset.view = name;
  document.querySelector(".global-search").hidden = name !== "overview";
  const labels = {
    overview: "Tổng quan hoạt động",
    medicines: "Quản lý thuốc",
    inventory: "Quản lý kho",
    orders: "Quản lý đơn hàng",
    customers: "Quản lý khách hàng",
    sales: "Bán hàng tại quầy",
    consultations: "Tư vấn thuốc",
    accounts: "Tài khoản của tôi",
    reports: "Báo cáo thống kê",
    permissions: "Phân quyền hệ thống",
  };
  pageTitle.textContent = labels[name];
  if (name === "orders") refreshOrderList();
  if (name === "consultations") loadConsultations();
  if (name === "reports") loadReport();
}

function medicinePayload(v) {
  return {
    name: v.name.trim(),
    type: v.type.trim(),
    brand: (v.brand || "").trim(),
    unit: v.unit.trim(),
    price: +v.price,
    stock: +v.stock,
    expiryDate: v.expiryDate || null,
    ingredient: v.ingredient.trim(),
    dosage: (v.dosage || "").trim(),
    supplier: v.supplier.trim(),
    minimumStock: +v.minimumStock || 20,
    active: v.active !== "false",
    description: v.description.trim(),
    image: v.image || "",
  };
}

async function saveMedicine(old) {
  const v = await openForm(old ? "Sửa thông tin thuốc" : "Thêm thuốc mới", [
    { name: "name", label: "Tên thuốc", value: old?.name, required: true },
    {
      name: "type",
      label: "Loại thuốc",
      value: old?.type || "",
      required: true,
    },
    {
      name: "image",
      label: "Hình ảnh thuốc",
      value: old?.image || "",
      image: true,
    },
    { name: "brand", label: "Thương hiệu", value: old?.brand || "" },
    {
      name: "unit",
      label: "Đơn vị tính",
      value: old?.unit || "Hộp",
      required: true,
    },
    { name: "ingredient", label: "Thành phần", value: old?.ingredient || "" },
    {
      name: "dosage",
      label: "Cách dùng",
      value: old?.dosage || "",
      textarea: true,
    },
    {
      name: "supplier",
      label: "Nhà cung cấp",
      value: old?.supplier || "",
      required: true,
    },
    {
      name: "price",
      label: "Giá bán (VNĐ)",
      type: "number",
      value: old?.price,
      required: true,
      min: 1,
    },
    {
      name: "stock",
      label: "Số lượng tồn",
      type: "number",
      value: old?.stock,
      required: true,
      min: 0,
    },
    {
      name: "minimumStock",
      label: "Ngưỡng cảnh báo tồn",
      type: "number",
      value: old?.minimumStock || 20,
      required: true,
      min: 1,
    },
    {
      name: "expiryDate",
      label: "Hạn sử dụng",
      type: "date",
      value: old?.expiryDate,
      required: true,
      min: localToday(),
    },
    {
      name: "active",
      label: "Trạng thái",
      value: String(old?.active !== false),
      options: [
        { value: "true", label: "Đang kinh doanh" },
        { value: "false", label: "Ngưng kinh doanh" },
      ],
    },
    {
      name: "description",
      label: "Công dụng / mô tả",
      value: old?.description,
      textarea: true,
    },
  ]);
  if (!v) return;
  await api("/medicines" + (old ? "/" + old.id : ""), {
    method: old ? "PUT" : "POST",
    ...json(medicinePayload(v)),
  });
  toast("Đã lưu thuốc.");
  load();
}

async function setMedicineActive(id, active) {
  if (!active) {
    await api("/medicines/" + id, { method: "DELETE" });
    toast("Đã xóa thuốc.");
    load();
    return;
  }
  const m = medicines.find((x) => x.id == id);
  const payload = medicinePayload({
    name: m.name,
    type: m.type,
    unit: m.unit || "Hộp",
    ingredient: m.ingredient || "",
    dosage: m.dosage || "",
    supplier: m.supplier || "",
    price: m.price,
    stock: m.stock,
    minimumStock: m.minimumStock || 20,
    expiryDate: m.expiryDate || "",
    active: String(active),
    description: m.description || "",
    image: m.image || "",
  });
  await api("/medicines/" + id, { method: "PUT", ...json(payload) });
  toast("Đã mở bán thuốc.");
  load();
}

async function addToStock(id) {
  const m = medicines.find((x) => x.id == id),
    v = await openForm("Nhập thuốc vào kho", [
      {
        name: "quantity",
        label: `Số lượng nhập thêm cho: ${m.name}`,
        type: "number",
        value: "",
        required: true,
        min: 1,
      },
      {
        name: "note",
        label: "Ghi chú nhập kho",
        value: "",
      },
    ]);
  if (!v) return;
  await api(
    "/medicines/" +
      id +
      "/stock?quantity=" +
      encodeURIComponent(v.quantity) +
      "&note=" +
      encodeURIComponent(v.note || ""),
    { method: "PUT" },
  );
  toast("Đã cập nhật tồn kho.");
  load();
}

async function loadConsultations() {
  try {
    const list = await api("/consultations");
    consultationRows.innerHTML =
      list
        .map(
          (c) =>
            `<tr><td><b>${escapeHtml(c.customer?.fullName || "")}</b></td><td>${renderConsultThread(c)}</td><td>${new Date(c.createdAt).toLocaleString("vi-VN")}</td><td><span class="tag ${c.status === "ANSWERED" ? "complete" : "processing"}">${c.status}</span></td><td>${c.status === "PENDING" ? `<button class="row-action answer" data-id="${c.id}">Trả lời</button>` : ""}</td></tr>`,
        )
        .join("") || '<tr><td colspan="5">Chưa có câu hỏi tư vấn.</td></tr>';
  } catch (e) {
    toast(e.message);
  }
}

function userPayload(v, role) {
  return {
    fullName: v.fullName.trim(),
    username: v.username.trim(),
    password: v.password || "GIU_LAI_MAT_KHAU",
    phone: v.phone.trim(),
    email: v.email.trim(),
    address: v.address.trim(),
    position: v.position?.trim() || "",
    department: v.department?.trim() || "",
    startDate: v.startDate || null,
    active: v.active !== "false",
    role: role || v.role,
  };
}

async function saveCustomer(old) {
  const fields = [
    { name: "fullName", label: "Họ tên khách hàng", value: old?.fullName, required: true },
    { name: "username", label: "Username", value: old?.username, required: true },
  ];
  if (!old) {
    fields.push({
      name: "password",
      label: "Mật khẩu",
      type: "password",
      required: true,
      min: 6,
    });
  }
  fields.push(
    { name: "phone", label: "Số điện thoại", value: old?.phone || "" },
    { name: "email", label: "Email", type: "email", value: old?.email || "" },
    { name: "address", label: "Địa chỉ", value: old?.address || "" },
    {
      name: "active",
      label: "Trạng thái",
      value: String(old?.active !== false),
      options: [
        { value: "true", label: "Đang hoạt động" },
        { value: "false", label: "Đang khóa" },
      ],
    },
  );
  const v = await openForm(old ? "Cập nhật khách hàng" : "Thêm khách hàng", fields);
  if (!v) return;
  await api("/users" + (old ? "/" + old.id : ""), {
    method: old ? "PUT" : "POST",
    ...json(userPayload(v, "CUSTOMER")),
  });
  toast("Đã lưu khách hàng.");
  load();
}

async function saveEmployee(old) {
  const fields = [
    { name: "fullName", label: "Họ tên", value: old?.fullName, required: true },
    { name: "username", label: "Username", value: old?.username, required: true },
  ];
  if (!old) {
    fields.push({
      name: "password",
      label: "Mật khẩu",
      type: "password",
      required: true,
      min: 6,
    });
  }
  fields.push(
    {
      name: "role",
      label: "Vai trò",
      options: [
        { value: "EMPLOYEE", label: "Nhân viên / Dược sĩ" },
        { value: "MANAGER", label: "Admin / Quản lý" },
      ],
      value: old?.role || "EMPLOYEE",
    },
    { name: "phone", label: "Số điện thoại", value: old?.phone || "" },
    { name: "email", label: "Email", type: "email", value: old?.email || "" },
    { name: "address", label: "Địa chỉ", value: old?.address || "" },
    { name: "position", label: "Chức vụ", value: old?.position || "" },
    { name: "department", label: "Bộ phận", value: old?.department || "" },
    { name: "startDate", label: "Ngày vào làm", type: "date", value: old?.startDate || "" },
    {
      name: "active",
      label: "Trạng thái",
      value: String(old?.active !== false),
      options: [
        { value: "true", label: "Đang hoạt động" },
        { value: "false", label: "Đang khóa" },
      ],
    },
  );
  const v = await openForm(old ? "Cập nhật nhân sự" : "Thêm nhân sự", fields);
  if (!v) return;
  await api("/users" + (old ? "/" + old.id : ""), {
    method: old ? "PUT" : "POST",
    ...json(userPayload(v)),
  });
  toast("Đã lưu tài khoản nhân sự.");
  load();
}

async function toggleUser(id, active) {
  if (!active) {
    const user = users.find((item) => String(item.id) === String(id));
    if (!user) return toast("Không tìm thấy tài khoản. Vui lòng tải lại danh sách.");
    const confirmed = await openConfirm({
      title: "Xác nhận khóa tài khoản",
      message: `Bạn có chắc muốn khóa tài khoản của ${user.fullName || user.username}? Tài khoản này sẽ không thể đăng nhập cho đến khi được mở khóa.`,
      confirmText: "Khóa tài khoản",
    });
    if (!confirmed) return;
  }
  await api("/users/" + id + "/active?value=" + active, { method: "PUT" });
  toast("Đã cập nhật trạng thái tài khoản.");
  load();
}

async function loadReport() {
  try {
    const reportDays = document.querySelector("#reportRange")?.value || 30;
    const data = await api("/reports/summary?days=" + reportDays);
    reportRevenue.textContent = money(data.revenue);
    reportSold.textContent = `${data.soldQuantity} sản phẩm đã bán`;
    reportCompletedOrders.textContent = data.completedOrders;
    reportTotalOrders.textContent = `${data.totalOrders} đơn tổng cộng`;
    reportLowStock.textContent = data.lowStock;
    reportExpiring.textContent = data.expiringSoon;
  } catch (e) {
    toast(e.message);
  }
  await loadRevenueChart();
}

const CHART_TITLES = {
  day: "Doanh thu 10 ngày gần nhất",
  week: "Doanh thu 7 tuần gần nhất",
  month: "Doanh thu 3 tháng gần nhất",
  quarter: "Doanh thu 3 quý gần nhất",
  year: "Doanh thu 3 năm gần nhất",
};

// Ve bieu do cot doanh thu that tu API /reports/revenue-chart, chia theo
// ngay/tuan/thang/quy/nam. Chieu cao cot tinh theo % so voi gia tri lon nhat trong nhom.
async function loadRevenueChart() {
  if (!revenueChart || !chartRange) return;
  try {
    const data = await api("/reports/revenue-chart?groupBy=" + chartRange.value);
    chartTitle.textContent = CHART_TITLES[data.groupBy] || "Doanh thu";
    const buckets = data.buckets || [];
    revenueChart.style.setProperty("--chart-columns", Math.max(1, buckets.length));
    revenueChart.style.setProperty("--chart-min-width", (buckets.length * (data.groupBy === "week" ? 130 : 115)) + "px");
    const max = Math.max(1, ...buckets.map((b) => b.revenue));
    revenueChart.innerHTML = buckets.length
      ? buckets
          .map((b) => {
            const heightPercent = Math.max(3, Math.round((b.revenue / max) * 100));
            return `<i style="height:${heightPercent}%" title="${b.label}: ${money(b.revenue)} · ${b.orders} đơn"><b>${formatChartValue(b.revenue)}</b><span>${b.label}</span></i>`;
          })
          .join("")
      : '<p class="bar-empty">Chưa có dữ liệu doanh thu trong khoảng thời gian này.</p>';
  } catch (e) {
    toast(e.message);
  }
}
if (chartRange) chartRange.onchange = loadRevenueChart;

// Hiển thị đầy đủ số tiền trên mỗi cột.
function formatChartValue(value) {
  return money(value);
}

function printReceipt(order) {
  const lines = (order.details || [])
    .map(
      (d) =>
        `<tr><td>${escapeHtml(d.medicine?.name || "")}</td><td>${d.quantity}</td><td>${money(d.price)}</td><td>${money(d.price * d.quantity)}</td></tr>`,
    )
    .join("");
  const receipt = window.open("", "_blank");
  if (!receipt) return toast("Trình duyệt đang chặn cửa sổ in hóa đơn.");
  receipt.document.write(`<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Hóa đơn #${order.id}</title><style>body{font-family:Arial,sans-serif;padding:28px;color:#102a56}h1{margin:0 0 8px;color:#0757d9}table{width:100%;border-collapse:collapse;margin-top:18px}th,td{border-bottom:1px solid #dce7f7;padding:10px;text-align:left}.total{text-align:right;font-size:20px;color:#e55727;font-weight:700}</style></head><body><h1>Nhà thuốc Long Châu</h1><p>Hóa đơn #${order.id} · ${new Date(order.orderDate).toLocaleString("vi-VN")}</p><p>Khách hàng: <b>${escapeHtml(order.customer?.fullName || "")}</b></p><p>Thanh toán: ${paymentText(order.paymentMethod)} · ${paymentStatus(order.paymentStatus)}</p><table><thead><tr><th>Thuốc</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead><tbody>${lines}</tbody></table><p class="total">Tổng: ${money(order.total)}</p></body></html>`);
  receipt.document.close();
  receipt.focus();
  receipt.print();
}

sideNav.onclick = (e) => {
  const x = e.target.closest("button");
  if (x) view(x.dataset.view);
};
document.querySelectorAll("[data-view]").forEach((x) => {
  if (!x.closest("#sideNav")) x.onclick = () => view(x.dataset.view);
});
menuToggle.onclick = () =>
  document.querySelector(".sidebar").classList.toggle("open");
medicineSearch.oninput = (e) =>
  renderMedicine(
    medicines.filter((m) =>
      (m.name + m.type + (m.brand || "") + (m.ingredient || ""))
        .toLowerCase()
        .includes(e.target.value.toLowerCase()),
    ),
  );
globalSearch.onkeydown = (e) => {
  if (e.key === "Enter") {
    view("medicines");
    medicineSearch.value = e.target.value;
    medicineSearch.dispatchEvent(new Event("input"));
  }
};
addMedicine.onclick = () => saveMedicine();
medicineRows.onclick = async (e) => {
  const id = e.target.dataset.id;
  if (e.target.matches(".edit-medicine"))
    saveMedicine(medicines.find((m) => m.id == id));
  if (e.target.matches(".delete-medicine")) {
    const medicine = medicines.find((m) => m.id == id);
    const ok = await openConfirm({
      title: "Xóa thuốc?",
      message: `"${medicine?.name || "Thuốc này"}" sẽ bị xóa vĩnh viễn, cùng dữ liệu giỏ hàng, lịch sử kho và chi tiết đơn hàng liên quan. Không thể khôi phục.`,
      confirmText: "Xóa vĩnh viễn",
    });
    if (!ok) return;
    try {
      await setMedicineActive(id, false);
    } catch (x) {
      toast(x.message);
    }
  }
};
inventoryCards.onclick = (e) =>
  e.target.matches(".import-one") && addToStock(e.target.dataset.id);
expiringCards.onclick = (e) => {
  if (e.target.matches(".edit-medicine"))
    saveMedicine(medicines.find((m) => m.id == e.target.dataset.id));
};
document.querySelector("#importStock").onclick = async () => {
  const v = await openForm("Nhập thuốc vào kho", [
    {
      name: "id",
      label: "Chọn thuốc",
      options: activeMedicines().map((m) => ({ value: m.id, label: m.id + ": " + m.name })),
      value: activeMedicines()[0]?.id,
    },
    {
      name: "quantity",
      label: "Số lượng nhập thêm",
      type: "number",
      value: "",
      required: true,
      min: 1,
    },
    { name: "note", label: "Ghi chú nhập kho", value: "" },
  ]);
  if (!v) return;
  try {
    await api(
      "/medicines/" +
        v.id +
        "/stock?quantity=" +
        encodeURIComponent(v.quantity) +
        "&note=" +
        encodeURIComponent(v.note || ""),
      { method: "PUT" },
    );
    toast("Đã nhập thuốc vào kho.");
    load();
  } catch (e) {
    toast(e.message);
  }
};
document.querySelector("#orders tbody").onchange = async (e) => {
  if (!e.target.matches(".status")) return;
  if (e.target.dataset.state === "CANCELLED") {
    e.target.value = "CANCELLED";
    toast("Đơn hàng đã hủy nên không thể thay đổi.");
    return;
  }
  orderStatusSaving = true;
  orderRefreshVersion++;
  e.target.disabled = true;
  try {
    await api(
      "/orders/" + e.target.dataset.id + "/status?value=" + e.target.value,
      { method: "PUT" },
    );
    toast("Đã cập nhật đơn.");
    await load();
  } catch (x) {
    toast(x.message);
    await load();
  } finally {
    orderStatusSaving = false;
    e.target.disabled = false;
  }
};
orderRows.onclick = (e) => {
  if (e.target.matches(".qr-order")) return openDemoPayment(e.target.dataset.id, load);
  const detailButton = e.target.closest(".order-detail-trigger");
  if (!detailButton) return;
  const order = orders.find((x) => x.id == detailButton.dataset.id);
  if (order) showOrderDetails(order).catch(error => toast(error.message));
};
async function showOrderDetails(order) {
  order = await api("/orders/" + order.id);
  const modal = document.querySelector("#orderDetailModal");
  document.querySelector("#orderDetailTitle").textContent = `Đơn hàng #${order.id}`;
  const status = document.querySelector("#orderDetailStatus");
  status.textContent = statusText(order.status);
  status.className = `tag ${tagClass(order.status)}`;
  const rows = (order.details || []).map(detail => `<tr><td>${escapeHtml(detail.medicine?.name || "")}</td><td>${detail.quantity}</td><td>${money(detail.price)}</td><td>${money(detail.price * detail.quantity)}</td></tr>`).join("");
  const address = order.deliveryAddress || order.customer?.address || "Chưa có thông tin";
  document.querySelector("#orderDetailBody").innerHTML = `
    <section class="order-detail-customer"><h3>Thông tin khách hàng</h3><div><span>Họ tên</span><b>${escapeHtml(order.customer?.fullName || "Khách hàng")}</b></div><div><span>Số điện thoại</span><b>${escapeHtml(order.customer?.phone || "Chưa có thông tin")}</b></div><div><span>Địa chỉ</span><b>${escapeHtml(address)}</b></div></section>
    <section class="order-detail-products"><h3>Sản phẩm</h3><div class="table-wrap"><table><thead><tr><th>Tên thuốc</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead><tbody>${rows || '<tr><td colspan="4">Đơn hàng chưa có sản phẩm.</td></tr>'}</tbody></table></div></section>
    ${order.prescriptionImage ? `<section class="order-detail-prescription"><h3>Ảnh đơn thuốc</h3><div><img src="${escapeHtml(order.prescriptionImage)}" alt="Ảnh đơn thuốc của đơn hàng #${order.id}"><button type="button" class="outline" id="orderPrescriptionZoom">Phóng to ảnh đơn thuốc</button></div></section>` : ""}
    <section class="order-detail-summary"><div><span>Hình thức thanh toán</span><b>${paymentText(order.paymentMethod)} · ${paymentStatus(order.paymentStatus)}</b></div><div><span>Thời gian đặt</span><b>${new Date(order.orderDate).toLocaleString("vi-VN")}</b></div><div class="order-detail-total"><span>Tổng tiền thanh toán</span><strong>${money(order.total)}</strong></div></section>`;
  modal.hidden = false;
  document.querySelector("#orderDetailClose").focus();
  const prescriptionZoom = document.querySelector("#orderPrescriptionZoom");
  if (prescriptionZoom) prescriptionZoom.onclick = () => {
    document.querySelector("#prescriptionZoomImage").src = order.prescriptionImage;
    document.querySelector("#prescriptionZoomDialog").hidden = false;
  };
}
function closeOrderDetails() { document.querySelector("#orderDetailModal").hidden = true; }
document.querySelector("#orderDetailClose").onclick = closeOrderDetails;
document.querySelector("#orderDetailCloseX").onclick = closeOrderDetails;
document.querySelector("#orderDetailModal").addEventListener("click", event => { if (event.target.id === "orderDetailModal") closeOrderDetails(); });
document.addEventListener("keydown", event => { if (event.key === "Escape") closeOrderDetails(); });
orderSearch.oninput = () => renderOrders();
orderTabs.onclick = (e) => {
  const button = e.target.closest("button");
  if (!button) return;
  orderFilter = button.dataset.status;
  orderTabs
    .querySelectorAll("button")
    .forEach((item) => item.classList.toggle("selected", item === button));
  renderOrders();
};
reloadConsultations.onclick = loadConsultations;
consultationRows.onclick = async (e) => {
  const answerButton = e.target.closest(".answer");
  if (!answerButton) return;
  const v = await openForm("Trả lời tư vấn", [
    { name: "text", label: "Nội dung trả lời", textarea: true, required: true },
    {
      name: "medicineId",
      label: "Gửi kèm link thuốc",
      options: [
        { value: "", label: "Không gửi link thuốc" },
        ...activeMedicines().map((m) => ({ value: m.id, label: m.name })),
      ],
    },
  ]);
  if (!v) return;
  const medicine = activeMedicines().find((m) => String(m.id) === String(v.medicineId));
  const answerText = medicine
    ? `${v.text.trim()}\n\nLink thuốc tham khảo: ${medicine.name}\n${productLink(medicine.id)}`
    : v.text.trim();
  try {
    await api(
      "/consultations/" +
        answerButton.dataset.id +
        "/answer?text=" +
        encodeURIComponent(answerText),
      { method: "PUT" },
    );
    toast("Đã gửi câu trả lời.");
    loadConsultations();
  } catch (x) {
    toast(x.message);
  }
};
addCustomer.onclick = () => saveCustomer();
customerSearch.oninput = (e) =>
  renderCustomers(
    customers.filter((u) =>
      (u.fullName + u.username + (u.phone || "") + (u.email || ""))
        .toLowerCase()
        .includes(e.target.value.toLowerCase()),
    ),
  );
customerRows.onclick = async (e) => {
  const id = e.target.dataset.id;
  if (e.target.matches(".edit-customer"))
    return saveCustomer(customers.find((u) => u.id == id));
  if (e.target.matches(".delete-customer")) {
    const customer = customers.find((u) => u.id == id);
    const ok = await openConfirm({
      title: "Xóa khách hàng?",
      message: `Bạn có muốn xóa hồ sơ "${customer?.fullName || "khách hàng này"}" không?`,
      confirmText: "Xóa",
    });
    if (!ok) return;
    try {
      await api("/users/" + id, { method: "DELETE" });
      toast("Đã xóa khách hàng.");
      load();
    } catch (x) {
      toast(x.message);
    }
  }
};
editProfile.onclick = async () => {
  try {
    const p = await api("/users/" + me().id),
      v = await openForm("Cập nhật thông tin cá nhân", [
        {
          name: "fullName",
          label: "Họ và tên",
          value: p.fullName,
          required: true,
        },
        { name: "phone", label: "Số điện thoại", value: p.phone },
        { name: "email", label: "Email", type: "email", value: p.email },
        { name: "address", label: "Địa chỉ", value: p.address || "" },
      ]);
    if (!v) return;
    await api("/users/" + p.id, {
      method: "PUT",
      ...json({ ...p, ...v, password: "GIU_LAI_MAT_KHAU" }),
    });
    toast("Đã cập nhật thông tin.");
    profile();
  } catch (e) {
    toast(e.message);
  }
};
changePassword.onclick = async () => {
  const v = await openForm("Đổi mật khẩu", [
    {
      name: "oldPassword",
      label: "Mật khẩu hiện tại",
      type: "password",
      required: true,
    },
    {
      name: "newPassword",
      label: "Mật khẩu mới (ít nhất 8 ký tự, gồm chữ hoa, chữ thường và số)",
      type: "password",
      required: true,
      min: 8,
    },
  ]);
  if (!v) return;
  try {
    await api(
      "/users/" +
        me().id +
        "/password?oldPassword=" +
        encodeURIComponent(v.oldPassword) +
        "&newPassword=" +
        encodeURIComponent(v.newPassword),
      { method: "PUT" },
    );
    toast("Đổi mật khẩu thành công.");
  } catch (e) {
    toast(e.message);
  }
};
if (addUser) addUser.onclick = () => saveEmployee();
if (employeeSearch)
  employeeSearch.oninput = (e) =>
    renderUsers(
      users
        .filter((u) => u.role !== "CUSTOMER")
        .filter((u) =>
          (u.fullName + u.username + (u.phone || "") + (u.email || ""))
            .toLowerCase()
            .includes(e.target.value.toLowerCase()),
        ),
    );
if (userRows)
  userRows.onclick = async (e) => {
    const id = e.target.dataset.id;
    if (e.target.matches(".view-user")) return showEmployeeDetails(id);
    if (e.target.matches(".edit-user"))
      return saveEmployee(users.find((u) => u.id == id));
    if (e.target.matches(".toggle-user"))
      try {
        await toggleUser(id, e.target.dataset.active === "true");
      } catch (x) {
        toast(x.message);
      }
  };
const reportRangeInput = document.querySelector("#reportRange");
if (reportRangeInput) reportRangeInput.onchange = loadReport;
document.querySelector('.sidebar-bottom a[href="login.html"]').onclick = () => {
  sessionStorage.removeItem("pharmacyUser");
};
const permissionKeys = ['medicines','inventory','orders','reports','users'];
let savedPermissions = {EMPLOYEE:{medicines:true,inventory:true,orders:true,reports:false,users:false},MANAGER:{medicines:true,inventory:true,orders:true,reports:true,users:true}};
function canAccess(name) {
  if (name === 'permissions') return isManager();
  return !permissionKeys.includes(name) || savedPermissions[me()?.role]?.[name] === true;
}
function applyPermissions() {
  document.querySelectorAll('#sideNav button').forEach(button => {
    if (permissionKeys.includes(button.dataset.view)) button.style.display = canAccess(button.dataset.view) ? '' : 'none';
  });
  document.querySelector('#reports').style.display = canAccess('reports') ? '' : 'none';
  const panel = document.querySelector('#staffAccountsPanel');
  if (panel) panel.style.display = canAccess('users') ? '' : 'none';
  const current = document.querySelector('.view.active');
  if (current && !canAccess(current.id)) view('overview');
}
function renderPermissions() {
  document.querySelectorAll('#permissions .permission-row').forEach((row,index) => {
    row.querySelectorAll('input').forEach((input,column) => {
      const role = column === 0 ? 'EMPLOYEE' : 'MANAGER';
      input.disabled = false;
      input.checked = savedPermissions[role][permissionKeys[index]];
      input.dataset.role = role;
      input.dataset.permission = permissionKeys[index];
      input.parentElement.lastChild.textContent = ' Cho phép truy cập';
    });
  });
}
async function loadPermissions() {
  try {
    savedPermissions = await api('/permissions');
    renderPermissions(); applyPermissions();
    document.querySelector('#permissionsHint').textContent = '';
  } catch (e) {
    document.querySelector('#permissionsHint').textContent = e.message;
    applyPermissions();
  }
}
document.querySelector('#savePermissions').onclick = async event => {
  const button = event.currentTarget;
  const next = {EMPLOYEE:{},MANAGER:{}};
  document.querySelectorAll('#permissions input[data-permission]').forEach(input => { next[input.dataset.role][input.dataset.permission] = input.checked; });
  button.disabled = true;
  try {
    savedPermissions = await api('/permissions', {method:'PUT',...json(next)});
    applyPermissions();
    document.querySelector('#permissionsHint').textContent = 'Đã lưu phân quyền vào hệ thống.';
    toast('Đã lưu phân quyền.');
  } catch(e) { document.querySelector('#permissionsHint').textContent = e.message; toast(e.message); }
  finally { button.disabled = false; }
};
applyRole();
renderPermissions();
load();
