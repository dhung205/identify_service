/* Shared QR payment demo for customer checkout and point of sale. */
window.openDemoPayment = function(orderId, onComplete) {
  const api = `${window.LongChauBackend?.apiRoot || `http://${location.hostname || 'localhost'}:8080/api`}/orders/${encodeURIComponent(orderId)}/demo-payment`;
  const dialog = document.createElement('dialog');
  dialog.className = 'demo-pay-dialog';
  dialog.innerHTML = `<button type="button" class="demo-pay-close" aria-label="Đóng">×</button><span class="demo-pay-badge">Thanh toán mô phỏng</span><h2>Quét mã QR thanh toán</h2><p class="demo-pay-merchant">NHA THUOC LONG CHAU TRIEU KHUC</p><div class="demo-pay-content">Đang tạo mã QR…</div><div class="demo-pay-processing" role="status" hidden><span class="demo-pay-spinner" aria-hidden="true"></span><b>Đang xử lý thanh toán</b><p>Vui lòng chờ trong giây lát…</p></div><p class="demo-pay-message" role="status"></p><button type="button" class="demo-pay-confirm" disabled>Thanh toán</button><p class="demo-pay-help">Bạn có thể đóng và mở lại QR trong chi tiết đơn hàng.</p>`;
  document.body.append(dialog); dialog.showModal();
  const confirm=dialog.querySelector('.demo-pay-confirm'), message=dialog.querySelector('.demo-pay-message');
  const area=dialog.querySelector('.demo-pay-content'), processing=dialog.querySelector('.demo-pay-processing');
  const closeButton=dialog.querySelector('.demo-pay-close'), help=dialog.querySelector('.demo-pay-help');
  let payment, busy=false;
  const close=()=>{if(busy)return;dialog.close();dialog.remove()};
  closeButton.onclick=close;
  dialog.addEventListener('cancel',event=>{if(busy)event.preventDefault();else dialog.remove()});
  function showSuccess(order) {
    if(!dialog.isConnected)return;
    busy=false;closeButton.disabled=false;processing.hidden=true;area.hidden=false;
    dialog.classList.add('demo-pay-success');
    dialog.querySelector('h2').textContent='Giao dịch thành công';
    dialog.querySelector('.demo-pay-merchant').hidden=true;
    area.innerHTML=`<div class="demo-pay-check" aria-hidden="true"><svg viewBox="0 0 80 80"><circle class="success-ring" cx="40" cy="40" r="35"/><path class="success-tick" d="M23 40l12 12 23-25"/></svg></div><p class="demo-pay-thanks">Cảm ơn bạn đã mua hàng tại<br><b>NHA THUOC LONG CHAU TRIEU KHUC</b></p><div class="demo-pay-receipt"><div><span>Mã đơn hàng</span><b class="paid-order-id"></b></div><div><span>Đã thanh toán</span><strong class="paid-amount"></strong></div></div>`;
    area.querySelector('.paid-order-id').textContent='#'+order.id;
    area.querySelector('.paid-amount').textContent=new Intl.NumberFormat('vi-VN').format(order.total)+'đ';
    message.textContent='Thanh toán thành công. Đơn hàng của bạn đang được xử lý.';
    confirm.hidden=false;confirm.disabled=false;confirm.textContent='Xem đơn hàng';
    confirm.onclick=()=>{close();if(location.pathname.includes('/staff/'))document.querySelector('#sideNav [data-view="orders"]')?.click();else location.href='account.html#orders';};
    help.textContent='Bạn có thể xem lại thông tin trong lịch sử đơn hàng.';
    dialog.scrollTop=0;confirm.focus({preventScroll:true});
  }
  (window.LongChauBackend?.ensure?.() || Promise.resolve()).then(()=>fetch(api)).then(async response=>{const result=await response.json();if(!response.ok||!result.success)throw Error(result.message||'Không tải được QR');return result.data}).then(data=>{
    if(!dialog.isConnected)return;
    payment=data;
    if(data.paid){showSuccess({id:data.orderId,total:data.amount,status:data.status});return;}
    area.textContent='';
    const img=document.createElement('img'); img.src=data.qr;img.alt='QR mô phỏng đơn #'+data.orderId;area.append(img);
    const amount=document.createElement('strong');amount.textContent=new Intl.NumberFormat('vi-VN').format(data.amount)+'đ';area.append(amount);
    const ref=document.createElement('p');ref.textContent='Nội dung: '+data.reference;area.append(ref);
    confirm.disabled=false;
  }).catch(error=>{message.textContent=error.message});
  confirm.onclick=async()=>{
    if(!payment||confirm.disabled||busy)return;
    busy=true;confirm.disabled=true;closeButton.disabled=true;confirm.hidden=true;area.hidden=true;processing.hidden=false;
    message.textContent='';help.textContent='Đang xác nhận giao dịch của bạn.';dialog.scrollTop=0;
    let result;
    try {
      const [data]=await Promise.all([
        (window.LongChauBackend?.ensure?.() || Promise.resolve()).then(()=>fetch(api,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:payment.token})})).then(async response=>{const body=await response.json();if(!response.ok||!body.success)throw Error(body.message||'Không thể xác nhận');return body;}),
        new Promise(resolve=>setTimeout(resolve,700))
      ]);
      result=data;
    }catch(error){busy=false;closeButton.disabled=false;processing.hidden=true;area.hidden=false;confirm.hidden=false;confirm.disabled=false;message.textContent=error.message;help.textContent='Vui lòng kiểm tra và thử lại.';return;}
    showSuccess(result.data);
    if(onComplete){try{await onComplete(result.data)}catch{message.textContent='Giao dịch thành công. Hãy mở lại danh sách đơn để cập nhật thông tin.';}}
  };
};
