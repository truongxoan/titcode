# 📱 Ứng Dụng Quét Mã Vạch (Tít Code) Tự Động Lưu Bộ Nhớ

Ứng dụng web chạy trực tiếp trên trình duyệt điện thoại (iOS Safari, Android Chrome) hoặc máy tính, hỗ trợ quét tất cả các loại mã vạch (đặc biệt là **Code 128**, Code 39, QR code, EAN tem mác quần áo/kho hàng) như trên hình áo thun / tem nhãn của bạn.

---

## ✨ Tính Năng Nổi Bật

1. **Âm thanh "TÍT" siêu nhạy**: Phát âm thanh bip chuẩn máy tính tiền siêu thị / POS mỗi khi nhận diện được mã.
2. **Tự động lưu vào bộ nhớ**:
   - Lưu ngay lập tức vào **Bộ nhớ máy (`localStorage`)**, tắt mạng hay tắt trình duyệt mở lại vẫn còn nguyên.
   - Tự động sao chép mã vừa tít vào **Khay nhớ tạm (Clipboard)** để bạn chỉ việc sang Zalo/Ghi chú/Sheet ấn Dán (Paste).
3. **Chống quét lặp liên tục**: Tự động trì hoãn 2 giây với cùng 1 mã để không bị tít dồn 10 lần một lúc.
4. **Đếm số lượng & Đánh dấu trùng**: Nếu quét lại mã cũ, hệ thống tự động tăng biến đếm số lần và phát âm báo kép.
5. **Xuất file dễ dàng**:
   - Xuất file **Excel (.CSV)** có tiếng Việt và ngày giờ chi tiết.
   - Xuất file **Văn bản (.TXT)** mỗi mã 1 dòng.
   - Nút "Copy tất cả" một chạm.
6. **Dán ảnh & Kéo thả ảnh (Mới)**:
   - **Dán ảnh (Paste - Ctrl+V)**: Chỉ cần bấm copy ảnh (hoặc chụp màn hình) rồi ấn nút **"Dán ảnh"** hoặc nhấn phím `Ctrl + V` bất kỳ lúc nào để web tự động trích xuất mã vạch.
   - **Kéo thả ảnh (Drag & Drop)**: Nắm kéo file ảnh từ máy tính hoặc tab khác thả thẳng vào màn hình để quét.
   - **Tự động xoay đa hướng (0°, 90°, 180°, 270°)**: Giúp nhận diện chuẩn xác cả những ảnh chụp tem áo thẳng đứng hay xoay ngang.
7. **Hỗ trợ công cụ kho**:
   - Nút bật/tắt **Đèn Flash (Torch)** khi quét trong góc tối.
   - Đổi camera Trước / Sau.
   - Chọn file ảnh từ bộ sưu tập.

---

## 🚀 Hướng Dẫn Đưa Lên GitHub & Bật Web Miễn Phí (GitHub Pages)

> 💡 **Lưu ý quan trọng**: Camera trên điện thoại (iPhone Safari & Android Chrome) **bắt buộc phải có HTTPS** thì mới cho phép cấp quyền. GitHub Pages cung cấp HTTPS miễn phí 100%!

### Cách 1: Đẩy bằng lệnh Git (Nhanh nhất nếu đã cài Git)

Mở Terminal / PowerShell tại thư mục này và chạy:

```bash
git init
git add .
git commit -m "Khoi tao web tit ma vach"
git branch -M main
# Tạo 1 repo mới trên github.com (ví dụ: titcode), rồi gán link vào lệnh dưới:
git remote add origin https://github.com/<tai-khoan-github-cua-ban>/titcode.git
git push -u origin main
```

---

### Cách 2: Kéo thả trực tiếp trên web GitHub (Không cần cài Git)

1. Đăng nhập vào [GitHub.com](https://github.com).
2. Bấm nút dấu cộng **+** ở góc trên bên phải ➔ Chọn **New repository**.
3. Đặt tên kho là: `titcode` ➔ Chọn chế độ **Public** ➔ Bấm **Create repository**.
4. Tại trang repo vừa tạo, bấm vào dòng chữ **"uploading an existing file"**.
5. Kéo thả toàn bộ các file trong thư mục này vào:
   - `index.html`
   - `style.css`
   - `app.js`
   - `manifest.json`
   - `sw.js`
6. Bấm **Commit changes**.

---

### 🌐 Cách Kích Hoạt Link Web Trên Điện Thoại (Bật GitHub Pages)

Sau khi code đã lên GitHub:

1. Vào tab **Settings** của repository trên GitHub.
2. Ở thanh menu bên trái, tìm và bấm vào mục **Pages** (mục GitHub Pages).
3. Tại phần **Branch**, chọn nhánh **main** (hoặc `master`), thư mục chọn **/ (root)**.
4. Bấm nút **Save**.
5. Đợi khoảng 1 - 2 phút, F5 tải lại trang bạn sẽ thấy đường link web xuất hiện ở đầu trang, dạng:
   👉 `https://<ten-tai-khoan>.github.io/titcode/`

---

## 📲 Cách Sử Dụng Trên Điện Thoại

1. Dùng trình duyệt Safari (trên iPhone) hoặc Chrome (trên Android) mở link `https://...` vừa tạo.
2. Trình duyệt hiện hộp thoại thông báo: **"Cho phép trang web sử dụng Camera?"** ➔ Bấm **Cho phép (Allow)**.
3. Hướng khung ngắm màu xanh/đỏ vào mã vạch trên áo hoặc tem:
   - Điện thoại sẽ kêu **"TÍT!"** 🎵
   - Rung nhẹ phản hồi.
   - Mã lập tức được lưu vào danh sách bên dưới và tự chép vào bộ nhớ tạm.
4. **Mẹo cài thành App trên điện thoại (Không cần App Store)**:
   - Trên **iPhone (Safari)**: Bấm nút Chia sẻ (biểu tượng ô vuông mũi tên chỉ lên) ➔ Chọn **"Thêm vào MH chính" (Add to Home Screen)**.
   - Trên **Android (Chrome)**: Bấm dấu 3 chấm góc phải ➔ Chọn **"Cài đặt ứng dụng"** hoặc **"Thêm vào màn hình chính"**.
   - Lúc này icon ứng dụng sẽ xuất hiện ngoài màn hình chính như một app thực thụ, mở lên toàn màn hình không có thanh địa chỉ!
