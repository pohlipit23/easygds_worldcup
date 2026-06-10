// Generates app/favicon.ico (16/32/48 px) from the altovo mark.
// One-off build asset generator — run with: node scripts/make-favicon.mjs
// Uses sharp (already present via Next) to rasterize the SVG, then packs the
// PNGs into an ICO container (PNG-compressed entries, valid since Windows Vista).
import sharp from "sharp";
import fs from "fs";
import path from "path";

// Filled, rounded mark — reads clearly at favicon sizes (matches app/icon.svg).
const SVG = Buffer.from(
  `<svg viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">` +
    `<rect width="96" height="96" rx="20" fill="#06152B"/>` +
    `<path d="M20 70 L48 22 L76 70" stroke="#F5F3EE" stroke-width="12" stroke-linejoin="miter" fill="none"/>` +
    `<path d="M48 22 L48 52" stroke="#F5F3EE" stroke-width="12" opacity="0.18" fill="none"/>` +
    `</svg>`,
);

const sizes = [16, 32, 48];

const pngs = await Promise.all(
  sizes.map((s) => sharp(SVG).resize(s, s).png().toBuffer()),
);

function buildIco(images) {
  const count = images.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(count, 4);

  const dir = Buffer.alloc(count * 16);
  let offset = 6 + count * 16;
  images.forEach((img, i) => {
    const s = sizes[i];
    const e = i * 16;
    dir.writeUInt8(s >= 256 ? 0 : s, e + 0); // width
    dir.writeUInt8(s >= 256 ? 0 : s, e + 1); // height
    dir.writeUInt8(0, e + 2); // palette
    dir.writeUInt8(0, e + 3); // reserved
    dir.writeUInt16LE(1, e + 4); // color planes
    dir.writeUInt16LE(32, e + 6); // bits per pixel
    dir.writeUInt32LE(img.length, e + 8);
    dir.writeUInt32LE(offset, e + 12);
    offset += img.length;
  });

  return Buffer.concat([header, dir, ...images]);
}

const out = path.join(process.cwd(), "app", "favicon.ico");
fs.writeFileSync(out, buildIco(pngs));
console.log(`wrote ${out} (${sizes.join("/")} px, ${fs.statSync(out).size} bytes)`);
