# 🎓 คู่มือส่งโปรเจคให้อาจารย์

## 📦 **3 วิธีส่งโปรเจคให้อาจารย์**

---

## ✅ **วิธีที่ 1: Deploy ขึ้น Cloud (แนะนำที่สุด!) ⭐**

> **อาจารย์เปิด URL ได้เลย ไม่ต้องติดตั้งอะไร**

### **🚀 ขั้นตอนการ Deploy:**

#### **A. Deploy Backend + Database (Railway.app)**

1. **สมัคร Railway.app:**
   - ไปที่ https://railway.app
   - สมัครด้วย GitHub account (ฟรี)

2. **Deploy Backend:**
   ```bash
   # 1. Push โปรเจคขึ้น GitHub (ถ้ายังไม่ได้ push)
   git init
   git add .
   git commit -m "Initial commit"git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main

   # 2. ไปที่ Railway.app → New Project → Deploy from GitHub
   # 3. เลือก repo ของคุณ
   # 4. เลือก folder: backend
   ```

3. **เพิ่ม PostgreSQL:**
   - คลิก "New" → "Database" → "PostgreSQL"
   - Railway จะสร้าง database ให้อัตโนมัติ

4. **ตั้งค่า Environment Variables:**
   ```
   NODE_ENV=production
   JWT_SECRET=your_secret_key_here_change_this
   JWT_REFRESH_SECRET=your_refresh_secret_change_this
   FRONTEND_URL=https://your-frontend-url.vercel.app
   ```
   **Database URL จะถูกเพิ่มอัตโนมัติ**

5. **Deploy:**
   - Railway จะ deploy อัตโนมัติ
   - รอประมาณ 2-3 นาที
   - คุณจะได้ URL: `https://your-app.up.railway.app`

---

#### **B. Deploy Frontend (Vercel)**

1. **Build Frontend:**
   ```bash
   cd frontend
   npm run build
   ```

2. **อัปเดต API URL:**
   - สร้างไฟล์ `frontend/.env.production`:
   ```env
   REACT_APP_API_URL=https://your-backend.up.railway.app
   REACT_APP_SOCKET_URL=https://your-backend.up.railway.app
   ```

3. **Deploy:**
   ```bash
   # ติดตั้ง Vercel CLI
   npm install -g vercel

   # Deploy
   cd frontend
   vercel --prod
   ```
   - ตอบคำถามตามที่ Vercel ถาม
   - คุณจะได้ URL: `https://your-app.vercel.app`

---

#### **C. ส่ง URL ให้อาจารย์:**

```
🌐 เว็บไซต์: https://your-app.vercel.app
🔐 ข้อมูล Login ทดสอบ:
   Email: test@bu.ac.th
   Password: 123456
```

---

### **📊 ข้อดี - ข้อเสีย:**

| ข้อดี | ข้อเสีย |
|-------|---------|
| ✅ อาจารย์เปิด URL ได้เลย | ❌ ต้องใช้อินเทอร์เน็ต |
| ✅ ไม่ต้องติดตั้งอะไร | ❌ Setup ครั้งแรกใช้เวลา 30-60 นาที |
| ✅ ฟรี (สำหรับ demo) | |
| ✅ HTTPS อัตโนมัติ | |
| ✅ ทำงาน 24/7 | |
| ✅ ใช้ได้ทุกเครื่อง (PC, Mac, Mobile) | |

---

## 🐳 **วิธีที่ 2: Docker (อาจารย์ติดตั้ง Docker Desktop)**

> **อาจารย์ติดตั้งแค่ Docker Desktop แล้วรันคำสั่งเดียว**

### **🔧 เตรียมโปรเจค:**

1. **สร้างไฟล์ `docker-compose.production.yml`:**
   ```yaml
   version: '3.8'

   services:
     postgres:
       image: postgres:15
       environment:
         POSTGRES_DB: lost_and_found
         POSTGRES_USER: postgres
         POSTGRES_PASSWORD: postgres123
       volumes:
         - postgres_data:/var/lib/postgresql/data
         - ./database_setup.sql:/docker-entrypoint-initdb.d/init.sql
       ports:
         - "5432:5432"
       healthcheck:
         test: ["CMD-SHELL", "pg_isready -U postgres"]
         interval: 10s
         timeout: 5s
         retries: 5

     backend:
       build: ./backend
       environment:
         NODE_ENV: production
         PORT: 5000
         DATABASE_URL: postgresql://postgres:postgres123@postgres:5432/lost_and_found
         JWT_SECRET: your_jwt_secret_change_this
         JWT_REFRESH_SECRET: your_refresh_secret_change_this
         FRONTEND_URL: http://localhost:3000
       ports:
         - "5000:5000"
       depends_on:
         postgres:
           condition: service_healthy
       restart: unless-stopped

     frontend:
       build: ./frontend
       ports:
         - "3000:80"
       depends_on:
         - backend
       restart: unless-stopped

   volumes:
     postgres_data:
   ```

2. **สร้าง `backend/Dockerfile.production`:**
   ```dockerfile
   FROM node:18-alpine

   WORKDIR /app

   COPY package*.json ./
   RUN npm ci --only=production

   COPY . .

   EXPOSE 5000

   CMD ["node", "server.js"]
   ```

3. **สร้าง `frontend/Dockerfile.production`:**
   ```dockerfile
   FROM node:18-alpine as build

   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   COPY . .
   RUN npm run build

   FROM nginx:alpine
   COPY --from=build /app/build /usr/share/nginx/html
   COPY nginx.conf /etc/nginx/conf.d/default.conf
   EXPOSE 80
   CMD ["nginx", "-g", "daemon off;"]
   ```

4. **สร้าง `frontend/nginx.conf`:**
   ```nginx
   server {
       listen 80;
       server_name localhost;
       root /usr/share/nginx/html;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       location /api {
           proxy_pass http://backend:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       location /socket.io {
           proxy_pass http://backend:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "upgrade";
       }
   }
   ```

5. **สร้าง `README_FOR_TEACHER.md`:**
   ```markdown
   # Lost & Found System - คู่มือสำหรับอาจารย์

   ## วิธีรันโปรเจค (ใช้เวลา 5 นาที)

   ### ขั้นตอนที่ 1: ติดตั้ง Docker Desktop
   1. Download Docker Desktop: https://www.docker.com/products/docker-desktop
   2. ติดตั้งและเปิด Docker Desktop
   3. รอให้ Docker เริ่มทำงาน (เห็น icon สีเขียว)

   ### ขั้นตอนที่ 2: รันโปรเจค
   1. เปิด Terminal/PowerShell
   2. ไปที่ folder โปรเจค:
      ```
      cd path/to/project
      ```
   3. รันคำสั่ง:
      ```
      docker-compose -f docker-compose.production.yml up
      ```
   4. รอประมาณ 2-3 นาที

   ### ขั้นตอนที่ 3: เปิดเว็บไซต์
   - เปิดเบราว์เซอร์: http://localhost:3000
   - ใช้งานได้เลย!

   ## ข้อมูล Login ทดสอบ
   - Email: test@bu.ac.th
   - Password: 123456

   ## หยุดการทำงาน
   กด `Ctrl+C` ใน Terminal
   ```

6. **สร้าง `RUN.bat` (สำหรับ Windows):**
   ```bat
   @echo off
   echo ========================================
   echo   Lost & Found System
   echo   กำลังเริ่มระบบ...
   echo ========================================
   echo.

   docker-compose -f docker-compose.production.yml up

   pause
   ```

7. **Zip ทั้งโปรเจค:**
   ```
   lost-and-found-system.zip
   ├── README_FOR_TEACHER.md
   ├── RUN.bat
   ├── docker-compose.production.yml
   ├── database_setup.sql
   ├── backend/
   ├── frontend/
   └── ...
   ```

### **📋 ส่งให้อาจารย์:**
- ไฟล์ `lost-and-found-system.zip`
- ไฟล์ `README_FOR_TEACHER.md`

### **👨‍🏫 อาจารย์ทำ:**
1. แตก zip
2. ติดตั้ง Docker Desktop (ครั้งเดียว)
3. Double-click `RUN.bat`
4. เปิด http://localhost:3000

### **📊 ข้อดี - ข้อเสีย:**

| ข้อดี | ข้อเสีย |
|-------|---------|
| ✅ รันได้ทันที (ติดตั้ง Docker ครั้งเดียว) | ❌ ต้องติดตั้ง Docker Desktop (~500MB) |
| ✅ ไม่ต้องติดตั้ง Node.js, PostgreSQL | ❌ ใช้ RAM ประมาณ 1-2GB |
| ✅ ทำงานบน Windows, Mac, Linux | |
| ✅ Database + Backend + Frontend ในที่เดียว | |
| ✅ ไม่ต้องใช้อินเทอร์เน็ต | |

---

## 💿 **วิธีที่ 3: Portable Package (ไม่แนะนำ)**

> **Package ทุกอย่างเป็น .exe (Windows only)**

### **ข้อจำกัด:**
- ❌ ใช้ได้แค่ Windows
- ❌ ขนาดไฟล์ใหญ่มาก (>500MB)
- ❌ Setup ซับซ้อน
- ❌ ไม่ค่อยเหมาะกับโปรเจค Web

**→ ไม่แนะนำวิธีนี้**

---

## 🎯 **สรุปและแนะนำ:**

| วิธี | เหมาะกับ | ความยาก | ระยะเวลา |
|------|----------|---------|----------|
| **1. Deploy to Cloud** ⭐ | **ส่งอาจารย์ดูได้ทันที** | ⭐⭐⭐ ปานกลาง | Setup 30-60 นาที (ครั้งเดียว) |
| **2. Docker** | อาจารย์มี Docker Desktop | ⭐⭐ ง่าย | Setup 15 นาที + ติดตั้ง Docker |
| **3. Portable** | ไม่แนะนำ | ⭐⭐⭐⭐⭐ ยากมาก | หลายชั่วโมง |

---

## 🌟 **คำแนะนำสุดท้าย:**

### **ถ้าอาจารย์มีอินเทอร์เน็ต:**
→ ใช้ **วิธีที่ 1 (Deploy to Cloud)** ✅
- อาจารย์เปิด URL ได้เลย
- ไม่ต้องติดตั้งอะไร
- ทำงานได้ทุกเครื่อง

### **ถ้าอาจารย์ไม่มีอินเทอร์เน็ต:**
→ ใช้ **วิธีที่ 2 (Docker)** ✅
- ติดตั้ง Docker Desktop ครั้งเดียว
- รันคำสั่งเดียวเสร็จ
- ทำงานได้ offline

---

## 📞 **ต้องการความช่วยเหลือ?**

ติดปัญหาตรงไหน ให้ผมช่วยได้เลยครับ! 🙏

