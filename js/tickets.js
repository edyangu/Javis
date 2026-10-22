// tickets.js — Firestore version (simplified)
import { db } from "./firebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const orgId = new URLSearchParams(window.location.search).get("org");
const FALLBACK = {
  eventName: "Live Concert Night", location: "Kampala, Uganda",
  entryTime: "7:00 PM", orgName: "Javis Events", currency: "UGX",
  prices: { ordinary: 50000, vip: 150000 }
};

(async function () {
  let c = FALLBACK;
  if (orgId) {
    const snap = await getDoc(doc(db, "orgs", orgId, "config", "main"));
    if (snap.exists()) c = snap.data();
  }
  document.getElementById("event-name").textContent = c.eventName;
  document.getElementById("event-location").textContent = c.location;
  document.getElementById("event-time").textContent = c.entryTime;
  document.getElementById("event-org").textContent = c.orgName;
  const fmt = n => Number(n).toLocaleString("en-UG");
  document.getElementById("price-ordinary").textContent = c.currency + " " + fmt(c.prices.ordinary);
  document.getElementById("price-vip").textContent = c.currency + " " + fmt(c.prices.vip);

  window.selectTicket = function (type) {
    window.location.href = "checkout.html?type=" + encodeURIComponent(type) +
      (orgId ? "&org=" + encodeURIComponent(orgId) : "");
  };
})();
