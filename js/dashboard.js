// dashboard.js — Firestore version
import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  doc, getDoc, setDoc, updateDoc,
  collection, getDocs, query, orderBy, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { verifyTicketCode } from "./codegen.js";

let currentUid = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    document.getElementById("access-denied").style.display = "block";
    return;
  }
  currentUid = user.uid;
  document.getElementById("dashboard-body").style.display = "block";
  await loadConfigIntoForm();
  await renderTickets();
});

async function loadConfigIntoForm() {
  const snap = await getDoc(doc(db, "orgs", currentUid, "config", "main"));
  if (!snap.exists()) return;
  const c = snap.data();
  document.getElementById("cfg-org").value = c.orgName || "";
  document.getElementById("cfg-event").value = c.eventName || "";
  document.getElementById("cfg-location").value = c.location || "";
  document.getElementById("cfg-time").value = c.entryTime || "";
  document.getElementById("cfg-price-ordinary").value = c.prices?.ordinary ?? 0;
  document.getElementById("cfg-price-vip").value = c.prices?.vip ?? 0;
  document.getElementById("cfg-mtn").value = c.mtnNumber || "";
  document.getElementById("cfg-airtel").value = c.airtelNumber || "";
}

window.saveSettings = async function () {
  const newCfg = {
    orgName: document.getElementById("cfg-org").value.trim() || "Javis Events",
    eventName: document.getElementById("cfg-event").value.trim() || "Concert",
    location: document.getElementById("cfg-location").value.trim() || "Kampala",
    entryTime: document.getElementById("cfg-time").value.trim() || "7:00 PM",
    currency: "UGX",
    prices: {
      ordinary: Number(document.getElementById("cfg-price-ordinary").value) || 0,
      vip: Number(document.getElementById("cfg-price-vip").value) || 0
    },
    mtnNumber: document.getElementById("cfg-mtn").value.trim(),
    airtelNumber: document.getElementById("cfg-airtel").value.trim()
  };
  try {
    await setDoc(doc(db, "orgs", currentUid, "config", "main"), newCfg, { merge: true });
    document.getElementById("save-status").textContent =
      "Saved at " + new Date().toLocaleTimeString();
  } catch (e) {
    document.getElementById("save-status").textContent = "Save failed: " + e.message;
  }
};

async function renderTickets() {
  const tbody = document.getElementById("sold-table-body");
  tbody.innerHTML = "";
  const q = query(collection(db, "orgs", currentUid, "tickets"), orderBy("issuedAt", "desc"));
  const snap = await getDocs(q);
  document.getElementById("sold-count").textContent = snap.size + " ticket(s) sold";
  snap.forEach(d => {
    const t = d.data();
    const tr = document.createElement("tr");
    [t.code, t.name, t.phone, (t.type || "").toUpperCase(),
     t.amount, (t.method || "").toUpperCase(),
     t.issuedAt ? new Date(t.issuedAt.toMillis()).toLocaleString() : "-"]
      .forEach(val => {
        const td = document.createElement("td");
        td.textContent = val ?? "";
        tr.appendChild(td);
      });
    tbody.appendChild(tr);
  });
}

window.clearTickets = async function () {
  if (!confirm("Delete ALL sold tickets for this org? This cannot be undone.")) return;
  const snap = await getDocs(collection(db, "orgs", currentUid, "tickets"));
  await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
  await renderTickets();
};

window.verifyCode = async function () {
  const code = document.getElementById("verify-input").value.trim().toUpperCase();
  const result = document.getElementById("verify-result");
  if (!verifyTicketCode(code)) {
    result.textContent = "INVALID format or checksum.";
    return;
  }
  const snap = await getDocs(collection(db, "orgs", currentUid, "tickets"));
  let found = null;
  snap.forEach(d => { if (d.data().code === code) found = d.data(); });
  if (!found) {
    result.textContent = "Well-formed but not found in this org's tickets.";
    return;
  }
  result.textContent = "VALID - " + found.type.toUpperCase() +
    " for " + found.name + " (" + found.phone + ")";
};

window.logout = async function () {
  await signOut(auth);
  window.location.href = "login.html";
};
