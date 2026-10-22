// tickets.js
(function () {
  const cfg = window.JavisConfig.loadConfig();
  const fmt = window.JavisConfig.formatMoney;

  document.getElementById("event-name").textContent = cfg.eventName;
  document.getElementById("event-location").textContent = cfg.location;
  document.getElementById("event-time").textContent = cfg.entryTime;
  document.getElementById("event-org").textContent = cfg.orgName;

  document.getElementById("price-ordinary").textContent = cfg.currency + " " + fmt(cfg.prices.ordinary);
  document.getElementById("price-vip").textContent = cfg.currency + " " + fmt(cfg.prices.vip);

  window.selectTicket = function (type) {
    localStorage.setItem("javis_selected_ticket", type);
    window.location.href = "checkout.html?type=" + encodeURIComponent(type);
  };
})();
