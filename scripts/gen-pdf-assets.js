// scripts/gen-pdf-assets.js
// Génère lib/pdf-assets.ts avec les images statiques encodées en base64 pour react-pdf
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

function readB64(relPath, mime) {
    const abs = path.join(root, relPath);
    if (!fs.existsSync(abs)) {
        console.error("INTROUVABLE:", abs);
        process.exit(1);
    }
    const b64 = fs.readFileSync(abs).toString("base64");
    return `data:${mime};base64,${b64}`;
}

const logoMixte = readB64("public/images/logo_mixte.webp", "image/webp");
const tricycles = readB64("public/images/tricycles.png", "image/png");

const lines = [
    "// AUTO-GENERATED — NE PAS MODIFIER MANUELLEMENT",
    "// Généré par: node scripts/gen-pdf-assets.js",
    "// Images statiques encodées en base64 pour react-pdf.",
    "// react-pdf ne peut pas résoudre les chemins relatifs (/images/...)",
    "",
    `export const IMG_LOGO_MIXTE = "${logoMixte}";`,
    "",
    `export const IMG_TRICYCLES  = "${tricycles}";`,
    "",
];

const outPath = path.join(root, "lib", "pdf-assets.ts");
fs.writeFileSync(outPath, lines.join("\n"), "utf8");
console.log("OK — lib/pdf-assets.ts généré (" + Math.round(fs.statSync(outPath).size / 1024) + " Ko)");
