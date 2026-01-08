// admin/js/schedule.js
import { db, ref, update, onValue } from './config.js';

let employeesData = [];
let currentWeekStart = new Date(); 
let currentMonthView = new Date();

// --- 1. HÀM XỬ LÝ NGÀY THÁNG CHUẨN ---
function formatDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function getMonday(d) {
    d = new Date(d);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

// --- 2. KHỞI TẠO ---
export function initScheduleListeners() {
    currentWeekStart = getMonday(new Date());

    const dbRef = ref(db, 'employees');
    onValue(dbRef, (snapshot) => {
        const data = snapshot.val();
        employeesData = [];
        if (data) {
            Object.keys(data).forEach(key => {
                employeesData.push({ id: key, ...data[key] });
            });
        }
        renderWeeklySchedule();
        
        // --- SỬA LỖI TẠI ĐÂY: Kiểm tra Modal có thực sự đang mở không ---
        const modal = document.getElementById('scheduleModal');
        const modalEmpIdEl = document.getElementById('modalEmpId');
        
        if(modal && modal.style.display === 'flex' && modalEmpIdEl) {
            const currentId = modalEmpIdEl.value;
            const emp = employeesData.find(e => e.id === currentId);
            if(emp) renderMonthCalendar(emp);
        }
    });
}

// --- 3. QUAN TRỌNG: LẮNG NGHE SỰ KIỆN ĐĂNG NHẬP THÀNH CÔNG ---
window.addEventListener('authUpdated', () => {
    console.log("Schedule: Auth updated, rerendering schedule...");
    renderWeeklySchedule();
    
    const modal = document.getElementById('scheduleModal');
    const modalEmpIdEl = document.getElementById('modalEmpId');

    if(modal && modal.style.display === 'flex' && modalEmpIdEl) {
        const currentId = modalEmpIdEl.value;
        const emp = employeesData.find(e => e.id === currentId);
        if(emp) renderMonthCalendar(emp);
    }
});

// --- 4. XỬ LÝ LỊCH TUẦN ---
function renderWeeklySchedule() {
    const tbody = document.getElementById('scheduleTableBody');
    const headerRow = document.getElementById('scheduleHeaderDates');
    const weekLabel = document.getElementById('currentWeekLabel');
    
    if (!tbody || !headerRow) return;

    const canEdit = window.checkPerm ? window.checkPerm('schedule', 'edit') : false;

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(currentWeekStart);
        d.setDate(currentWeekStart.getDate() + i);
        weekDays.push(d);
    }

    if (weekLabel) {
        const startStr = `${weekDays[0].getDate()}/${weekDays[0].getMonth()+1}`;
        const endStr = `${weekDays[6].getDate()}/${weekDays[6].getMonth()+1}`;
        weekLabel.innerText = `Tuần: ${startStr} - ${endStr}`;
    }

    const dayNames = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    headerRow.innerHTML = `<th style="min-width:200px; background:#f8f9fa">Nhân viên</th><th style="width:60px; background:#f8f9fa">Ca</th>`;
    
    weekDays.forEach((d, index) => {
        const isToday = formatDateKey(d) === formatDateKey(new Date());
        const bgStyle = isToday ? "background-color: #e3f2fd;" : "background-color: #f8f9fa;";
        const textStyle = isToday ? "color: #1976d2; font-weight:bold;" : "color: #333;";
        headerRow.innerHTML += `<th style="${bgStyle} ${textStyle} text-align:center;">${dayNames[index]}<br><small>${d.getDate()}/${d.getMonth()+1}</small></th>`;
    });

    tbody.innerHTML = '';
    employeesData.forEach(emp => {
        const tr = document.createElement('tr');
        
        let infoTdHtml = `
            <td style="cursor:pointer; font-weight:500" onclick="window.openMonthModal('${emp.id}')">
                <div style="color:var(--primary)">${emp.name}</div>
                <div style="font-size:0.75rem; color:#888">${emp.dept || ''}</div>
            </td>
            <td class="text-center"><span class="badge bg-light text-dark border">${emp.shift || 'A'}</span></td>
        `;
        tr.innerHTML = infoTdHtml;

        weekDays.forEach(day => {
            const dateKey = formatDateKey(day);
            const status = (emp.schedule && emp.schedule[dateKey]) ? emp.schedule[dateKey] : null;
            
            const td = document.createElement('td');
            td.style.textAlign = 'center';
            td.style.verticalAlign = 'middle';
            td.style.border = '1px solid #eee';

            if (status === 'working') {
                td.className = 'bg-success text-white';
                td.innerHTML = '<i class="fas fa-check"></i>';
            } else if (status === 'off') {
                td.className = 'bg-danger text-white';
                td.innerHTML = '<i class="fas fa-times"></i>';
            } else {
                td.innerHTML = '<span style="color:#eee">.</span>';
            }

            if (canEdit) {
                td.style.cursor = 'pointer';
                td.onclick = () => window.toggleDayStatus(emp.id, dateKey, status || '');
            } else {
                td.style.cursor = 'not-allowed';
                td.style.opacity = '0.7';
                td.onclick = () => alert("Bạn không có quyền chỉnh sửa lịch làm việc!");
            }
            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });
}

// --- 5. CÁC HÀM GLOBAL ---
window.changeWeek = function(offset) {
    currentWeekStart.setDate(currentWeekStart.getDate() + (offset * 7));
    renderWeeklySchedule();
};

window.toggleDayStatus = function(empId, dateKey, currentStatus) {
    if (window.checkPerm && !window.checkPerm('schedule', 'edit')) {
        alert("Thao tác bị chặn: Bạn không có quyền sửa!");
        return;
    }

    let nextStatus = 'working';
    if (currentStatus === 'working') nextStatus = 'off';
    else if (currentStatus === 'off') nextStatus = null;

    const updates = {};
    updates[`employees/${empId}/schedule/${dateKey}`] = nextStatus;
    update(ref(db), updates).catch(err => alert("Lỗi DB: " + err.message));
};

// --- 6. LỊCH THÁNG (MODAL) ---
window.openMonthModal = function(empId) {
    const emp = employeesData.find(e => e.id === empId);
    if (!emp) return;

    const modal = document.getElementById('scheduleModal');
    const modalId = document.getElementById('modalEmpId');
    const modalName = document.getElementById('modalEmpName');

    if (modal) modal.style.display = 'flex';
    if (modalId) modalId.value = empId;
    if (modalName) {
        modalName.innerHTML = `
            <span style="font-size:1.2rem">${emp.name}</span> 
            <span class="badge bg-secondary" style="font-size:0.8rem">${emp.code || ''}</span>
        `;
    }
    
    currentMonthView = new Date();
    renderMonthCalendar(emp);
};

window.changeMonth = function(offset) {
    const newMonth = new Date(currentMonthView.getFullYear(), currentMonthView.getMonth() + offset, 1);
    currentMonthView = newMonth;
    
    const modalIdEl = document.getElementById('modalEmpId');
    if (modalIdEl) {
        const empId = modalIdEl.value;
        const emp = employeesData.find(e => e.id === empId);
        if (emp) renderMonthCalendar(emp);
    }
};

function renderMonthCalendar(emp) {
    const year = currentMonthView.getFullYear();
    const month = currentMonthView.getMonth();
    const canEdit = window.checkPerm ? window.checkPerm('schedule', 'edit') : false;

    const monthLabel = document.getElementById('monthLabel');
    if (monthLabel) monthLabel.innerText = `Tháng ${month + 1} / ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;

    const tbody = document.getElementById('monthCalendarBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    let date = 1;
    for (let i = 0; i < 6; i++) {
        const row = document.createElement('tr');
        for (let j = 0; j < 7; j++) {
            const cell = document.createElement('td');
            cell.style.cssText = 'height:80px; width:14.28%; vertical-align:top; border:1px solid #dee2e6; padding:5px;';

            if (i === 0 && j < startOffset) {
                cell.style.backgroundColor = '#f8f9fa';
            } else if (date > daysInMonth) {
                cell.style.backgroundColor = '#f8f9fa';
            } else {
                const currentDate = new Date(year, month, date);
                const dateKey = formatDateKey(currentDate);
                const status = (emp.schedule && emp.schedule[dateKey]) ? emp.schedule[dateKey] : null;

                if (status === 'working') {
                    cell.style.backgroundColor = '#d4edda';
                } else if (status === 'off') {
                    cell.style.backgroundColor = '#f8d7da';
                }

                if (canEdit) {
                    cell.style.cursor = 'pointer';
                    cell.onclick = () => window.toggleDayStatus(emp.id, dateKey, status || '');
                } else {
                    cell.style.cursor = 'not-allowed';
                    cell.onclick = () => alert("Bạn không có quyền chỉnh sửa!");
                }

                let statusText = '';
                if(status === 'working') statusText = '<span style="color:#155724; font-size:0.8rem; font-weight:bold">● Đi làm</span>';
                if(status === 'off') statusText = '<span style="color:#721c24; font-size:0.8rem; font-weight:bold">● Nghỉ</span>';

                cell.innerHTML = `
                    <div style="text-align:right; font-weight:bold; color:#555">${date}</div>
                    <div style="text-align:center; margin-top:5px;">${statusText}</div>
                `;
                date++;
            }
            row.appendChild(cell);
        }
        tbody.appendChild(row);
        if (date > daysInMonth) break;
    }
}

window.closeScheduleModal = function() {
    const modal = document.getElementById('scheduleModal');
    if (modal) modal.style.display = 'none';
};