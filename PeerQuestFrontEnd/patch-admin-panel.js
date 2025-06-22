// patch-admin-panel.js

const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "components", "admin", "admin-panel.tsx");
const backupPath = filePath.replace(".tsx", ".backup.tsx");

if (!fs.existsSync(filePath)) {
  console.error("❌ admin-panel.tsx not found.");
  process.exit(1);
}

let content = fs.readFileSync(filePath, "utf-8");

// Fix 1: Cast to number when passing to number-only setters
content = content.replace(
  /\(([^()]*?)\.id\)/g,
  (_, inner) => `(Number(${inner}.id))`
);

// Fix 2: Optional chaining for poster, selectedGuildDetails.poster, etc.
content = content
  .replace(/(\bquest\.poster)\./g, "quest.poster?.")
  .replace(/(\bselectedQuestDetails\.poster)\./g, "selectedQuestDetails.poster?.")
  .replace(/(\bguild\.poster)\./g, "guild.poster?.")
  .replace(/(\bselectedGuildDetails\.poster)\./g, "selectedGuildDetails.poster?.");

// Fix 3: Add fallback for .username
content = content.replace(/\.poster\.username/g, ".poster?.username || poster?.name");

// Backup original
fs.copyFileSync(filePath, backupPath);
fs.writeFileSync(filePath, content, "utf-8");

console.log("✅ admin-panel.tsx patched.");
console.log(`📦 Backup saved at: ${backupPath}`);
