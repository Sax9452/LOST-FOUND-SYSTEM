-- ============================================
-- Lost & Found Database Setup
-- สำหรับ PostgreSQL (pgAdmin 4)
-- ============================================

-- สร้าง Database (รันคำสั่งนี้ใน pgAdmin หรือ psql)
-- CREATE DATABASE lost_and_found;

-- เชื่อมต่อกับ database
-- \c lost_and_found

-- ลบตารางเก่า (ถ้ามี)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS chats CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ลบ ENUM types เก่า (ถ้ามี)
DROP TYPE IF EXISTS enum_users_role CASCADE;
DROP TYPE IF EXISTS enum_users_language CASCADE;
DROP TYPE IF EXISTS enum_items_type CASCADE;
DROP TYPE IF EXISTS enum_items_category CASCADE;
DROP TYPE IF EXISTS enum_items_status CASCADE;
DROP TYPE IF EXISTS enum_notifications_type CASCADE;

-- สร้าง ENUM types
CREATE TYPE enum_users_role AS ENUM ('user', 'admin');
CREATE TYPE enum_users_language AS ENUM ('en', 'th');
CREATE TYPE enum_items_type AS ENUM ('lost', 'found');
CREATE TYPE enum_items_category AS ENUM (
  'Electronics',
  'Documents', 
  'Clothes',
  'Accessories',
  'Keys',
  'Bags',
  'Books',
  'Jewelry',
  'Sports Equipment',
  'Other'
);
CREATE TYPE enum_items_status AS ENUM ('pending', 'active', 'matched', 'returned', 'archived');
CREATE TYPE enum_notifications_type AS ENUM ('match', 'message', 'status_update', 'admin');

-- ตาราง Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(30) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role enum_users_role DEFAULT 'user',
  verified BOOLEAN DEFAULT false,
  phone VARCHAR(20),
  profile_image VARCHAR(255),
  language enum_users_language DEFAULT 'th',
  notification_email BOOLEAN DEFAULT true,
  notification_push BOOLEAN DEFAULT true,
  notification_match_alerts BOOLEAN DEFAULT true,
  location VARCHAR(255),
  last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ตาราง Items
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type enum_items_type NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  category enum_items_category NOT NULL,
  date DATE NOT NULL,
  location VARCHAR(255) NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  images TEXT[],
  status enum_items_status DEFAULT 'pending',
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  matched_with_id UUID REFERENCES items(id) ON DELETE SET NULL,
  views INTEGER DEFAULT 0,
  keywords TEXT[],
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ตาราง Chats
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  participants UUID[],
  active BOOLEAN DEFAULT true,
  reported BOOLEAN DEFAULT false,
  report_reason TEXT,
  last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ตาราง Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ตาราง Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type enum_notifications_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  related_item_id UUID REFERENCES items(id) ON DELETE SET NULL,
  related_chat_id UUID REFERENCES chats(id) ON DELETE SET NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- สร้าง Indexes เพื่อเพิ่มประสิทธิภาพ
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

CREATE INDEX idx_items_type_status ON items(type, status);
CREATE INDEX idx_items_category ON items(category);
CREATE INDEX idx_items_owner ON items(owner_id);
CREATE INDEX idx_items_date ON items(date);
CREATE INDEX idx_items_keywords ON items USING GIN(keywords);

CREATE INDEX idx_chats_item ON chats(item_id);
CREATE INDEX idx_chats_participants ON chats USING GIN(participants);

CREATE INDEX idx_messages_chat ON messages(chat_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);

CREATE INDEX idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX idx_notifications_read ON notifications(recipient_id, read);

-- Function สำหรับอัพเดท updated_at อัตโนมัติ
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- สร้าง Triggers สำหรับอัพเดท updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chats_updated_at BEFORE UPDATE ON chats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ข้อมูลตัวอย่างสำหรับทดสอบ (ไม่บังคับ)
-- รหัสผ่านคือ: password123 (ถูก hash แล้ว)

-- INSERT INTO users (username, email, password, role, language) VALUES
-- ('admin', 'admin@example.com', '$2a$10$xQZX3fJ0YpAj7N5YFE/Z3.vK2vK2vK2vK2vK2vK2vK2vK2vK2vK', 'admin', 'th'),
-- ('user1', 'user1@example.com', '$2a$10$xQZX3fJ0YpAj7N5YFE/Z3.vK2vK2vK2vK2vK2vK2vK2vK2vK2vK', 'user', 'th');

-- ============================================
-- คำสั่งที่เป็นประโยชน์
-- ============================================

-- ดูตารางทั้งหมด
-- \dt

-- ดูโครงสร้างตาราง
-- \d users
-- \d items

-- ดูข้อมูลในตาราง
-- SELECT * FROM users;
-- SELECT * FROM items;

-- สร้าง Admin User (รัน query นี้หลังจากสมัครสมาชิก)
-- UPDATE users SET role = 'admin' WHERE email = 'your_email@example.com';

-- ลบข้อมูลทั้งหมด (ระวัง!)
-- TRUNCATE users, items, chats, messages, notifications RESTART IDENTITY CASCADE;

-- ============================================
-- เสร็จสิ้น!
-- ============================================

