import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  doc, getDoc, setDoc,
  collection, getDocs, query, orderBy, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { verifyTicketCode } from "./codegen.js";
import { DEFAULTS } from "./config.js";

const EVENT_REF = () => doc(db, "settings", "event");

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    document.getElementById("access-denied").style.display = "block";
    document.getElementById("dashboard-body").style.display = "none";
    return;
  }
  document.getElementById("access-denied").style.display = "none";
  document.getElementById("dashboard-body").style.display = "block";
  document.getElementById("public-link").textContent = window.location.origin + "/index.html";
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
    console.error(e);
  }
};

async function renderTickets() {
  const tbody = document.getElementById("sold-table-body");
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

window.logout = async function () {
  try { await signOut(auth); } catch (e) {}
  window.location.href = "login.html";
};
