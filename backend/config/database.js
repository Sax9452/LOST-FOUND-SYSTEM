/**
 * MySQL Database Connection
 * สำหรับเชื่อมต่อกับ MySQL database จาก XAMPP
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

// สร้าง connection pool สำหรับประสิทธิภาพที่ดีกว่า
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'lostfound',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  // Add connection timeout
  connectTimeout: 10000,
  // Enable multiple statements (if needed)
  multipleStatements: false
});

// Log connection config (without password)
console.log('📊 Database Config:', {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  database: process.env.DB_NAME || 'lostfound',
  password: process.env.DB_PASSWORD ? '***' : '(empty)'
});

// ทดสอบการเชื่อมต่อ
pool.getConnection()
  .then(connection => {
    console.log('✅ Connected to MySQL database');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Database connection error:', err.message);
    console.error('Please make sure:');
    console.error('1. XAMPP MySQL is running');
    console.error('2. Database "lostfound" exists (or create it)');
    console.error('3. Check DB credentials in .env file');
  });

module.exports = pool;

