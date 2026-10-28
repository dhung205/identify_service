(async () => {
await PharmacyCart.ready;
await (window.LongChauBackend?.ensure?.() || Promise.resolve()).catch(() => {});
/* Product details read the existing medicine endpoint and use the existing cart keys. */
const detailApi = window.LongChauBackend?.apiRoot || `http://${location.hostname || 'localhost'}:8080/api`;
const el = (id) => document.getElementById(id);
const fmt = (value) => new Intl.NumberFormat('vi-VN').format(value || 0) + 'đ';
let detailUser = null;
try { detailUser = JSON.parse(sessionStorage.getItem('pharmacyUser')); } catch {}
const detailCartKey = detailUser?.id ? `pharmacyCart:customer:${detailUser.id}` : 'pharmacyCart:guest';
function readDetailCart() { return PharmacyCart.read(); }
function refreshDetailCartCount() { el('cartCount').textContent = PharmacyCart.quantity(); }
el('cartButton').addEventListener('click', async () => { try { await PharmacyCart.flush(); location.href = 'cart.html'; } catch(e) { alert(e.message); } });
if (detailUser) {
  el('accountLabel').textContent = detailUser.fullName || 'Tài khoản';
  el('accountLink').href = detailUser.role === 'CUSTOMER' ? 'account.html' : 'staff/index.html';
}
refreshDetailCartCount();
window.addEventListener('storage', refreshDetailCartCount);
let currentMedicine = null;
let adding = false;
let sendingConsult = false;
const productId = new URLSearchParams(location.search).get('id');
function availableStock(m) { return m.active === false ? 0 : Math.max(0, Math.floor(Number(m.stock) || 0)); }
function setDetailText(id, value) { el(id).textContent = value; }
function safeProductImage(value) {
  return typeof value === 'string' && (/^https?:\/\//i.test(value) || /^data:image\/(png|jpe?g|webp|gif);base64,/i.test(value)) ? value : '';
}
function currentProductUrl(m = currentMedicine) {
  return new URL(`product.html?id=${encodeURIComponent(m?.id || productId || "")}`, location.href).href;
}
function normalizeQuantity() {
  const stock = currentMedicine ? availableStock(currentMedicine) : 0;
  const entered = Math.floor(Number(el('detailQuantity').value));
  if (entered > stock) setDetailText("detailFeedback", "Số lượng đã chọn vượt quá tồn kho. Vui lòng xem lại.");
  const qty = Math.max(1, Math.min(stock || 1, Number.isFinite(entered) ? entered : 1));
  el('detailQuantity').value = qty;
  el('detailQuantity').max = Math.max(1, stock);
  el('detailQuantity').disabled = !stock || adding;
  el('detailMinus').disabled = !stock || qty <= 1 || adding;
  el('detailPlus').disabled = !stock || qty >= stock || adding;
  el('detailBuy').disabled = !stock || adding;
  return qty;
}
async function fetchMedicine() {
  const response = await fetch(`${detailApi}/medicines/${encodeURIComponent(productId)}`, {signal: AbortSignal.timeout(8000)});
  const result = await response.json();
  if (!response.ok || !result.success || !result.data) throw new Error(response.status === 404 ? 'Sản phẩm này không còn tồn tại.' : 'Không tải được thông tin sản phẩm. Vui lòng thử lại.');
  return result.data;
}
function renderDetail(m) {
  currentMedicine = m;
  document.title = `${m.name} | Nhà thuốc Long Châu`;
  setDetailText('detailCrumb', m.type || 'Chi tiết sản phẩm');
  setDetailText('detailName', m.name);
  setDetailText('detailBrand', m.brand ? `Thương hiệu: ${m.brand}` : m.type || 'Sản phẩm nhà thuốc');
  setDetailText('detailCode', `Mã sản phẩm: ${m.id}`);
  setDetailText('detailPrice', fmt(m.price));
  setDetailText('detailPriceUnit', ` / ${m.unit || 'Sản phẩm'}`);
  setDetailText('detailUnit', m.unit || 'Sản phẩm');
  el('detailStock').hidden = true;
  setDetailText('detailBuy', availableStock(m) ? 'Chọn mua' : 'Không thể đặt mua');
  setDetailText('detailDescription', m.description || 'Nhà thuốc chưa cập nhật mô tả sản phẩm.');
  setDetailText('detailIngredient', m.ingredient || 'Nhà thuốc chưa cập nhật thành phần.');
  setDetailText('detailDosage', m.dosage || 'Nhà thuốc chưa cập nhật cách dùng.');
  const facts = [['Nhóm sản phẩm', m.type], ['Thương hiệu', m.brand], ['Nhà cung cấp', m.supplier], ['Hạn sử dụng', m.expiryDate]];
  el('detailFacts').replaceChildren();
  facts.forEach(([label, value]) => {
    if (!value) return;
    const dt = document.createElement('dt'), dd = document.createElement('dd');
    dt.textContent = label; dd.textContent = value;
    el('detailFacts').append(dt, dd);
  });
  const image = el('detailImage'), src = safeProductImage(m.image);
  image.hidden = !src; el('detailNoImage').hidden = !!src; image.alt = m.name;
  image.onerror = () => { image.hidden = true; el('detailNoImage').hidden = false; };
  if (src) image.src = src; else image.removeAttribute('src');
  normalizeQuantity();
}
async function loadDetail() {
  el('detailLoading').hidden = false; el('detailError').hidden = true; el('detailProduct').hidden = true;
  try {
    if (!productId || !/^\d+$/.test(productId)) throw new Error('Đường dẫn sản phẩm không hợp lệ. Hãy chọn sản phẩm từ danh sách.');
    renderDetail(await fetchMedicine());
    el('detailProduct').hidden = false;
  } catch(error) {
    setDetailText('detailErrorText', error.name === 'TimeoutError' || error instanceof TypeError ? 'Không kết nối được máy chủ. Vui lòng kiểm tra backend và thử lại.' : error.message);
    el('detailError').hidden = false;
  } finally { el('detailLoading').hidden = true; }
}
el('detailRetry').addEventListener('click', loadDetail);
el('detailQuantity').addEventListener('change', normalizeQuantity);
el('detailMinus').addEventListener('click', () => { el('detailQuantity').value = normalizeQuantity() - 1; normalizeQuantity(); });
el('detailPlus').addEventListener('click', () => { el('detailQuantity').value = normalizeQuantity() + 1; normalizeQuantity(); });
el('detailBuy').addEventListener('click', async () => {
  if (adding || !currentMedicine || !availableStock(currentMedicine)) return;
  const quantity = normalizeQuantity();
  adding = true; normalizeQuantity(); setDetailText('detailFeedback', 'Đang kiểm tra số lượng…');
  try {
    const fresh = await fetchMedicine();
    renderDetail(fresh);
    const rows = readDetailCart(), existing = rows.find(item => String(item.id) === String(fresh.id));
    const already = Math.max(0, Number(existing?.quantity) || 0);
    if (quantity + already > availableStock(fresh)) throw new Error("Số lượng đã chọn vượt quá tồn kho. Vui lòng điều chỉnh số lượng.");
    if (existing) Object.assign(existing, fresh, {quantity: already + quantity, selected:true});
    else rows.push({...fresh, quantity});
    await PharmacyCart.save(rows);
    refreshDetailCartCount();
    setDetailText('detailFeedback', `Đã thêm ${quantity} ${fresh.unit || 'sản phẩm'} vào giỏ hàng.`);
  } catch(error) {
    setDetailText('detailFeedback', error instanceof TypeError || error.name === 'TimeoutError' ? 'Chưa thể thêm vào giỏ. Vui lòng kiểm tra kết nối và thử lại.' : error.message);
  } finally { adding = false; normalizeQuantity(); }
});
el('detailConsult').addEventListener('click', () => {
  if (!currentMedicine) return;
  if (!detailUser || detailUser.role !== 'CUSTOMER') {
    setDetailText('detailFeedback', 'Bạn cần đăng nhập bằng tài khoản khách hàng để gửi tư vấn về sản phẩm.');
    setTimeout(() => { location.href = 'staff/login.html'; }, 900);
    return;
  }
  const form = el('detailConsultForm');
  form.hidden = !form.hidden;
  if (!form.hidden) {
    const question = el('detailConsultQuestion');
    if (!question.value.trim()) question.value = `Tôi cần tư vấn về sản phẩm ${currentMedicine.name}.`;
    question.focus();
  }
});
el('detailConsultForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (sendingConsult || !currentMedicine) return;
  if (!detailUser || detailUser.role !== 'CUSTOMER') {
    setDetailText('detailFeedback', 'Bạn cần đăng nhập bằng tài khoản khách hàng để gửi tư vấn.');
    return;
  }
  const input = el('detailConsultQuestion');
  const text = input.value.trim();
  if (!text) {
    setDetailText('detailFeedback', 'Vui lòng nhập câu hỏi cần tư vấn.');
    return;
  }
  const question = [
    `Tư vấn sản phẩm: ${currentMedicine.name}`,
    `Link sản phẩm: ${currentProductUrl()}`,
    `Câu hỏi: ${text}`,
  ].join('\n');
  sendingConsult = true;
  el('detailConsultForm').querySelector('button[type="submit"]').disabled = true;
  setDetailText('detailFeedback', 'Đang gửi câu hỏi tư vấn…');
  try {
    const response = await fetch(`${detailApi}/consultations?customerId=${encodeURIComponent(detailUser.id)}`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({question}),
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'Không thể gửi tư vấn.');
    input.value = '';
    el('detailConsultForm').hidden = true;
    setDetailText('detailFeedback', 'Đã gửi câu hỏi tư vấn. Dược sĩ sẽ phản hồi trong mục Tin nhắn tư vấn.');
  } catch (error) {
    setDetailText('detailFeedback', error.message || 'Không thể gửi tư vấn. Vui lòng thử lại.');
  } finally {
    sendingConsult = false;
    el('detailConsultForm').querySelector('button[type="submit"]').disabled = false;
  }
});
loadDetail();

})().catch(error => alert(error.message || "Không tải được giỏ hàng. Vui lòng tải lại trang."));
