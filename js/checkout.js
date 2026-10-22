// checkout.js
(function () {
  const cfg = window.JavisConfig.loadConfig();
  const fmt = window.JavisConfig.formatMoney;

  const params = new URLSearchParams(window.location.search);
  const type = params.get("type") === "vip" ? "vip" : "ordinary";
  const amount = type === "vip" ? cfg.prices.vip : cfg.prices.ordinary;

  document.getElementById("sum-event").textContent = cfg.eventName;
  document.getElementById("sum-type").textContent = type === "vip" ? "VIP" : "Ordinary";
  document.getElementById("sum-amount").textContent = cfg.currency + " " + fmt(amount);

  const methodSelect = document.getElementById("payment-method");
  const instruction = document.getElementById("payment-instruction");

  function updateInstruction() {
    const m = methodSelect.value;
    const number = m === "mtn" ? cfg.mtnNumber : cfg.airtelNumber;
    const label = m === "mtn" ? "MTN Mobile Money" : "Airtel Money";
    instruction.textContent =
      "Send " + cfg.currency + " " + fmt(amount) + " to " + label +
      " number " + number + ". In this demo, no real money is charged.";
  }

  methodSelect.addEventListener("change", updateInstruction);
  updateInstruction();

  let currentTicket = null;

  window.processPayment = function () {
    const name = document.getElementById("buyer-name").value.trim();
    const phone = document.getElementById("buyer-phone").value.trim();
    const method = methodSelect.value;
    const err = document.getElementById("checkout-error");
    err.textContent = "";

    if (name.length < 3) {
      err.textContent = "Please enter your full name.";
      return;
    }
    if (!/^0[0-9]{9}$/.test(phone)) {
      err.textContent = "Phone number must be 10 digits starting with 0.";
      return;
    }

    // Demo: simulate payment processing
    const code = window.JavisCode.generateTicketCode();
    const ticket = {
      code: code,
      type: type,
      amount: amount,
      name: name,
      phone: phone,
      method: method,
      event: cfg.eventName,
      location: cfg.location,
      entryTime: cfg.entryTime,
      org: cfg.orgName,
      issuedAt: new Date().toISOString()
    };

    // Save into "sold tickets" list (demo storage)
    const sold = JSON.parse(localStorage.getItem("javis_sold") || "[]");
    sold.push(ticket);
    localStorage.setItem("javis_sold", JSON.stringify(sold));

    currentTicket = ticket;

    document.getElementById("checkout-view").style.display = "none";
    document.getElementById("success-view").style.display = "block";
    document.getElementById("ticket-code").textContent = code;
    document.getElementById("ticket-meta").textContent =
      ticket.type.toUpperCase() + " | " + ticket.event + " | " +
      ticket.location + " | Entry " + ticket.entryTime;
  };

  window.downloadTicket = function () {
    if (!currentTicket) return;
    const t = currentTicket;
    const lines = [
      "JAVIS EVENT TICKET",
      "==================",
      "Code: " + t.code,
      "Name: " + t.name,
      "Phone: " + t.phone,
      "Type: " + t.type.toUpperCase(),
      "Amount: " + t.amount + " UGX",
      "Event: " + t.event,
      "Location: " + t.location,
      "Entry Time: " + t.entryTime,
      "Organiser: " + t.org,
      "Issued: " + t.issuedAt,
      "",
      "Do not share this code. One entry per code."
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "javis-ticket-" + t.code + ".txt";
    a.click();
    URL.revokeObjectURL(url);
  };
})();
