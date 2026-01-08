// public/js/script.js

console.log("✅ File script.js đã được tải thành công!");

// --- 1. CẤU HÌNH & BIẾN TOÀN CỤC ---
const API_URL = "/api"; 

// --- 2. XỬ LÝ GIAO DIỆN (UI) ---

// Chờ web tải xong mới chạy code
document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 Web đã tải xong giao diện!");
    checkLogin();
});

// Hàm kiểm tra trạng thái đăng nhập
function checkLogin() {
    const isLogged = localStorage.getItem('isLoggedIn');
    const overlay = document.getElementById('login-overlay');
    
    if (isLogged) {
        // Đã đăng nhập
        if(overlay) overlay.style.display = 'none';
        
        // Hiển thị tên người dùng
        const nameDisplay = document.getElementById('admin-display-name');
        if(nameDisplay) nameDisplay.innerText = localStorage.getItem('username') || "Admin";
        
        // Mặc định vào tab Tổng quan nếu chưa chọn tab nào
        if(!document.querySelector('.tab.active')) {
            window.switchTab('overview', document.getElementById('menu_overview'));
        }
    } else {
        // Chưa đăng nhập
        if(overlay) overlay.style.display = 'flex';
    }
}

// Hàm chuyển Tab (Menu) - Gán vào window để HTML gọi được
window.switchTab = function(tabId, element) {
    console.log("Chuyển sang tab:", tabId);

    // Ẩn tất cả các tab
    document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active'));

    // Hiện tab được chọn
    const targetTab = document.getElementById(tabId);
    if (targetTab) targetTab.classList.add('active');
    if (element) element.classList.add('active');

    // Nếu vào tab Phòng ban thì tải dữ liệu
    if (tabId === 'departments') {
        loadDepartments();
    }
    
    // Đóng sidebar trên mobile sau khi chọn
    if(window.innerWidth < 768) {
        window.toggleSidebar();
    }
};

// Hàm bật/tắt Sidebar
window.toggleSidebar = function() {
    const sidebar = document.getElementById('sidebar');
    const main = document.querySelector('.main');
    if(sidebar) sidebar.classList.toggle('active');
    if(main) main.classList.toggle('active');
};

// --- 3. XỬ LÝ ĐĂNG NHẬP (LOGIN) ---

window.handleLogin = function(event) {
    event.preventDefault(); // Chặn reload trang
    console.log("🖱️ Đã bấm nút Đăng nhập");

    const userInput = document.getElementById('login-user');
    const passInput = document.getElementById('login-pass');
    const errorMsg = document.getElementById('login-error');

    const user = userInput ? userInput.value.trim() : "";
    const pass = passInput ? passInput.value.trim() : "";

    // LOGIC ĐĂNG NHẬP (HARDCODE TẠM THỜI)
    // Cho phép dùng 'admin' HOẶC email của bạn 'bachmn@gmail.com'
    // Mật khẩu chung: '123456'
    if ((user === 'admin' || user.includes('@')) && pass === '123456') {
        console.log("✅ Đăng nhập thành công!");
        
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('username', user);
        
        checkLogin(); // Cập nhật giao diện
    } else {
        console.warn("❌ Đăng nhập thất bại");
        if(errorMsg) errorMsg.innerText = "Sai mật khẩu! (Thử lại: 123456)";
    }
};

window.handleLogout = function() {
    if(confirm("Bạn muốn đăng xuất khỏi hệ thống?")) {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('username');
        location.reload(); // Tải lại trang để về màn hình login
    }
};

// --- 4. CHỨC NĂNG PHÒNG BAN (Gọi API Node.js) ---

window.openDeptModal = function(mode, id = null, name = '', desc = '') {
    const modal = document.getElementById('deptModal');
    if(modal) modal.style.display = 'flex';

    document.getElementById('deptKey').value = id || '';
    document.getElementById('deptName').value = name;
    document.getElementById('deptDesc').value = desc;
};

window.closeDeptModal = function() {
    const modal = document.getElementById('deptModal');
    if(modal) modal.style.display = 'none';
};

// Tải danh sách phòng ban
async function loadDepartments() {
    const tbody = document.getElementById('deptTableBody');
    if(!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="4" class="text-center">⏳ Đang tải dữ liệu...</td></tr>';

    try {
        const response = await fetch(`${API_URL}/departments`);
        const data = await response.json();

        tbody.innerHTML = ''; 

        if(!data || Object.keys(data).length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center">Chưa có dữ liệu</td></tr>';
            return;
        }

        let index = 1;
        for (const [key, value] of Object.entries(data)) {
            const row = `
                <tr>
                    <td>${index++}</td>
                    <td><b>${value.name}</b></td>
                    <td>${value.desc}</td>
                    <td>
                        <button class="btn-edit" style="background:#f39c12; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; margin-right:5px" 
                            onclick="window.openDeptModal('edit', '${key}', '${value.name}', '${value.desc}')">
                            <i class="fas fa-edit"></i> Sửa
                        </button>
                        <button class="btn-delete" style="background:#e74c3c; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer" 
                            onclick="window.deleteDepartment('${key}')">
                            <i class="fas fa-trash"></i> Xóa
                        </button>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        }
    } catch (error) {
        console.error("Lỗi tải API:", error);
        tbody.innerHTML = '<tr><td colspan="4" style="color:red; text-align:center">❌ Lỗi kết nối Server!</td></tr>';
    }
}

// Lưu Phòng Ban
window.saveDepartment = async function(event) {
    event.preventDefault();
    
    const key = document.getElementById('deptKey').value;
    const name = document.getElementById('deptName').value;
    const desc = document.getElementById('deptDesc').value;
    const adminName = localStorage.getItem('username') || "Admin";

    const payload = { key, name, desc, adminName };

    try {
        const response = await fetch(`${API_URL}/departments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.success) {
            alert(result.message);
            window.closeDeptModal();
            loadDepartments(); 
        } else {
            alert("Lỗi: " + result.message);
        }
    } catch (error) {
        alert("Không thể kết nối tới Server!");
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
            loadDepartments(); 
        } else {
            alert("Lỗi: " + result.message);
        }
    } catch (error) {
        alert("Lỗi khi xóa!");
    }
};

// --- 5. HÀM CHỜ (PLACEHOLDER) ---
window.openModal = () => alert("Chức năng đang cập nhật...");
window.closeModal = () => document.getElementById('modal').style.display = 'none';
window.openPosModal = () => alert("Chức năng đang cập nhật...");
window.closePosModal = () => document.getElementById('posModal').style.display = 'none';
window.openScanner = () => document.getElementById('scannerModal').style.display = 'flex';
window.closeScanner = () => document.getElementById('scannerModal').style.display = 'none';
window.changeLanguage = (lang) => alert("Đã chuyển ngôn ngữ: " + lang);