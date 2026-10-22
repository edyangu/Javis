// auth.js
// Demo auth. Production: replace with Firebase Authentication.

const USERS_KEY = "javis_users";
const SESSION_KEY = "javis_session";

function simpleHash(str) {
  // FNV-1a style hash, deterministic for demo storage.
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h.toString(16);
}

function getUsers() {
  try {
    const list = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    if (list.length === 0) {
      // seed default admin
      list.push({
        email: "admin@javis.local",
        passHash: simpleHash("admin123"),
        orgName: "Javis Events"
      });
      localStorage.setItem(USERS_KEY, JSON.stringify(list));
    }
    return list;
  } catch (e) {
    return [];
  }
}

function saveUsers(list) {
  localStorage.setItem(USERS_KEY, JSON.stringify(list));
}

function handleLogin() {
  const email = document.getElementById("login-email").value.trim().toLowerCase();
  const pass = document.getElementById("login-password").value;
  const err = document.getElementById("login-error");
  err.textContent = "";

  if (!email || !pass) {
    err.textContent = "Enter email and password.";
    return;
  }

  const users = getUsers();
  const user = users.find(u => u.email === email && u.passHash === simpleHash(pass));
  if (!user) {
    err.textContent = "Invalid email or password.";
    return;
  }

  localStorage.setItem(SESSION_KEY, JSON.stringify({ email: user.email, orgName: user.orgName }));
  window.location.href = "dashboard.html";
}

function handleRegister() {
  const email = document.getElementById("login-email").value.trim().toLowerCase();
  const pass = document.getElementById("login-password").value;
  const err = document.getElementById("login-error");
  err.textContent = "";

  if (!email || !pass) {
    err.textContent = "Enter email and password to create an account.";
    return;
  }
  if (pass.length < 6) {
    err.textContent = "Password must be at least 6 characters.";
    return;
  }

  const users = getUsers();
  if (users.find(u => u.email === email)) {
    err.textContent = "An account with that email already exists.";
    return;
  }

  users.push({ email: email, passHash: simpleHash(pass), orgName: email.split("@")[0] });
  saveUsers(users);
  err.textContent = "";
  alert("Account created. You can now log in.");
}
