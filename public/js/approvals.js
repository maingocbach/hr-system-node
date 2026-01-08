import { db, ref, set, remove, onValue } from './config.js';

// Export biến để các file khác dùng
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
        
        // Gọi render lần đầu khi có dữ liệu
        renderApprovalTable(pendingList);
    });
    
    // Listeners cập nhật dropdown khi Dept/Pos thay đổi
    window.addEventListener('departmentsUpdated', (e) => updateSelect('approveDept', e.detail));
    window.addEventListener('positionsUpdated', (e) => updateSelect('approvePos', e.detail));
}

/**
 * QUAN TRỌNG: Lắng nghe sự kiện đăng nhập thành công
 * Khi Admin đăng nhập, hàm này sẽ vẽ lại bảng để hiện các nút Duyệt/Xóa
 */
window.addEventListener('authUpdated', () => {
    console.log("[Approvals] Nhận tín hiệu đăng nhập, cập nhật giao diện...");
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

    // --- KIỂM TRA QUYỀN THỰC TẾ ---
    const hasAuthFunc = typeof window.checkPerm === 'function';
    const canApprove = hasAuthFunc ? window.checkPerm('approvals', 'edit') : false;
    const canDelete = hasAuthFunc ? window.checkPerm('approvals', 'delete') : false;

    data.forEach(u => {
        const tr = document.createElement('tr');
        
        // Logic Click hàng
        if(canApprove) {
            tr.onclick = () => window.openApprovalModal(u.id);
            tr.style.cursor = 'pointer';
        } else {
            tr.style.cursor = 'not-allowed';
        }

        // Tạo chuỗi HTML cho các nút bấm dựa trên quyền
        let actionHtml = '';
        if (canApprove) {
            actionHtml += `<button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); window.openApprovalModal('${u.id}')" style="margin-right:5px">Xem & Duyệt</button>`;
        }
        if (canDelete) {
            actionHtml += `<button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); window.rejectUser('${u.id}')"><i class="fas fa-trash"></i></button>`;
        }

        // Nếu không có quyền nào thì hiện thông báo khóa
        if (actionHtml === '') {
            actionHtml = '<span style="color:#999; font-style:italic"><i class="fas fa-lock"></i> No Access</span>';
        }

        tr.innerHTML = `
            <td><strong>${u.name}</strong><br><small>${u.email}</small></td>
            <td>${u.phone || '-'}</td>
            <td><span style="color:#e67e22; font-weight:bold">Chờ duyệt</span></td>
            <td>${actionHtml}</td>
        `;
        tbody.appendChild(tr);
    });
}

// --- CÁC HÀM GỌI TỪ WINDOW ---

window.openApprovalModal = function(id) {
    // Bảo vệ 2 lớp: Check quyền khi mở form
    if (window.checkPerm && !window.checkPerm('approvals', 'edit')) {
        alert("Bạn CHƯA được cấp quyền xem/duyệt mục này!");
        return;
    }

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

    // Chặn ở mức logic xử lý
    if (window.checkPerm && !window.checkPerm('approvals', 'edit')) {
        alert("CẢNH BÁO: Bạn không có quyền Duyệt!");
        return;
    }

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

    if (!finalData.dept || !finalData.pos) { alert("Chưa chọn Phòng/Ban hoặc Chức vụ!"); return; }

    if (confirm("Duyệt nhân viên này?")) {
        set(ref(db, 'employees/' + uid), finalData)
            .then(() => remove(ref(db, 'pending_users/' + uid)))
            .then(() => { window.closeApprovalModal(); alert("Đã duyệt thành công!"); })
            .catch(err => alert("Lỗi: " + err.message));
    }
};

window.rejectUser = function(id) {
    // Chặn ở mức logic xóa
    if (!window.checkPerm || !window.checkPerm('approvals', 'delete')) {
        alert("CẢNH BÁO: Bạn không có quyền Xóa!");
        return;
    }

    if(confirm("Xóa yêu cầu này?")) {
        remove(ref(db, 'pending_users/' + id))
            .then(() => alert("Đã xóa."))
            .catch(err => alert("Lỗi: " + err.message));
    }
};