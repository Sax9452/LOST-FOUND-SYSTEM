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
- Node.js + Express.js - Web Framework
- Socket.IO - Real-time Communication
- JWT - Authentication
- bcryptjs - Password Hashing
- Multer - File Upload
- Sharp - Image Processing
- Helmet - Security Headers
- express-rate-limit - Rate Limiting
- express-validator - Input Validation
- MySQL - Database (XAMPP)
- mysql2 - MySQL Client

### Frontend
- React - UI Library
- React Router - Routing
- Tailwind CSS - Styling
- Socket.IO Client - Real-time Communication
- Axios - HTTP Client
- i18next - Internationalization
- React Hot Toast - Notifications
- React Context API - State Management

## ความต้องการของระบบ

- Node.js (v14 หรือสูงกว่า)
- npm หรือ yarn
- XAMPP (สำหรับ MySQL Database)
- MySQL Server (ผ่าน XAMPP)

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

### 2. ตั้งค่า Database

#### 2.1 เปิด XAMPP และเริ่ม MySQL Server

1. เปิด XAMPP Control Panel
2. คลิก "Start" ที่ MySQL
3. ตรวจสอบว่า MySQL ทำงานอยู่ (สถานะเป็นสีเขียว)

#### 2.2 สร้าง Database

เปิด phpMyAdmin (http://localhost/phpmyadmin) และรัน:

```sql
CREATE DATABASE lostfound CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### 2.3 สร้างตาราง

ใน phpMyAdmin เลือก database `lostfound` แล้วรัน SQL ต่อไปนี้เพื่อสร้างตารางทั้งหมด:

```sql
-- ตาราง users
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  verified BOOLEAN DEFAULT FALSE,
  phone VARCHAR(20),
  profile_image VARCHAR(255),
  language VARCHAR(10) DEFAULT 'th',
  notification_email BOOLEAN DEFAULT TRUE,
  notification_push BOOLEAN DEFAULT TRUE,
  notification_match_alerts BOOLEAN DEFAULT TRUE,
  location VARCHAR(255),
  last_login DATETIME,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  INDEX idx_email (email),
  INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ตาราง items
CREATE TABLE IF NOT EXISTS items (
  id VARCHAR(36) PRIMARY KEY,
  type ENUM('lost', 'found') NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  date DATE,
  location VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  images JSON,
  status ENUM('active', 'matched', 'returned', 'closed') DEFAULT 'active',
  owner_id VARCHAR(36) NOT NULL,
  matched_with_id VARCHAR(36),
  views INT DEFAULT 0,
  keywords JSON,
  rejection_reason TEXT,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (matched_with_id) REFERENCES items(id) ON DELETE SET NULL,
  INDEX idx_type (type),
  INDEX idx_status (status),
  INDEX idx_owner (owner_id),
  INDEX idx_category (category),
  FULLTEXT idx_search (name, description, location)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ตาราง chat_rooms
CREATE TABLE IF NOT EXISTS chat_rooms (
  id VARCHAR(36) PRIMARY KEY,
  user1_id VARCHAR(36) NOT NULL,
  user2_id VARCHAR(36) NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_chat (user1_id, user2_id),
  INDEX idx_user1 (user1_id),
  INDEX idx_user2 (user2_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ตาราง messages
CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR(36) PRIMARY KEY,
  chat_room_id VARCHAR(36) NOT NULL,
  sender_id VARCHAR(36) NOT NULL,
  message_text TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at DATETIME NOT NULL,
  FOREIGN KEY (chat_room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_chat_room (chat_room_id),
  INDEX idx_sender (sender_id),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ตาราง notifications
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  related_item_id VARCHAR(36),
  related_user_id VARCHAR(36),
  is_read BOOLEAN DEFAULT FALSE,
  created_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (related_item_id) REFERENCES items(id) ON DELETE CASCADE,
  FOREIGN KEY (related_user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user (user_id),
  INDEX idx_read (is_read),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**หมายเหตุ:** ตารางที่สร้างจะประกอบด้วย:
- `users` - ข้อมูลผู้ใช้
- `items` - ข้อมูลสิ่งของ
- `chat_rooms` - ห้องแชท
- `messages` - ข้อความ
- `notifications` - การแจ้งเตือน

### 3. ตั้งค่า Environment Variables

สร้างไฟล์ `backend/.env`:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# JWT Configuration
JWT_SECRET=your-secret-key-change-this-in-production-min-32-characters
JWT_EXPIRE=7d

# Bcrypt Configuration
BCRYPT_ROUNDS=12

# MySQL Database Configuration (XAMPP)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=lostfound

# File Upload
MAX_FILE_SIZE=5242880
MAX_FILES=5
```

**สำคัญ:** 
- สำหรับ XAMPP โดยปกติ `DB_PASSWORD` จะเป็นค่าว่าง (ไม่มีรหัสผ่าน)
- ถ้าคุณตั้งรหัสผ่าน MySQL ไว้ ให้ใส่ใน `DB_PASSWORD`
- `JWT_SECRET` ควรเป็น random string ยาวๆ (อย่างน้อย 32 ตัวอักษร)

### 4. สร้างโฟลเดอร์สำหรับ Uploads

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
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- Health Check: http://localhost:5000/api/health

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

### Translate
- `POST /api/translate` - แปลข้อความ
- `POST /api/translate/batch` - แปลหลายข้อความ
- `POST /api/translate/item` - แปลข้อมูล Item

## โครงสร้างโปรเจค

```
lostfound/
├── backend/              # Backend Server
│   ├── config/          # Configuration
│   │   └── database.js  # MySQL connection
│   ├── controllers/     # Business logic
│   ├── database/        # SQL files
│   │   └── reset.sql    # Reset database script
│   ├── middleware/      # Express middlewares
│   ├── models/          # Data models
│   │   ├── db.js        # Model exports
│   │   └── mysql/       # MySQL models
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
│       ├── hooks/       # Custom hooks
│       ├── i18n/        # Internationalization
│       └── pages/       # Page components
│
└── package.json         # Root package.json
```

## Troubleshooting

### ปัญหา: Cannot connect to MySQL

**แก้ไข:**
1. ตรวจสอบว่า XAMPP MySQL ทำงานอยู่
2. ตรวจสอบว่า database `lostfound` ถูกสร้างแล้ว
3. ตรวจสอบ credentials ในไฟล์ `.env`:
   - `DB_USER=root` (สำหรับ XAMPP)
   - `DB_PASSWORD=` (ว่างเปล่าสำหรับ XAMPP)
   - `DB_NAME=lostfound`
4. ตรวจสอบว่า MySQL port (3306) ไม่ถูกบล็อก

### ปัญหา: Table doesn't exist

**แก้ไข:**
1. ตรวจสอบว่าได้รัน SQL script เพื่อสร้างตารางแล้ว
2. ตรวจสอบว่าเลือก database `lostfound` ก่อนรัน SQL
3. ตรวจสอบว่าไม่มี error ตอนรัน SQL
4. ตรวจสอบใน phpMyAdmin ว่ามีตารางทั้งหมด 5 ตาราง:
   - `users`
   - `items`
   - `chat_rooms`
   - `messages`
   - `notifications`

### ปัญหา: Access denied

**แก้ไข:**
1. ตรวจสอบ username และ password ใน `.env`
2. สำหรับ XAMPP โดยปกติ username คือ `root` และไม่มี password
3. ถ้าตั้ง password ไว้ ให้ใส่ใน `DB_PASSWORD`

### ปัญหา: Port already in use

**แก้ไข:**
1. เปลี่ยน PORT ใน `.env` เป็นหมายเลขอื่น (เช่น 5001)
2. หรือปิดโปรแกรมที่ใช้ port 5000 อยู่

### ปัญหา: Frontend ไม่เชื่อมต่อกับ Backend

**แก้ไข:**
1. ตรวจสอบว่า Backend ทำงานอยู่ (http://localhost:5000/api/health)
2. ตรวจสอบ `FRONTEND_URL` ใน `.env` ว่าเป็น `http://localhost:3000`
3. ตรวจสอบ CORS settings

### ปัญหา: JWT Authentication failed

**แก้ไข:**
1. ตรวจสอบว่า `JWT_SECRET` ถูกตั้งค่าใน `.env`
2. ตรวจสอบว่า `JWT_SECRET` มีความยาวอย่างน้อย 32 ตัวอักษร
3. ตรวจสอบว่า token ถูกส่งใน header `Authorization: Bearer <token>`

## หมายเหตุสำคัญ

1. **ข้อมูลจะถูกเก็บใน MySQL** - ข้อมูลจะไม่หายเมื่อ restart server (ต่างจาก in-memory storage)
2. **ต้องเปิด XAMPP MySQL ทุกครั้ง** - ก่อนเริ่ม server ต้องเปิด MySQL ใน XAMPP
3. **Backup Database** - ควร backup database เป็นระยะๆ ผ่าน phpMyAdmin
4. **Reset Database** - ใช้ไฟล์ `backend/database/reset.sql` เพื่อลบข้อมูลทั้งหมด (ระวัง: จะลบข้อมูลทั้งหมด)

## Quick Start Checklist

- [ ] ติดตั้ง Node.js และ npm
- [ ] ติดตั้ง XAMPP และเริ่ม MySQL
- [ ] สร้าง database `lostfound` ใน phpMyAdmin
- [ ] รัน SQL script เพื่อสร้างตารางทั้งหมด
- [ ] สร้างไฟล์ `backend/.env` และตั้งค่า
- [ ] ติดตั้ง dependencies (`npm install`)
- [ ] สร้างโฟลเดอร์ `backend/uploads/items`
- [ ] เริ่ม Backend และ Frontend (`npm run dev`)
- [ ] ตรวจสอบ health check (http://localhost:5000/api/health)
- [ ] ลงทะเบียนและทดสอบระบบ

## License

MIT
