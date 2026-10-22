
import { db } from "./firebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { DEFAULTS } from "./config.js";

const orgId = new URLSearchParams(window.location.search).get("org");

(async function () {
  let c = DEFAULTS;
  if (orgId) {
    try {
      const snap = await getDoc(doc(db, "orgs", orgId, "config", "main"));
      if (snap.exists()) {
        const data = snap.data();
        c = { ...DEFAULTS, ...data, prices: { ...DEFAULTS.prices, ...(data.prices || {}) } };
      }
    } catch (e) { console.error("Could not load org config:", e); }
  }

  document.getElementById("event-name").textContent     = c.eventName;
  document.getElementById("event-location").textContent = c.location;
  document.getElementById("event-time").textContent     = c.entryTime;
  document.getElementById("event-org").textContent      = c.orgName;

  const fmt = n => Number(n).toLocaleString("en-UG");
  document.getElementById("price-ordinary").textContent = c.currency + " " + fmt(c.prices.ordinary);
  document.getElementById("price-vip").textContent      = c.currency + " " + fmt(c.prices.vip);

  window.selectTicket = function (type) {
    window.location.href = "checkout.html?type=" + encodeURIComponent(type) +
      (orgId ? "&org=" + encodeURIComponent(orgId) : "");
  };
})();
