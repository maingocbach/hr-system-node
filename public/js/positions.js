import { db, ref, push, update, remove, onValue } from './config.js';

// --- Đổi tên thành 'positions' và thêm export để hệ thống nhận diện ---
export let positions = [];

export function initPositionListeners() {
    const dbRef = ref(db, 'positions');
    
    onValue(dbRef, (snapshot) => {
        const data = snapshot.val();
        
        // Reset mảng nhưng giữ tham chiếu
        positions.length = 0;
        
        if (data) {
            Object.keys(data).forEach(key => {
                positions.push({ id: key, ...data[key] });
            });
        }
        
        renderPosTable(positions);
        
        // Bắn tín hiệu cập nhật cho các module khác (như employees dropdown)
        window.dispatchEvent(new CustomEvent('positionsUpdated', { detail: positions }));
        window.dispatchEvent(new CustomEvent('dataUpdated', { detail: positions }));
    });
}

/**
 * Hàm vẽ bảng Chức vụ
 */
function renderPosTable(data) {
    const tbody = document.getElementById('posTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    // --- KIỂM TRA QUYỀN SỬA/XÓA TỪ AUTH.JS ---
    const canEdit = window.checkPerm ? window.checkPerm('positions', 'edit') : false;
    const canDelete = window.checkPerm ? window.checkPerm('positions', 'delete') : false;

    data.forEach((pos, index) => {
        const tr = document.createElement('tr');
        
        const btnEdit = canEdit 
            ? `<button class="btn btn-warning" onclick="window.openPosModal('edit', '${pos.id}')"><i class="fas fa-edit"></i></button>`
            : '';
        const btnDelete = canDelete 
            ? `<button class="btn btn-danger" onclick="window.deletePos('${pos.id}')"><i class="fas fa-trash"></i></button>`
            : '';

        tr.innerHTML = `
            <td>${index + 1}</td>
            <td><strong>${pos.name}</strong></td>
            <td>${pos.desc || ''}</td>
            <td>
                ${btnEdit}
                ${btnDelete}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// --- QUAN TRỌNG: Lắng nghe sự kiện đăng nhập thành công để render lại bảng ---
window.addEventListener('authUpdated', () => {
    console.log("Positions: Auth updated, rerendering table...");
    renderPosTable(positions);
});

// --- CÁC HÀM GẮN VÀO WINDOW ĐỂ GỌI TỪ HTML ---

// Thêm từ khóa async ở đây
window.savePosition = async function(e) {
    e.preventDefault();
    
    if (window.checkPerm && !window.checkPerm('positions', 'edit')) {
        alert("Bạn không có quyền thực hiện hành động này!");
        return;
    }

    const key = document.getElementById('posKey').value;
    // Lấy giá trị ra biến riêng để dùng cho cả lưu và ghi log
    const posName = document.getElementById('posName').value;
    const posDesc = document.getElementById('posDesc').value;

    const newData = {
        name: posName,
        desc: posDesc
    };

    try {
        if (key) {
            // Dùng await để đợi lưu xong
            await update(ref(db, 'positions/' + key), newData);
            alert("Cập nhật chức vụ thành công!");
        } else {
            // Dùng await cho push
            await push(ref(db, 'positions'), newData);
            alert("Thêm chức vụ mới thành công!");
        }

        // GỌI GHI LOG SAU KHI LƯU THÀNH CÔNG
        if (window.createSystemLog) {
            await window.createSystemLog(
                key ? "Sửa" : "Thêm", 
                "Chức Vụ", 
                posName, 
                `Thông tin: ${posDesc}`
            );
        }

        window.closePosModal();
    } catch (err) {
        alert("Lỗi: " + err.message);
    }
};

window.deletePos = function(id) {
    // Bảo vệ logic: Kiểm tra quyền xóa
    if (window.checkPerm && !window.checkPerm('positions', 'delete')) {
        alert("Bạn không có quyền xóa chức vụ!");
        return;
    }

    if(confirm("Xóa chức vụ này?")) {
        remove(ref(db, 'positions/' + id))
            .then(() => alert("Đã xóa!"))
            .catch((err) => alert("Lỗi: " + err.message));
    }
};

window.openPosModal = function(mode, id = null) {
    // Chặn mở modal sửa nếu không có quyền
    if (window.checkPerm && !window.checkPerm('positions', 'edit') && mode === 'edit') {
        alert("Bạn không có quyền chỉnh sửa!");
        return;
    }

    const modal = document.getElementById('posModal');
    if (!modal) return;
    modal.style.display = 'flex';
    
    const form = modal.querySelector('form'); 
    if(form) form.reset();
    
    const titleEl = modal.querySelector('h3');

    if (mode === 'add') {
        if(titleEl) titleEl.innerText = "Thêm Chức Vụ Mới";
        document.getElementById('posKey').value = "";
    } else {
        if(titleEl) titleEl.innerText = "Cập Nhật Chức Vụ";
        const p = positions.find(x => x.id === id);
        if(p) {
            document.getElementById('posKey').value = id;
            document.getElementById('posName').value = p.name;
            document.getElementById('posDesc').value = p.desc;
        }
    }
};

window.closePosModal = function() {
    document.getElementById('posModal').style.display = 'none';
};