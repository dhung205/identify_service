// Shared cart storage for home, product, account, cart and checkout pages.
window.PharmacyCart = (() => {
  let user=null;
  try { user=JSON.parse(sessionStorage.getItem('pharmacyUser')); } catch {}
  // Mỗi tài khoản đăng nhập (khách hàng, nhân viên, quản lý) có giỏ hàng riêng trên máy chủ.
  const remote=Boolean(user?.id);
  const key=remote?`pharmacyCart:customer:${user.id}`:'pharmacyCart:guest';
  const api=(window.LongChauBackend?.apiRoot || `http://${window.location.hostname || 'localhost'}:8080/api`) + '/cart';
  let state={version:0,items:[]},queue=Promise.resolve(),failure=null,lastRequested='';
  const clone=x=>JSON.parse(JSON.stringify(x));
  const rows=items=>items.map(i=>({medicineId:Number(i.id),quantity:Number(i.quantity),selected:i.selected!==false}));
  const signature=items=>JSON.stringify(rows(items).sort((a,b)=>a.medicineId-b.medicineId));
  function local(){try{const x=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(x)?x:[];}catch{return [];}}
  async function request(path='',method='GET',body){
    await window.LongChauBackend?.ensure?.();
    const r=await fetch(api+path,{method,headers:{'Content-Type':'application/json',Authorization:'Bearer '+(user?.token||'')},
      ...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(15000)});
    const result=await r.json();
    if(r.status===401){
      // Backend vừa khởi động lại hoặc phiên đã hết hạn: bỏ thông tin cũ để tránh
      // tình trạng header còn tên tài khoản nhưng giỏ hàng báo chưa đăng nhập.
      sessionStorage.removeItem('pharmacyUser');
      if(location.pathname.includes('/frontend/')) location.href='staff/login.html?expired=1';
      throw Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }
    if(!r.ok||!result.success)throw Error(result.message||'Không lưu được giỏ hàng. Vui lòng tải lại trang.');
    return result.data;
  }
  function accept(value){state=value;lastRequested=signature(state.items);}
  const ready=(async()=>{
    if(!remote){accept({version:0,items:local()});return;}
    if(!user.token)throw Error('Vui lòng đăng nhập lại để dùng giỏ hàng lưu trên máy chủ.');
    let value=await request();
    if(!value.legacyImported){
      const legacy=local();
      value=await request('/import','POST',{version:value.version,items:rows(legacy)});
      // Remove the legacy copy only once the server confirms that it is saved.
      localStorage.removeItem(key);
    }
    accept(value);
  })();
  function save(items){
    const snapshot=clone(items),sig=signature(snapshot);
    if(sig===signature(state.items)&&failure)return Promise.resolve();
    if(sig===lastRequested)return queue;
    lastRequested=sig;
    const job=queue.then(async()=>{
      if(failure)throw failure;
      if(!remote){localStorage.setItem(key,JSON.stringify(snapshot));state={version:state.version+1,items:snapshot};return;}
      state=await request('','PUT',{version:state.version,items:rows(snapshot)});
    });
    queue=job.catch(e=>{failure=e;throw e;});
    // Consumers receive the rejection; keep it from becoming an unhandled event.
    queue.catch(()=>{});
    return queue;
  }
  async function flush(){await ready;await queue;if(failure)throw failure;}
  async function refresh(){await flush();if(remote)accept(await request());}
  function checkoutDone(){accept({...state,version:state.version+1,items:state.items.filter(i=>!i.selected)});}
  // Ensure page navigation cannot discard an outstanding write.
  document.addEventListener('click',e=>{
    const link=e.target.closest('a[href]');
    if(!link||link.target==='_blank'||e.ctrlKey||e.metaKey||link.getAttribute('href').startsWith('#'))return;
    if(lastRequested===signature(state.items)&&!failure)return;
    e.preventDefault();flush().then(()=>{location.href=link.href;}).catch(error=>alert(error.message));
  },true);
  window.addEventListener('beforeunload',e=>{
    if(lastRequested!==signature(state.items)&&!failure){e.preventDefault();e.returnValue='';}
  });
  // Không để giỏ tạm của trình duyệt xuất hiện như giỏ của tài khoản sau khi đăng xuất.
  // Dữ liệu khách vẫn được giữ để có thể dùng trong phiên khách, nhưng badge chỉ hiển thị
  // khi người dùng đã đăng nhập.
  const quantity=()=>remote?state.items.reduce((sum,item)=>sum+(Number(item.quantity)||0),0):0;
  return {ready,save,flush,refresh,checkoutDone,read:()=>clone(state.items),quantity,get version(){return state.version;}};
})();
