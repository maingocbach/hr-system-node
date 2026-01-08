// FILE: server.js (FULL 100%)

const express = require('express');
const admin = require('firebase-admin');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. KẾT NỐI FIREBASE
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
}

const db = admin.database();

// 2. CẤU HÌNH SERVER
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 3. ROUTES
app.get('/', (req, res) => res.render('index'));

// 4. API ENDPOINTS

// --- MODULE PHÒNG BAN ---
app.get('/api/departments', async (req, res) => {
    const s = await db.ref('departments').once('value'); res.json(s.val() || {});
});
app.post('/api/departments', async (req, res) => {
    const { key, name, desc, adminName } = req.body;
    const ref = key ? db.ref(`departments/${key}`) : db.ref('departments').push();
    await ref.set({ name, desc });
    await logHistory(adminName, key?'Sửa':'Thêm', 'Phòng ban', name);
    res.json({ success: true, message: "Thành công!" });
});
app.delete('/api/departments/:id', async (req, res) => {
    await db.ref(`departments/${req.params.id}`).remove();
    res.json({ success: true });
});

// --- MODULE CHỨC VỤ ---
app.get('/api/positions', async (req, res) => {
    const s = await db.ref('positions').once('value'); res.json(s.val() || {});
});
app.post('/api/positions', async (req, res) => {
    const { key, name, desc, adminName } = req.body;
    const ref = key ? db.ref(`positions/${key}`) : db.ref('positions').push();
    await ref.set({ name, desc });
    await logHistory(adminName, key?'Sửa':'Thêm', 'Chức vụ', name);
    res.json({ success: true, message: "Thành công!" });
});
app.delete('/api/positions/:id', async (req, res) => {
    await db.ref(`positions/${req.params.id}`).remove();
    res.json({ success: true });
});

// --- MODULE NHÂN VIÊN (FULL INFO) ---
app.get('/api/employees', async (req, res) => {
    const s = await db.ref('employees').once('value'); res.json(s.val() || {});
});
app.post('/api/employees', async (req, res) => {
    const { key, code, name, email, password, phone, address, licensePlate, dept, pos, status, startDate, shift, adminName } = req.body;
    const ref = key ? db.ref(`employees/${key}`) : db.ref('employees').push();
    
    let empData = { code, name, email, phone, address, licensePlate, dept, pos, status, startDate, shift };
    if (password && password.trim() !== "") empData.password = password;
    else if (!key) empData.password = "123456"; // Default pass

    if (key) await ref.update(empData); else await ref.set(empData);
    
    await logHistory(adminName, key?'Sửa':'Thêm', 'Nhân viên', `${name} - ${code}`);
    res.json({ success: true, message: "Lưu nhân viên thành công!" });
});
app.delete('/api/employees/:id', async (req, res) => {
    await db.ref(`employees/${req.params.id}`).remove();
    res.json({ success: true });
});

// --- MODULE LỊCH & PHÂN QUYỀN (MỚI) ---
app.get('/api/schedule', async (req, res) => {
    const s = await db.ref('schedule').once('value'); res.json(s.val() || {});
});
app.get('/api/permissions', async (req, res) => {
    const s = await db.ref('permissions').once('value'); res.json(s.val() || {});
});

// 5. HISTORY LOG
async function logHistory(user, action, target, detail) {
    const time = new Date().toLocaleString('vi-VN');
    await db.ref('system_logs').push({ time, user: user||'Admin', action, target, detail });
}

// 6. START
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));