# Hướng dẫn cấu hình Stripe Checkout API cho CoreSound Premium

## 📋 Tổng quan

Hệ thống Premium sử dụng **Stripe Checkout API** (Test Mode) để xử lý thanh toán:
- **Gói 1 tháng**: 30.000 VNĐ
- **Gói 1 năm**: 300.000 VNĐ (tiết kiệm 17%)

## 🔑 Bước 1: Lấy Stripe API Keys

1. Truy cập [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Đảm bảo đang ở **Test mode** (toggle ở góc trên bên phải)
3. Copy 2 keys:
   - **Publishable key**: `pk_test_...` (không cần dùng trong project này)
   - **Secret key**: `sk_test_...` (click "Reveal test key")

## ⚙️ Bước 2: Cấu hình Backend

1. Mở file `backend/.env`
2. Thêm Stripe Secret Key:

```env
# Stripe Keys (Test Mode)
STRIPE_SECRET_KEY=sk_test_your_actual_secret_key_here

# MongoDB
MONGODB_URI=mongodb://localhost:27017/coresound

# JWT Secret
JWT_SECRET=your-secret-key-change-in-production

# Server
PORT=5000

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

3. **QUAN TRỌNG**: Thay `sk_test_your_actual_secret_key_here` bằng Secret Key thật từ Stripe Dashboard

## 🚀 Bước 3: Khởi động ứng dụng

### Backend:
```bash
cd backend
npm install
npm start
```

Server sẽ chạy tại `http://localhost:5000`

### Frontend:
```bash
cd frontend
npm install
npm run dev
```

App sẽ chạy tại `http://localhost:3000`

## 🧪 Bước 4: Test luồng thanh toán

### Luồng hoạt động:

1. **Đăng nhập** vào ứng dụng
2. Vào trang **Profile** (`/#/profile`)
3. Click nút **"Nâng cấp ngay"**
4. Popup hiện 2 gói Premium:
   - CoreSound Premium 1 tháng - 30.000đ
   - CoreSound Premium 1 năm - 300.000đ
5. Chọn gói → Hệ thống tạo Checkout Session
6. Redirect đến **Stripe Checkout** page
7. Nhập thông tin thẻ test:
   - **Card**: `4242 4242 4242 4242`
   - **MM/YY**: `12/34` (bất kỳ ngày tương lai)
   - **CVC**: `123` (bất kỳ 3 số)
   - **Email**: Email bất kỳ
8. Click **"Pay"**
9. Stripe xử lý thanh toán và redirect về `/#/premium-success?session_id=...`
10. Hệ thống:
    - Verify session với Stripe
    - Kích hoạt Premium cho user
    - Hiển thị thông báo thành công
    - Auto redirect về Profile sau 3 giây
11. Profile hiển thị:
    - Badge **"Premium"** màu vàng
    - Ngày hết hạn Premium

## 💳 Thẻ test Stripe

### ✅ Thẻ thành công:
- `4242 4242 4242 4242` - Visa (khuyến nghị)
- `5555 5555 5555 4444` - Mastercard
- `3782 822463 10005` - American Express

### ❌ Thẻ thất bại (để test error handling):
- `4000 0000 0000 0002` - Card declined
- `4000 0000 0000 9995` - Insufficient funds
- `4000 0000 0000 0069` - Expired card

## 📊 API Endpoints

### 1. Tạo Checkout Session
```
POST /api/premium/create-checkout-session
Authorization: Bearer {token}
Body: { "plan": "monthly" | "yearly" }

Response:
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/..."
}
```

### 2. Verify Session và Activate Premium
```
POST /api/premium/verify-session
Authorization: Bearer {token}
Body: { "sessionId": "cs_test_..." }

Response:
{
  "message": "Nâng cấp Premium thành công",
  "user": {
    "_id": "...",
    "isPremium": true,
    "premiumExpiresAt": "2025-12-03T00:00:00.000Z",
    ...
  }
}
```

### 3. Kiểm tra Premium Status
```
GET /api/premium/status
Authorization: Bearer {token}

Response:
{
  "isPremium": true,
  "premiumExpiresAt": "2025-12-03T00:00:00.000Z"
}
```

## 🔍 Kiểm tra Backend Logs

Sau khi thanh toán thành công, console backend sẽ hiển thị:

```
🔗 Checkout session created for user@example.com - Plan: monthly
✅ Premium activated for user@example.com until 03/12/2025 - Session: cs_test_a1b2c3...
```

## 🗄️ Kiểm tra Database

Mở MongoDB Compass hoặc mongo shell:

```javascript
db.users.findOne({ email: "test@example.com" })
```

Kết quả mong đợi:
```javascript
{
  "_id": ObjectId("..."),
  "email": "test@example.com",
  "name": "Test User",
  "isPremium": true,
  "premiumExpiresAt": ISODate("2025-12-03T00:00:00.000Z"),
  // ... other fields
}
```

## 🎨 UI Components

### PremiumModal
- Hiển thị 2 gói Premium với giá và tính năng
- Loading state khi đang tạo session
- Error handling nếu API fail
- Disable buttons khi đang xử lý

### PremiumSuccess
- Loading spinner khi verify session
- Success animation với crown icon
- Danh sách tính năng Premium
- Auto redirect sau 3 giây
- Error state nếu verify fail

### Profile
- Premium badge màu vàng nếu isPremium = true
- Hiển thị ngày hết hạn
- Card "Nâng cấp lên Premium" nếu chưa Premium
- Ẩn card nếu đã Premium

## ⚠️ Lưu ý quan trọng

### Security:
1. **Test Mode**: Đang dùng test mode, không có giao dịch thật
2. **API Keys**: KHÔNG commit `.env` file lên Git
3. **Session Verification**: Backend verify session với Stripe API trước khi activate
4. **User Verification**: Kiểm tra session thuộc về user đang đăng nhập
5. **Payment Status**: Chỉ activate khi `payment_status = 'paid'`

### Auto Expiration:
- API `/api/premium/status` tự động check và expire premium khi hết hạn
- Frontend nên gọi API này định kỳ hoặc khi load Profile

### Production Deployment:
1. Chuyển sang **Live Mode** trên Stripe Dashboard
2. Lấy Live API Keys: `sk_live_...` và `pk_live_...`
3. Cập nhật `.env` với Live keys
4. Cập nhật `FRONTEND_URL` thành domain thật
5. **Bắt buộc**: Setup Stripe Webhook để xử lý payment events
6. Test kỹ với thẻ thật trước khi ra mắt

## 🐛 Troubleshooting

### ❌ Lỗi: "Không thể tạo phiên thanh toán"
**Nguyên nhân**: 
- Chưa cấu hình `STRIPE_SECRET_KEY` trong `.env`
- Secret key không hợp lệ
- Backend không chạy

**Cách fix**:
1. Kiểm tra file `backend/.env` có `STRIPE_SECRET_KEY`
2. Verify key bắt đầu bằng `sk_test_`
3. Restart backend server
4. Check backend console có lỗi không

### ❌ Lỗi: "Xác minh thanh toán thất bại"
**Nguyên nhân**:
- Session ID không hợp lệ
- Thanh toán chưa hoàn tất
- Session không thuộc về user

**Cách fix**:
1. Đảm bảo thanh toán thành công trên Stripe
2. Kiểm tra URL có `session_id` parameter
3. Kiểm tra backend logs để xem lỗi cụ thể
4. Thử thanh toán lại

### ❌ Lỗi: "Vui lòng đăng nhập để tiếp tục"
**Nguyên nhân**: Token hết hạn hoặc không tồn tại

**Cách fix**:
1. Đăng nhập lại
2. Kiểm tra `localStorage` có `cs_user` không
3. Clear cache và thử lại

### ❌ Lỗi: Premium không hiển thị sau khi activate
**Nguyên nhân**: Frontend chưa refresh user data

**Cách fix**:
1. Hard refresh (Ctrl + Shift + R)
2. Đăng xuất và đăng nhập lại
3. Kiểm tra database: `db.users.findOne({ email: "..." })`
4. Kiểm tra `localStorage.getItem('cs_user')`

### ❌ Lỗi: Stripe Checkout không mở
**Nguyên nhân**: 
- API không trả về URL
- Network error
- CORS issue

**Cách fix**:
1. Mở Browser Console (F12) → Network tab
2. Kiểm tra request `/api/premium/create-checkout-session`
3. Xem response có `url` field không
4. Kiểm tra CORS settings trong backend

### ❌ Lỗi: MongoDB connection failed
**Nguyên nhân**: MongoDB không chạy

**Cách fix**:
```bash
# Windows
net start MongoDB

# Mac/Linux
sudo systemctl start mongod
```

## ✅ Checklist triển khai

- [ ] Cài đặt Stripe package: `npm install stripe`
- [ ] Tạo file `.env` và thêm `STRIPE_SECRET_KEY`
- [ ] Lấy Secret Key từ Stripe Dashboard (Test Mode)
- [ ] Khởi động MongoDB
- [ ] Khởi động backend server
- [ ] Khởi động frontend server
- [ ] Đăng nhập vào ứng dụng
- [ ] Test thanh toán với thẻ `4242 4242 4242 4242`
- [ ] Verify Premium badge hiển thị trong Profile
- [ ] Kiểm tra database có `isPremium = true`
- [ ] Test auto expiration (optional)

## 📞 Support

Nếu gặp vấn đề:
1. Kiểm tra backend logs
2. Kiểm tra browser console (F12)
3. Kiểm tra Network tab để xem API requests
4. Verify MongoDB đang chạy
5. Verify Stripe keys đúng và hợp lệ

## 🔗 Tài liệu tham khảo

- [Stripe Checkout Documentation](https://stripe.com/docs/payments/checkout)
- [Stripe Test Cards](https://stripe.com/docs/testing)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Dashboard](https://dashboard.stripe.com/test/dashboard)
