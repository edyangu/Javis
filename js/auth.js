import { auth, db } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  doc, setDoc, getDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

async function registerOrganiser(user) {
  try {
    const ref = doc(db, "organisers", user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        email: user.email,
        name: user.email.split("@")[0],
        createdAt: serverTimestamp()
      });
    }
  } catch (e) {
    console.warn("registerOrganiser failed:", e);
  }
}

function mapAuthError(code) {
  switch (code) {
    case "auth/invalid-email":        return "Invalid email address.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":   return "Invalid email or password.";
    case "auth/email-already-in-use": return "That email already has an account.";
    case "auth/weak-password":        return "Password too weak (min 6 characters).";
    case "auth/unauthorized-domain":  return "This domain is not authorised in Firebase.";
    default:                          return "Auth error: " + code;
  }
}

window.handleLogin = async function () {
  const email = document.getElementById("login-email").value.trim();
  const pass = document.getElementById("login-password").value;
  const err = document.getElementById("login-error");
  err.textContent = "";
  if (!email || !pass) { err.textContent = "Enter email and password."; return; }

  try {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    await registerOrganiser(cred.user);
    window.location.href = "dashboard.html";
  } catch (e) {
    err.textContent = mapAuthError(e.code);
  }
};

window.handleRegister = async function () {
  const email = document.getElementById("login-email").value.trim();
  const pass = document.getElementById("login-password").value;
  const err = document.getElementById("login-error");
  err.textContent = "";
  if (!email || !pass) { err.textContent = "Enter email and password."; return; }
  if (pass.length < 6) { err.textContent = "Password must be at least 6 characters."; return; }

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(cred.user, { displayName: email.split("@")[0] });
    await registerOrganiser(cred.user);
    window.location.href = "dashboard.html";
  } catch (e) {
    err.textContent = mapAuthError(e.code);
  }
};
