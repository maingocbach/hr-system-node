// admin/js/auth.js

const MODULES = ['overview', 'approvals', 'employees', 'departments', 'positions', 'schedule', 'permissions'];
const ACTIONS = ['view', 'add', 'edit', 'delete'];

const defaultPerms = {
    'role_admin': { 'all': true },
    'pos_Staff': { 'schedule': ['view'], 'overview': ['view'] },
    'pos_Nhân viên': { 'schedule': ['view'], 'overview': ['view'] }
};

let permissionsData = JSON.parse(localStorage.getItem('hr_permissions')) || defaultPerms;
let currentUser = null;
let internalData = { departments: [], positions: [], users: [] };

// --- 1. XỬ LÝ ĐĂNG NHẬP ---
export function handleLogin(e, users) {
    e.preventDefault();
    const emailInput = document.getElementById('login-user').value.trim();
    const passInput = document.getElementById('login-pass').value.trim();
    const errorMsg = document.getElementById('login-error');
    
    if (emailInput === 'bachmn@gmail.com') {
        if (passInput === 'admin' || passInput === '123456') {
            currentUser = { id: 'super_admin', name: 'Bach MN (Super Admin)', email: 'bachmn@gmail.com', role: 'admin', pos: 'Director' };
            loginSuccess();
            return;
        } else { errorMsg.innerText = 'Sai mật khẩu Super Admin!'; return; }
    }

    const user = users.find(u => u.email === emailInput || u.code === emailInput);
    if (user) {
        if (passInput === '123456') { currentUser = user; loginSuccess(); } 
        else { errorMsg.innerText = 'Sai mật khẩu!'; }
    } else {
        if(emailInput === 'admin' && passInput === 'admin') { currentUser = { name: 'System Admin', role: 'admin', pos: 'admin' }; loginSuccess(); }
        else { errorMsg.innerText = 'Không tìm thấy tài khoản!'; }
    }
}

function loginSuccess() {
    document.getElementById('login-overlay').style.display = 'none';
    document.getElementById('login-error').innerText = '';
    applyPermissions();
    window.dispatchEvent(new CustomEvent('authUpdated'));
}

export function handleLogout() {
    currentUser = null;
    document.getElementById('login-overlay').style.display = 'flex';
    document.getElementById('login-user').value = '';
    document.getElementById('login-pass').value = '';
}

// --- 2. LOGIC KIỂM TRA QUYỀN ---
export function checkPermission(module, action) {
    if (!currentUser) return false;
    if (currentUser.email === 'bachmn@gmail.com') return true; 
    if (currentUser.role === 'admin' || currentUser.pos === 'admin') return true;

    const userPerm = permissionsData[`user_${currentUser.id}`];
    if (userPerm && (userPerm['all'] || (userPerm[module] && userPerm[module].includes(action)))) return true;

    const posPerm = permissionsData[`pos_${currentUser.pos}`]; 
    if (posPerm && (posPerm['all'] || (posPerm[module] && posPerm[module].includes(action)))) return true;

    const deptPerm = permissionsData[`dept_${currentUser.dept}`];
    if (deptPerm && (deptPerm['all'] || (deptPerm[module] && deptPerm[module].includes(action)))) return true;

    return false;
}

// --- 3. ÁP DỤNG QUYỀN LÊN GIAO DIỆN ---
export function applyPermissions() {
    if (!currentUser) return;
    MODULES.forEach(mod => {
        const el = document.getElementById(`menu_${mod}`);
        if(el) {
            el.style.display = checkPermission(mod, 'view') ? 'block' : 'none';
        }
    });
    
    // Nếu đang ở tab permissions, render lại ma trận để disable checkbox nếu ko có quyền
    if (document.getElementById('permissions').classList.contains('active')) {
        if (currentSubjectId) loadMatrix(currentSubjectType, currentSubjectId, document.getElementById('currentPermSubject').innerText);
    }
}

// --- 4. QUẢN LÝ TAB PHÂN QUYỀN ---
let currentSubjectType = 'pos';
let currentSubjectId = '';

window.toggleColumn = function(action, headerCheckbox) {
    // Chặn nếu không có quyền sửa
    if (!checkPermission('permissions', 'edit')) {
        alert("Bạn không có quyền sửa phân quyền!");
        headerCheckbox.checked = !headerCheckbox.checked;
        return;
    }
    const isChecked = headerCheckbox.checked;
    MODULES.forEach(mod => {
        const checkbox = document.getElementById(`perm_${mod}_${action}`);
        if(checkbox && !checkbox.disabled) checkbox.checked = isChecked;
    });
};

export function initPermissionTab(departments, positions, users) {
    internalData.departments = departments;
    internalData.positions = positions;
    internalData.users = users;

    window.loadPermSubjects = () => {
        const type = document.getElementById('permTypeSelect').value;
        const searchInput = document.getElementById('permSearchInput');
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";
        currentSubjectType = type;

        if(searchInput) searchInput.style.display = (type === 'user') ? 'block' : 'none';

        const container = document.getElementById('permSubjectList');
        container.innerHTML = '';

        let list = [];
        if(type === 'pos') list = internalData.positions.map(p => ({id: p.name, name: p.name}));
        else if(type === 'dept') list = internalData.departments.map(d => ({id: d.name, name: d.name}));
        else {
            list = internalData.users
                .filter(u => u.name.toLowerCase().includes(searchTerm) || (u.email && u.email.toLowerCase().includes(searchTerm)))
                .map(u => ({id: u.id, name: `${u.name} (${u.email || u.code})`}));
        }

        list.forEach(item => {
            const div = document.createElement('div');
            div.className = 'perm-item' + (currentSubjectId === item.id ? ' active' : '');
            div.innerHTML = `<span>${item.name}</span> <i class="fas fa-chevron-right"></i>`;
            div.onclick = () => {
                document.querySelectorAll('.perm-item').forEach(el => el.classList.remove('active'));
                div.classList.add('active');
                loadMatrix(type, item.id, item.name);
            };
            container.appendChild(div);
        });
    };

    window.savePermissions = () => {
        // --- CHẶN LOGIC LƯU TẠI ĐÂY ---
        if (!checkPermission('permissions', 'edit')) {
            alert("Bạn không có quyền thực hiện thao tác này!");
            return;
        }

        if(!currentSubjectId) return;
        const key = `${currentSubjectType}_${currentSubjectId}`;
        const newPerms = {};
        MODULES.forEach(mod => {
            const actions = [];
            ACTIONS.forEach(act => {
                const checkbox = document.getElementById(`perm_${mod}_${act}`);
                if(checkbox && checkbox.checked) actions.push(act);
            });
            if(actions.length > 0) newPerms[mod] = actions;
        });

        permissionsData[key] = newPerms;
        localStorage.setItem('hr_permissions', JSON.stringify(permissionsData));
        alert('Đã lưu phân quyền cho: ' + currentSubjectId);
    };

    window.loadPermSubjects();
}

function loadMatrix(type, id, name) {
    currentSubjectId = id;
    currentSubjectType = type;
    document.getElementById('currentPermSubject').innerText = name;
    
    // Kiểm tra quyền sửa của user đang đăng nhập
    const canEditPerm = checkPermission('permissions', 'edit');
    
    // Ẩn/Hiện nút Lưu
    const saveBtn = document.querySelector('#permissions .btn-primary');
    if (saveBtn) saveBtn.style.display = canEditPerm ? 'block' : 'none';

    const headerChecks = document.querySelectorAll('thead input[type="checkbox"]');
    headerChecks.forEach(ck => {
        ck.checked = false;
        ck.disabled = !canEditPerm; // Vô hiệu hóa "Chọn tất cả" nếu ko có quyền
    });

    const key = `${type}_${id}`;
    const data = permissionsData[key] || {};
    const tbody = document.getElementById('permMatrixBody');
    tbody.innerHTML = '';

    MODULES.forEach(mod => {
        let rowHtml = `<td><b>${mod.toUpperCase()}</b></td>`;
        ACTIONS.forEach(act => {
            const isChecked = data[mod] && data[mod].includes(act) ? 'checked' : '';
            // THÊM: disabled nếu không có quyền sửa (canEditPerm)
            const disabledAttr = canEditPerm ? '' : 'disabled';
            rowHtml += `<td><input type="checkbox" class="perm-check" id="perm_${mod}_${act}" ${isChecked} ${disabledAttr}></td>`;
        });
        tbody.appendChild(Object.assign(document.createElement('tr'), {innerHTML: rowHtml}));
    });
}

// Lắng nghe sự kiện authUpdated để render lại ma trận nếu đang mở tab permissions
window.addEventListener('authUpdated', () => {
    if (currentSubjectId) loadMatrix(currentSubjectType, currentSubjectId, document.getElementById('currentPermSubject').innerText);
});