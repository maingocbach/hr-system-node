// File: presence.js
import { db, ref, onValue, set, onDisconnect, serverTimestamp, remove } from './config.js';

// Hàm báo cáo "Tôi đang Online"
export function initPresence(uid, userInfo) {
    const connectedRef = ref(db, '.info/connected');
    const myStatusRef = ref(db, '/status/' + uid);

    onValue(connectedRef, (snap) => {
        if (snap.val() === true) {
            // Khi mất mạng thì tự xóa
            onDisconnect(myStatusRef).remove().then(() => {
                // Khi có mạng thì set trạng thái online
                set(myStatusRef, {
                    state: 'online',
                    last_changed: serverTimestamp(),
                    name: userInfo.name || userInfo.ho_ten || "Unknown",
                    email: userInfo.email,
                    role: userInfo.role || 'user'
                });
            });
        }
    });
}

// Hàm lấy danh sách người đang online (Cho Admin xem)
export function listenToOnlineUsers(callback) {
    const statusRef = ref(db, '/status');
    onValue(statusRef, (snapshot) => {
        const data = snapshot.val() || {};
        const onlineList = Object.keys(data).map(key => ({
            uid: key,
            ...data[key]
        }));
        callback(onlineList);
    });
}