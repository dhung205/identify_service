const form = document.querySelector('#loginForm');
const register = document.querySelector('#registerForm');
const errorBox = document.querySelector('#loginError');
const api = window.LongChauBackend.apiRoot;
function error(message) { errorBox.textContent = message; errorBox.hidden = false; }
async function request(path, body, token) {
  const response = await fetch(api + path, {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json', ...(token ? {Authorization: 'Bearer ' + token} : {}) },
    ...(body ? {body: JSON.stringify(body)} : {}), signal: AbortSignal.timeout(10000)
  });
  const data = await response.json();
  if (!response.ok || (data.code && data.code !== 1000)) throw Error(data.message || 'Không thể xử lý yêu cầu.');
  return data.result;
}
async function login(username, password) {
  const auth = await request('/auth/token', {username, password});
  const user = await request('/users/myInfo', null, auth.token);
  sessionStorage.setItem('pharmacyUser', JSON.stringify({ ...user, token: auth.token,
    fullName: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username,
    role: 'CUSTOMER'
  }));
  location.href = '../index.html';
}
async function submit(event, action) {
  event.preventDefault(); errorBox.hidden = true;
  const button = event.target.querySelector('button[type="submit"]');
  button.disabled = true;
  try { await action(); } catch (e) { error(e.name === 'TimeoutError' ? 'Máy chủ phản hồi chậm. Vui lòng thử lại.' : e.message === 'Failed to fetch' ? 'Không thể kết nối backend. Hãy chạy ứng dụng và mở trang qua http://localhost:8080/identify/.' : e.message); }
  finally { button.disabled = false; }
}
form.addEventListener('submit', event => submit(event, () => login(document.querySelector('#loginPhone').value.trim(), document.querySelector('#password').value)));
register.addEventListener('submit', event => submit(event, async () => {
  const value = id => document.querySelector(id).value;
  const username = value('#registerPhone').trim(), password = value('#registerPassword');
  if (password !== value('#registerConfirm')) throw Error('Mật khẩu nhập lại chưa khớp.');
  const names = value('#registerFullName').trim().split(/\s+/);
  await request('/users', {username, password, firstName: names.slice(0, -1).join(' '), lastName: names.at(-1)});
  await login(username, password);
}));
function mode() {
  const creating = location.hash === '#register';
  form.hidden = creating; register.hidden = !creating;
  document.querySelector('#loginPrompt').hidden = !creating;
  document.querySelector('#registerPrompt').hidden = creating;
  document.querySelector('#authTitle').textContent = creating ? 'Tạo tài khoản của bạn' : 'Chào mừng bạn trở lại';
  document.querySelector('#authDescription').textContent = creating ? 'Đồng hành cùng bạn chăm sóc sức khỏe mỗi ngày.' : 'Đăng nhập để tiếp tục với tài khoản của bạn.';
  errorBox.hidden = true;
}
addEventListener('hashchange', mode); mode();
