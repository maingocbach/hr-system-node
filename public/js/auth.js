// public/js/auth.js

const MODULES = ['overview', 'approvals', 'employees', 'departments', 'positions', 'permissions'];
const ACTIONS = ['view', 'add', 'edit', 'delete'];

const defaultPerms = {
    'role_admin': { 'all': true },
    'pos_Staff': { 'overview': ['view'] }
};

let permissionsData = JSON.parse(localStorage.getItem('hr_permissions')) || defaultPerms;
let currentUser = null;

// Xử lý Login
export function handleLogin(e, users) {
    e.preventDefault();
    const emailInput = document.getElementById('login-user').value.trim();
    const passInput = document.getElementById('login-pass').value.trim();
    const errorMsg = document.getElementById('login-error');

    // Admin cứng
    if (emailInput === 'admin' && passInput === '123456') {
        currentUser = { id: 'admin', name: 'System Admin', role: 'admin', pos: 'admin' };
        loginSuccess();
        return;
    }

    // Tìm user trong danh sách tải từ Firebase
    const user = users.find(u => u.email === emailInput || u.code === emailInput);
    
    if (user) {
        // Tạm thời check pass đơn giản
        if (passInput === '123456' || user.password === passInput) { 
            currentUser = user; 
            loginSuccess(); 
        } else { errorMsg.innerText = 'Sai mật khẩu!'; }
    } else {
        errorMsg.innerText = 'Tài khoản không tồn tại!';
    }
}

function loginSuccess() {
    document.getElementById('login-overlay').style.display = 'none';
    localStorage.setItem('hr_user', JSON.stringify(currentUser));
    window.dispatchEvent(new CustomEvent('authUpdated', { detail: currentUser }));
}

// Hàm kiểm tra quyền (để ẩn hiện nút bấm)
export function checkPermission(module, action) {
    if (!currentUser) return false;
    if (currentUser.role === 'admin' || currentUser.pos === 'admin') return true;

    const userPerm = permissionsData[`user_${currentUser.id}`];
    if (userPerm && (userPerm['all'] || (userPerm[module] && userPerm[module].includes(action)))) return true;

    const posPerm = permissionsData[`pos_${currentUser.pos}`];
    if (posPerm && (posPerm['all'] || (posPerm[module] && posPerm[module].includes(action)))) return true;

    return false;
}

// Khởi tạo Tab Phân Quyền
export function initPermissionTab(departments, positions, users) {
    // 1. Render danh sách bên trái
    window.loadPermSubjects = () => {
        const type = document.getElementById('permTypeSelect').value;
        const searchInput = document.getElementById('permSearchInput');
        if(searchInput) searchInput.style.display = (type === 'user') ? 'block' : 'none';

        const container = document.getElementById('permSubjectList');
        container.innerHTML = '';
        
        let list = [];
        if(type === 'pos') list = positions;
        else if(type === 'dept') list = departments;
        else list = users;

        list.forEach(item => {
            const div = document.createElement('div');
            div.className = 'perm-item';
            div.innerHTML = `<span>${item.name}</span> <i class="fas fa-chevron-right"></i>`;
            div.onclick = () => {
                document.querySelectorAll('.perm-item').forEach(e => e.classList.remove('active'));
                div.classList.add('active');
                loadMatrix(type, item.id || item.name, item.name);
            };
            container.appendChild(div);
        });
    };

    // 2. Logic Lưu Quyền
    window.savePermissions = () => {
        const titleEl = document.getElementById('currentPermSubject');
        if(titleEl.innerText === '---') return alert("Chưa chọn đối tượng!");

        const currentId = titleEl.dataset.id;
        const currentType = titleEl.dataset.type;
        const key = `${currentType}_${currentId}`;
        const newPerms = {};
        
        MODULES.forEach(mod => {
            const acts = [];
            ACTIONS.forEach(act => {
                if(document.getElementById(`perm_${mod}_${act}`).checked) acts.push(act);
            });
            if(acts.length > 0) newPerms[mod] = acts;
        });

        permissionsData[key] = newPerms;
        localStorage.setItem('hr_permissions', JSON.stringify(permissionsData));
        alert("Đã lưu quyền thành công!");
    };
    
    // Toggle cột
    window.toggleColumn = (act, el) => {
         MODULES.forEach(mod => {
             const cb = document.getElementById(`perm_${mod}_${act}`);
             if(cb) cb.checked = el.checked;
         });
    };

    window.loadPermSubjects();
}

// Vẽ bảng checkbox bên phải
function loadMatrix(type, id, name) {
    const title = document.getElementById('currentPermSubject');
    title.innerText = name;
    title.dataset.id = id;
    title.dataset.type = type;

    const key = `${type}_${id}`;
    const data = permissionsData[key] || {};
    const tbody = document.getElementById('permMatrixBody');
    tbody.innerHTML = '';

    MODULES.forEach(mod => {
        let row = `<tr><td style="text-align:left; font-weight:bold">${mod.toUpperCase()}</td>`;
        ACTIONS.forEach(act => {
            const checked = data[mod] && data[mod].includes(act) ? 'checked' : '';
            row += `<td><input type="checkbox" id="perm_${mod}_${act}" ${checked}></td>`;
        });
        row += '</tr>';
        tbody.innerHTML += row;
    });
}