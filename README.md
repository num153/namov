# 🎬 NAM.OV - Nền Tảng Xem Phim Trực Tuyến & Streaming M3U8

- Trang web xem phim cá nhân phát triển trên nền tảng **Vite + React**, hỗ trợ stream trực tiếp qua luồng **HLS `.m3u8`** tốc độ cao, tích hợp tuyển tập 120+ phim kinh điển (Châu Tinh Trì, Điện Ảnh Hollywood, Anime). Dự án thuộc dạng movies collection cá nhân nên chỉ lưu những bộ phim cá nhân thấy ấn tượng và yêu thích.
- ## 🌐 Namov Watch

Visit the website: [namov-watch.vercel.app](https://namov-watch.vercel.app/)

### 📸 Website Preview
[![namov-watch-vercel-app-(1).png](https://i.postimg.cc/XJbFj0t6/namov-watch-vercel-app-(1).png)](https://postimg.cc/LqxhDGHx)
---

## ⚡ Hướng Dẫn Khởi Tạo trên máy của bạn

### 1. Clone repository về máy
```bash
git clone https://github.com/your-username/namov.git
cd namov
```

### 2. Cài đặt các gói phụ thuộc (Dependencies)
```bash
npm install
```
*(Các thư viện cần thiết như React, Vite, Artplayer, Hls.js, Lucide-React sẽ tự động được tải về nhanh chóng trong vài giây mà không cần commit thư mục `node_modules` nặng nề lên Git).*

### 3. Khởi động môi trường phát triển (Dev Server)
```bash
npm run dev
```
Trang web sẽ chạy tại: **`http://localhost:5173/`**

---

## 🛠️ Các Lệnh Thao Tác (Scripts)

| Lệnh | Mô tả |
| :--- | :--- |
| `npm run dev` | Chạy máy chủ phát triển (Hot Reload tức thì) |
| `npm run build` | Đóng gói sản phẩm tối ưu (Production Build ra thư mục `/dist`) |
| `npm run preview` | Xem thử bản build production trên máy local |

---

## 🌟 Tính Năng Nổi Bật

- 🚀 **Stream Native M3U8 (HLS):** Sử dụng **Artplayer + HLS.js** phát video trực tiếp tốc độ cao, không giật lag.
- 📱 **Mobile-First UI:** Giao diện tối ưu hiển thị 3 cột trên điện thoại, danh mục cuộn ngang mượt mà, chạm lướt êm ái.
- ⏱️ **Ghi nhớ thời gian xem dở (Resume Playback):** Tự động lưu tiến độ video vào `localStorage` để xem tiếp bất cứ lúc nào.
- 🔍 **Live Search & Filter:** Tìm kiếm phim tức thì không dấu tiếng Việt theo tên, diễn viên và thể loại.
- 📌 **Bộ sưu tập cá nhân:** Danh sách phim yêu thích (Watchlist) và Lịch sử xem (Watch History).
- 🔄 **Nguồn dữ liệu kép:** Hơn 120+ phim nội bộ chất lượng cao kết hợp kết nối API phim trực tuyến mở rộng.
- ⬆️ **Nút Cuộn Lên Đầu Trang:** Smooth Back-to-Top button tiện lợi.

---

## 📁 Cấu Trúc Mã Nguồn

```text
namov/
├── src/
│   ├── components/      # Navbar, Footer, MovieCard, VideoPlayer, HeroBanner, BackToTop
│   ├── data/            # localMovies.json (122 bộ phim & link m3u8 chuẩn hóa)
│   ├── pages/           # HomePage, WatchPage, CollectionPage, AboutPage
│   ├── services/        # movieService.js (Bộ xử lý tìm kiếm, lọc và kết nối API)
│   ├── App.jsx          # Định tuyến SPA & ErrorBoundary
│   ├── main.jsx         # Entry point React
│   └── index.css        # Hệ thống Dark Mode Design System
├── .env                 # Biến môi trường
├── .env.example         # Mẫu cấu hình môi trường
├── .gitignore           # Loại bỏ node_modules, build artifacts khỏi Git
├── package.json         # Danh sách packages & scripts
└── vite.config.js       # Cấu hình Vite React
```
