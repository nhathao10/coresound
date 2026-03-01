# Coresound - Website nghe nhạc trực tuyến (MERN)

## Cấu trúc dự án
- `/frontend`: Frontend React (Vite)
- `/backend`: Backend Node.js/Express

## Chức năng chính
- Đăng ký, đăng nhập, quản lý tài khoản
- Phát nhạc trực tuyến, playlist, tìm kiếm, đề xuất, bình luận, v.v.


## Khởi động dự án
### Frontend
```sh
cd frontend
npm install
npm run dev
```
### Backend
```sh
cd backend
npm install
node index.js
```

## Ghi chú
- Cần cài đặt MongoDB và cấu hình biến môi trường trong file `.env` ở `/server`.
- Đây là khởi tạo cơ bản, các module sẽ được phát triển tiếp theo.

## Chạy Demo

Để chạy demo dự án CoreSound, hãy làm theo các bước sau:

### Điều kiện tiên quyết
- Đảm bảo MongoDB đã được cài đặt và đang chạy.
- Cài đặt biến môi trường trong file `.env` ở thư mục `/backend`.
- Đảm bảo các cổng 3000 và 5000 có sẵn cho frontend và backend tương ứng.

### Các bước
1. **Khởi động Backend**
   - Di chuyển đến thư mục backend:
     ```sh
     cd backend
     ```
   - Cài đặt các gói phụ thuộc:
     ```sh
     npm install
     ```
   - Khởi động máy chủ backend:
     ```sh
     node index.js
     ```

2. **Khởi động Frontend**
   - Mở một cửa sổ terminal mới.
   - Di chuyển đến thư mục frontend:
     ```sh
     cd frontend
     ```
   - Cài đặt các gói phụ thuộc:
     ```sh
     npm install
     ```
   - Khởi động máy chủ frontend:
     ```sh
     npm run dev
     ```

### Truy cập Demo
- Mở trình duyệt web và truy cập `http://localhost:3000` để truy cập giao diện frontend của CoreSound.

### Xử lý sự cố
- Nếu gặp sự cố, hãy đảm bảo rằng tất cả các gói phụ thuộc đã được cài đặt và MongoDB đang chạy.
- Kiểm tra console để tìm các thông báo lỗi và giải quyết chúng theo cách phù hợp.
- Đảm bảo rằng file `.env` được cấu hình đúng với các khóa và giá trị cần thiết.
