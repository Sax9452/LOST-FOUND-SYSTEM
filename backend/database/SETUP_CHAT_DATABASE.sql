-- ==========================================
-- COMPLETE CHAT SYSTEM DATABASE SETUP
-- Lost & Found - Real-time Chat Module
-- ==========================================
-- Run this ENTIRE file in pgAdmin 4 Query Tool
-- ==========================================

-- ==========================================
-- STEP 1: CLEAN UP (ลบของเก่าทั้งหมด)
-- ==========================================

-- Drop existing tables (ถ้ามี)
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS chat_rooms CASCADE;

-- Drop existing functions (ถ้ามี)
DROP FUNCTION IF EXISTS get_or_create_chat_room(INTEGER, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS update_chat_room_timestamp() CASCADE;

-- Drop existing views (ถ้ามี)
DROP VIEW IF EXISTS chat_list_view CASCADE;

-- Drop existing triggers (ถ้ามี)
DROP TRIGGER IF EXISTS trigger_update_chat_room_timestamp ON messages;

SELECT '✅ Step 1: Cleanup complete!' AS status;

-- ==========================================
-- STEP 2: CREATE TABLES
-- ==========================================

-- Table: chat_rooms
CREATE TABLE chat_rooms (
  id SERIAL PRIMARY KEY,
  user1_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Unique constraint: prevent duplicate chat rooms
  CONSTRAINT unique_chat_users UNIQUE (user1_id, user2_id),
  
  -- Check constraint: ensure user1_id is always less than user2_id
  CONSTRAINT check_user_order CHECK (user1_id < user2_id)
);

SELECT '✅ Step 2.1: Table chat_rooms created!' AS status;

-- Table: messages
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  chat_room_id INTEGER NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP
);

SELECT '✅ Step 2.2: Table messages created!' AS status;

-- ==========================================
-- STEP 3: CREATE INDEXES (เพิ่มความเร็ว)
-- ==========================================

CREATE INDEX idx_chat_rooms_user1 ON chat_rooms(user1_id);
CREATE INDEX idx_chat_rooms_user2 ON chat_rooms(user2_id);
CREATE INDEX idx_chat_rooms_updated_at ON chat_rooms(updated_at DESC);

CREATE INDEX idx_messages_chat_room ON messages(chat_room_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_is_read ON messages(is_read) WHERE is_read = FALSE;

SELECT '✅ Step 3: Indexes created!' AS status;

-- ==========================================
-- STEP 4: CREATE FUNCTIONS
-- ==========================================

-- Function: Get or create chat room between two users
CREATE OR REPLACE FUNCTION get_or_create_chat_room(
  p_user1_id INTEGER, 
  p_user2_id INTEGER
)
RETURNS INTEGER AS $$
DECLARE
  v_chat_room_id INTEGER;
  v_min_user_id INTEGER;
  v_max_user_id INTEGER;
BEGIN
  -- Ensure canonical ordering (smaller ID first)
  IF p_user1_id < p_user2_id THEN
    v_min_user_id := p_user1_id;
    v_max_user_id := p_user2_id;
  ELSE
    v_min_user_id := p_user2_id;
    v_max_user_id := p_user1_id;
  END IF;
  
  -- Try to find existing chat room
  SELECT id INTO v_chat_room_id
  FROM chat_rooms
  WHERE user1_id = v_min_user_id AND user2_id = v_max_user_id;
  
  -- If not found, create new chat room
  IF v_chat_room_id IS NULL THEN
    INSERT INTO chat_rooms (user1_id, user2_id)
    VALUES (v_min_user_id, v_max_user_id)
    RETURNING id INTO v_chat_room_id;
  END IF;
  
  RETURN v_chat_room_id;
END;
$$ LANGUAGE plpgsql;

SELECT '✅ Step 4.1: Function get_or_create_chat_room created!' AS status;

-- Function: Update chat room timestamp when new message is sent
CREATE OR REPLACE FUNCTION update_chat_room_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_rooms 
  SET updated_at = NOW() 
  WHERE id = NEW.chat_room_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

SELECT '✅ Step 4.2: Function update_chat_room_timestamp created!' AS status;

-- ==========================================
-- STEP 5: CREATE TRIGGERS
-- ==========================================

-- Trigger: Auto-update chat_room.updated_at when new message is inserted
CREATE TRIGGER trigger_update_chat_room_timestamp
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_chat_room_timestamp();

SELECT '✅ Step 5: Triggers created!' AS status;

-- ==========================================
-- STEP 6: CREATE VIEWS (สำหรับ query ที่ซับซ้อน)
-- ==========================================

-- View: Chat list with last message and unread counts
CREATE OR REPLACE VIEW chat_list_view AS
SELECT 
  cr.id,
  cr.user1_id,
  cr.user2_id,
  cr.created_at,
  cr.updated_at,
  u1.username AS user1_username,
  u1.email AS user1_email,
  u2.username AS user2_username,
  u2.email AS user2_email,
  m.message_text AS last_message,
  m.created_at AS last_message_time,
  m.sender_id AS last_message_sender_id,
  (SELECT COUNT(*) FROM messages WHERE chat_room_id = cr.id AND is_read = FALSE AND sender_id != cr.user1_id) AS unread_count_user1,
  (SELECT COUNT(*) FROM messages WHERE chat_room_id = cr.id AND is_read = FALSE AND sender_id != cr.user2_id) AS unread_count_user2
FROM chat_rooms cr
LEFT JOIN users u1 ON cr.user1_id = u1.id
LEFT JOIN users u2 ON cr.user2_id = u2.id
LEFT JOIN LATERAL (
  SELECT message_text, created_at, sender_id
  FROM messages
  WHERE chat_room_id = cr.id
  ORDER BY created_at DESC
  LIMIT 1
) m ON true
ORDER BY cr.updated_at DESC;

SELECT '✅ Step 6: Views created!' AS status;

-- ==========================================
-- STEP 7: VERIFY INSTALLATION
-- ==========================================

-- Check tables
SELECT 
  'Tables' AS component, 
  COUNT(*) AS count,
  string_agg(table_name, ', ') AS items
FROM information_schema.tables 
WHERE table_name IN ('chat_rooms', 'messages')
GROUP BY 1;

-- Check functions
SELECT 
  'Functions' AS component,
  COUNT(*) AS count,
  string_agg(routine_name, ', ') AS items
FROM information_schema.routines 
WHERE routine_name IN ('get_or_create_chat_room', 'update_chat_room_timestamp')
GROUP BY 1;

-- Check views
SELECT 
  'Views' AS component,
  COUNT(*) AS count,
  string_agg(table_name, ', ') AS items
FROM information_schema.views 
WHERE table_name = 'chat_list_view'
GROUP BY 1;

-- Check indexes
SELECT 
  'Indexes' AS component,
  COUNT(*) AS count
FROM pg_indexes 
WHERE tablename IN ('chat_rooms', 'messages')
GROUP BY 1;

SELECT '✅ Step 7: Verification complete!' AS status;

-- ==========================================
-- STEP 8: TEST FUNCTION
-- ==========================================

-- Test the get_or_create_chat_room function
-- (This should work if you have at least 2 users in your database)
SELECT 
  '✅ Step 8: Testing function...' AS status,
  get_or_create_chat_room(
    (SELECT id FROM users ORDER BY id LIMIT 1 OFFSET 0),
    (SELECT id FROM users ORDER BY id LIMIT 1 OFFSET 1)
  ) AS test_chat_room_id;

-- ==========================================
-- INSTALLATION COMPLETE! 🎉
-- ==========================================

SELECT '🎉 CHAT DATABASE SETUP COMPLETE!' AS status;
SELECT 'Next steps:' AS instruction_1;
SELECT '1. Restart your backend server' AS instruction_2;
SELECT '2. Test the Message Owner button' AS instruction_3;
SELECT '3. Start chatting in real-time!' AS instruction_4;

-- ==========================================
-- NOTES:
-- ==========================================
-- 1. This script is idempotent (safe to run multiple times)
-- 2. All old data will be deleted when you run this
-- 3. Make sure you have at least 2 users in your database
-- 4. Tables created: chat_rooms, messages
-- 5. Functions created: get_or_create_chat_room, update_chat_room_timestamp
-- 6. Triggers created: trigger_update_chat_room_timestamp
-- 7. Views created: chat_list_view
-- 8. Indexes created: 7 indexes for performance
-- ==========================================

