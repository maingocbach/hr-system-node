// public/js/positions.js
import { db } from './config.js';
import { ref, push, update, remove, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

export let positions = [];

export function initPositionListeners() {
    const dbRef = ref(db, 'positions');
    
    onValue(dbRef, (snapshot) => {
        const data = snapshot.val();
        positions.length = 0;
        
        if (data) {
            Object.keys(data).forEach(key => {
                positions.push({ id: key, ...data[key] });
            });
        }
        
        renderPosTable(positions);
        window.dispatchEvent(new CustomEvent('positionsUpdated', { detail: positions }));
        window.dispatchEvent(new CustomEvent('dataUpdated', { detail: positions }));
    });
}

function renderPosTable(data) {
    const tbody = document.getElementById('posTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const canEdit = window.checkPerm ? window.checkPerm('positions', 'edit') : true;
    const canDelete = window.checkPerm ? window.checkPerm('positions', 'delete') : true;

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
            <td>${btnEdit} ${btnDelete}</td>
        `;
        tbody.appendChild(tr);
    });
}

window.addEventListener('authUpdated', () => {
    renderPosTable(positions);
});

window.savePosition = async function(e) {
    e.preventDefault();
    if (window.checkPerm && !window.checkPerm('positions', 'edit')) return alert("Bạn không có quyền!");

    const key = document.getElementById('posKey').value;
    const newData = {
        name: document.getElementById('posName').value,
        desc: document.getElementById('posDesc').value
    };

    try {
        if (key) {
            await update(ref(db, 'positions/' + key), newData);
            alert("Cập nhật thành công!");
        } else {
            await push(ref(db, 'positions'), newData);
            alert("Thêm mới thành công!");
        }
        window.closePosModal();
    } catch (err) { alert("Lỗi: " + err.message); }
};

window.deletePos = function(id) {
    if (window.checkPerm && !window.checkPerm('positions', 'delete')) return alert("Bạn không có quyền xóa!");
    if(confirm("Xóa chức vụ này?")) {
        remove(ref(db, 'positions/' + id)).catch((err) => alert("Lỗi: " + err.message));
    }
};

window.openPosModal = function(mode, id = null) {
    const modal = document.getElementById('posModal');
    if (!modal) return;
    modal.style.display = 'flex';
    const form = modal.querySelector('form'); if(form) form.reset();
    
    if (mode === 'add') {
        document.getElementById('posKey').value = "";
    } else {
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