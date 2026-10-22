// auth.js — Firebase Authentication version
import { auth, db } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  doc, setDoc, getDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const DEFAULT_CONFIG = {
  orgName: "Javis Events",
  eventName: "Live Concert Night",
  location: "Kampala, Uganda",
  entryTime: "7:00 PM",
  currency: "UGX",
  prices: { ordinary: 50000, vip: 150000 },
  mtnNumber: "0770000000",
  airtelNumber: "0750000000"
};

// Create org doc + default config for a new user
async function ensureOrg(user, orgName) {
  const orgRef = doc(db, "orgs", user.uid);
  const snap = await getDoc(orgRef);
  if (!snap.exists()) {
    await setDoc(orgRef, {
      name: orgName || (user.email.split("@")[0]),
      ownerUid: user.uid,
      createdAt: serverTimestamp()
    });
    await setDoc(doc(db, "orgs", user.uid, "config", "main"), {
      ...DEFAULT_CONFIG,
      orgName: orgName || DEFAULT_CONFIG.orgName
    });
  }
}

window.handleLogin = async function () {
  const email = document.getElementById("login-email").value.trim();
  const pass = document.getElementById("login-password").value;
  const err = document.getElementById("login-error");
  err.textContent = "";
  if (!email || !pass) { err.textContent = "Enter email and password."; return; }

  try {
    await signInWithEmailAndPassword(auth, email, pass);
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
    await ensureOrg(cred.user);
    window.location.href = "dashboard.html";
  } catch (e) {
    err.textContent = mapAuthError(e.code);
  }
};

function mapAuthError(code) {
  switch (code) {
    case "auth/invalid-email": return "Invalid email address.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential": return "Invalid email or password.";
    case "auth/email-already-in-use": return "That email already has an account.";
    case "auth/weak-password": return "Password too weak.";
    case "auth/too-many-requests": return "Too many attempts. Try again later.";
    default: return "Login failed. Please try again.";
  }
}
