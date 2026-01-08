// register.js
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

/**
 * Hàm hiển thị trang đăng ký
 */
export function renderRegister(auth, db, container, onBackToLogin) {
    // 1. Kiểm tra container có tồn tại không để tránh lỗi
    if (!container) {
        console.error("Lỗi: Không tìm thấy container để hiển thị trang đăng ký!");
        return;
    }

    // 2. HTML Giao diện
    const htmlContent = `
        <div class="auth-container">
            <h3 class="mb-3 text-success fw-bold text-center"><i class="fas fa-user-plus"></i> 新規登録</h3>
            <p class="text-secondary text-center mb-4">Đăng ký thành viên mới</p>
            
            <form id="moduleRegisterForm">
                <h6 class="text-primary border-bottom pb-2 mb-3">アカウント情報 (Tài khoản)</h6>
                
                <div class="mb-2">
                    <label class="form-label fw-bold small">メールアドレス (Email) <span class="text-danger">*</span></label>
                    <input type="email" id="regEmail" class="form-control" required>
                </div>
                
                <div class="row">
                    <div class="col-md-6 mb-2">
                        <label class="form-label fw-bold small">パスワード (Mật khẩu) <span class="text-danger">*</span></label>
                        <input type="password" id="regPass" class="form-control" placeholder="6 ký tự trở lên" required>
                    </div>
                    <div class="col-md-6 mb-2">
                        <label class="form-label fw-bold small">確認用 (Nhập lại MK) <span class="text-danger">*</span></label>
                        <input type="password" id="regPassConfirm" class="form-control" placeholder="Nhập lại mật khẩu" required>
                    </div>
                </div>

                <h6 class="text-primary border-bottom pb-2 mt-3 mb-3">個人情報 (Thông tin cá nhân)</h6>

                <div class="mb-2">
                    <label class="form-label fw-bold small">氏名 (Họ và tên) <span class="text-danger">*</span></label>
                    <input type="text" id="regName" class="form-control" placeholder="NGUYEN VAN A" required>
                </div>

                <div class="row">
                    <div class="col-md-6 mb-2">
                        <label class="form-label fw-bold small">電話番号 (SĐT)</label>
                        <input type="text" id="regPhone" class="form-control">
                    </div>
                    <div class="col-md-6 mb-2">
                        <label class="form-label fw-bold small">国籍 (Quốc tịch)</label>
                        <input type="text" id="regNation" class="form-control" value="ベトナム (Vietnam)">
                    </div>
                </div>

                <div class="mb-2">
                    <label class="form-label fw-bold small">現住所 (Địa chỉ)</label>
                    <input type="text" id="regAddress" class="form-control">
                </div>

                <div class="mb-4">
                    <label class="form-label fw-bold small">希望部署 (Bộ phận mong muốn) <span class="text-danger">*</span></label>
                    <select id="regDept" class="form-select" required>
                        <option value="">-- 部署を選択 (Chọn bộ phận) --</option>
                    </select>
                </div>

                <div class="d-grid gap-2 mb-3">
                    <button type="submit" class="btn btn-success fw-bold">登録申請 (Gửi yêu cầu đăng ký)</button>
                </div>
                <div class="text-center">
                    <span class="text-muted small">すでにアカウントをお持ちですか？ (Đã có tài khoản?)</span><br>
                    <a href="#" id="btnBackLogin" class="fw-bold text-decoration-none">ログインはこちら (Đăng nhập tại đây)</a>
                </div>
            </form>
        </div>
    `;

    // 3. Render nội dung
    container.innerHTML = htmlContent;

    // --- SỬA LỖI TRẮNG XOÁ TẠI ĐÂY ---
    // Loại bỏ class ẩn (nếu có)
    container.classList.remove('hidden'); 
    // Ép kiểu hiển thị là block (đề phòng style="display:none" đang bị dính)
    container.style.display = 'block'; 
    // ---------------------------------

    // 4. Logic: Tải danh sách bộ phận từ Database
    const deptSelect = document.getElementById('regDept');
    onValue(ref(db, 'departments'), (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            deptSelect.innerHTML = '<option value="">-- 部署を選択 (Chọn bộ phận) --</option>';
            
            Object.values(data).forEach(deptObj => {
                const name = deptObj.name || deptObj; 
                const opt = document.createElement('option');
                opt.value = name;
                opt.innerText = name;
                deptSelect.appendChild(opt);
            });
        }
    });

    // 5. Sự kiện: Quay lại Login
    const btnBack = document.getElementById('btnBackLogin');
    if (btnBack) {
        btnBack.addEventListener('click', (e) => {
            e.preventDefault();
            // Ẩn form đăng ký đi
            container.style.display = 'none'; 
            container.classList.add('hidden');
            container.innerHTML = ""; 
            // Gọi callback để hiện lại Login
            if (typeof onBackToLogin === 'function') {
                onBackToLogin(); 
            }
        });
    }

    // 6. Sự kiện: Xử lý Đăng ký
    const form = document.getElementById('moduleRegisterForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const email = document.getElementById('regEmail').value;
            const pass = document.getElementById('regPass').value;
            const passConfirm = document.getElementById('regPassConfirm').value;
            const name = document.getElementById('regName').value;
            const phone = document.getElementById('regPhone').value;
            const nation = document.getElementById('regNation').value;
            const address = document.getElementById('regAddress').value;
            const dept = document.getElementById('regDept').value;

            // Validation
            if (pass !== passConfirm) {
                alert("❌ Lỗi: Mật khẩu xác nhận không khớp!");
                document.getElementById('regPassConfirm').focus();
                return;
            }
            if (pass.length < 6) {
                alert("❌ Lỗi: Mật khẩu phải từ 6 ký tự trở lên!");
                return;
            }

            // Tạo User Authentication
            createUserWithEmailAndPassword(auth, email, pass)
                .then((cred) => {
                    const uid = cred.user.uid;
                    
                    const userData = {
                        uid: uid,
                        email: email,
                        name: name,
                        phone: phone,
                        dept: dept,
                        nationality: nation,
                        address: address,
                        status: "pending", 
                        createdAt: new Date().toISOString()
                    };

                    // Lưu vào Realtime Database (pending_users)
                    set(ref(db, 'pending_users/' + uid), userData).then(() => {
                        alert("✅ Đăng ký thành công! Vui lòng chờ Admin phê duyệt.");
                        
                        auth.signOut(); // Đăng xuất ngay

                        // Quay về login
                        container.style.display = 'none';
                        container.innerHTML = "";
                        if (typeof onBackToLogin === 'function') {
                            onBackToLogin();
                        }
                    });
                })
                .catch((error) => {
                    let msg = error.message;
                    if(error.code === 'auth/email-already-in-use') msg = "Email này đã được sử dụng!";
                    if(error.code === 'auth/weak-password') msg = "Mật khẩu quá yếu!";
                    alert("❌ Lỗi đăng ký: " + msg);
                });
        });
    }
}