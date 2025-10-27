-- ==========================================
-- Real-time Chat System Schema
-- ==========================================

-- Chat Rooms Table (1-to-1 private chat)
CREATE TABLE IF NOT EXISTS chat_rooms (
  id SERIAL PRIMARY KEY,
  user1_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Ensure unique combination (prevent duplicate rooms)
  CONSTRAINT unique_chat_users UNIQUE (user1_id, user2_id),
  
  -- Ensure user1_id < user2_id (canonical ordering)
  CONSTRAINT check_user_order CHECK (user1_id < user2_id)
);

-- Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  chat_room_id INTEGER NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  
  -- Indexes for performance
  CONSTRAINT fk_chat_room FOREIGN KEY (chat_room_id) REFERENCES chat_rooms(id),
  CONSTRAINT fk_sender FOREIGN KEY (sender_id) REFERENCES users(id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_chat_rooms_user1 ON chat_rooms(user1_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_user2 ON chat_rooms(user2_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_room ON messages(chat_room_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read) WHERE is_read = FALSE;

-- Function to update chat_room updated_at on new message
CREATE OR REPLACE FUNCTION update_chat_room_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_rooms 
  SET updated_at = NOW() 
  WHERE id = NEW.chat_room_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update chat_room timestamp
DROP TRIGGER IF EXISTS trigger_update_chat_room_timestamp ON messages;
CREATE TRIGGER trigger_update_chat_room_timestamp
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_chat_room_timestamp();

-- View for chat list with last message
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

-- ==========================================
-- Helper Functions
-- ==========================================

-- Function to get or create chat room between two users
CREATE OR REPLACE FUNCTION get_or_create_chat_room(p_user1_id INTEGER, p_user2_id INTEGER)
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
  
  -- Try to find existing room
  SELECT id INTO v_chat_room_id
  FROM chat_rooms
  WHERE user1_id = v_min_user_id AND user2_id = v_max_user_id;
  
  -- If not found, create new room
  IF v_chat_room_id IS NULL THEN
    INSERT INTO chat_rooms (user1_id, user2_id)
    VALUES (v_min_user_id, v_max_user_id)
    RETURNING id INTO v_chat_room_id;
  END IF;
  
  RETURN v_chat_room_id;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- Sample Queries (for testing)
-- ==========================================

-- Get all chat rooms for a user
-- SELECT * FROM chat_list_view WHERE user1_id = 1 OR user2_id = 1;

-- Get unread message count for a user in a specific chat
-- SELECT COUNT(*) FROM messages WHERE chat_room_id = 1 AND sender_id != 1 AND is_read = FALSE;

-- Mark all messages as read in a chat room
-- UPDATE messages SET is_read = TRUE, read_at = NOW() WHERE chat_room_id = 1 AND sender_id != 1 AND is_read = FALSE;

