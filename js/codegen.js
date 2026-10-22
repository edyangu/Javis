// codegen.js
// Javis ticket confirmation code generator
// Format: JVS-XXXX-XXXX-CHK  (16 chars + checksum)
// Checksum is derived so codes cannot be guessed easily.

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I, O, 0, 1 to avoid confusion

function randomBlock(length) {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
  }
  return out;
}

// Simple deterministic checksum: sum of char codes mod 997, formatted to 3 digits
function checksum(str) {
  let total = 0;
  for (let i = 0; i < str.length; i++) {
    total += str.charCodeAt(i) * (i + 1);
  }
  const mod = total % 997;
  return String(mod).padStart(3, "0");
}

function generateTicketCode() {
  const part1 = randomBlock(4);
  const part2 = randomBlock(4);
  const body = "JVS" + part1 + part2;
  const chk = checksum(body);
  return "JVS-" + part1 + "-" + part2 + "-" + chk;
}

function verifyTicketCode(code) {
  if (typeof code !== "string") return false;
  const parts = code.split("-");
  if (parts.length !== 4) return false;
  const [prefix, p1, p2, chk] = parts;
  if (prefix !== "JVS") return false;
  if (p1.length !== 4 || p2.length !== 4 || chk.length !== 3) return false;
  return checksum("JVS" + p1 + p2) === chk;
}

window.JavisCode = { generateTicketCode, verifyTicketCode };
