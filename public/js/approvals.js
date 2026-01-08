// public/js/approvals.js
import { db } from './config.js';
import { ref, set, remove, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

export let pendingList = [];

export function initApprovalListeners() {
    const dbRef = ref(db, 'pending_users');
    
    onValue(dbRef, (snapshot) => {
        const data = snapshot.val();
        pendingList.length = 0;
        
        if (data) {
            Object.keys(data).forEach(key => {
                pendingList.push({ id: key, ...data[key] });
            });
        }
        renderApprovalTable(pendingList);
    });
    
    window.addEventListener('departmentsUpdated', (e) => updateSelect('approveDept', e.detail));
    window.addEventListener('positionsUpdated', (e) => updateSelect('approvePos', e.detail));
}

window.addEventListener('authUpdated', () => {
    renderApprovalTable(pendingList);
});

function updateSelect(id, list) {
    const el = document.getElementById(id);
    if(el) {
        let h = '<option value="">-- Chọn --</option>';
        list.forEach(i => h += `<option value="${i.name}">${i.name}</option>`);
        el.innerHTML = h;
    }
}

function renderApprovalTable(data) {
    const tbody = document.getElementById('approvalTableBody');
    if(!tbody) return;
    tbody.innerHTML = '';

    const canApprove = window.checkPerm ? window.checkPerm('approvals', 'edit') : true;
    const canDelete = window.checkPerm ? window.checkPerm('approvals', 'delete') : true;

    data.forEach(u => {
        const tr = document.createElement('tr');
        if(canApprove) {
            tr.onclick = () => window.openApprovalModal(u.id);
            tr.style.cursor = 'pointer';
        }

        let actionHtml = '';
        if (canApprove) actionHtml += `<button class="btn btn-primary" onclick="event.stopPropagation(); window.openApprovalModal('${u.id}')">Duyệt</button> `;
        if (canDelete) actionHtml += `<button class="btn btn-danger" onclick="event.stopPropagation(); window.rejectUser('${u.id}')"><i class="fas fa-trash"></i></button>`;

        tr.innerHTML = `
            <td><strong>${u.name}</strong><br><small>${u.email}</small></td>
            <td>${u.phone || '-'}</td>
            <td><span style="color:#e67e22; font-weight:bold">Chờ duyệt</span></td>
            <td>${actionHtml}</td>
        `;
        tbody.appendChild(tr);
    });
}

window.openApprovalModal = function(id) {
    if (window.checkPerm && !window.checkPerm('approvals', 'edit')) return alert("Không có quyền!");
    const user = pendingList.find(u => u.id === id);
    if (!user) return;
    
    document.getElementById('approvalModal').style.display = 'flex';
    document.getElementById('approveKey').value = id;
    document.getElementById('approveName').value = user.name || '';
    document.getElementById('approveCode').value = ''; 
    document.getElementById('approvePhone').value = user.phone || '';
    document.getElementById('approveEmail').value = user.email || '';
};

window.closeApprovalModal = () => document.getElementById('approvalModal').style.display = 'none';

window.approveUser = function(e) {
    e.preventDefault();
    if (window.checkPerm && !window.checkPerm('approvals', 'edit')) return alert("Không có quyền!");

    const uid = document.getElementById('approveKey').value;
    const originalData = pendingList.find(u => u.id === uid) || {};

    const finalData = {
        ...originalData,
        code: document.getElementById('approveCode').value,
        name: document.getElementById('approveName').value,
        phone: document.getElementById('approvePhone').value,
        email: document.getElementById('approveEmail').value,
        dept: document.getElementById('approveDept').value,
        pos: document.getElementById('approvePos').value,
        status: 'working',
        avatar: originalData.avatar || `https://ui-avatars.com/api/?name=${document.getElementById('approveName').value}&background=random`
    };
    
    delete finalData.id;
    if (!finalData.dept || !finalData.pos) return alert("Chưa chọn Phòng/Ban hoặc Chức vụ!");

    if (confirm("Duyệt nhân viên này?")) {
        set(ref(db, 'employees/' + uid), finalData)
            .then(() => remove(ref(db, 'pending_users/' + uid)))
            .then(() => { window.closeApprovalModal(); alert("Đã duyệt thành công!"); })
            .catch(err => alert("Lỗi: " + err.message));
    }
};

window.rejectUser = function(id) {
    if (window.checkPerm && !window.checkPerm('approvals', 'delete')) return alert("Không có quyền!");
    if(confirm("Xóa yêu cầu này?")) {
        remove(ref(db, 'pending_users/' + id))
            .then(() => alert("Đã xóa."))
            .catch(err => alert("Lỗi: " + err.message));
    }
};