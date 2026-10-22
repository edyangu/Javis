import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB352izMwQBtakUXNQ2y0tP0Lp0wqLw3NI",
  authDomain: "javis-aa79f.firebaseapp.com",
  projectId: "javis-aa79f",
  storageBucket: "javis-aa79f.firebasestorage.app",
  messagingSenderId: "450894977943",
  appId: "1:450894977943:web:6263af6ef575c40a6582d2",
  measurementId: "G-CPF219C1HN"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);
