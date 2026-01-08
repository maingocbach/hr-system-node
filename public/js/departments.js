// public/js/departments.js
// Vẫn import Firebase để ĐỌC dữ liệu realtime (giữ trải nghiệm mượt mà)
import { onValue, ref } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
// Lưu ý: Ta import 'db' từ file config.js của bạn (đảm bảo đường dẫn đúng)
// Nếu bạn chưa có file config.js tách riêng, hãy thay dòng dưới bằng import trực tiếp getDatabase...
import { db } from './config.js'; 

export let departments = [];

export function initDepartmentListeners() {
    console.log("NodeJS App: Đang lắng nghe dữ liệu phòng ban...");
    const dbRef = ref(db, 'departments');
    
    // Vẫn dùng Realtime Listener để khi Server Node.js lưu xong, bảng tự nhảy data mới
    onValue(dbRef, (snapshot) => {
        const data = snapshot.val();
        departments.length = 0; 
        
        if (data) {
            Object.keys(data).forEach(key => {
                departments.push({ id: key, ...data[key] });
            });
        }
        
        renderDeptTable(departments);
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
                <button class="btn btn-sm btn-info" onclick="window.openDeptModal('edit', '${dept.id}')"><i class="fas fa-edit"></i> Sửa</button> 
                <button class="btn btn-sm btn-danger" onclick="window.deleteDept('${dept.id}', '${dept.name}')"><i class="fas fa-trash"></i> Xóa</button> 
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// --- CÁC HÀM GỌI API NODE.JS ---

window.saveDepartment = async function(e) {
    if(e) e.preventDefault();
    
    const key = document.getElementById('deptKey').value;
    const name = document.getElementById('deptName').value;
    const desc = document.getElementById('deptDesc').value;
    const adminName = document.getElementById('admin-display-name')?.innerText || "Admin";

    if(!name) return alert("Vui lòng nhập tên phòng ban");

    // Thay vì gọi firebase.update(), ta gọi fetch() tới Server Node.js
    try {
        const response = await fetch('/api/departments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key, name, desc, adminName })
        });

        const result = await response.json();

        if (result.success) {
            alert("✅ " + result.message);
            window.closeDeptModal();
        } else {
            alert("❌ Lỗi Server: " + result.message);
        }
    } catch (err) {
        alert("Lỗi kết nối: " + err.message);
    }
};

window.deleteDept = async function(id, name) {
    const adminName = document.getElementById('admin-display-name')?.innerText || "Admin";
    
    if(confirm(`Bạn có chắc muốn xóa phòng ban [${name}]?`)) {
        try {
            // Gọi API Delete của Node.js
            const response = await fetch(`/api/departments/${id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, adminName }) // Gửi tên để server ghi log
            });

            const result = await response.json();
            if (result.success) {
                alert("✅ " + result.message);
            } else {
                alert("❌ Lỗi Server: " + result.message);
            }
        } catch (err) {
            alert("Lỗi kết nối: " + err.message);
        }
    }
};

// Các hàm bổ trợ giao diện
window.openDeptModal = function(mode, id = null) {
    const modal = document.getElementById('deptModal');
    if (!modal) return;
    modal.style.display = 'flex';
    
    const keyInput = document.getElementById('deptKey');
    const nameInput = document.getElementById('deptName');
    const descInput = document.getElementById('deptDesc');

    if (mode === 'add') {
        keyInput.value = "";
        nameInput.value = "";
        descInput.value = "";
    } else {
        const d = departments.find(x => x.id === id);
        if(d) {
            keyInput.value = id;
            nameInput.value = d.name || "";
            descInput.value = d.desc || "";
        }
    }
};

window.closeDeptModal = function() {
    const modal = document.getElementById('deptModal');
    if(modal) modal.style.display = 'none';
};