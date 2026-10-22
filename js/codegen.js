const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomBlock(length) {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
  }
  return out;
}

function checksum(str) {
  let total = 0;
  for (let i = 0; i < str.length; i++) {
    total += str.charCodeAt(i) * (i + 1);
  }
  return String(total % 997).padStart(3, "0");
}

export function generateTicketCode() {
  const p1 = randomBlock(4);
  const p2 = randomBlock(4);
  const chk = checksum("JVS" + p1 + p2);
  return "JVS-" + p1 + "-" + p2 + "-" + chk;
}

export function verifyTicketCode(code) {
  if (typeof code !== "string") return false;
  const parts = code.split("-");
  if (parts.length !== 4) return false;
  const [prefix, p1, p2, chk] = parts;
  if (prefix !== "JVS") return false;
  if (p1.length !== 4 || p2.length !== 4 || chk.length !== 3) return false;
  return checksum("JVS" + p1 + p2) === chk;
}
