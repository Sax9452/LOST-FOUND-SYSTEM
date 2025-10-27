-- =====================================================
-- Add UNIQUE Constraint to Chats Table
-- ป้องกันการสร้างแชทซ้ำระหว่าง users เดียวกันสำหรับ item เดียวกัน
-- =====================================================

-- สร้าง function เพื่อจัดเรียง user IDs ก่อนเช็ค uniqueness
CREATE OR REPLACE FUNCTION sort_user_ids(user1 INTEGER, user2 INTEGER)
RETURNS TABLE(min_id INTEGER, max_id INTEGER)
AS $$
BEGIN
    RETURN QUERY SELECT 
        LEAST(user1, user2) as min_id,
        GREATEST(user1, user2) as max_id;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- เพิ่ม generated column สำหรับ sorted user IDs
ALTER TABLE chats 
ADD COLUMN IF NOT EXISTS user_min_id INTEGER GENERATED ALWAYS AS (LEAST(user1_id, user2_id)) STORED,
ADD COLUMN IF NOT EXISTS user_max_id INTEGER GENERATED ALWAYS AS (GREATEST(user1_id, user2_id)) STORED;

-- สร้าง UNIQUE constraint
-- ป้องกันการมี chat มากกว่า 1 chat สำหรับ item_id + user คู่เดียวกัน
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_chat_users_item 
ON chats (item_id, user_min_id, user_max_id);

-- เพิ่ม indexes สำหรับการค้นหาที่เร็วขึ้น
CREATE INDEX IF NOT EXISTS idx_chats_user1 ON chats(user1_id);
CREATE INDEX IF NOT EXISTS idx_chats_user2 ON chats(user2_id);
CREATE INDEX IF NOT EXISTS idx_chats_item ON chats(item_id);
CREATE INDEX IF NOT EXISTS idx_chats_last_message ON chats(last_message_at DESC);

-- เพิ่ม index สำหรับ messages ที่ยังไม่อ่าน
CREATE INDEX IF NOT EXISTS idx_messages_unread 
ON messages(chat_id, read) 
WHERE read = false;

-- เพิ่ม index สำหรับ full-text search ใน items
CREATE INDEX IF NOT EXISTS idx_items_search 
ON items USING GIN (to_tsvector('english', name || ' ' || description));

-- เพิ่ม index สำหรับการกรองตาม status และ type
CREATE INDEX IF NOT EXISTS idx_items_status_type ON items(status, type);
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
CREATE INDEX IF NOT EXISTS idx_items_date ON items(date);
CREATE INDEX IF NOT EXISTS idx_items_created_at ON items(created_at DESC);

-- เพิ่ม index สำหรับ notifications
CREATE INDEX IF NOT EXISTS idx_notifications_recipient 
ON notifications(recipient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_unread 
ON notifications(recipient_id, read) 
WHERE read = false;

-- แสดงข้อมูลการสร้าง constraints และ indexes
DO $$
BEGIN
    RAISE NOTICE 'สร้าง UNIQUE constraint และ indexes สำเร็จ!';
    RAISE NOTICE '✅ Unique constraint: idx_unique_chat_users_item';
    RAISE NOTICE '✅ Chat indexes: 4 indexes';
    RAISE NOTICE '✅ Message indexes: 1 index';
    RAISE NOTICE '✅ Item indexes: 5 indexes';
    RAISE NOTICE '✅ Notification indexes: 2 indexes';
END $$;

