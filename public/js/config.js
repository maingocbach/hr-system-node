// public/js/config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// CẤU HÌNH MỚI CHO DỰ ÁN HRM-COMPANY
const firebaseConfig = {
  apiKey: "AIzaSyCoS7THPsgN-XDXUFjT6yWix0z6RkoPpE8",
  authDomain: "hrm-company.firebaseapp.com",
  // Lưu ý: Database của bạn ở server Asia (Singapore), đường dẫn dài hơn bình thường
  databaseURL: "https://hrm-company-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "hrm-company",
  storageBucket: "hrm-company.firebasestorage.app",
  messagingSenderId: "1029376061404",
  appId: "1:1029376061404:web:620e2003a0ed322578e919",
  measurementId: "G-1J9YF67Y3P"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);