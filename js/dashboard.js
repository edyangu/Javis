import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  doc, getDoc, setDoc, deleteDoc,
  collection, getDocs, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { verifyTicketCode } from "./codegen.js";
import { DEFAULTS } from "./config.js";

const EVENT_REF = () => doc(db, "settings", "event");
const ADMIN_REF = (uid) => doc(db, "admins", uid);

let currentUser = null;
let isSuperAdmin = false;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    document.getElementById("access-denied").style.display = "block";
    document.getElementById("dashboard-body").style.display = "none";
    document.getElementById("super-admin-panel").style.display = "none";
    return;
  }
  currentUser = user;

  // Check if this user is a super admin
  try {
    const adminSnap = await getDoc(ADMIN_REF(user.uid));
    isSuperAdmin = adminSnap.exists();
  } catch (e) {
    isSuperAdmin = false;
  }

  document.getElementById("access-denied").style.display = "none";
  document.getElementById("dashboard-body").style.display = "block";
  document.getElementById("public-link").textContent = window.location.origin + "/index.html";

  if (isSuperAdmin) {
    document.getElementById("super-admin-panel").style.display = "block";
    document.getElementById("super-admin-badge").style.display = "inline-block";
    await loadOrganisers();
    await loadAllTickets();
  } else {
    document.getElementById("super-admin-panel").style.display = "none";
    document.getElementById("super-admin-badge").style.display = "none";
  }

  await loadConfigIntoForm();
  await renderTickets();
});

async function loadConfigIntoForm() {
  try {
    const snap = await getDoc(EVENT_REF());
    const c = snap.exists() ? snap.data() : DEFAULTS;
    document.getElementById("cfg-org").value        = c.orgName || "";
    document.getElementById("cfg-event").value      = c.eventName || "";
    document.getElementById("cfg-location").value   = c.location || "";
    document.getElementById("cfg-time").value       = c.entryTime || "";
    document.getElementById("cfg-price-ordinary").value = c.prices?.ordinary ?? 50000;
    document.getElementById("cfg-price-vip").value      = c.prices?.vip ?? 150000;
    document.getElementById("cfg-mtn").value        = c.mtnNumber || "";
    document.getElementById("cfg-airtel").value     = c.airtelNumber || "";
  } catch (e) {
    console.error("loadConfig error:", e);
  }
}

window.saveSettings = async function () {
  const newCfg = {
    orgName:    document.getElementById("cfg-org").value.trim() || "Javis Events",
    eventName:  document.getElementById("cfg-event").value.trim() || "Concert",
    location:   document.getElementById("cfg-location").value.trim() || "Kampala",
    entryTime:  document.getElementById("cfg-time").value.trim() || "7:00 PM",
    currency:   "UGX",
    prices: {
      ordinary: Number(document.getElementById("cfg-price-ordinary").value) || 0,
      vip:      Number(document.getElementById("cfg-price-vip").value) || 0
    },
    mtnNumber:    document.getElementById("cfg-mtn").value.trim(),
    airtelNumber: document.getElementById("cfg-airtel").value.trim()
  };

  try {
    await setDoc(EVENT_REF(), newCfg, { merge: true });
    document.getElementById("save-status").textContent =
      "Settings saved at " + new Date().toLocaleTimeString();
  } catch (e) {
    document.getElementById("save-status").textContent = "Save failed: " + e.message;
  }
};

async function renderTickets() {
  const tbody = document.getElementById("sold-table-body");
  if (!tbody) return;
  tbody.innerHTML = "";
  try {
    const q = query(collection(db, "tickets"), orderBy("issuedAt", "desc"));
    const snap = await getDocs(q);
    document.getElementById("sold-count").textContent = snap.size + " ticket(s) sold";
    snap.forEach(d => {
      const t = d.data();
      const tr = document.createElement("tr");
      const issued = t.issuedAt && t.issuedAt.toMillis
        ? new Date(t.issuedAt.toMillis()).toLocaleString() : "-";
      [t.code, t.name, t.phone, (t.type || "").toUpperCase(),
       t.amount, (t.method || "").toUpperCase(), issued]
        .forEach(val => {
          const td = document.createElement("td");
          td.textContent = val ?? "";
          tr.appendChild(td);
        });
      tbody.appendChild(tr);
    });
  } catch (e) {
    console.error("renderTickets error:", e);
  }
}

window.clearTickets = async function () {
  if (!confirm("Delete ALL tickets?")) return;
  try {
    const snap = await getDocs(collection(db, "tickets"));
    await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
    await renderTickets();
    if (isSuperAdmin) await loadAllTickets();
  } catch (e) { alert("Clear failed: " + e.message); }
};

window.verifyCode = async function () {
  const code = document.getElementById("verify-input").value.trim().toUpperCase();
  const result = document.getElementById("verify-result");
  result.textContent = "";
  if (!verifyTicketCode(code)) { result.textContent = "INVALID format or checksum."; return; }
  try {
    const snap = await getDocs(collection(db, "tickets"));
    let found = null;
    snap.forEach(d => { if (d.data().code === code) found = d.data(); });
    if (!found) { result.textContent = "Well-formed but not found."; return; }
    result.textContent = "VALID - " + found.type.toUpperCase() + " for " + found.name + " (" + found.phone + ")";
  } catch (e) { result.textContent = "Verify failed: " + e.message; }
};

/* ============================================
   SUPER ADMIN specific functions
   ============================================ */

async function loadOrganisers() {
  const tbody = document.getElementById("organisers-table-body");
  if (!tbody) return;
  tbody.innerHTML = "";

  try {
    // Every user who has logged in is in Firestore as an "organiser"
    // We use the organisers collection, which auth.js will write on login
    const snap = await getDocs(collection(db, "organisers"));
    document.getElementById("organisers-count").textContent = snap.size + " organiser(s)";

    if (snap.size === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="muted">No organisers registered yet.</td></tr>';
      return;
    }

    snap.forEach(d => {
      const o = d.data();
      const tr = document.createElement("tr");
      [d.id, o.email || "-", o.name || "-", o.createdAt ? new Date(o.createdAt.toMillis ? o.createdAt.toMillis() : o.createdAt).toLocaleString() : "-"]
        .forEach(val => {
          const td = document.createElement("td");
          td.textContent = val ?? "";
          td.style.fontFamily = d.id === val ? "monospace" : "inherit";
          td.style.fontSize = d.id === val ? "12px" : "13px";
          tr.appendChild(td);
        });
      tbody.appendChild(tr);
    });
  } catch (e) {
    console.error("loadOrganisers error:", e);
    tbody.innerHTML = '<tr><td colspan="4" class="error">Could not load organisers: ' + e.message + '</td></tr>';
  }
}

async function loadAllTickets() {
  const tbody = document.getElementById("all-tickets-table-body");
  if (!tbody) return;
  tbody.innerHTML = "";

  try {
    const q = query(collection(db, "tickets"), orderBy("issuedAt", "desc"));
    const snap = await getDocs(q);
    document.getElementById("all-tickets-count").textContent = snap.size + " ticket(s) total";

    if (snap.size === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="muted">No tickets sold yet.</td></tr>';
      return;
    }

    snap.forEach(d => {
      const t = d.data();
      const tr = document.createElement("tr");
      const issued = t.issuedAt && t.issuedAt.toMillis
        ? new Date(t.issuedAt.toMillis()).toLocaleString() : "-";
      [t.code, t.name, (t.type || "").toUpperCase(), t.amount + " UGX", issued]
        .forEach(val => {
          const td = document.createElement("td");
          td.textContent = val ?? "";
          tr.appendChild(td);
        });
      tbody.appendChild(tr);
    });
  } catch (e) {
    console.error("loadAllTickets error:", e);
    tbody.innerHTML = '<tr><td colspan="5" class="error">Could not load tickets: ' + e.message + '</td></tr>';
  }
}

window.logout = async function () {
  try { await signOut(auth); } catch (e) {}
  window.location.href = "login.html";
};
