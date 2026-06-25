import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const src =
  "C:/Users/HP/.cursor/projects/c-Users-HP-Desktop-Arsenal-Union/assets/c__Users_HP_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-d3614904-4073-4a42-83c6-a2508c0d08b1.png";

/** Mockup grid — 5 ustun, ta'm kartochkalari */
const GRID = {
  left: 11,
  top: 318,
  cols: 5,
  cellW: 89,
  cellH: 106,
  gapX: 2,
  gapY: 4,
  artPadX: 6,
  artPadTop: 7,
  artW: 77,
  artH: 58,
};

const flavors = [
  { slug: "cotton-candy", row: 0, col: 0 },
  { slug: "blackberry", row: 0, col: 1 },
  { slug: "fig", row: 0, col: 2 },
  { slug: "american-cake", row: 0, col: 3 },
  { slug: "watermelon", row: 0, col: 4 },
  { slug: "melon", row: 1, col: 0 },
  { slug: "lime-space-peach", row: 1, col: 1 },
  { slug: "lemon-marmalade", row: 1, col: 2 },
  { slug: "lemon", row: 1, col: 3 },
  { slug: "mango", row: 1, col: 4 },
  { slug: "raspberry-pistachio", row: 2, col: 0 },
  { slug: "big-bubble", row: 2, col: 1 },
  { slug: "strawberry", row: 2, col: 2 },
  { slug: "acai", row: 2, col: 3 },
  { slug: "liara-mix", row: 3, col: 0 },
  { slug: "liara-amore", row: 3, col: 1 },
  { slug: "liara-ice-summer", row: 3, col: 2 },
  { slug: "liara-secret", row: 3, col: 3 },
  { slug: "liara-jeen", row: 3, col: 4 },
  { slug: "liara-61", row: 4, col: 0 },
  { slug: "liara-troya", row: 4, col: 1 },
  { slug: "liara-alpha", row: 4, col: 2 },
  { slug: "liara-white-rabbit", row: 4, col: 3 },
  { slug: "liara-pacho", row: 4, col: 4 },
];

const outDir = path.join(root, "public/hookah/flavors");

for (const flavor of flavors) {
  const cellLeft = GRID.left + flavor.col * (GRID.cellW + GRID.gapX);
  const cellTop = GRID.top + flavor.row * (GRID.cellH + GRID.gapY);
  const left = cellLeft + GRID.artPadX;
  const top = cellTop + GRID.artPadTop;
  const out = path.join(outDir, `${flavor.slug}.png`);

  await sharp(src)
    .extract({ left, top, width: GRID.artW, height: GRID.artH })
    .resize(480, 480, { fit: "cover", position: "centre" })
    .png({ quality: 92 })
    .toFile(out);

  console.log("wrote", flavor.slug);
}

console.log("done");
