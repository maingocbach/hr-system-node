// public/js/departments.js
import { db } from './config.js';
import { ref, push, update, remove, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

export let departments = [];

export function initDepartmentListeners() {
    const dbRef = ref(db, 'departments');
    onValue(dbRef, (snapshot) => {
        const data = snapshot.val();
        departments.length = 0; 
        
        if (data) {
            Object.keys(data).forEach(key => {
                departments.push({ id: key, ...data[key] });
            });
        }
        
        renderDeptTable(departments);
        window.dispatchEvent(new CustomEvent('departmentsUpdated', { detail: departments }));
    });
}

function renderDeptTable(data) {
    const tbody = document.getElementById('deptTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    data.forEach((dept, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td><strong>${dept.name}</strong></td>
            <td>${dept.desc || ''}</td>
            <td>
                <button class="btn btn-warning" onclick="window.openDeptModal('edit', '${dept.id}')"><i class="fas fa-edit"></i></button> 
                <button class="btn btn-danger" onclick="window.deleteDept('${dept.id}')"><i class="fas fa-trash"></i></button> 
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.saveDepartment = async function(e) {
    if(e) e.preventDefault();
    const key = document.getElementById('deptKey').value;
    const newData = {
        name: document.getElementById('deptName').value,
        desc: document.getElementById('deptDesc').value
    };

    if(!newData.name) return alert("Vui lòng nhập tên phòng ban");

    try {
        if(key) {
            await update(ref(db, 'departments/' + key), newData);
            alert("Cập nhật thành công!");
        } else {
            await push(ref(db, 'departments'), newData);
            alert("Thêm mới thành công!");
        }
        window.closeDeptModal();
    } catch (err) { alert("Lỗi: " + err.message); }
};

window.deleteDept = function(id) {
    if(confirm(`Bạn có chắc muốn xóa?`)) {
        remove(ref(db, 'departments/' + id)).catch(err => alert("Lỗi: " + err.message));
    }
};

window.openDeptModal = function(mode, id = null) {
    const modal = document.getElementById('deptModal');
    if (!modal) return;
    modal.style.display = 'flex';
    const form = modal.querySelector('form'); if(form) form.reset();

    if (mode === 'add') {
        document.getElementById('deptKey').value = "";
    } else {
        const d = departments.find(x => x.id === id);
        if(d) {
            document.getElementById('deptKey').value = id;
            document.getElementById('deptName').value = d.name || "";
            document.getElementById('deptDesc').value = d.desc || "";
        }
    }
};

window.closeDeptModal = function() {
    const modal = document.getElementById('deptModal');
    if(modal) modal.style.display = 'none';
};