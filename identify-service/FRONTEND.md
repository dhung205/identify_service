# Frontend Long Châu

Giao diện được đưa từ project LongChau_NhaThuoc do bạn cung cấp, giữ nguyên CSS, bố cục và các trang khách hàng/nhân viên.

Nguồn đối chiếu: `C:\Users\Dell\Documents\Codex\LongChau_NhaThuoc\LongChau_NhaThuoc\frontend`.
Toàn bộ HTML/CSS được đồng bộ với bản mẫu này, bao gồm đăng nhập/đăng ký. Thanh thông báo kỹ thuật phía trên các trang đã được bỏ để giữ bố cục gốc. JavaScript kết nối đăng nhập và giỏ hàng vẫn giữ phần điều chỉnh cho identify-service.

## Chạy

1. Khởi động MySQL và backend Spring Boot như cấu hình hiện tại.
2. Mở http://localhost:8080/identify/ (không mở HTML bằng file://).
3. Đăng nhập/đăng ký ở http://localhost:8080/identify/staff/login.html.

Frontend nằm trong src/main/resources/static, được Spring Boot phục vụ trực tiếp, không cần npm hoặc XAMPP.

## Phần đã nối backend

- Đăng ký: POST /identify/users.
- Đăng nhập: POST /identify/auth/token.
- Lấy danh tính sau đăng nhập: GET /identify/users/myInfo với Bearer token.
- Tên đăng nhập và mật khẩu theo quy tắc backend hiện tại. Giao diện không tự cấp vai trò quản trị.

## Phạm vi giao diện

Có trang chủ, sản phẩm, giỏ hàng, thanh toán, tài khoản, đăng nhập/đăng ký và quản trị từ mẫu gốc. Trang chủ dùng danh sách sản phẩm mẫu khi chưa có API danh mục. Giỏ hàng lưu trong trình duyệt; chưa đồng bộ máy chủ.

Backend identify-service hiện chưa có API thuốc, đơn hàng, thanh toán, địa chỉ, voucher hoặc tư vấn. Các màn hình đó giữ giao diện mẫu, chưa hoàn tất nghiệp vụ. Trang tài khoản và quản trị vẫn theo hợp đồng API của project Long Châu gốc, cần triển khai/tích hợp tiếp để tải và cập nhật dữ liệu. Không dùng thanh toán mẫu để nhận tiền thật.

Không cần trình khởi động PHP từ project cũ. Cấu hình OAuth Google và các điều kiện khởi động backend đang có vẫn cần được đáp ứng.

## Kiểm tra

Đã kiểm tra cú pháp toàn bộ JavaScript và đường dẫn CSS/JS/HTML cục bộ. Chưa kiểm thử trình duyệt hoặc nghiệp vụ với MySQL đang chạy.
