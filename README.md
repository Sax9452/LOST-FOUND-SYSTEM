# Lost & Found System

ระบบ Lost & Found สำหรับการจัดการสิ่งของหายและสิ่งของที่พบ

## 🚀 การติดตั้ง

### 1. ติดตั้ง Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2. ตั้งค่า Database (PostgreSQL)

```bash
# สร้าง database
createdb lost_and_found

# รัน schema
psql -U postgres -d lost_and_found -f database_setup.sql
```

### 3. ตั้งค่า Environment Variables

สร้างไฟล์ `backend/.env`:
```env
PORT=5000
DATABASE_URL=postgresql://postgres:password@localhost:5432/lost_and_found
JWT_SECRET=your_jwt_secret_key_here
JWT_REFRESH_SECRET=your_refresh_secret_key_here
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

## 🏃 การรันโปรเจค

### ตัวเลือกที่ 1: รัน Backend และ Frontend พร้อมกัน
```bash
npm run dev
```

### ตัวเลือกที่ 2: รันแยก

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm start
```

## 📦 เทคโนโลยีที่ใช้

### Backend
- Node.js + Express
- PostgreSQL
- Socket.IO
- JWT Authentication
- bcrypt
- Multer + Sharp (Image handling)

### Frontend
- React
- Tailwind CSS
- Socket.IO Client
- React Router
- i18next (Multi-language)
- date-fns

## 🔐 ความปลอดภัย

- JWT Authentication (Access + Refresh Tokens)
- Password hashing (bcrypt)
- Rate limiting
- Helmet (Security headers)
- Input sanitization
- SQL injection protection
- XSS protection

## 📝 License

MIT
