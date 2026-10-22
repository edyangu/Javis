// auth.js
// Firebase Authentication for organisers.
// Retries the Firestore write if the first attempt fails right after signup
// (Firebase sometimes needs a beat before the auth token is available to Firestore).

import { auth, db } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  doc, setDoc, getDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { DEFAULTS } from "./config.js";

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function ensureOrg(user) {
  const orgRef = doc(db, "orgs", user.uid);
  const cfgRef = doc(db, "orgs", user.uid, "config", "main");

  // Try up to 3 times. Firebase auth sometimes lags behind Firestore.
  let lastErr = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const snap = await getDoc(orgRef);
      if (!snap.exists()) {
        const orgName = user.email.split("@")[0];
        await setDoc(orgRef, {
          name: orgName,
          ownerUid: user.uid,
          createdAt: serverTimestamp()
        });
        await setDoc(cfgRef, {
          ...DEFAULTS,
          orgName: orgName
        });
      }
      return; // success
    } catch (e) {
      lastErr = e;
      console.warn("ensureOrg attempt " + attempt + " failed:", e.code || e.message);
      await sleep(800);
    }
  }
  throw lastErr;
}

function mapAuthError(code) {
  switch (code) {
    case "auth/invalid-email":        return "Invalid email address.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":   return "Invalid email or password.";
    case "auth/email-already-in-use": return "That email already has an account.";
    case "auth/weak-password":        return "Password too weak (min 6 characters).";
    case "auth/too-many-requests":    return "Too many attempts. Try again later.";
    case "auth/unauthorized-domain":  return "This domain is not authorised in Firebase.";
    case "auth/network-request-failed": return "Network error.";
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
    // If the user exists but org doc is missing, create it now.
    try { await ensureOrg(cred.user); } catch (e) {
      console.warn("ensureOrg on login failed:", e);
    }
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

    // Give Firestore a moment to see the auth token
    await sleep(500);

    try {
      await ensureOrg(cred.user);
    } catch (e) {
      console.error("Org creation failed:", e);
      err.textContent = "Account created, but org setup failed: " + (e.code || e.message);
      // Still send them to dashboard — it will retry on load
    }

    window.location.href = "dashboard.html";
  } catch (e) {
    err.textContent = mapAuthError(e.code);
  }
};
