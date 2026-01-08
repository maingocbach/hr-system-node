// public/js/employees.js
import { db } from './config.js';
import { ref, update, remove, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

export let employees = []; 

// --- LOGIC CẬP NHẬT SELECT ---
window.addEventListener('departmentsUpdated', (e) => {
    const departments = e.detail;
    const filterSelect = document.getElementById('filterDept');
    const formSelect = document.getElementById('dept');
    
    if (filterSelect) {
        let h = '<option value="">All Depts</option>';
        departments.forEach(d => h += `<option value="${d.name}">${d.name}</option>`);
        filterSelect.innerHTML = h;
    }
    if (formSelect) {
         let h = '<option value="Chưa phân loại">Chưa phân loại</option>';
         departments.forEach(d => h += `<option value="${d.name}">${d.name}</option>`);
         formSelect.innerHTML = h;
    }
});

window.addEventListener('positionsUpdated', (e) => {
    const positions = e.detail;
    const filterSelect = document.getElementById('filterPos');
    const formSelect = document.getElementById('pos');
    
    if (filterSelect) {
        let h = '<option value="">All Roles</option>';
        positions.forEach(p => h += `<option value="${p.name}">${p.name}</option>`);
        filterSelect.innerHTML = h;
    }
    if (formSelect) {
         let h = '<option value="Nhân viên">Nhân viên</option>';
         positions.forEach(p => h += `<option value="${p.name}">${p.name}</option>`);
         formSelect.innerHTML = h;
    }
});

// --- LẤY DỮ LIỆU NHÂN VIÊN ---
export function initEmployeeListeners() {
    const dbRef = ref(db, 'employees');
    onValue(dbRef, (snapshot) => {
        const data = snapshot.val();
        employees.length = 0;
        
        if (data) {
            Object.keys(data).forEach(key => {
                employees.push({ id: key, ...data[key] });
            });
        }
        
        renderTable(employees);
        window.dispatchEvent(new CustomEvent('dataUpdated', { detail: employees }));
    });
}

function renderTable(data) {
    const tbody = document.getElementById('tableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    const canEdit = window.checkPerm ? window.checkPerm('employees', 'edit') : true;
    const canDelete = window.checkPerm ? window.checkPerm('employees', 'delete') : true;

    data.forEach(emp => {
        const statusHtml = emp.status === 'working' 
            ? '<span style="color:#27ae60; font-weight:bold">● Working</span>' 
            : '<span style="color:#e74c3c; font-weight:bold">● Off</span>';
        
        const avatarUrl = emp.avatar || `https://ui-avatars.com/api/?name=${emp.name}&background=random`;

        const tr = document.createElement('tr');
        if(canEdit) {
            tr.onclick = () => window.openModal('edit', emp.id);
            tr.style.cursor = 'pointer';
        }
        
        const btnEdit = canEdit ? `<button class="btn btn-warning" onclick="window.openModal('edit', '${emp.id}')"><i class="fas fa-edit"></i></button>` : '';
        const btnDelete = canDelete ? `<button class="btn btn-danger" onclick="window.deleteEmp('${emp.id}')"><i class="fas fa-trash"></i></button>` : '';

        tr.innerHTML = `
            <td>
                <div style="display:flex; align-items:center; gap:10px">
                    <img src="${avatarUrl}" class="avatar" style="width:35px;height:35px;border-radius:50%;object-fit:cover">
                    <div>
                        <strong>${emp.name}</strong><br>
                        <small style="color:#666">${emp.email || ''}</small>
                    </div>
                </div>
            </td>
            <td>${emp.code}</td>
            <td>${emp.dept}</td>
            <td>${emp.pos}</td>
            <td>${statusHtml}</td>
            <td onclick="event.stopPropagation()">
                ${btnEdit}
                ${btnDelete}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.filterData = function() {
    const txt = document.getElementById('search').value.toLowerCase();
    const dept = document.getElementById('filterDept') ? document.getElementById('filterDept').value : "";
    const pos = document.getElementById('filterPos') ? document.getElementById('filterPos').value : "";
    
    const filtered = employees.filter(e => {
        return (e.name.toLowerCase().includes(txt) || e.code.toLowerCase().includes(txt)) 
            && (dept === "" || e.dept === dept)
            && (pos === "" || e.pos === pos);
    });
    renderTable(filtered);
};

window.deleteEmp = function(id) {
    if(confirm("Xóa nhân viên này?")) {
        remove(ref(db, 'employees/' + id)).catch((err) => alert("Lỗi: " + err.message));
    }
};

window.saveEmployee = async function(event) {
    event.preventDefault();
    const getVal = (id) => { const el = document.getElementById(id); return el ? el.value.trim() : ""; };
    const uid = getVal('empKey'); 
    
    const empData = {
        code: getVal('code'), name: getVal('name'), dept: getVal('dept'), pos: getVal('pos'),
        startDate: getVal('startDate'), shift: getVal('shift'), status: getVal('status'),
        email: getVal('email'), dob: getVal('dob'), phone: getVal('phone'),
        nationality: getVal('nationality'), visa: getVal('visa'), address: getVal('address'),
        jlpt: getVal('jlpt'), car: getVal('car')
    };

    if (!empData.code || !empData.name || !empData.email) return alert("Vui lòng nhập đầy đủ các trường có dấu (*)");
    if (!uid) return alert("Lỗi logic: Không tìm thấy ID nhân viên để cập nhật!");

    try {
        await update(ref(db, 'employees/' + uid), empData);
        alert("✅ Lưu thông tin thành công!");
        window.closeModal();
    } catch (error) {
        console.error("Lỗi lưu:", error);
        alert("❌ Lỗi hệ thống: " + error.message);
    }
};

window.openModal = function(mode, id = null) {
    document.getElementById('modal').style.display = 'flex';
    const form = document.getElementById('empForm');
    if(form) form.reset();
    
    const title = document.getElementById('modalTitle');
    if (mode === 'add') {
        if(title) title.innerText = "Thêm Nhân Viên";
        document.getElementById('empKey').value = ""; // Cần logic tạo ID mới nếu là thêm mới
        alert("Chức năng thêm mới cần code sinh ID (hiện tại code này hỗ trợ Sửa tốt hơn)");
    } else {
        if(title) title.innerText = "Cập Nhật Hồ Sơ";
        const emp = employees.find(e => e.id === id);
        if(emp) {
            document.getElementById('empKey').value = id;
            const setVal = (domId, val) => { const el = document.getElementById(domId); if(el) el.value = val || ""; };
            setVal('code', emp.code); setVal('name', emp.name); setVal('email', emp.email);
            setVal('dept', emp.dept); setVal('pos', emp.pos);
            setVal('startDate', emp.startDate); setVal('shift', emp.shift); setVal('status', emp.status);
            setVal('dob', emp.dob); setVal('phone', emp.phone);
            setVal('nationality', emp.nationality); setVal('visa', emp.visa);
            setVal('address', emp.address); setVal('jlpt', emp.jlpt); setVal('car', emp.car);
        }
    }
};

window.closeModal = function() {
    document.getElementById('modal').style.display = 'none';
};

window.addEventListener('authUpdated', () => {
    if (typeof employees !== 'undefined') renderTable(employees); 
});