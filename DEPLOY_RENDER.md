# 🚀 คู่มือ Deploy Lost & Found System ด้วย Render.com

## 📋 สิ่งที่ต้องเตรียม
1. ✅ บัญชี GitHub (มีโค้ดอัพโหลดแล้ว)
2. ✅ บัญชี Render.com (สมัครฟรีได้ที่ https://render.com)
3. ✅ Code พร้อม Deploy แล้ว

---

## 🎯 ขั้นตอนการ Deploy (3 ส่วน)

### 1️⃣ สร้าง PostgreSQL Database
### 2️⃣ Deploy Backend (Node.js API)
### 3️⃣ Deploy Frontend (React App)

---

## 📚 ส่วนที่ 1: สร้าง PostgreSQL Database

### ขั้นตอน:

1. **เข้าสู่ Render Dashboard**
   - ไปที่ https://dashboard.render.com
   - คลิก **"New +"** → เลือก **"PostgreSQL"**

2. **ตั้งค่า Database**
   ```
   Name: lost-found-db
   Database: lostfound
   User: lostfound_user
   Region: Singapore (ใกล้ที่สุด)
   PostgreSQL Version: 16
   Plan: Free
   ```

3. **คลิก "Create Database"**
   - รอประมาณ 2-3 นาที

4. **บันทึกข้อมูลสำคัญ**
   - หลังจากสร้างเสร็จ จะได้:
   ```
   Internal Database URL: postgres://...
   External Database URL: postgres://...
   PSQL Command: PGPASSWORD=xxx psql -h xxx
   ```
   - **เก็บ External Database URL ไว้** (จะใช้ตอนตั้งค่า Backend)

5. **Setup Database Schema**
   - ใน Dashboard ของ Database → เลือก **"Connect"**
   - คัดลอก **PSQL Command**
   - เปิด Terminal (PowerShell/CMD) และรัน:
   ```bash
   # Paste PSQL Command ที่คัดลอกมา แล้วกด Enter
   # จะเข้าสู่ PostgreSQL console
   ```
   
   - หรือใช้ **Web Shell** ใน Render Dashboard
   
   - **วิธีที่ง่ายกว่า:** ใช้ pgAdmin หรือ DBeaver
     ```
     Host: (จาก External URL)
     Port: 5432
     Database: lostfound
     Username: lostfound_user
     Password: (จาก External URL)
     ```

6. **Import Database Schema**
   - เปิดไฟล์ `database_setup.sql` ในโปรเจค
   - คัดลอกทั้งหมด
   - Paste และรันใน Database client
   - จะได้ Tables, Functions, Triggers ครบทั้งหมด

---

## 🔧 ส่วนที่ 2: Deploy Backend (Node.js API)

### ขั้นตอน:

1. **สร้าง Web Service**
   - กลับไปที่ Render Dashboard
   - คลิก **"New +"** → เลือก **"Web Service"**

2. **เชื่อมต่อ GitHub**
   - เลือก **"Connect repository"**
   - อนุญาตให้ Render เข้าถึง GitHub
   - เลือก repository: `Sax9452/lost-found`

3. **ตั้งค่า Backend Service**
   ```
   Name: lost-found-backend
   Region: Singapore
   Branch: main
   Root Directory: backend
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   Plan: Free
   ```

4. **ตั้งค่า Environment Variables**
   คลิก **"Advanced"** → **"Add Environment Variable"**
   
   เพิ่มตัวแปรต่อไปนี้:
   
   ```bash
   # Database
   DATABASE_URL=<PASTE_EXTERNAL_DATABASE_URL_จากขั้นตอนที่_1>
   
   # JWT Secrets (สร้างใหม่ให้ปลอดภัย)
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
   JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production-min-32-chars
   
   # Server Config
   NODE_ENV=production
   PORT=5000
   
   # Frontend URL (จะได้หลังจาก deploy frontend - ใส่ภายหลังได้)
   FRONTEND_URL=https://your-frontend-url.onrender.com
   
   # CORS (เหมือน FRONTEND_URL)
   CORS_ORIGIN=https://your-frontend-url.onrender.com
   ```

5. **คลิก "Create Web Service"**
   - Render จะเริ่ม build และ deploy
   - รอประมาณ 5-10 นาที
   - เมื่อเสร็จจะได้ URL เช่น: `https://lost-found-backend.onrender.com`

6. **ทดสอบ Backend**
   - เปิด browser ไปที่: `https://lost-found-backend.onrender.com/api/health`
   - ควรเห็น:
   ```json
   {
     "status": "OK",
     "message": "Server is running with PostgreSQL",
     "database": "PostgreSQL"
   }
   ```

---

## 🎨 ส่วนที่ 3: Deploy Frontend (React App)

### ขั้นตอน:

1. **สร้าง Static Site**
   - กลับไปที่ Render Dashboard
   - คลิก **"New +"** → เลือก **"Static Site"**

2. **เลือก Repository เดิม**
   - เลือก repository: `Sax9452/lost-found`

3. **ตั้งค่า Frontend**
   ```
   Name: lost-found-frontend
   Branch: main
   Root Directory: frontend
   Build Command: npm install && npm run build
   Publish Directory: build
   Plan: Free
   ```

4. **ตั้งค่า Environment Variables**
   เพิ่มตัวแปร:
   
   ```bash
   REACT_APP_API_URL=https://lost-found-backend.onrender.com
   ```
   
   (ใช้ URL ของ Backend ที่ได้จากขั้นตอนที่ 2)

5. **คลิก "Create Static Site"**
   - Render จะเริ่ม build
   - รอประมาณ 5-10 นาที
   - เมื่อเสร็จจะได้ URL เช่น: `https://lost-found-frontend.onrender.com`

---

## 🔄 ขั้นตอนสุดท้าย: อัพเดท CORS

1. **กลับไปที่ Backend Service**
   - ไปที่ Dashboard → เลือก `lost-found-backend`
   - ไปที่ **"Environment"**

2. **อัพเดท Environment Variables**
   ```bash
   FRONTEND_URL=https://lost-found-frontend.onrender.com
   CORS_ORIGIN=https://lost-found-frontend.onrender.com
   ```
   
   (ใช้ URL ของ Frontend ที่เพิ่งได้)

3. **บันทึกและ Redeploy**
   - คลิก **"Save Changes"**
   - Render จะ redeploy Backend อัตโนมัติ

---

## ✅ ทดสอบระบบ

1. **เปิด Frontend URL**
   - `https://lost-found-frontend.onrender.com`

2. **ทดสอบ Register**
   - สมัครสมาชิกใหม่
   - ใช้อีเมล: `test.user@bu.ac.th`

3. **ทดสอบ Login**
   - เข้าสู่ระบบ

4. **ทดสอบ Post Item**
   - ลงประกาศของหาย/เจอ
   - อัพโหลดรูป

5. **ทดสอบ Chat**
   - ทดสอบติดต่อผู้อื่น

---

## ⚠️ ข้อควรระวัง (Free Plan)

### Render Free Plan มีข้อจำกัด:

1. **Web Service (Backend)**
   - ⏰ Sleep หลังไม่มีคนใช้ 15 นาที
   - 🐌 ครั้งแรกที่เข้าจะช้า (15-30 วินาที)
   - 💾 RAM: 512MB
   - 🔄 750 ชั่วโมง/เดือน

2. **PostgreSQL Database**
   - 💽 Storage: 1GB
   - 🔄 หลัง 90 วัน จะถูกลบ (ต้อง backup)
   - ⚡ Performance จำกัด

3. **Static Site (Frontend)**
   - 📦 100GB Bandwidth/เดือน
   - ⚡ CDN Global

### แนะนำ:
- ใช้สำหรับ **Demo/Presentation** เท่านั้น
- **ไม่แนะนำ** สำหรับใช้งานจริง
- **Backup Database** เป็นประจำ

---

## 🔧 การอัพเดทโค้ด

เมื่อแก้ไขโค้ดใหม่:

1. **Push ขึ้น GitHub**
   ```bash
   git add .
   git commit -m "Update features"
   git push origin main
   ```

2. **Render จะ Auto Deploy**
   - Backend: ใช้เวลา 5-10 นาที
   - Frontend: ใช้เวลา 5-10 นาที

3. **หรือ Manual Deploy**
   - ไปที่ Dashboard → เลือก Service
   - คลิก **"Manual Deploy"** → **"Deploy latest commit"**

---

## 📊 ตรวจสอบ Logs

### Backend Logs:
1. ไปที่ Dashboard → `lost-found-backend`
2. คลิก **"Logs"** tab
3. ดู error/warning

### Frontend Logs:
1. ไปที่ Dashboard → `lost-found-frontend`
2. คลิก **"Logs"** tab
3. ดู build logs

---

## 🎯 สรุป URLs ที่ได้

```
🗄️  Database:     postgres://...external-url...
🔧 Backend API:   https://lost-found-backend.onrender.com
🎨 Frontend Web:  https://lost-found-frontend.onrender.com
```

---

## 🆘 แก้ปัญหา

### ปัญหา: Backend ไม่ทำงาน
- ✅ ตรวจสอบ Environment Variables
- ✅ ตรวจสอบ Database Connection
- ✅ ดู Logs หา error

### ปัญหา: Frontend ไม่เชื่อมต่อ Backend
- ✅ ตรวจสอบ `REACT_APP_API_URL`
- ✅ ตรวจสอบ CORS ใน Backend
- ✅ เปิด Browser Console ดู error

### ปัญหา: รูปภาพไม่โหลด
- ✅ Render Free Plan ไม่มี persistent storage
- ✅ ควรใช้ Cloudinary หรือ AWS S3 (แนะนำ)

### ปัญหา: Database หลุด
- ✅ ตรวจสอบ `DATABASE_URL` ว่าถูกต้อง
- ✅ ตรวจสอบว่า run schema แล้ว

---

## 💡 Tips

1. **Custom Domain** (ถ้ามี)
   - Settings → Custom Domain → เพิ่ม domain ของคุณ

2. **Environment Secrets**
   - อย่าใส่ secrets ใน code
   - ใช้ Environment Variables เสมอ

3. **Monitoring**
   - ตรวจสอบ Dashboard เป็นประจำ
   - ดู Metrics (CPU, Memory, Bandwidth)

4. **Backup Database**
   ```bash
   # ใช้ pg_dump backup database
   pg_dump <DATABASE_URL> > backup.sql
   ```

---

## 🎓 สำหรับนำเสนออาจารย์

### ขั้นตอนที่อาจารย์ทำ:

1. **เปิด URL Frontend**
   ```
   https://lost-found-frontend.onrender.com
   ```

2. **สมัครสมาชิก**
   - Email: `professor.test@bu.ac.th`
   - Password: อะไรก็ได้ (ขั้นต่ำ 6 ตัว)

3. **ทดสอบฟีเจอร์**
   - ✅ ลงประกาศของหาย
   - ✅ ค้นหาของ
   - ✅ ระบบ Matching
   - ✅ Chat
   - ✅ Notifications
   - ✅ Dark Mode
   - ✅ Multi-language (TH/EN)

---

## 📞 ติดต่อ Support

- 📧 Render Support: https://render.com/docs
- 💬 Community Forum: https://community.render.com

---

**สร้างโดย:** Lost & Found System Development Team
**อัพเดทล่าสุด:** {{ DATE }}
**GitHub:** https://github.com/Sax9452/lost-found

