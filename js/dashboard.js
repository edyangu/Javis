// dashboard.js
(function () {
  const SESSION_KEY = "javis_session";
  let session = null;
  try {
    session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
  } catch (e) {
    session = null;
  }

  if (!session) {
    document.getElementById("access-denied").style.display = "block";
    return;
  }

  document.getElementById("dashboard-body").style.display = "block";

  const cfg = window.JavisConfig.loadConfig();

  document.getElementById("cfg-org").value = cfg.orgName;
  document.getElementById("cfg-event").value = cfg.eventName;
  document.getElementById("cfg-location").value = cfg.location;
  document.getElementById("cfg-time").value = cfg.entryTime;
  document.getElementById("cfg-price-ordinary").value = cfg.prices.ordinary;
  document.getElementById("cfg-price-vip").value = cfg.prices.vip;
  document.getElementById("cfg-mtn").value = cfg.mtnNumber;
  document.getElementById("cfg-airtel").value = cfg.airtelNumber;

  window.saveSettings = function () {
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
    window.JavisConfig.saveConfig(newCfg);
    document.getElementById("save-status").textContent = "Settings saved at " + new Date().toLocaleTimeString();
  };

  function renderTickets() {
    const sold = JSON.parse(localStorage.getItem("javis_sold") || "[]");
    document.getElementById("sold-count").textContent = sold.length + " ticket(s) sold";
    const tbody = document.getElementById("sold-table-body");
    tbody.innerHTML = "";
    sold.slice().reverse().forEach(function (t) {
      const tr = document.createElement("tr");
      [t.code, t.name, t.phone, t.type.toUpperCase(), t.amount, t.method.toUpperCase(), t.issuedAt]
        .forEach(function (val) {
          const td = document.createElement("td");
          td.textContent = val;
          tr.appendChild(td);
        });
      tbody.appendChild(tr);
    });
  }

  renderTickets();

  window.clearTickets = function () {
    if (!confirm("Delete all sold tickets from this demo? This cannot be undone.")) return;
    localStorage.removeItem("javis_sold");
    renderTickets();
  };

  window.verifyCode = function () {
    const code = document.getElementById("verify-input").value.trim().toUpperCase();
    const result = document.getElementById("verify-result");
    const valid = window.JavisCode.verifyTicketCode(code);
    if (!valid) {
      result.textContent = "INVALID code format or checksum mismatch.";
      return;
    }
    const sold = JSON.parse(localStorage.getItem("javis_sold") || "[]");
    const found = sold.find(function (t) { return t.code === code; });
    if (!found) {
      result.textContent = "Code is well-formed but not found in sold tickets.";
      return;
    }
    result.textContent = "VALID - " + found.type.toUpperCase() + " ticket for " + found.name + " (" + found.phone + ")";
  };

  window.logout = function () {
    localStorage.removeItem(SESSION_KEY);
    window.location.href = "login.html";
  };
})();
