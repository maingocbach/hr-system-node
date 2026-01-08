const express = require('express');
const admin = require('firebase-admin');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

// CẤU HÌNH PORT: Dùng biến môi trường (cho Render) hoặc mặc định 3000 (cho Local)
const PORT = process.env.PORT || 3000;

// --- 1. CẤU HÌNH FIREBASE ADMIN ---
let serviceAccount;

try {
    // Kiểm tra: Nếu chạy trên Render (Online) -> Dùng biến môi trường
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } 
    // Nếu chạy trên máy tính (Local) -> Dùng file JSON
    else {
        serviceAccount = require("./serviceAccountKey_hrm.json");
    }

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        // URL Database mới của bạn (Server Singapore)
        databaseURL: "https://hrm-company-default-rtdb.asia-southeast1.firebasedatabase.app"
    });

    console.log("✅ Firebase Admin đã kết nối thành công!");
} catch (error) {
    console.error("❌ Lỗi kết nối Firebase:", error.message);
}

const db = admin.database();

// --- 2. CẤU HÌNH SERVER ---
app.set('view engine', 'ejs'); // Sử dụng EJS
app.use(express.static(path.join(__dirname, 'public'))); // Thư mục file tĩnh
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// --- 3. ROUTE (Đường dẫn trang web) ---

// Trang chủ (Dashboard Admin)
app.get('/', (req, res) => {
    res.render('index'); 
});

// --- API KHU VỰC PHÒNG BAN ---

// API: Lấy danh sách phòng ban
app.get('/api/departments', async (req, res) => {
    try {
        const snapshot = await db.ref('departments').once('value');
        const data = snapshot.val() || {};
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API: Lưu Phòng Ban (Thêm hoặc Sửa)
app.post('/api/departments', async (req, res) => {
    const { key, name, desc, adminName } = req.body;
    
    // Validate dữ liệu
    if (!name) return res.status(400).json({ success: false, message: "Thiếu tên phòng ban" });

    try {
        const isEdit = !!key; // Có key là Sửa, không có là Thêm
        const refPath = isEdit ? `departments/${key}` : `departments`;
        
        if (isEdit) {
            await db.ref(refPath).update({ name, desc });
        } else {
            // Dùng push() để Firebase tự sinh Key ngẫu nhiên (An toàn hơn Date.now)
            await db.ref(refPath).push({ name, desc });
        }

        // TỰ ĐỘNG GHI LOG
        await db.ref('system_logs').push({
            timestamp: new Date().toLocaleString('vi-VN'),
            admin: adminName || "Admin",
            action: isEdit ? "Sửa" : "Thêm",
            table: "Phòng Ban",
            target: name,
            details: `Thao tác qua Node.js Server: ${desc || ''}`
        });

        res.json({ success: true, message: isEdit ? "Cập nhật thành công!" : "Thêm mới thành công!" });
    } catch (error) {
        console.error("Lỗi:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// API: Xóa Phòng Ban
app.delete('/api/departments/:id', async (req, res) => {
    const { id } = req.params;
    const { name, adminName } = req.body;

    try {
        await db.ref(`departments/${id}`).remove();

        // Ghi Log Xóa
        await db.ref('system_logs').push({
            timestamp: new Date().toLocaleString('vi-VN'),
            admin: adminName || "Admin",
            action: "Xóa",
            table: "Phòng Ban",
            target: name || id,
            details: "Đã xóa khỏi hệ thống qua Node.js"
        });

        res.json({ success: true, message: "Đã xóa thành công!" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- 4. KHỞI ĐỘNG SERVER ---
app.listen(PORT, () => {
    console.log(`Server đang chạy tại: http://localhost:${PORT}`);
});