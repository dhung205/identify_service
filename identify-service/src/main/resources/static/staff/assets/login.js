// Lấy các thẻ HTML cần dùng một lần để mã ngắn gọn hơn ở bên dưới.
const loginForm = document.querySelector("#loginForm");
const phoneInput = document.querySelector("#loginPhone");
const passwordInput = document.querySelector("#password");
const errorBox = document.querySelector("#loginError");
const loginButton = document.querySelector("#loginButton");
const API_ROOT = window.LongChauBackend?.apiRoot || `${location.origin}/identify/api`;
const LOGIN_API = `${API_ROOT}/auth/token`;

loginForm.addEventListener("submit", async function (event) {
  event.preventDefault(); // Không cho trình duyệt tải lại trang.
  hideError();
  setLoading(loginButton, true, "Đang xác thực...");

  const loginData = {
    phone: phoneInput.value.trim(),
    password: passwordInput.value,
  };

  try {
    setLoading(loginButton, true, "Đang mở máy chủ...");
    await window.LongChauBackend?.ensure?.();
    setLoading(loginButton, true, "Đang xác thực...");
    const result = await send(LOGIN_API, { username: loginData.phone, password: loginData.password });
    const token = result.result?.token;
    if (!token) throw new Error("Máy chủ không trả về mã đăng nhập.");
    const response = await fetch(`${API_ROOT}/users/myInfo`, { headers: { Authorization: `Bearer ${token}` } });
    const info = await response.json();
    if (!response.ok || !info.result) throw new Error(info.message || "Không thể lấy thông tin tài khoản.");
    const roles = (info.result.roles || []).map(role => String(role.name || "").toUpperCase());
    const role = roles.includes("ADMIN") ? "ADMIN" : roles.includes("STAFF") || roles.includes("EMPLOYEE") || roles.includes("MANAGER") ? "STAFF" : "CUSTOMER";
    const identity = { id: info.result.id, username: info.result.username, fullName: [info.result.firstName, info.result.lastName].filter(Boolean).join(" "), role, token };
    sessionStorage.setItem("pharmacyUser", JSON.stringify(identity));
    goToCorrectPage(identity.role);
  } catch (error) {
    showError(error.message);
  } finally {
    setLoading(loginButton, false, "Đăng nhập →");
  }
});

async function send(url, data) {
  // Không để giao diện bị kẹt khi máy chủ không phản hồi. Mọi lần đăng nhập có giới hạn 8 giây.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      signal: controller.signal,
    });
    const result = await response.json();
    if (!response.ok || !result.success || !result.data) {
      throw new Error(result.message || "Không thể xử lý yêu cầu.");
    }
    return result;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Máy chủ chưa phản hồi sau 8 giây. Hãy kiểm tra backend.");
    }
    if (error instanceof TypeError) {
      throw new Error("Không thể kết nối máy chủ xác thực. Backend đang được tự khởi động, hãy thử lại sau vài giây.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function goToCorrectPage(role) {
  location.href = "../home.html";
}

function setLoading(button, isLoading, text) {
  button.disabled = isLoading;
  button.textContent = text;
}

function showError(message) {
  errorBox.textContent =
    message === "Failed to fetch"
      ? "Không thể kết nối máy chủ xác thực. Backend đang được tự khởi động, hãy thử lại sau vài giây."
      : message;
  errorBox.hidden = false;
}

function hideError() {
  errorBox.hidden = true;
}

// Public registration uses the existing customer-only endpoint.
const registerForm = document.querySelector('#registerForm');
const registerButton = document.querySelector('#registerButton');
const loginPrompt = document.querySelector('#loginPrompt');
const registerPrompt = document.querySelector('#registerPrompt');
function selectAuthMode() {
  const registering = location.hash === '#register';
  loginForm.hidden = registering;
  registerForm.hidden = !registering;
  loginPrompt.hidden = !registering;
  registerPrompt.hidden = registering;
  document.querySelector('#authTitle').textContent = registering ? 'Tạo tài khoản của bạn' : 'Chào mừng bạn trở lại';
  document.querySelector('#authDescription').textContent = registering ? 'Đồng hành cùng bạn chăm sóc sức khỏe mỗi ngày.' : 'Đăng nhập để tiếp tục với tài khoản của bạn.';
  hideError();
}
window.addEventListener('hashchange', selectAuthMode);
selectAuthMode();
registerForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (registerButton.disabled) return;
  hideError();
  const value = (id) => document.querySelector(id).value;
  const data = {
    fullName: value('#registerFullName').trim(),
    phone: value('#registerPhone').trim(),
    email: value('#registerEmail').trim(),
    password: value('#registerPassword'),
  };
  if (!data.fullName) return showError('Vui lòng nhập họ tên.');
  if (!/^[0-9+() .-]{9,20}$/.test(data.phone)) return showError('Vui lòng nhập số điện thoại hợp lệ.');
  if (data.password.trim().length < 6) return showError('Mật khẩu phải có ít nhất 6 ký tự.');
  if (data.password !== value('#registerConfirm')) return showError('Mật khẩu nhập lại chưa khớp.');
  setLoading(registerButton, true, 'Đang tạo tài khoản...');
  try {
    const result = await send(`${API_ROOT}/auth/register`, data);
    sessionStorage.setItem('pharmacyUser', JSON.stringify(result.data));
    registerForm.reset();
    goToCorrectPage(result.data.role);
  } catch (error) {
    showError(error.message);
  } finally {
    setLoading(registerButton, false, 'Tạo tài khoản khách hàng');
  }
});
