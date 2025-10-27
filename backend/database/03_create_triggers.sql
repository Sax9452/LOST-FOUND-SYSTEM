-- ==========================================
-- STEP 3: Create Triggers
-- ==========================================

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

-- Success message
SELECT 'Triggers created successfully!' AS result;

