// config.js
// Default configuration. Admin panel will overwrite these in localStorage.
// Later we will replace this with Firebase reads/writes.

const DEFAULTS = {
  orgName: "Javis Events",
  eventName: "Live Concert Night",
  location: "Kampala, Uganda",
  entryTime: "7:00 PM",
  currency: "UGX",
  prices: {
    ordinary: 50000,
    vip: 150000
  },
  mtnNumber: "0770000000",
  airtelNumber: "0750000000"
};

const STORAGE_KEY = "javis_config";

function loadConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULTS, ...parsed, prices: { ...DEFAULTS.prices, ...(parsed.prices || {}) } };
  } catch (e) {
    return { ...DEFAULTS };
  }
}

function saveConfig(cfg) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
}

function formatMoney(n) {
  return Number(n).toLocaleString("en-UG");
}

window.JavisConfig = { loadConfig, saveConfig, formatMoney, DEFAULTS };
