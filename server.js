// server.js - FULL UPDATE

const express = require('express');
const admin = require('firebase-admin');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// --- 1. KẾT NỐI FIREBASE (Đã fix lỗi crash) ---
let serviceAccount;
try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } else {
        serviceAccount = require("./serviceAccountKey_hrm.json");
    }

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://hrm-company-default-rtdb.asia-southeast1.firebasedatabase.app"
    });
    console.log("✅ Firebase connected successfully!");
} catch (error) {
    console.error("❌ Firebase connection error:", error.message);
    process.exit(1);
}

const db = admin.database();

// --- 2. CẤU HÌNH SERVER ---
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// --- 3. ROUTES (GIAO DIỆN) ---
app.get('/', (req, res) => {
    res.render('index');
});

// --- 4. API ENDPOINTS (DỮ LIỆU) ---

// === A. MODULE PHÒNG BAN (DEPARTMENTS) ===
app.get('/api/departments', async (req, res) => {
    try {
        const snapshot = await db.ref('departments').once('value');
        res.json(snapshot.val() || {});
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/departments', async (req, res) => {
    try {
        const { key, name, desc, adminName } = req.body;
        const ref = key ? db.ref(`departments/${key}`) : db.ref('departments').push();
        
        await ref.set({ name, desc });
        
        // Ghi lịch sử
        await logHistory(adminName, key ? 'Sửa' : 'Thêm', 'Phòng ban', `Tên: ${name}`);
        
        res.json({ success: true, message: "Lưu phòng ban thành công!" });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.delete('/api/departments/:id', async (req, res) => {
    try {
        const { adminName } = req.body; // Lấy tên người xóa để ghi log
        await db.ref(`departments/${req.params.id}`).remove();
        await logHistory(adminName || 'Admin', 'Xóa', 'Phòng ban', `ID: ${req.params.id}`);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// === B. MODULE CHỨC VỤ (POSITIONS) - MỚI THÊM ===
app.get('/api/positions', async (req, res) => {
    try {
        const snapshot = await db.ref('positions').once('value');
        res.json(snapshot.val() || {});
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/positions', async (req, res) => {
    try {
        const { key, name, desc, adminName } = req.body;
        const ref = key ? db.ref(`positions/${key}`) : db.ref('positions').push();
        await ref.set({ name, desc });
        await logHistory(adminName, key ? 'Sửa' : 'Thêm', 'Chức vụ', `Tên: ${name}`);
        res.json({ success: true, message: "Lưu chức vụ thành công!" });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.delete('/api/positions/:id', async (req, res) => {
    try {
        const { adminName } = req.body;
        await db.ref(`positions/${req.params.id}`).remove();
        await logHistory(adminName || 'Admin', 'Xóa', 'Chức vụ', `ID: ${req.params.id}`);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// === C. MODULE NHÂN VIÊN (EMPLOYEES) - MỚI THÊM ===
app.get('/api/employees', async (req, res) => {
    try {
        const snapshot = await db.ref('employees').once('value');
        res.json(snapshot.val() || {});
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/employees', async (req, res) => {
    try {
        const { key, code, name, email, dept, pos, status, startDate, shift, adminName } = req.body;
        const ref = key ? db.ref(`employees/${key}`) : db.ref('employees').push();
        
        await ref.set({ code, name, email, dept, pos, status, startDate, shift });
        await logHistory(adminName, key ? 'Sửa' : 'Thêm', 'Nhân viên', `${name} (${code})`);
        
        res.json({ success: true, message: "Lưu nhân viên thành công!" });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.delete('/api/employees/:id', async (req, res) => {
    try {
        const { adminName } = req.body;
        await db.ref(`employees/${req.params.id}`).remove();
        await logHistory(adminName || 'Admin', 'Xóa', 'Nhân viên', `ID: ${req.params.id}`);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// --- 5. HÀM GHI LỊCH SỬ (HISTORY LOG) ---
async function logHistory(user, action, target, detail) {
    const time = new Date().toLocaleString('vi-VN');
    await db.ref('system_logs').push({
        time, user: user || 'Unknown', action, target, detail
    });
}

// --- 6. KHỞI ĐỘNG SERVER ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});