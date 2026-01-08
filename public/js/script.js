// public/js/script.js

// --- 1. CẤU HÌNH & BIẾN TOÀN CỤC ---
const API_URL = "/api"; // Gọi đến chính server Node.js này

// --- 2. XỬ LÝ GIAO DIỆN (UI) ---

// Chờ web tải xong mới chạy code
document.addEventListener('DOMContentLoaded', () => {
    console.log("Web đã tải xong!");
    checkLogin();
});

// Hàm chuyển Tab (Menu)
window.switchTab = function(tabId, element) {
    // Ẩn tất cả các tab
    document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active'));

    // Hiện tab được chọn
    document.getElementById(tabId).classList.add('active');
    if(element) element.classList.add('active');

    // Nếu vào tab Phòng ban thì tải dữ liệu
    if (tabId === 'departments') {
        loadDepartments();
    }
    
    // Đóng sidebar trên mobile sau khi chọn
    if(window.innerWidth < 768) {
        toggleSidebar();
    }
};

// Hàm bật/tắt Sidebar (Mobile)
window.toggleSidebar = function() {
    document.getElementById('sidebar').classList.toggle('active');
    document.querySelector('.main').classList.toggle('active');
};

// --- 3. XỬ LÝ ĐĂNG NHẬP (LOGIN) ---

window.handleLogin = function(event) {
    event.preventDefault(); // Chặn reload trang
    
    const user = document.getElementById('login-user').value;
    const pass = document.getElementById('login-pass').value;

    // Demo đăng nhập đơn giản (Sau này sẽ nối Database)
    if (user === 'admin' && pass === '123456') {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('username', user);
        checkLogin();
    } else {
        document.getElementById('login-error').innerText = "Sai tài khoản hoặc mật khẩu!";
    }
};

window.handleLogout = function() {
    if(confirm("Bạn muốn đăng xuất?")) {
        localStorage.removeItem('isLoggedIn');
        location.reload();
    }
};

function checkLogin() {
    const isLogged = localStorage.getItem('isLoggedIn');
    const overlay = document.getElementById('login-overlay');
    
    if (isLogged) {
        overlay.style.display = 'none'; // Ẩn màn hình login
        document.getElementById('admin-display-name').innerText = localStorage.getItem('username');
        // Mặc định vào tab Tổng quan
        window.switchTab('overview', document.getElementById('menu_overview'));
    } else {
        overlay.style.display = 'flex'; // Hiện màn hình login
    }
}

// --- 4. CHỨC NĂNG PHÒNG BAN (Gọi API Node.js) ---

// Mở Modal Thêm/Sửa
window.openDeptModal = function(mode, id = null, name = '', desc = '') {
    const modal = document.getElementById('deptModal');
    modal.style.display = 'flex';

    document.getElementById('deptKey').value = id || '';
    document.getElementById('deptName').value = name;
    document.getElementById('deptDesc').value = desc;
};

window.closeDeptModal = function() {
    document.getElementById('deptModal').style.display = 'none';
};

// Tải danh sách phòng ban từ Server
async function loadDepartments() {
    const tbody = document.getElementById('deptTableBody');
    tbody.innerHTML = '<tr><td colspan="4">Đang tải dữ liệu...</td></tr>';

    try {
        // Gọi API GET /api/departments
        const response = await fetch(`${API_URL}/departments`);
        const data = await response.json();

        tbody.innerHTML = ''; // Xóa chữ đang tải

        let index = 1;
        // Duyệt qua object data trả về từ Firebase
        for (const [key, value] of Object.entries(data)) {
            const row = `
                <tr>
                    <td>${index++}</td>
                    <td><b>${value.name}</b></td>
                    <td>${value.desc}</td>
                    <td>
                        <button class="btn btn-sm btn-warning" onclick="window.openDeptModal('edit', '${key}', '${value.name}', '${value.desc}')">Sửa</button>
                        <button class="btn btn-sm btn-danger" onclick="window.deleteDepartment('${key}')">Xóa</button>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        }
    } catch (error) {
        console.error("Lỗi:", error);
        tbody.innerHTML = '<tr><td colspan="4" style="color:red">Lỗi tải dữ liệu!</td></tr>';
    }
}

// Lưu Phòng Ban (Thêm mới hoặc Sửa)
window.saveDepartment = async function(event) {
    event.preventDefault();
    
    const key = document.getElementById('deptKey').value;
    const name = document.getElementById('deptName').value;
    const desc = document.getElementById('deptDesc').value;
    const adminName = localStorage.getItem('username');

    const payload = { key, name, desc, adminName };

    try {
        // Gọi API POST /api/departments
        const response = await fetch(`${API_URL}/departments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.success) {
            alert(result.message);
            window.closeDeptModal();
            loadDepartments(); // Tải lại bảng
        } else {
            alert("Lỗi: " + result.message);
        }
    } catch (error) {
        alert("Lỗi kết nối server!");
        console.error(error);
    }
};

// Xóa Phòng Ban
window.deleteDepartment = async function(id) {
    if (!confirm("Bạn có chắc muốn xóa phòng ban này?")) return;

    try {
        const response = await fetch(`${API_URL}/departments/${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adminName: localStorage.getItem('username') })
        });

        const result = await response.json();
        if (result.success) {
            loadDepartments(); // Tải lại bảng
        } else {
            alert("Lỗi: " + result.message);
        }
    } catch (error) {
        alert("Lỗi khi xóa!");
    }
};

// --- 5. CÁC HÀM KHÁC (Placeholder) ---
// Để code không bị lỗi khi bấm vào các nút chưa làm xong
window.openModal = () => alert("Chức năng đang cập nhật...");
window.closeModal = () => document.getElementById('modal').style.display = 'none';
window.openPosModal = () => alert("Chức năng đang cập nhật...");
window.closePosModal = () => document.getElementById('posModal').style.display = 'none';
window.openScanner = () => document.getElementById('scannerModal').style.display = 'flex';
window.closeScanner = () => document.getElementById('scannerModal').style.display = 'none';
window.changeLanguage = (lang) => alert("Đổi ngôn ngữ: " + lang);