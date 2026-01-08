// File: js/main.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } 
    from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase, ref, get, child, update } 
    from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

import { renderRegister } from "./register.js";
import { initPresence } from "./presence.js"; 
import { initLanguage } from "./language.js";

// GLOBAL ERROR HANDLER
window.onerror = function(message, source, lineno, colno, error) {
    if(message.includes("module") || message.includes("import")) alert("Lỗi Hệ Thống: " + message);
};

const firebaseConfig = {
    apiKey: "AIzaSyAHx3jiPwVjKmegcddl4JRM0qHucvJ_BzA",
    authDomain: "bejimiru-bf731.firebaseapp.com",
    databaseURL: "https://bejimiru-bf731-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "bejimiru-bf731",
    storageBucket: "bejimiru-bf731.firebasestorage.app",
    messagingSenderId: "536691957748",
    appId: "1:536691957748:web:e4a9c57a3ee20e2deca3a1",
    measurementId: "G-SX5TZDVEK0"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
let currentUserUid = null;

// BIẾN QUẢN LÝ QR CODE
let qrGenerator = null;
let qrInterval = null;
let qrCountdown = 10;

// STARTUP LANGUAGE
initLanguage();

// Lấy các element và kiểm tra tồn tại
const loginContainer = document.getElementById('login-container');

// --- SỬA LỖI TẠI ĐÂY: Đổi tên biến và ID cho khớp với HTML ---
const registerContainer = document.getElementById('register-container'); 
// -------------------------------------------------------------

const dashboardScreen = document.getElementById('dashboard-screen');
const pendingScreen = document.getElementById('pending-screen');
const langSwitcherGlobal = document.getElementById('lang-switcher-global');

// Xử lý chuyển sang đăng ký
const btnGoToRegister = document.getElementById('btnGoToRegister');
if (btnGoToRegister) {
    btnGoToRegister.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Ẩn Login đi
        if (loginContainer) loginContainer.classList.add('hidden');
        
        // --- SỬA LOGIC GỌI HÀM RENDER ---
        if (registerContainer) {
            renderRegister(auth, db, registerContainer, () => {
                // Callback: Khi người dùng bấm "Quay lại Login" hoặc Đăng ký xong
                if (loginContainer) loginContainer.classList.remove('hidden');
                
                // Ẩn và dọn dẹp container đăng ký
                registerContainer.classList.add('hidden');
                registerContainer.innerHTML = ""; 
            });
        } else {
            console.error("Lỗi: Không tìm thấy ID 'register-container' trong HTML");
        }
        // --------------------------------
    });
}

// Xử lý Form đăng nhập
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const pass = document.getElementById('loginPass').value;
        signInWithEmailAndPassword(auth, email, pass)
            .catch(err => alert("Lỗi đăng nhập: " + err.message));
    });
}

// Hàm Logout
const handleLogout = () => {
    stopDynamicQR(); 
    signOut(auth).then(() => location.reload());
};

const btnLogout = document.getElementById('btnLogout');
if (btnLogout) btnLogout.onclick = handleLogout;

const btnPendingLogout = document.getElementById('btnPendingLogout');
if (btnPendingLogout) btnPendingLogout.onclick = handleLogout;

// THEO DÕI TRẠNG THÁI ĐĂNG NHẬP
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUserUid = user.uid;
        
        if (loginContainer) loginContainer.classList.add('hidden');
        
        // Ẩn luôn Register container nếu đang mở
        if (registerContainer) {
            registerContainer.classList.add('hidden');
            registerContainer.innerHTML = "";
        }

        if (langSwitcherGlobal) langSwitcherGlobal.classList.add('hidden'); 

        try {
            const empSnapshot = await get(child(ref(db), `employees/${user.uid}`));
            
            if (empSnapshot.exists()) {
                if (pendingScreen) pendingScreen.classList.add('hidden');
                if (dashboardScreen) dashboardScreen.classList.remove('hidden');
                
                const navEmail = document.getElementById('nav_user_email');
                if (navEmail) navEmail.innerText = user.email;
                
                const empData = empSnapshot.val();
                
                try { if(typeof initPresence === 'function') initPresence(user.uid, empData); } 
                catch(err) { console.warn("Lỗi Presence:", err); }

                loadFullUserProfile(empData);
                renderCalendar(empData.schedule || {});
                startDynamicQR(user.uid);

                // --- TỰ ĐỘNG LOAD DỮ LIỆU CHẤM CÔNG KHI VÀO DASHBOARD ---
                const now = new Date();
                const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                const filterInput = document.getElementById('attMonthFilter');
                if(filterInput) {
                    filterInput.value = currentMonth;
                    window.loadMyAttendance();
                }

            } else {
                const pendingSnapshot = await get(child(ref(db), `pending_users/${user.uid}`));
                if (pendingSnapshot.exists()) {
                    if (dashboardScreen) dashboardScreen.classList.add('hidden');
                    if (pendingScreen) pendingScreen.classList.remove('hidden');
                    if (langSwitcherGlobal) langSwitcherGlobal.classList.remove('hidden'); 
                    
                    const pData = pendingSnapshot.val();
                    const pName = document.getElementById('pending_user_name');
                    const pEmail = document.getElementById('pending_email');
                    if (pName) pName.innerText = pData.name || user.email;
                    if (pEmail) pEmail.innerText = pData.email || user.email;
                } else {
                    alert("Không tìm thấy dữ liệu nhân viên.");
                    handleLogout();
                }
            }
        } catch (error) {
            console.error("Firebase Error:", error);
            alert("Lỗi kết nối database: " + error.message);
        }
    } else {
        currentUserUid = null;
        if (dashboardScreen) dashboardScreen.classList.add('hidden');
        if (pendingScreen) pendingScreen.classList.add('hidden');
        if (langSwitcherGlobal) langSwitcherGlobal.classList.remove('hidden'); 
        
        // Hiển thị lại Login nếu không phải đang ở trang đăng ký
        if (loginContainer && (!registerContainer || registerContainer.innerHTML === "")) {
            loginContainer.classList.remove('hidden');
        }
    }
});

// --- LOGIC QR CODE ĐỘNG ---
function startDynamicQR(uid) {
    const container = document.getElementById("qrcode-container");
    const timerText = document.getElementById("qr-timer");
    const progressBar = document.getElementById("qr-progress");

    if (!container || typeof QRCode === 'undefined') return;

    if (!qrGenerator) {
        qrGenerator = new QRCode(container, {
            width: 200,
            height: 200,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    }

    const updateCode = () => {
        const timestamp = Math.floor(Date.now() / 1000);
        const secureData = `BEJI|${uid}|${timestamp}`;
        qrGenerator.makeCode(secureData);
        qrCountdown = 10;
    };

    updateCode();

    if (qrInterval) clearInterval(qrInterval);
    qrInterval = setInterval(() => {
        qrCountdown--;
        if (timerText) timerText.innerText = `Next update: ${qrCountdown}s`;
        if (progressBar) progressBar.style.width = `${(qrCountdown / 10) * 100}%`;

        if (qrCountdown <= 0) {
            updateCode();
        }
    }, 1000);
}

function stopDynamicQR() {
    if (qrInterval) clearInterval(qrInterval);
}

// --- LOGIC TẢI DỮ LIỆU CHẤM CÔNG CÁ NHÂN ---
window.loadMyAttendance = async function() {
    const monthFilter = document.getElementById('attMonthFilter');
    const tbody = document.getElementById('myAttendanceBody');
    
    if (!monthFilter || !tbody || !currentUserUid) return;

    const monthVal = monthFilter.value; // YYYY-MM
    if (!monthVal) return;

    tbody.innerHTML = '<tr><td colspan="6" class="py-4 text-muted">読み込み中...</td></tr>';

    try {
        const attRef = ref(db, `employees/${currentUserUid}/attendance`);
        const snapshot = await get(attRef);

        if (snapshot.exists()) {
            const attData = snapshot.val();
            let html = "";
            
            const sortedDates = Object.keys(attData)
                .filter(date => date.startsWith(monthVal))
                .sort((a, b) => b.localeCompare(a));

            if (sortedDates.length > 0) {
                sortedDates.forEach(date => {
                    const day = attData[date];
                    html += `
                        <tr>
                            <td class="fw-bold">${date.split('-')[2]}日</td>
                            <td class="text-success fw-bold">${day.checkIn || '-'}</td>
                            <td>${day.breakStart || '-'}</td>
                            <td>${day.breakEnd || '-'}</td>
                            <td class="text-danger fw-bold">${day.checkOut || '-'}</td>
                            <td class="fw-bold">${day.totalHours ? day.totalHours + 'h' : '-'}</td>
                        </tr>`;
                });
                tbody.innerHTML = html;
            } else {
                tbody.innerHTML = '<tr><td colspan="6" class="py-4 text-muted">この月のデータはありません。</td></tr>';
            }
        } else {
            tbody.innerHTML = '<tr><td colspan="6" class="py-4 text-muted">記録がありません。</td></tr>';
        }
    } catch (error) {
        console.error("Lỗi tải chấm công:", error);
        tbody.innerHTML = '<tr><td colspan="6" class="py-4 text-danger">エラーが発生しました。</td></tr>';
    }
};

// LOAD PROFILE
function loadFullUserProfile(data) {
    const dName = document.getElementById('display_name');
    const dPos = document.getElementById('display_pos');
    const dCode = document.getElementById('display_code');
    const dAvatar = document.getElementById('pf_avatar_img');

    if (dName) dName.innerText = data.name || "---";
    if (dPos) dPos.innerText = data.pos || "---";
    if (dCode) dCode.innerText = "ID: " + (data.code || "---");
    
    if (data.avatar && dAvatar) {
        dAvatar.src = data.avatar;
    } else if (dAvatar) {
        dAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name || 'User')}&background=random`;
    }

    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if(el) el.value = val || "";
    };
    setVal('inp_code', data.code);
    setVal('inp_dept', data.dept);
    setVal('inp_pos', data.pos);
    setVal('inp_email', data.email);
    setVal('inp_shift', data.shift || "A");
    setVal('inp_start_date', data.startDate || "---");
    setVal('inp_name', data.name);
    setVal('inp_dob', data.dob);
    setVal('inp_phone', data.phone);
    setVal('inp_nation', data.nationality);
    setVal('inp_address', data.address);
    setVal('inp_visa', data.visa);
    setVal('inp_jlpt', data.jlpt);
    setVal('inp_car', data.car);
}

// PROFILE EDITING LOGIC (giữ nguyên)
const btnEdit = document.getElementById('btnEdit');
const btnSave = document.getElementById('btnSave');
const btnCancel = document.getElementById('btnCancel');
const uploadArea = document.getElementById('upload_area');
const inpFile = document.getElementById('inp_file');
const imgPreview = document.getElementById('pf_avatar_img');

const compressAndConvertToBase64 = (file) => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image(); 
            img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let w = img.width, h = img.height, max = 800;
                if(w>h){if(w>max){h*=max/w;w=max}}else{if(h>max){w*=max/h;h=max}}
                canvas.width=w; canvas.height=h;
                canvas.getContext('2d').drawImage(img,0,0,w,h);
                resolve(canvas.toDataURL('image/jpeg',0.7));
            };
        };
    });
};

if(inpFile && imgPreview) {
    inpFile.onchange = (e) => { 
        if(e.target.files[0]) imgPreview.src = URL.createObjectURL(e.target.files[0]); 
    };
}

if(btnEdit) {
    btnEdit.onclick = () => {
        btnEdit.classList.add('hidden');
        if (btnSave) btnSave.classList.remove('hidden');
        if (btnCancel) btnCancel.classList.remove('hidden');
        if (uploadArea) uploadArea.classList.remove('hidden');
        document.querySelectorAll('.editable').forEach(i => { 
            i.disabled = false; 
            i.classList.add('editable-active'); 
        });
    };
}

if(btnCancel) {
    btnCancel.onclick = () => { if(confirm("Cancel changes?")) location.reload(); };
}

if(btnSave) {
    btnSave.onclick = async () => {
        if(!currentUserUid) return;
        const saveText = document.getElementById('saveText');
        const saveLoading = document.getElementById('saveLoading');
        
        if (saveText) saveText.classList.add('hidden');
        if (saveLoading) saveLoading.classList.remove('hidden');
        btnSave.disabled = true;

        try {
            const updates = {
                name: document.getElementById('inp_name').value,
                dob: document.getElementById('inp_dob').value,
                phone: document.getElementById('inp_phone').value,
                nationality: document.getElementById('inp_nation').value,
                address: document.getElementById('inp_address').value,
                visa: document.getElementById('inp_visa').value,
                jlpt: document.getElementById('inp_jlpt').value,
                car: document.getElementById('inp_car').value
            };

            if (inpFile && inpFile.files[0]) {
                updates.avatar = await compressAndConvertToBase64(inpFile.files[0]);
            }

            await update(ref(db, 'employees/' + currentUserUid), updates);
            alert("✅ Saved!");
            location.reload();
        } catch (error) {
            console.error(error);
            alert("Error: " + error.message);
            location.reload();
        }
    };
}

// CALENDAR RENDER (giữ nguyên)
function renderCalendar(scheduleData) {
    const tbody = document.getElementById('calendar-body');
    if(!tbody) return;
    tbody.innerHTML = "";
    
    let today = new Date();
    let currentMonth = today.getMonth(); 
    let year = today.getFullYear();
    
    const monthTitle = `${year} / ${currentMonth + 1}`;
    const titleEl = document.getElementById('calendar-month-title');
    if(titleEl) titleEl.innerHTML = `<i class="fas fa-calendar-alt"></i> ${monthTitle}`;

    let firstDay = new Date(year, currentMonth, 1).getDay(); 
    let daysInMonth = new Date(year, currentMonth + 1, 0).getDate();
    let date = 1;
    
    const formatDateKey = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dNum = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${dNum}`;
    };

    for (let i = 0; i < 6; i++) {
        let row = document.createElement("tr");
        for (let j = 0; j < 7; j++) {
            let cell = document.createElement("td");
            cell.classList.add('calendar-day');

            if (i === 0 && j < firstDay) {
                cell.classList.add('bg-light');
            } else if (date > daysInMonth) {
                cell.classList.add('bg-light');
            } else {
                let dateNum = document.createElement("span");
                dateNum.innerText = date;
                dateNum.classList.add("date-number");
                cell.appendChild(dateNum);

                const currentDateObj = new Date(year, currentMonth, date);
                const dateKey = formatDateKey(currentDateObj);
                const status = scheduleData[dateKey];

                if (status === 'working') {
                    cell.classList.add("bg-working");
                    cell.innerHTML += '<i class="fas fa-check text-success status-mark"></i>';
                } else if (status === 'off') {
                    cell.classList.add("bg-off");
                    cell.innerHTML += '<i class="fas fa-times text-danger status-mark"></i>';
                }
                date++;
            }
            row.appendChild(cell);
        }
        tbody.appendChild(row);
        if (date > daysInMonth) break;
    }
}