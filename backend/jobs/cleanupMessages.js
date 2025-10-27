/**
 * Cleanup Job - Auto-delete chat rooms (including messages) after 30 minutes
 * ลบห้องแชททั้งหมดอัตโนมัติหลังจาก 30 นาที
 * 
 * เมื่อห้องแชทถูกลบแล้ว:
 * - ผู้ใช้ต้องกดติดต่อจากประกาศใหม่
 * - ระบบจะสร้างห้องแชทใหม่
 */

const { pool } = require('../config/database');
const cron = require('node-cron');

/**
 * ลบห้องแชทที่มีข้อความสุดท้ายเก่าเกิน 30 นาที
 */
async function cleanupOldChatRooms() {
  try {
    console.log('🧹 [Cleanup] Starting chat room cleanup...');
    
    const now = new Date();
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
    
    // หาห้องแชทที่มีข้อความล่าสุดเก่าเกิน 30 นาที
    const findOldRoomsQuery = `
      SELECT DISTINCT cr.id, cr.user1_id, cr.user2_id, 
             u1.username as user1_name, u2.username as user2_name,
             MAX(m.created_at) as last_message_time
      FROM chat_rooms cr
      LEFT JOIN messages m ON cr.id = m.chat_room_id
      LEFT JOIN users u1 ON cr.user1_id = u1.id
      LEFT JOIN users u2 ON cr.user2_id = u2.id
      GROUP BY cr.id, cr.user1_id, cr.user2_id, u1.username, u2.username
      HAVING MAX(m.created_at) < $1 OR MAX(m.created_at) IS NULL
    `;
    
    const oldRooms = await pool.query(findOldRoomsQuery, [thirtyMinutesAgo]);
    
    if (oldRooms.rows.length > 0) {
      console.log(`   📊 Found ${oldRooms.rows.length} old chat rooms to delete:`);
      
      for (const room of oldRooms.rows) {
        const lastMsg = room.last_message_time 
          ? new Date(room.last_message_time).toLocaleString('th-TH')
          : 'No messages';
        console.log(`      → Room ${room.id}: ${room.user1_name} ↔ ${room.user2_name} (Last: ${lastMsg})`);
      }
      
      // ลบห้องแชท (messages จะถูกลบอัตโนมัติด้วย ON DELETE CASCADE)
      const deleteRoomsQuery = `
        DELETE FROM chat_rooms
        WHERE id = ANY($1::int[])
        RETURNING id
      `;
      
      const roomIds = oldRooms.rows.map(r => r.id);
      const deletedRooms = await pool.query(deleteRoomsQuery, [roomIds]);
      
      console.log(`   ✅ Deleted ${deletedRooms.rows.length} chat rooms (and their messages)`);
      console.log(`   💡 Users will need to contact each other again from item listings`);
    } else {
      console.log(`   ℹ️ No old chat rooms to delete (all are within 30 minutes)`);
    }
    
    console.log(`🧹 [Cleanup] Completed at ${now.toLocaleString('th-TH')}\n`);
    
  } catch (error) {
    console.error('❌ [Cleanup] Error during cleanup:', error);
    console.error(error.stack);
  }
}

/**
 * เริ่ม Cron Job - รันทุก 5 นาที
 */
function startCleanupJob() {
  // รันทุก 5 นาที (*/5 * * * *)
  // หรือทุก 1 นาทีเพื่อทดสอบ (*/1 * * * *)
  const cronSchedule = '*/5 * * * *'; // ทุก 5 นาที
  
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║  🕐 Chat Cleanup Job Started                  ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log(`   📅 Schedule: Every 5 minutes`);
  console.log(`   ⏰ Will delete chat rooms older than 30 minutes`);
  console.log(`   💬 Users must contact each other again from items\n`);
  
  cron.schedule(cronSchedule, () => {
    cleanupOldChatRooms();
  });
  
  // รัน cleanup ทันทีเมื่อ start server (ทดสอบ)
  console.log('   🧪 Running initial cleanup...\n');
  cleanupOldChatRooms();
}

module.exports = {
  startCleanupJob,
  cleanupOldChatRooms
};

