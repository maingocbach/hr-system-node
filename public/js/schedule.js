// public/js/schedule.js
import { db } from './config.js';
import { ref, get, update } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

export function initScheduleListeners() {
    // Khởi tạo tuần hiện tại cho input weekPicker
    const picker = document.getElementById('weekPicker');
    if(picker && !picker.value) {
        const today = new Date();
        const year = today.getFullYear();
        // Logic tính tuần đơn giản
        const firstDay = new Date(year, 0, 1);
        const pastDays = (today - firstDay) / 86400000;
        const weekNum = Math.ceil((pastDays + firstDay.getDay() + 1) / 7);
        picker.value = `${year}-W${weekNum.toString().padStart(2, '0')}`;
    }
}

export async function renderScheduleTable(employees) {
    const tbody = document.getElementById('scheduleTableBody');
    if(!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="9">Đang tải lịch...</td></tr>';
    renderWeekHeader();

    // Render từng dòng nhân viên
    let html = '';
    employees.forEach(emp => {
        let row = `<tr class="sched-row" data-name="${emp.name.toLowerCase()}" data-dept="${emp.dept}">
            <td style="font-weight:bold; white-space:nowrap">${emp.name}</td>
            <td style="font-size:12px; color:#7f8c8d">${emp.dept || '-'}</td>`;
        
        // 7 ngày trong tuần
        for(let i=0; i<7; i++) {
            // Logic state: 0 (trống), 1 (đi làm), 2 (nghỉ)
            row += `<td onclick="window.toggleShift(this)" data-state="0" style="cursor:pointer; text-align:center; border-left:1px solid #eee"><i class="fas fa-minus" style="color:#ccc"></i></td>`;
        }
        html += row + '</tr>';
    });
    tbody.innerHTML = html;
}

function renderWeekHeader() {
    const picker = document.getElementById('weekPicker');
    if(!picker || !picker.value) return;

    const [year, week] = picker.value.split('-W');
    const simple = new Date(year, 0, 1 + (week - 1) * 7);
    const dayOfWeek = simple.getDay();
    const monday = simple;
    if (dayOfWeek <= 4) monday.setDate(simple.getDate() - simple.getDay() + 1);
    else monday.setDate(simple.getDate() + 8 - simple.getDay());

    const hRow = document.getElementById('scheduleHeaderDates'); 
    hRow.innerHTML = '<th>Nhân Viên</th><th>Phòng Ban</th>';
    
    for (let i = 0; i < 7; i++) {
        let d = new Date(monday); d.setDate(monday.getDate() + i);
        const dayStr = `${d.getDate()}/${d.getMonth()+1}`;
        const dayName = ['T2','T3','T4','T5','T6','T7','CN'][i];
        hRow.innerHTML += `<th>${dayStr}<br><small>${dayName}</small></th>`;
    }
}

// Logic Click ô lịch (được export ra window ở script.js)
export function toggleShiftLogic(cell) {
    let state = parseInt(cell.getAttribute('data-state') || 0);
    state = (state + 1) % 3; 
    cell.setAttribute('data-state', state);

    if (state === 0) cell.innerHTML = '<i class="fas fa-minus" style="color:#ccc"></i>';
    else if (state === 1) cell.innerHTML = '<i class="fas fa-check" style="color:#2ecc71"></i>';
    else cell.innerHTML = '<i class="fas fa-times" style="color:#e74c3c"></i>';
}