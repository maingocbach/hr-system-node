// FILE: language.js

// 1. TỪ ĐIỂN TỔNG HỢP
const resources = {
    vi: {
        app_name: "Bejimiru", app_subtitle: "Hệ Thống Quản Lý Nhân Sự",
        // Login & Pending
        lbl_email: "Địa chỉ Email", lbl_password: "Mật khẩu", btn_login: "Đăng nhập", link_forgot: "Quên mật khẩu?", link_register: "Đăng ký mới",
        title_pending: "Đang Chờ Duyệt", msg_hello: "Xin chào", msg_pending: "Tài khoản của bạn đang chờ Admin phê duyệt.<br>Vui lòng quay lại sau.", btn_logout: "Đăng xuất",
        // Navbar & Tabs
        tab_profile: "Hồ Sơ Cá Nhân", tab_schedule: "Lịch Làm Việc",
        // Profile Form
        title_detail: "Thông Tin Chi Tiết", btn_edit: "Chỉnh sửa", btn_save: "Lưu lại", btn_cancel: "Hủy", btn_change_photo: "Đổi ảnh",
        sec_job: "Thông Tin Công Việc", lbl_readonly: "Chỉ xem", sec_personal: "Thông Tin Cá Nhân", lbl_editable: "Có thể sửa",
        lbl_code: "Mã NV", lbl_dept: "Phòng Ban", lbl_pos: "Chức Vụ", lbl_start_date: "Ngày vào", lbl_shift: "Ca làm",
        lbl_name: "Họ và Tên", lbl_dob: "Ngày sinh", lbl_phone: "Số điện thoại", lbl_nation: "Quốc tịch", lbl_addr: "Địa chỉ", lbl_visa: "Loại Visa", lbl_car: "Biển số xe",
        // Schedule
        st_work: "Đi làm", st_off: "Nghỉ",
        // Admin specific (giữ lại để dùng chung file nếu cần)
        card_online: "Đang Online", list_online: "Danh sách đang Online",
        menu_overview: "Tổng Quan", menu_approval: "Phê Duyệt", menu_staff: "Nhân Viên", menu_dept: "Phòng Ban", menu_pos: "Chức Vụ", menu_schedule: "Lịch Làm Việc",
        card_total: "Tổng nhân viên", card_working: "Đi làm hôm nay", card_off: "Nghỉ phép",
        chart_rate: "Tỷ lệ đi làm", chart_dept: "Thống kê phòng ban",
        col_name_email: "Họ Tên / Email", col_phone: "SĐT", col_status: "Trạng Thái", col_action: "Hành Động",
        col_staff: "Nhân Viên", col_code: "Mã", col_name: "Tên", col_desc: "Mô Tả",
        title_approval: "Phê Duyệt Người Dùng", desc_approval: "Danh sách chờ duyệt:",
        title_approval_modal: "Duyệt Nhân Viên", btn_approve: "Duyệt", title_staff_list: "Danh Sách Nhân Viên", title_staff_info: "Thông tin nhân viên", btn_add: "Thêm Mới", btn_close: "Đóng", hint_schedule: "Click ô ngày để đổi trạng thái."
    },
    jp: {
        app_name: "ベジミール", app_subtitle: "人事管理システム",
        lbl_email: "メールアドレス", lbl_password: "パスワード", btn_login: "ログイン", link_forgot: "パスワードを忘れた", link_register: "新規登録",
        title_pending: "承認待ち", msg_hello: "こんにちは", msg_pending: "現在、管理者によるアカウント確認中です。<br>承認が完了するまでしばらくお待ちください。", btn_logout: "ログアウト",
        tab_profile: "個人情報", tab_schedule: "勤務表",
        title_detail: "詳細情報", btn_edit: "編集", btn_save: "保存", btn_cancel: "キャンセル", btn_change_photo: "写真を変更",
        sec_job: "勤務情報", lbl_readonly: "閲覧のみ", sec_personal: "個人情報", lbl_editable: "編集可能",
        lbl_code: "社員番号", lbl_dept: "部署", lbl_pos: "役職", lbl_start_date: "入社日", lbl_shift: "シフト",
        lbl_name: "氏名", lbl_dob: "生年月日", lbl_phone: "電話番号", lbl_nation: "国籍", lbl_addr: "現住所", lbl_visa: "在留資格", lbl_car: "車両番号",
        st_work: "出勤", st_off: "休み",
        // Admin
        card_online: "オンライン中", list_online: "オンライン中のユーザー",
        menu_overview: "ダッシュボード", menu_approval: "承認待ち", menu_staff: "社員リスト", menu_dept: "部署管理", menu_pos: "役職管理", menu_schedule: "勤務表",
        card_total: "総社員数", card_working: "出勤中", card_off: "休暇中",
        chart_rate: "出勤率", chart_dept: "部署別統計",
        col_name_email: "氏名 / メール", col_phone: "電話番号", col_status: "ステータス", col_action: "操作",
        col_staff: "社員", col_code: "社員番号", col_name: "名称", col_desc: "説明",
        title_approval: "ユーザー承認", desc_approval: "承認待ちのアカウント一覧:",
        title_approval_modal: "社員承認", btn_approve: "承認", title_staff_list: "社員一覧", title_staff_info: "社員詳細情報", btn_add: "新規追加", btn_close: "閉じる", hint_schedule: "日付をクリックしてステータスを変更。"
    },
    en: {
        app_name: "Bejimiru HRM", app_subtitle: "Human Resource Management",
        lbl_email: "Email Address", lbl_password: "Password", btn_login: "Login", link_forgot: "Forgot Password?", link_register: "Register New",
        title_pending: "Pending Approval", msg_hello: "Hello", msg_pending: "Your account is currently under review by Admin.<br>Please wait for approval.", btn_logout: "Logout",
        tab_profile: "My Profile", tab_schedule: "Work Schedule",
        title_detail: "Detailed Info", btn_edit: "Edit", btn_save: "Save", btn_cancel: "Cancel", btn_change_photo: "Change Photo",
        sec_job: "Job Info", lbl_readonly: "Read-only", sec_personal: "Personal Info", lbl_editable: "Editable",
        lbl_code: "Staff Code", lbl_dept: "Department", lbl_pos: "Position", lbl_start_date: "Start Date", lbl_shift: "Shift",
        lbl_name: "Full Name", lbl_dob: "Date of Birth", lbl_phone: "Phone", lbl_nation: "Nationality", lbl_addr: "Address", lbl_visa: "Visa Type", lbl_car: "Car Plate",
        st_work: "Working", st_off: "Off",
        // Admin
        card_online: "Online Users", list_online: "Online User List",
        menu_overview: "Dashboard", menu_approval: "Approvals", menu_staff: "Employees", menu_dept: "Departments", menu_pos: "Positions", menu_schedule: "Schedule",
        card_total: "Total Staff", card_working: "Working Today", card_off: "On Leave",
        chart_rate: "Attendance Rate", chart_dept: "Dept Statistics",
        col_name_email: "Name / Email", col_phone: "Phone", col_status: "Status", col_action: "Action",
        col_staff: "Employee", col_code: "Code", col_name: "Name", col_desc: "Description",
        title_approval: "User Approvals", desc_approval: "Accounts waiting for approval:",
        title_approval_modal: "Approve User", btn_approve: "Approve", title_staff_list: "Employee List", title_staff_info: "Employee Details", btn_add: "Add New", btn_close: "Close", hint_schedule: "Click cell to toggle status."
    }
};

// 2. HÀM KHỞI TẠO (Được gọi từ index.html)
export function initLanguage() {
    window.currentLang = localStorage.getItem('hr_lang') || 'jp';
    changeLanguage(window.currentLang);
}

// 3. HÀM ĐỔI NGÔN NGỮ
window.changeLanguage = function(lang) {
    window.currentLang = lang;
    localStorage.setItem('hr_lang', lang);
    
    // Đổi màu cờ active
    document.querySelectorAll('.flag-btn').forEach(btn => btn.classList.remove('active'));
    
    // Cố gắng tìm cả ID cờ ở màn hình Login và Navbar
    const flagIds = [`flag-${lang}`, `nav-flag-${lang}`];
    flagIds.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.classList.add('active');
    });

    // Thay đổi Text
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (resources[lang][key]) {
             // Nếu thẻ là input thì đổi placeholder, ngược lại đổi innerHTML
             if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = resources[lang][key];
            } else {
                el.innerHTML = resources[lang][key];
            }
        }
    });
    
    // Thay đổi Placeholder (Input Login)
    const placeholders = {
        jp: "例: user@bejimiru.com",
        en: "Ex: user@bejimiru.com",
        vi: "Ví dụ: user@bejimiru.com"
    };
    if(document.getElementById('loginEmail')) document.getElementById('loginEmail').placeholder = placeholders[lang];

    // Bắn sự kiện (để vẽ lại lịch nếu cần)
    window.dispatchEvent(new CustomEvent('langChanged', { detail: lang }));
};

// Helper
window.t = function(key) {
    return resources[window.currentLang][key] || key;
};