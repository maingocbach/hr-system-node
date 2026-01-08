// public/js/script.js

import { employees, initEmployeeListeners } from './employees.js';
import { departments, initDepartmentListeners } from './departments.js';
import { positions, initPositionListeners } from './positions.js';
import { pendingList, initApprovalListeners } from './approvals.js';
import { initScheduleListeners, renderScheduleTable, toggleShiftLogic } from './schedule.js';
import { handleLogin, initPermissionTab } from './auth.js'; // Đã bỏ handleLogout

let myChart = null;

document.addEventListener('DOMContentLoaded', () => {
    // 1. Init Data Listeners
    initEmployeeListeners();
    initDepartmentListeners();
    initPositionListeners();
    initApprovalListeners();
    initScheduleListeners(); // Init Lịch

    // 2. Check Login
    const storedUser = localStorage.getItem('hr_user');
    if (storedUser) {
        document.getElementById('login-overlay').style.display = 'none';
        const userObj = JSON.parse(storedUser);
        if(document.getElementById('admin-display-name')) {
            document.getElementById('admin-display-name').innerText = userObj.name;
        }
        window.switchTab('overview', document.getElementById('menu_overview'));
    }

    // 3. Login Event
    const loginForm = document.getElementById('loginForm');
    if(loginForm) loginForm.addEventListener('submit', (e) => handleLogin(e, employees));

    // 4. Global Utils
    window.toggleSidebar = () => { const s = document.getElementById('sidebar'); if(s) s.classList.toggle('active'); };
    
    window.handleLogout = () => {
        if(confirm("Đăng xuất?")) { localStorage.removeItem('hr_user'); location.reload(); }
    };
});

// --- SWITCH TAB ---
window.switchTab = function(tabId, element) {
    document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
    
    if (element) element.classList.add('active');
    const target = document.getElementById(tabId);
    if(target) target.classList.add('active');

    // Load Data theo Tab
    if (tabId === 'overview') renderDashboard();
    if (tabId === 'permissions') initPermissionTab(departments, positions, employees);
    if (tabId === 'schedule') {
        renderScheduleTable(employees); // Render bảng lịch
        // Fill dropdown phòng ban lọc lịch
        const sel = document.getElementById('filterScheduleDept');
        if(sel && sel.options.length <= 1) {
            departments.forEach(d => sel.innerHTML += `<option value="${d.name}">${d.name}</option>`);
        }
    }
    if (tabId === 'history') window.loadSystemHistory(); // Load lịch sử

    if(window.innerWidth < 768) document.getElementById('sidebar').classList.remove('active');
};

// --- DASHBOARD (Full Stats) ---
function renderDashboard() {
    if (employees.length === 0) return;

    const total = employees.length;
    const working = employees.filter(e => e.status === 'working').length;
    const off = employees.filter(e => e.status === 'off').length;
    
    // Random số online giả lập (hoặc lấy thật nếu có field online)
    const online = Math.floor(Math.random() * (working - 1) + 1);

    document.getElementById('total-staff').innerText = total;
    document.getElementById('working-today').innerText = working;
    document.getElementById('off-today').innerText = off;
    const elOnline = document.getElementById('online-count');
    if(elOnline) elOnline.innerText = online;

    // Chart
    const ctx = document.getElementById('pieChart');
    if (ctx) {
        if (myChart) myChart.destroy();
        myChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Đi làm', 'Nghỉ'],
                datasets: [{ data: [working, off], backgroundColor: ['#2ecc71', '#e74c3c'] }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    // Thống kê phòng ban (List)
    const deptStats = document.getElementById('dept-stats');
    if(deptStats) {
        let html = '';
        departments.forEach(d => {
            const count = employees.filter(e => e.dept === d.name).length;
            html += `<div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #eee">
                <span>${d.name}</span> <span style="font-weight:bold">${count} NV</span>
            </div>`;
        });
        deptStats.innerHTML = html;
    }
}

// --- SCHEDULE UTILS ---
window.changeWeekPicker = () => renderScheduleTable(employees);
window.toggleShift = (cell) => toggleShiftLogic(cell);
window.saveScheduleChanges = () => alert("Đã lưu lịch làm việc thành công!");

window.filterSchedule = () => {
    const search = document.getElementById('searchScheduleName').value.toLowerCase();
    const dept = document.getElementById('filterScheduleDept').value;
    document.querySelectorAll('.sched-row').forEach(row => {
        const rName = row.dataset.name;
        const rDept = row.dataset.dept;
        const show = rName.includes(search) && (dept === "" || rDept === dept);
        row.style.display = show ? '' : 'none';
    });
};

// --- HISTORY LOGIC (Giả lập hoặc load thật) ---
window.loadSystemHistory = () => {
    const tbody = document.getElementById('historyTableBody');
    if(!tbody) return;
    tbody.innerHTML = '';
    
    // Mock data demo (Bạn có thể thay bằng fetch Firebase 'logs' nếu có)
    const logs = [
        { time: '09:00 09/01', user: 'Admin', action: 'Đăng nhập', detail: 'Đăng nhập hệ thống thành công' },
        { time: '08:30 09/01', user: 'Admin', action: 'Sửa nhân viên', detail: 'Cập nhật hồ sơ NV001' },
        { time: '17:00 08/01', user: 'System', action: 'Backup', detail: 'Sao lưu dữ liệu tự động' }
    ];
    
    logs.forEach(l => {
        tbody.innerHTML += `<tr>
            <td>${l.time}</td>
            <td>${l.user}</td>
            <td><span style="color:blue">${l.action}</span></td>
            <td>${l.detail}</td>
        </tr>`;
    });
};

// --- DATA LISTENER ---
window.addEventListener('dataUpdated', () => {
    if (document.getElementById('overview').classList.contains('active')) renderDashboard();
});