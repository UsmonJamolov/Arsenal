import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const src =
  "C:/Users/HP/.cursor/projects/c-Users-HP-Desktop-Arsenal-Union/assets/c__Users_HP_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-7c9b94b6-27db-4164-b252-48aa00de2546.png";

const flavors = [
  { slug: "cotton-candy", title: "Cotton Candy", row: 0, col: 0 },
  { slug: "blackberry", title: "Blackberry", row: 0, col: 1 },
  { slug: "fig", title: "Fig", row: 0, col: 2 },
  { slug: "american-cake", title: "American Cake", row: 0, col: 3 },
  { slug: "watermelon", title: "Watermelon", row: 0, col: 4 },
  { slug: "melon", title: "Melon", row: 1, col: 0 },
  { slug: "lime-space-peach", title: "Lime Space Peach", row: 1, col: 1 },
  { slug: "lemon-marmalade", title: "Lemon Marmalade", row: 1, col: 2 },
  { slug: "lemon", title: "Lemon", row: 1, col: 3 },
  { slug: "mango", title: "Mango", row: 1, col: 4 },
  { slug: "raspberry-pistachio", title: "Raspberry Pistachio", row: 2, col: 0 },
  { slug: "big-bubble", title: "Big Bubble", row: 2, col: 1 },
  { slug: "strawberry", title: "Strawberry", row: 2, col: 2 },
  { slug: "acai", title: "Acai", row: 2, col: 3 },
];

const outDir = path.join(root, "public/hookah/flavors");
const meta = await sharp(src).metadata();
const { width, height } = meta;

const rows = 3;
const cols = 5;
const padX = Math.round(width * 0.02);
const padY = Math.round(height * 0.03);
const cellW = Math.floor((width - padX * 2) / cols);
const cellH = Math.floor((height - padY * 2) / rows);

for (const flavor of flavors) {
  const left = padX + flavor.col * cellW + Math.round(cellW * 0.04);
  const top = padY + flavor.row * cellH + Math.round(cellH * 0.04);
  const cropW = Math.round(cellW * 0.92);
  const cropH = Math.round(cellH * 0.92);
  const out = path.join(outDir, `${flavor.slug}.png`);

  await sharp(src)
    .extract({ left, top, width: cropW, height: cropH })
    .resize(480, 480, { fit: "cover", position: "centre" })
    .png({ quality: 90 })
    .toFile(out);

  console.log("wrote", flavor.slug);
}

console.log("done", width, height);
