-- ==========================================
-- STEP 2: Create Functions
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

-- Success message
SELECT 'Function created successfully!' AS result;

-- Test the function
SELECT get_or_create_chat_room(1, 2) AS test_chat_room_id;

