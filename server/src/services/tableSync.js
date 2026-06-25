const Table = require("../models/Table");
const { forEachUserCart } = require("../store/cartStore");
const { broadcastUpdate } = require("../realtime");

function collectReservedTableIds() {
  const reserved = new Set();

  forEachUserCart((state) => {
    for (const item of state.cart) {
      if (item.type !== "hookah" || !Array.isArray(item.tableIds)) {
        continue;
      }

      for (const tableId of item.tableIds) {
        const slug = String(tableId || "").trim();
        if (slug) {
          reserved.add(slug);
        }
      }
    }
  });

  return reserved;
}

async function syncAllTableStatuses({ broadcast = false } = {}) {
  const reserved = collectReservedTableIds();
  const tables = await Table.find();
  let changed = false;

  for (const table of tables) {
    let nextStatus = "available";

    if (reserved.has(table.slug)) {
      nextStatus = "booked";
    } else if (table.status === "busy") {
      nextStatus = "busy";
    }

    if (table.status !== nextStatus) {
      table.status = nextStatus;
      await table.save();
      changed = true;
    }
  }

  if (changed && broadcast) {
    broadcastUpdate({ entity: "tables", message: "Stol holati yangilandi" });
  }

  return changed;
}

async function occupyTables(tableIds, { broadcast = true } = {}) {
  const slugs = [...new Set(tableIds.map((id) => String(id || "").trim()).filter(Boolean))];

  if (!slugs.length) {
    return;
  }

  await Table.updateMany({ slug: { $in: slugs } }, { status: "busy" });

  if (broadcast) {
    broadcastUpdate({ entity: "tables", message: "Stol band qilindi" });
  }
}

async function reserveTables(tableIds, { broadcast = true } = {}) {
  const slugs = [...new Set(tableIds.map((id) => String(id || "").trim()).filter(Boolean))];

  if (!slugs.length) {
    return;
  }

  await Table.updateMany({ slug: { $in: slugs } }, { status: "booked" });

  if (broadcast) {
    broadcastUpdate({ entity: "tables", message: "Stol band qilindi" });
  }
}

module.exports = { collectReservedTableIds, syncAllTableStatuses, reserveTables, occupyTables };
