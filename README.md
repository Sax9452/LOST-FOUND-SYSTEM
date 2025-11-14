# Lost & Found System

ระบบ Lost & Found สำหรับการจัดการสิ่งของหายและสิ่งของที่พบ พัฒนาด้วย Node.js + Express (Backend) และ React (Frontend)

## คุณสมบัติหลัก

### การจัดการผู้ใช้
- ลงทะเบียนและเข้าสู่ระบบด้วย JWT Authentication
- จัดการโปรไฟล์ส่วนตัว
- เปลี่ยนรหัสผ่าน
- ตั้งค่าการแจ้งเตือน

### การจัดการสิ่งของ
- ลงประกาศของหาย/ของพบ พร้อมอัปโหลดรูปภาพหลายรูป
- ค้นหาและกรองสิ่งของ
- ดูรายละเอียดสิ่งของ
- แก้ไขและลบสิ่งของ
- จัดการสิ่งของของฉัน
- อัปเดตสถานะสิ่งของ

### ระบบจับคู่อัตโนมัติ
- จับคู่อัตโนมัติเมื่อลงประกาศสิ่งของใหม่
- แจ้งเตือนเมื่อพบสิ่งของที่อาจตรงกัน
- ดูรายการสิ่งของที่อาจตรงกัน

### ระบบแชท Real-time
- แชทแบบ Real-time ด้วย Socket.IO
- ส่งข้อความทันที
- ดูประวัติการสนทนา
- Typing indicator
- สถานะอ่าน/ยังไม่ได้อ่าน

### ระบบแจ้งเตือน Real-time
- แจ้งเตือนแบบ Real-time
- แจ้งเตือนเมื่อพบสิ่งของที่อาจตรงกัน
- แจ้งเตือนเมื่อมีข้อความใหม่
- จัดการการแจ้งเตือน

### Dashboard
- ดูสถิติส่วนตัว
- ดูกิจกรรมล่าสุด
- Quick actions

### ระบบหลายภาษา
- รองรับภาษาไทยและอังกฤษ
- เปลี่ยนภาษาได้ทันที

### Dark Mode
- เปิด/ปิด Dark Mode
- จำการตั้งค่าใน LocalStorage

### Admin Panel
- จัดการผู้ใช้
- จัดการสิ่งของ
- ดูรายงาน

## เทคโนโลยีที่ใช้

### Backend
- **Node.js** + **Express.js** - Web Framework
- **Socket.IO** - Real-time Communication
- **JWT** - Authentication
- **bcryptjs** - Password Hashing
- **Multer** - File Upload
- **Sharp** - Image Processing
- **Helmet** - Security Headers
- **express-rate-limit** - Rate Limiting
- **express-validator** - Input Validation
- **In-Memory Storage** - Data Storage (Map-based)

### Frontend
- **React** - UI Library
- **React Router** - Routing
- **Tailwind CSS** - Styling
- **Socket.IO Client** - Real-time Communication
- **Axios** - HTTP Client
- **i18next** - Internationalization
- **React Hot Toast** - Notifications
- **React Context API** - State Management

## ความต้องการของระบบ

- Node.js (v14 หรือสูงกว่า)
- npm หรือ yarn
- ไม่ต้องใช้ Database (ใช้ in-memory storage)

## การติดตั้ง

### 1. ติดตั้ง Dependencies

```bash
npm run install-all
```

หรือติดตั้งแยก:

```bash
# Root
npm install

# Backend
cd backend
npm install
cd ..

# Frontend
cd frontend
npm install
cd ..
```

### 2. ตั้งค่า Environment Variables

สร้างไฟล์ `backend/.env`:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here_change_this_to_random_string
JWT_EXPIRE=7d

# Frontend URL (สำหรับ CORS และ Socket.IO)
FRONTEND_URL=http://localhost:3000

# Password Hashing
BCRYPT_ROUNDS=12
```

สร้างไฟล์ `frontend/.env` (ไม่บังคับ):

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

### 3. สร้างโฟลเดอร์สำหรับ Uploads

```bash
mkdir -p backend/uploads/items
```

## การรันโปรเจค

### รัน Backend และ Frontend พร้อมกัน (แนะนำ)

```bash
npm run dev
```

### รันแยก

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

### การเข้าถึง
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api
- **Health Check:** http://localhost:5000/api/health

## API Endpoints

### Authentication
- `POST /api/auth/register` - ลงทะเบียน
- `POST /api/auth/login` - เข้าสู่ระบบ
- `GET /api/auth/me` - ดูข้อมูลผู้ใช้ปัจจุบัน
- `PUT /api/auth/profile` - แก้ไขโปรไฟล์
- `PUT /api/auth/password` - เปลี่ยนรหัสผ่าน
- `PUT /api/auth/notifications` - ตั้งค่าการแจ้งเตือน

### Items
- `GET /api/items` - ดูรายการสิ่งของ (พร้อมการกรอง)
- `GET /api/items/search` - ค้นหาสิ่งของ
- `GET /api/items/stats` - ดูสถิติ
- `GET /api/items/:id` - ดูรายละเอียดสิ่งของ
- `POST /api/items` - ลงประกาศสิ่งของใหม่
- `PUT /api/items/:id` - แก้ไขสิ่งของ
- `DELETE /api/items/:id` - ลบสิ่งของ
- `PUT /api/items/:id/status` - อัปเดตสถานะสิ่งของ
- `GET /api/items/user/my-items` - ดูสิ่งของของฉัน
- `GET /api/items/:id/matches` - ดูสิ่งของที่อาจตรงกัน

### Chat
- `POST /api/chats/start` - เริ่มแชท
- `GET /api/chats/rooms` - ดูรายการห้องแชท
- `GET /api/chats/rooms/:id/messages` - ดูข้อความในห้อง
- `POST /api/chats/rooms/:id/messages` - ส่งข้อความ
- `PUT /api/chats/rooms/:id/read` - ทำเครื่องหมายว่าอ่านแล้ว

### Notifications
- `GET /api/notifications` - ดูรายการการแจ้งเตือน
- `PUT /api/notifications/:id/read` - ทำเครื่องหมายว่าอ่านแล้ว
- `DELETE /api/notifications/:id` - ลบการแจ้งเตือน
- `PUT /api/notifications/read-all` - ทำเครื่องหมายว่าอ่านทั้งหมดแล้ว

## โครงสร้างโปรเจค

```
lost-and-found-app/
├── backend/              # Backend Server
│   ├── config/          # Configuration
│   ├── controllers/     # Business logic
│   ├── middleware/      # Express middlewares
│   ├── models/          # Data models
│   ├── routes/          # API routes
│   ├── sockets/         # Socket.IO handlers
│   ├── utils/           # Utility functions
│   ├── uploads/         # Uploaded files
│   └── server.js        # Main server file
│
├── frontend/            # Frontend Application
│   ├── public/          # Static files
│   └── src/
│       ├── api/         # API services
│       ├── components/  # React components
│       ├── context/     # React Context
│       ├── i18n/        # Internationalization
│       └── pages/        # Page components
│
└── package.json         # Root package.json
```



## License

MIT

