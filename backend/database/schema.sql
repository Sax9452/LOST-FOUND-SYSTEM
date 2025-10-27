-- ลบ tables เก่าถ้ามี
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS chats CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- สร้างตาราง Users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(30) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    verified BOOLEAN DEFAULT false,
    phone VARCHAR(20),
    profile_image VARCHAR(255),
    language VARCHAR(5) DEFAULT 'en' CHECK (language IN ('en', 'th')),
    notification_email BOOLEAN DEFAULT true,
    notification_push BOOLEAN DEFAULT true,
    notification_match BOOLEAN DEFAULT true,
    location VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- สร้างตาราง Items
CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    type VARCHAR(10) NOT NULL CHECK (type IN ('lost', 'found')),
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    location VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    images TEXT[], -- Array of image paths
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('pending', 'active', 'matched', 'returned', 'archived')),
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    matched_with INTEGER REFERENCES items(id) ON DELETE SET NULL,
    views INTEGER DEFAULT 0,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- สร้างตาราง Chats
CREATE TABLE chats (
    id SERIAL PRIMARY KEY,
    item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    user1_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user2_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    active BOOLEAN DEFAULT true,
    reported BOOLEAN DEFAULT false,
    report_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- สร้างตาราง Messages
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- สร้างตาราง Notifications
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('match', 'message', 'status_update', 'admin')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
    related_chat_id INTEGER REFERENCES chats(id) ON DELETE CASCADE,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- สร้าง Indexes สำหรับการค้นหาที่เร็วขึ้น
CREATE INDEX idx_items_type ON items(type);
CREATE INDEX idx_items_category ON items(category);
CREATE INDEX idx_items_status ON items(status);
CREATE INDEX idx_items_owner ON items(owner_id);
CREATE INDEX idx_items_date ON items(date);
CREATE INDEX idx_items_created ON items(created_at);

CREATE INDEX idx_chats_item ON chats(item_id);
CREATE INDEX idx_chats_users ON chats(user1_id, user2_id);

CREATE INDEX idx_messages_chat ON messages(chat_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);

CREATE INDEX idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX idx_notifications_read ON notifications(read);

-- สร้าง Full Text Search Index สำหรับการค้นหา
CREATE INDEX idx_items_search ON items USING gin(to_tsvector('english', name || ' ' || description));

-- Function สำหรับอัพเดท updated_at อัตโนมัติ
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger สำหรับ Items
CREATE TRIGGER update_items_updated_at 
    BEFORE UPDATE ON items 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger สำหรับอัพเดท last_message_at ใน Chats
CREATE OR REPLACE FUNCTION update_chat_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chats 
    SET last_message_at = NEW.created_at 
    WHERE id = NEW.chat_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_chat_last_message_trigger
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_last_message();

-- Insert ข้อมูลตัวอย่าง (Optional)
-- INSERT INTO users (username, email, password, role) 
-- VALUES ('admin', 'admin@example.com', '$2a$10$encrypted_password', 'admin');

