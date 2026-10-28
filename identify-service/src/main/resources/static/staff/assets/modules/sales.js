function warnSaleStock(item, stock) {
  staffCore.toast(`Vui lòng xem lại số lượng: ${item.name} chỉ còn ${stock} ${item.unit || "sản phẩm"} trong kho.`);
}
// Màn hình Bán hàng tại quầy: chọn thuốc, giỏ hóa đơn và thanh toán.
saleMedicineGrid.onclick = (e) => {
  const card = e.target.closest(".sale-product");
  if (!card) return;
  const medicine = medicines.find((item) => item.id == card.dataset.id);
  if (!medicine) return;
  if (medicine.stock < 1) return warnSaleStock(medicine, 0);
  currentSaleOrder = null;
  const item = cart.find((entry) => entry.id === medicine.id);
  if (item && item.quantity >= medicine.stock) return warnSaleStock(medicine, medicine.stock);
  item ? item.quantity++ : cart.push({ ...medicine, quantity: 1 });
  renderSale();
};

saleCart.onclick = (e) => {
  const row = e.target.closest(".cart-line");
  if (!row) return;
  const item = cart.find((entry) => entry.id == row.dataset.id);
  if (!item) return;
  if (e.target.dataset.action === "decrease") item.quantity--;
  if (e.target.dataset.action === "increase") {
    const stock = Number(medicines.find(m => m.id === item.id)?.stock ?? item.stock);
    if (item.quantity >= stock) return warnSaleStock(item, stock);
    item.quantity++;
  }
  if (e.target.dataset.action === "remove" || item.quantity < 1) cart = cart.filter((entry) => entry.id !== item.id);
  currentSaleOrder = null;
  renderSale();
};

saleSearch.oninput = renderSale;
const prescriptionSearch = document.getElementById("prescriptionSearch");
const prescriptionMedicineList = document.getElementById("prescriptionMedicineList");
const prescriptionFile = document.getElementById("prescriptionFile");
const prescriptionDropzone = document.getElementById("prescriptionDropzone");
const prescriptionPreview = document.getElementById("prescriptionPreview");
const prescriptionEmpty = document.getElementById("prescriptionEmpty");
const prescriptionImage = document.getElementById("prescriptionImage");
let prescriptionObjectUrl = null;
let prescriptionDataUrl = null;
let selectedSaleType = "RETAIL";

function renderPrescriptionMedicines() {
  const terms = (prescriptionSearch.value || "").trim().toLocaleLowerCase("vi");
  prescriptionMedicineList.innerHTML = activeMedicines()
    .filter(m => (m.name + " " + m.type + " " + (m.brand || "")).toLocaleLowerCase("vi").includes(terms))
    .map(m => {
      const imageValid = typeof m.image === "string" && (/^https?:\/\//i.test(m.image) || /^data:image\/(png|jpe?g|webp|gif);base64,/i.test(m.image));
      return `<article class="prescription-medicine" data-id="${m.id}"><div class="prescription-medicine-photo">${imageValid ? `<img data-prescription-photo src="${escapeHtml(m.image)}" alt="Ảnh ${escapeHtml(m.name)}" loading="lazy">` : '<span aria-label="Chưa có ảnh">▧</span>'}</div><div class="prescription-medicine-info"><b>${escapeHtml(m.name)}</b><span>${m.stock} còn lại</span></div><strong>${money(m.price)}</strong><button type="button" class="prescription-add" aria-label="Thêm ${escapeHtml(m.name)} vào hóa đơn" ${m.stock < 1 ? "disabled" : ""}>＋</button></article>`;
    })
    .join("") || '<p class="prescription-no-results">Không tìm thấy thuốc phù hợp.</p>';
}
prescriptionMedicineList.addEventListener("error", event => {
  if (event.target.matches?.("img[data-prescription-photo]")) event.target.parentElement.innerHTML = '<span aria-label="Chưa có ảnh">▧</span>';
}, true);

document.getElementById("saleTabRetail").addEventListener("click", () => setSaleTab("retail"));
document.getElementById("saleTabPrescription").addEventListener("click", () => setSaleTab("prescription"));
function setSaleTab(tab) {
  const retail = tab === "retail";
  selectedSaleType = retail ? "RETAIL" : "PRESCRIPTION";
  document.getElementById("saleTabRetail").classList.toggle("selected", retail);
  document.getElementById("saleTabPrescription").classList.toggle("selected", !retail);
  document.getElementById("saleTabRetail").setAttribute("aria-selected", String(retail));
  document.getElementById("saleTabPrescription").setAttribute("aria-selected", String(!retail));
  document.getElementById("saleRetailPanel").hidden = !retail;
  document.getElementById("salePrescriptionPanel").hidden = retail;
  if (!retail) renderPrescriptionMedicines();
}
prescriptionSearch.addEventListener("input", renderPrescriptionMedicines);
prescriptionMedicineList.addEventListener("click", event => {
  const row = event.target.closest(".prescription-medicine");
  if (!row) return;
  const medicine = medicines.find(item => item.id == row.dataset.id);
  if (!medicine) return;
  if (medicine.stock < 1) return warnSaleStock(medicine, 0);
  currentSaleOrder = null;
  const item = cart.find(entry => entry.id === medicine.id);
  if (item && item.quantity >= medicine.stock) return warnSaleStock(medicine, medicine.stock);
  item ? item.quantity++ : cart.push({ ...medicine, quantity: 1 });
  renderSale();
});

function showPrescription(file) {
  if (!file || !file.type.startsWith("image/")) return;
  if (prescriptionObjectUrl) URL.revokeObjectURL(prescriptionObjectUrl);
  prescriptionObjectUrl = URL.createObjectURL(file);
  prescriptionDataUrl = null;
  prescriptionImage.src = prescriptionObjectUrl;
  prescriptionEmpty.hidden = true;
  prescriptionPreview.hidden = false;
  createImageBitmap(file).then(bitmap => {
    const scale = Math.min(1, 1800 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    prescriptionDataUrl = canvas.toDataURL("image/jpeg", 0.82);
  }).catch(() => staffCore.toast("Không đọc được ảnh đơn thuốc. Vui lòng chọn ảnh JPG, PNG hoặc WEBP khác."));
}
prescriptionDropzone.addEventListener("click", event => {
  if (!event.target.closest("button")) prescriptionFile.click();
});
prescriptionDropzone.addEventListener("keydown", event => {
  if (event.key === "Enter" || event.key === " ") { event.preventDefault(); prescriptionFile.click(); }
});
prescriptionFile.addEventListener("change", () => showPrescription(prescriptionFile.files[0]));
document.getElementById("prescriptionReplace").addEventListener("click", event => { event.stopPropagation(); prescriptionFile.click(); });
for (const name of ["dragenter", "dragover"]) prescriptionDropzone.addEventListener(name, event => { event.preventDefault(); prescriptionDropzone.classList.add("is-dragging"); });
for (const name of ["dragleave", "drop"]) prescriptionDropzone.addEventListener(name, event => { event.preventDefault(); prescriptionDropzone.classList.remove("is-dragging"); });
prescriptionDropzone.addEventListener("drop", event => showPrescription(event.dataTransfer.files[0]));
const prescriptionZoomDialog = document.getElementById("prescriptionZoomDialog");
document.getElementById("prescriptionZoom").addEventListener("click", event => {
  event.stopPropagation();
  document.getElementById("prescriptionZoomImage").src = prescriptionImage.src;
  prescriptionZoomDialog.hidden = false;
});
document.getElementById("prescriptionZoomClose").addEventListener("click", () => { prescriptionZoomDialog.hidden = true; });
prescriptionZoomDialog.addEventListener("click", event => { if (event.target === prescriptionZoomDialog) prescriptionZoomDialog.hidden = true; });
saleCustomer.onchange = toggleNewCustomerFields;
checkoutSale.onclick = async () => {
  if (!cart.length) return staffCore.toast("Chưa chọn thuốc.");
  if (!saleCustomer.value) return staffCore.toast("Chưa chọn khách hàng.");
  if (selectedSaleType === "PRESCRIPTION" && !prescriptionDataUrl) return staffCore.toast("Vui lòng tải ảnh đơn thuốc và chờ ảnh sẵn sàng trước khi thanh toán.");
  checkoutSale.disabled = true;
  try {
    const freshProducts = await Promise.all(cart.map(item => staffCore.api("/medicines/" + item.id)));
    for (let index = 0; index < cart.length; index++) {
      const item = cart[index], fresh = freshProducts[index];
      if (!fresh || fresh.active === false || item.quantity > Number(fresh.stock)) {
        warnSaleStock(item, fresh?.active === false ? 0 : Number(fresh?.stock || 0));
        return;
      }
    }
    const customer = saleCustomer.value === "NEW" ? await createWalkInCustomer() : null;
    const customerId = customer?.id || saleCustomer.value;
    const order = await staffCore.api("/orders?customerId=" + customerId, {
      method: "POST",
      ...staffCore.json({
        status: "PENDING", paymentMethod: salePaymentMethod.value,
        prescriptionImage: selectedSaleType === "PRESCRIPTION" ? prescriptionDataUrl : null,
        employee: { id: staffCore.me().id },
        note: saleNote.value.trim(),
        details: cart.map((item) => ({ medicine: { id: item.id }, quantity: item.quantity })),
      }),
    });
    currentSaleOrder = order.paymentMethod === "TRANSFER" ? order : await staffCore.api("/orders/" + order.id + "/status?value=COMPLETED", { method: "PUT" });
    if (prescriptionObjectUrl) URL.revokeObjectURL(prescriptionObjectUrl);
    prescriptionObjectUrl = null;
    prescriptionDataUrl = null;
    prescriptionFile.value = "";
    prescriptionImage.removeAttribute("src");
    prescriptionPreview.hidden = true;
    prescriptionEmpty.hidden = false;
    cart = [];
    saleNote.value = "";
    newCustomerName.value = "";
    newCustomerPhone.value = "";
    saleCustomer.value = "";
    staffCore.toast(order.paymentMethod === "TRANSFER" ? "Đã tạo đơn chờ thanh toán QR." : "Thanh toán thành công.");
    await load();
    currentSaleOrder = await staffCore.api("/orders/" + order.id);
    renderSale();
    if (order.paymentMethod === "TRANSFER") openDemoPayment(order.id, async updated => { await load(); currentSaleOrder = updated; renderSale(); });
  } catch (error) {
    staffCore.toast(error.message);
  } finally {
    checkoutSale.disabled = false;
  }
};
printInvoice.onclick = () => currentSaleOrder && printReceipt(currentSaleOrder);
