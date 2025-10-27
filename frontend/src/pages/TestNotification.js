import React, { useState } from 'react';
import axios from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

const TestNotification = () => {
  const { user } = useAuth();
  const { socket } = useApp();
  const [sending, setSending] = useState(false);
  const [socketStatus, setSocketStatus] = useState({});

  const checkSocketStatus = () => {
    if (socket) {
      setSocketStatus({
        connected: socket.connected,
        id: socket.id,
        userId: user?.id,
        room: `user_${user?.id}`
      });
    } else {
      setSocketStatus({
        connected: false,
        error: 'Socket not initialized'
      });
    }
  };

  const sendTestNotification = async () => {
    setSending(true);
    try {
      const response = await axios.post('/test/notification');
      console.log('✅ Test notification sent:', response.data);
      toast.success('ส่งการแจ้งเตือนทดสอบแล้ว! ดู Console ด้วย');
    } catch (error) {
      console.error('❌ Error sending test notification:', error);
      toast.error('ส่งการแจ้งเตือนไม่สำเร็จ');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="card">
          <h1 className="text-3xl font-bold mb-6">🧪 ทดสอบระบบ Notification</h1>
          
          {/* User Info */}
          <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <h2 className="font-semibold mb-2">ข้อมูลผู้ใช้:</h2>
            <p>Username: {user?.username}</p>
            <p>User ID: {user?.id}</p>
            <p>Email: {user?.email}</p>
          </div>

          {/* Socket Status */}
          <div className="mb-6">
            <button
              onClick={checkSocketStatus}
              className="btn btn-secondary mb-3"
            >
              🔍 ตรวจสอบสถานะ Socket.IO
            </button>
            
            {Object.keys(socketStatus).length > 0 && (
              <div className={`p-4 rounded-lg ${socketStatus.connected ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
                <h3 className="font-semibold mb-2">
                  {socketStatus.connected ? '✅ Socket เชื่อมต่อแล้ว' : '❌ Socket ไม่ได้เชื่อมต่อ'}
                </h3>
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(socketStatus, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Test Button */}
          <div className="mb-6">
            <button
              onClick={sendTestNotification}
              disabled={sending}
              className="btn btn-primary w-full text-lg py-4"
            >
              {sending ? '📤 กำลังส่ง...' : '🔔 ส่งการแจ้งเตือนทดสอบ'}
            </button>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">📝 วิธีทดสอบ:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>กด "ตรวจสอบสถานะ Socket.IO" ก่อน</li>
              <li>ถ้า Socket เชื่อมต่อแล้ว (✅) → กด "ส่งการแจ้งเตือนทดสอบ"</li>
              <li>จะเห็น popup ขึ้นมุมขวาบนทันที</li>
              <li>เปิด Browser Console (F12) ดู log:</li>
              <ul className="list-disc list-inside ml-4 mt-1">
                <li><code>✅ Socket connected</code></li>
                <li><code>🔔 NOTIFICATION RECEIVED</code></li>
              </ul>
              <li>เปิด Backend Console ดู log:</li>
              <ul className="list-disc list-inside ml-4 mt-1">
                <li><code>🧪 TEST: Sending test notification</code></li>
                <li><code>📡 Sending notification to room: user_X</code></li>
                <li><code>✅ Notification sent</code></li>
              </ul>
            </ol>
          </div>

          {/* Common Issues */}
          <div className="mt-6 bg-yellow-50 dark:bg-yellow-900 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">⚠️ ถ้าไม่ทำงาน:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Socket ไม่เชื่อมต่อ → Refresh หน้าเว็บ</li>
              <li>ไม่เห็น popup → เช็ค Console ว่ามี error ไหม</li>
              <li>Backend ไม่ส่ง → เช็ค Backend Console</li>
              <li>Room name ไม่ตรงกัน → ต้องเป็น <code>user_&#123;userId&#125;</code></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestNotification;

