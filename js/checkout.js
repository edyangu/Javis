import { db } from "./firebase.js";
import {
  doc, getDoc, collection, addDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { generateTicketCode } from "./codegen.js";
import { DEFAULTS } from "./config.js";

const params = new URLSearchParams(window.location.search);
const orgId = params.get("org");
const type = params.get("type") === "vip" ? "vip" : "ordinary";

if (!orgId) {
  document.getElementById("checkout-view").innerHTML =
    "<div class='card'><h2>Invalid link</h2>" +
    "<p>This checkout link is missing an organiser reference.</p>" +
    "<a class='btn' href='index.html'>Back to Home</a></div>";
}

let cfg = null;
let amount = 0;
let currentTicket = null;

function fmt(n) { return Number(n).toLocaleString("en-UG"); }

function updateInstruction() {
  if (!cfg) return;
  const m = document.getElementById("payment-method").value;
  const number = m === "mtn" ? cfg.mtnNumber : cfg.airtelNumber;
  const label = m === "mtn" ? "MTN Mobile Money" : "Airtel Money";
  document.getElementById("payment-instruction").textContent =
    "Send " + cfg.currency + " " + fmt(amount) + " to " + label +
    " number " + number + ". In this demo, no real money is charged.";
}

async function loadConfig() {
  if (!orgId) return;
  let loaded = DEFAULTS;
  try {
    const snap = await getDoc(doc(db, "orgs", orgId, "config", "main"));
    if (snap.exists()) {
      const data = snap.data();
      loaded = { ...DEFAULTS, ...data, prices: { ...DEFAULTS.prices, ...(data.prices || {}) } };
    }
  } catch (e) { console.error("Could not load config:", e); }
  cfg = loaded;
  amount = type === "vip" ? cfg.prices.vip : cfg.prices.ordinary;

  document.getElementById("sum-event").textContent = cfg.eventName;
  document.getElementById("sum-type").textContent = type === "vip" ? "VIP" : "Ordinary";
  document.getElementById("sum-amount").textContent = cfg.currency + " " + fmt(amount);
  updateInstruction();
}

document.getElementById("payment-method").addEventListener("change", updateInstruction);

window.processPayment = async function () {
  const name = document.getElementById("buyer-name").value.trim();
  const phone = document.getElementById("buyer-phone").value.trim();
  const method = document.getElementById("payment-method").value;
  const err = document.getElementById("checkout-error");
  err.textContent = "";

  if (!cfg) { err.textContent = "Event not loaded. Refresh."; return; }
  if (name.length < 3) { err.textContent = "Enter your full name."; return; }
  if (!/^0[0-9]{9}$/.test(phone)) { err.textContent = "Phone must be 10 digits starting with 0."; return; }

  const code = generateTicketCode();
  const ticket = {
    code, type, amount, name, phone, method,
    event: cfg.eventName, location: cfg.location, entryTime: cfg.entryTime,
    status: "valid", issuedAt: serverTimestamp()
  };

  try {
    await addDoc(collection(db, "orgs", orgId, "tickets"), ticket);
    currentTicket = ticket;
    document.getElementById("checkout-view").style.display = "none";
    document.getElementById("success-view").style.display = "block";
    document.getElementById("ticket-code").textContent = code;
    document.getElementById("ticket-meta").textContent =
      ticket.type.toUpperCase() + " | " + ticket.event + " | " +
      ticket.location + " | Entry " + ticket.entryTime;
  } catch (e) {
    err.textContent = "Failed to save ticket: " + e.message;
    console.error(e);
  }
};

window.downloadTicket = function () {
  if (!currentTicket) return;
  const t = currentTicket;
  const lines = [
    "JAVIS EVENT TICKET", "==================",
    "Code: " + t.code, "Name: " + t.name, "Phone: " + t.phone,
    "Type: " + t.type.toUpperCase(), "Amount: " + t.amount + " UGX",
    "Event: " + t.event, "Location: " + t.location, "Entry Time: " + t.entryTime,
    "", "Do not share this code. One entry per code."
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "javis-ticket-" + t.code + ".txt";
  a.click();
  URL.revokeObjectURL(url);
};

loadConfig();
