// Dữ liệu tỉnh/thành phố và quận/huyện của Việt Nam.
// Đây là dữ liệu mẫu phục vụ đồ án, dùng để hiển thị ô chọn "lướt để tìm".
// Có thể thay thế bằng API địa chỉ hành chính thật (ví dụ: provinces.open-api.vn) khi triển khai thực tế.
const VN_ADDRESS_DATA = [
  {
    city: "Hà Nội",
    districts: [
      "Ba Đình", "Hoàn Kiếm", "Hai Bà Trưng", "Đống Đa", "Tây Hồ", "Cầu Giấy",
      "Thanh Xuân", "Hoàng Mai", "Long Biên", "Nam Từ Liêm", "Bắc Từ Liêm", "Hà Đông",
      "Sơn Tây", "Đông Anh", "Gia Lâm", "Thanh Trì", "Sóc Sơn", "Ba Vì", "Chương Mỹ",
      "Đan Phượng", "Hoài Đức", "Mỹ Đức", "Phú Xuyên", "Phúc Thọ", "Quốc Oai",
      "Thạch Thất", "Thanh Oai", "Thường Tín", "Ứng Hòa", "Mê Linh",
    ],
  },
  {
    city: "TP. Hồ Chí Minh",
    districts: [
      "Quận 1", "Quận 3", "Quận 4", "Quận 5", "Quận 6", "Quận 7", "Quận 8",
      "Quận 10", "Quận 11", "Quận 12", "Bình Thạnh", "Bình Tân", "Gò Vấp",
      "Phú Nhuận", "Tân Bình", "Tân Phú", "Thủ Đức", "Bình Chánh", "Củ Chi",
      "Hóc Môn", "Nhà Bè", "Cần Giờ",
    ],
  },
  {
    city: "Đà Nẵng",
    districts: [
      "Hải Châu", "Thanh Khê", "Sơn Trà", "Ngũ Hành Sơn", "Liên Chiểu", "Cẩm Lệ",
      "Hòa Vang", "Hoàng Sa",
    ],
  },
  {
    city: "Hải Phòng",
    districts: [
      "Hồng Bàng", "Ngô Quyền", "Lê Chân", "Hải An", "Kiến An", "Đồ Sơn", "Dương Kinh",
      "Thủy Nguyên", "An Dương", "An Lão", "Kiến Thụy", "Tiên Lãng", "Vĩnh Bảo",
      "Cát Hải", "Bạch Long Vĩ",
    ],
  },
  {
    city: "Cần Thơ",
    districts: [
      "Ninh Kiều", "Bình Thủy", "Cái Răng", "Ô Môn", "Thốt Nốt", "Phong Điền",
      "Cờ Đỏ", "Thới Lai", "Vĩnh Thạnh",
    ],
  },
  {
    city: "Bình Dương",
    districts: [
      "Thủ Dầu Một", "Dĩ An", "Thuận An", "Tân Uyên", "Bến Cát", "Bàu Bàng",
      "Bắc Tân Uyên", "Dầu Tiếng", "Phú Giáo",
    ],
  },
  {
    city: "Đồng Nai",
    districts: [
      "Biên Hòa", "Long Khánh", "Long Thành", "Nhơn Trạch", "Trảng Bom", "Vĩnh Cửu",
      "Thống Nhất", "Cẩm Mỹ", "Xuân Lộc", "Định Quán", "Tân Phú",
    ],
  },
  {
    city: "Khánh Hòa",
    districts: [
      "Nha Trang", "Cam Ranh", "Ninh Hòa", "Diên Khánh", "Cam Lâm", "Vạn Ninh",
      "Khánh Vĩnh", "Khánh Sơn", "Trường Sa",
    ],
  },
  {
    city: "Thừa Thiên Huế",
    districts: [
      "Huế", "Hương Thủy", "Hương Trà", "Phong Điền", "Quảng Điền", "Phú Vang",
      "Phú Lộc", "A Lưới", "Nam Đông",
    ],
  },
  {
    city: "Nghệ An",
    districts: [
      "Vinh", "Cửa Lò", "Thái Hòa", "Diễn Châu", "Quỳnh Lưu", "Yên Thành",
      "Đô Lương", "Nam Đàn", "Hưng Nguyên", "Nghi Lộc", "Nghĩa Đàn", "Anh Sơn",
      "Con Cuông", "Tân Kỳ", "Thanh Chương", "Quỳ Hợp", "Quỳ Châu", "Quế Phong",
      "Tương Dương", "Kỳ Sơn",
    ],
  },
  {
    city: "Thanh Hóa",
    districts: [
      "Thanh Hóa (TP)", "Bỉm Sơn", "Sầm Sơn", "Đông Sơn", "Quảng Xương", "Hoằng Hóa",
      "Hậu Lộc", "Nga Sơn", "Yên Định", "Thọ Xuân", "Thiệu Hóa", "Triệu Sơn",
      "Nông Cống", "Tĩnh Gia", "Vĩnh Lộc", "Cẩm Thủy", "Ngọc Lặc", "Thạch Thành",
      "Như Thanh", "Như Xuân", "Bá Thước", "Lang Chánh", "Thường Xuân", "Quan Hóa",
      "Quan Sơn", "Mường Lát",
    ],
  },
  {
    city: "Hải Dương",
    districts: [
      "Hải Dương (TP)", "Chí Linh", "Nam Sách", "Kinh Môn", "Kim Thành", "Thanh Hà",
      "Cẩm Giàng", "Bình Giang", "Gia Lộc", "Tứ Kỳ", "Ninh Giang", "Thanh Miện",
    ],
  },
  {
    city: "Bắc Ninh",
    districts: [
      "Bắc Ninh (TP)", "Từ Sơn", "Tiên Du", "Yên Phong", "Quế Võ", "Thuận Thành",
      "Gia Bình", "Lương Tài",
    ],
  },
  {
    city: "Quảng Ninh",
    districts: [
      "Hạ Long", "Móng Cái", "Cẩm Phả", "Uông Bí", "Đông Triều", "Quảng Yên",
      "Vân Đồn", "Tiên Yên", "Ba Chẽ", "Bình Liêu", "Đầm Hà", "Hải Hà", "Cô Tô",
    ],
  },
  {
    city: "Lâm Đồng",
    districts: [
      "Đà Lạt", "Bảo Lộc", "Đơn Dương", "Đức Trọng", "Lâm Hà", "Di Linh",
      "Bảo Lâm", "Đạ Huoai", "Đạ Tẻh", "Cát Tiên", "Lạc Dương",
    ],
  },
  {
    city: "Nam Định",
    districts: [
      "Nam Định (TP)", "Vụ Bản", "Ý Yên", "Nghĩa Hưng", "Trực Ninh", "Xuân Trường",
      "Giao Thủy", "Hải Hậu", "Nam Trực", "Mỹ Lộc",
    ],
  },
  {
    city: "Thái Bình",
    districts: [
      "Thái Bình (TP)", "Quỳnh Phụ", "Hưng Hà", "Đông Hưng", "Thái Thụy", "Tiền Hải",
      "Kiến Xương", "Vũ Thư",
    ],
  },
  {
    city: "Vĩnh Phúc",
    districts: [
      "Vĩnh Yên", "Phúc Yên", "Bình Xuyên", "Lập Thạch", "Sông Lô", "Tam Dương",
      "Tam Đảo", "Vĩnh Tường", "Yên Lạc",
    ],
  },
  {
    city: "Hưng Yên",
    districts: [
      "Hưng Yên (TP)", "Mỹ Hào", "Văn Lâm", "Văn Giang", "Yên Mỹ", "Khoái Châu",
      "Ân Thi", "Kim Động", "Tiên Lữ", "Phù Cừ",
    ],
  },
  {
    city: "An Giang",
    districts: ["Long Xuyên", "Châu Đốc", "Châu Phú", "Châu Thành", "Chợ Mới", "Phú Tân", "Tân Châu", "Thoại Sơn", "Tri Tôn", "Tịnh Biên", "An Phú"],
  },
  { city: "Bà Rịa - Vũng Tàu", districts: ["Vũng Tàu", "Bà Rịa", "Phú Mỹ", "Châu Đức", "Xuyên Mộc", "Long Điền", "Đất Đỏ", "Côn Đảo"] },
  { city: "Bạc Liêu", districts: ["Bạc Liêu (TP)", "Giá Rai", "Hòa Bình", "Vĩnh Lợi", "Hồng Dân", "Phước Long", "Đông Hải"] },
  { city: "Bắc Giang", districts: ["Bắc Giang (TP)", "Việt Yên", "Yên Dũng", "Lạng Giang", "Tân Yên", "Hiệp Hòa", "Lục Nam", "Lục Ngạn", "Sơn Động", "Yên Thế"] },
  { city: "Bắc Kạn", districts: ["Bắc Kạn (TP)", "Ba Bể", "Bạch Thông", "Chợ Đồn", "Chợ Mới", "Na Rì", "Ngân Sơn", "Pác Nặm"] },
  { city: "Bến Tre", districts: ["Bến Tre (TP)", "Châu Thành", "Chợ Lách", "Mỏ Cày Nam", "Mỏ Cày Bắc", "Giồng Trôm", "Bình Đại", "Ba Tri", "Thạnh Phú"] },
  { city: "Bình Định", districts: ["Quy Nhơn", "An Nhơn", "Hoài Nhơn", "Tuy Phước", "Phù Cát", "Phù Mỹ", "Vân Canh", "Vĩnh Thạnh", "Tây Sơn", "An Lão", "Hoài Ân"] },
  { city: "Bình Phước", districts: ["Đồng Xoài", "Bình Long", "Phước Long", "Chơn Thành", "Đồng Phú", "Bù Đăng", "Bù Đốp", "Bù Gia Mập", "Hớn Quản", "Lộc Ninh"] },
  { city: "Bình Thuận", districts: ["Phan Thiết", "La Gi", "Tuy Phong", "Bắc Bình", "Hàm Thuận Bắc", "Hàm Thuận Nam", "Tánh Linh", "Đức Linh", "Hàm Tân", "Phú Quý"] },
  { city: "Cà Mau", districts: ["Cà Mau (TP)", "Thới Bình", "U Minh", "Trần Văn Thời", "Cái Nước", "Đầm Dơi", "Năm Căn", "Phú Tân", "Ngọc Hiển"] },
  { city: "Cao Bằng", districts: ["Cao Bằng (TP)", "Bảo Lạc", "Bảo Lâm", "Hà Quảng", "Hạ Lang", "Hòa An", "Nguyên Bình", "Quảng Hòa", "Thạch An", "Trùng Khánh"] },
  { city: "Đắk Lắk", districts: ["Buôn Ma Thuột", "Buôn Hồ", "Ea H'leo", "Ea Súp", "Krông Năng", "Krông Búk", "Cư M'gar", "Krông Pắc", "Krông Bông", "Krông Ana", "Lắk", "M'Đrắk", "Ea Kar", "Cư Kuin"] },
  { city: "Đắk Nông", districts: ["Gia Nghĩa", "Đắk R'lấp", "Đắk Mil", "Cư Jút", "Krông Nô", "Đắk Song", "Đắk Glong", "Tuy Đức"] },
  { city: "Điện Biên", districts: ["Điện Biên Phủ", "Mường Lay", "Điện Biên", "Điện Biên Đông", "Mường Ảng", "Mường Chà", "Mường Nhé", "Nậm Pồ", "Tủa Chùa", "Tuần Giáo"] },
  { city: "Đồng Tháp", districts: ["Cao Lãnh (TP)", "Sa Đéc", "Hồng Ngự", "Cao Lãnh", "Tháp Mười", "Thanh Bình", "Tam Nông", "Tân Hồng", "Châu Thành", "Lấp Vò", "Lai Vung"] },
  { city: "Gia Lai", districts: ["Pleiku", "An Khê", "Ayun Pa", "Chư Păh", "Chư Prông", "Chư Sê", "Đắk Đoa", "Đức Cơ", "Ia Grai", "Kbang", "Krông Pa", "Mang Yang", "Phú Thiện", "Chư Pưh", "Đak Pơ", "Kông Chro", "Ia Pa"] },
  { city: "Hà Giang", districts: ["Hà Giang (TP)", "Đồng Văn", "Mèo Vạc", "Yên Minh", "Quản Bạ", "Vị Xuyên", "Bắc Mê", "Hoàng Su Phì", "Xín Mần", "Bắc Quang", "Quang Bình"] },
  { city: "Hà Nam", districts: ["Phủ Lý", "Duy Tiên", "Kim Bảng", "Thanh Liêm", "Bình Lục", "Lý Nhân"] },
  { city: "Hà Tĩnh", districts: ["Hà Tĩnh (TP)", "Hồng Lĩnh", "Nghi Xuân", "Đức Thọ", "Hương Sơn", "Hương Khê", "Vũ Quang", "Can Lộc", "Thạch Hà", "Cẩm Xuyên", "Kỳ Anh"] },
  { city: "Hậu Giang", districts: ["Vị Thanh", "Ngã Bảy", "Châu Thành", "Châu Thành A", "Phụng Hiệp", "Vị Thủy", "Long Mỹ"] },
  { city: "Hòa Bình", districts: ["Hòa Bình (TP)", "Đà Bắc", "Lương Sơn", "Kim Bôi", "Cao Phong", "Tân Lạc", "Mai Châu", "Lạc Sơn", "Yên Thủy", "Lạc Thủy"] },
  { city: "Kiên Giang", districts: ["Rạch Giá", "Hà Tiên", "Phú Quốc", "Kiên Lương", "Hòn Đất", "Tân Hiệp", "Châu Thành", "Giồng Riềng", "Gò Quao", "An Biên", "An Minh", "Vĩnh Thuận", "U Minh Thượng", "Kiên Hải"] },
  { city: "Kon Tum", districts: ["Kon Tum (TP)", "Đắk Glei", "Ngọc Hồi", "Đắk Tô", "Kon Plông", "Kon Rẫy", "Đắk Hà", "Sa Thầy", "Tu Mơ Rông", "Ia H'Drai"] },
  { city: "Lai Châu", districts: ["Lai Châu (TP)", "Tam Đường", "Mường Tè", "Sìn Hồ", "Phong Thổ", "Than Uyên", "Tân Uyên", "Nậm Nhùn"] },
  { city: "Lạng Sơn", districts: ["Lạng Sơn (TP)", "Tràng Định", "Bình Gia", "Văn Lãng", "Cao Lộc", "Văn Quan", "Bắc Sơn", "Hữu Lũng", "Chi Lăng", "Lộc Bình", "Đình Lập"] },
  { city: "Lào Cai", districts: ["Lào Cai (TP)", "Bát Xát", "Mường Khương", "Si Ma Cai", "Bắc Hà", "Bảo Thắng", "Bảo Yên", "Sa Pa", "Văn Bàn"] },
  { city: "Long An", districts: ["Tân An", "Kiến Tường", "Đức Hòa", "Bến Lức", "Cần Đước", "Cần Giuộc", "Châu Thành", "Tân Trụ", "Thủ Thừa", "Thạnh Hóa", "Đức Huệ", "Vĩnh Hưng", "Mộc Hóa", "Tân Hưng", "Tân Thạnh"] },
  { city: "Ninh Bình", districts: ["Ninh Bình (TP)", "Tam Điệp", "Gia Viễn", "Hoa Lư", "Nho Quan", "Yên Khánh", "Yên Mô", "Kim Sơn"] },
  { city: "Ninh Thuận", districts: ["Phan Rang - Tháp Chàm", "Bác Ái", "Ninh Sơn", "Ninh Hải", "Ninh Phước", "Thuận Bắc", "Thuận Nam"] },
  { city: "Phú Thọ", districts: ["Việt Trì", "Phú Thọ (TX)", "Đoan Hùng", "Hạ Hòa", "Thanh Ba", "Phù Ninh", "Yên Lập", "Cẩm Khê", "Tam Nông", "Lâm Thao", "Thanh Sơn", "Thanh Thủy", "Tân Sơn"] },
  { city: "Phú Yên", districts: ["Tuy Hòa", "Sông Cầu", "Đồng Xuân", "Tuy An", "Sơn Hòa", "Sông Hinh", "Tây Hòa", "Phú Hòa", "Đông Hòa"] },
  { city: "Quảng Bình", districts: ["Đồng Hới", "Minh Hóa", "Tuyên Hóa", "Quảng Trạch", "Bố Trạch", "Quảng Ninh", "Lệ Thủy", "Ba Đồn"] },
  { city: "Quảng Nam", districts: ["Tam Kỳ", "Hội An", "Điện Bàn", "Đại Lộc", "Duy Xuyên", "Quế Sơn", "Thăng Bình", "Núi Thành", "Phú Ninh", "Tiên Phước", "Nam Trà My", "Bắc Trà My", "Hiệp Đức", "Nông Sơn", "Đông Giang", "Tây Giang", "Nam Giang", "Phước Sơn"] },
  { city: "Quảng Ngãi", districts: ["Quảng Ngãi (TP)", "Bình Sơn", "Sơn Tịnh", "Tư Nghĩa", "Nghĩa Hành", "Mộ Đức", "Đức Phổ", "Ba Tơ", "Minh Long", "Sơn Hà", "Sơn Tây", "Trà Bồng", "Lý Sơn"] },
  { city: "Quảng Trị", districts: ["Đông Hà", "Quảng Trị (TX)", "Vĩnh Linh", "Gio Linh", "Cam Lộ", "Triệu Phong", "Hải Lăng", "Hướng Hóa", "Đakrông", "Cồn Cỏ"] },
  { city: "Sóc Trăng", districts: ["Sóc Trăng (TP)", "Châu Thành", "Kế Sách", "Mỹ Tú", "Cù Lao Dung", "Long Phú", "Mỹ Xuyên", "Ngã Năm", "Thạnh Trị", "Vĩnh Châu", "Trần Đề"] },
  { city: "Sơn La", districts: ["Sơn La (TP)", "Quỳnh Nhai", "Thuận Châu", "Mường La", "Bắc Yên", "Phù Yên", "Mộc Châu", "Yên Châu", "Mai Sơn", "Sông Mã", "Sốp Cộp", "Vân Hồ"] },
  { city: "Tây Ninh", districts: ["Tây Ninh (TP)", "Tân Biên", "Tân Châu", "Dương Minh Châu", "Châu Thành", "Hòa Thành", "Gò Dầu", "Bến Cầu", "Trảng Bàng"] },
  { city: "Tiền Giang", districts: ["Mỹ Tho", "Gò Công", "Cai Lậy", "Cái Bè", "Cai Lậy (H)", "Châu Thành", "Chợ Gạo", "Gò Công Tây", "Gò Công Đông", "Tân Phước", "Tân Phú Đông"] },
  { city: "Trà Vinh", districts: ["Trà Vinh (TP)", "Càng Long", "Cầu Kè", "Tiểu Cần", "Châu Thành", "Cầu Ngang", "Trà Cú", "Duyên Hải"] },
  { city: "Tuyên Quang", districts: ["Tuyên Quang (TP)", "Lâm Bình", "Na Hang", "Chiêm Hóa", "Hàm Yên", "Yên Sơn", "Sơn Dương"] },
  { city: "Vĩnh Long", districts: ["Vĩnh Long (TP)", "Long Hồ", "Mang Thít", "Vũng Liêm", "Tam Bình", "Bình Minh", "Trà Ôn", "Bình Tân"] },
  { city: "Yên Bái", districts: ["Yên Bái (TP)", "Nghĩa Lộ", "Lục Yên", "Văn Yên", "Mù Cang Chải", "Trấn Yên", "Trạm Tấu", "Văn Chấn", "Yên Bình"] },
];
