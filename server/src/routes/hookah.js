const express = require("express");
const HookahFlavor = require("../models/HookahFlavor");
const Table = require("../models/Table");
const { pushNotification } = require("../services/settings");

const router = express.Router();

router.get("/flavors", async (req, res, next) => {
  try {
    const flavors = await HookahFlavor.find().sort({ createdAt: 1 });
    res.json(flavors.map((f) => f.toJSON()));
  } catch (error) {
    next(error);
  }
});

router.post("/orders", async (req, res, next) => {
  try {
    const { flavorId, flavorIds, tableId, tableIds, startHour } = req.body ?? {};

    if (!startHour || !String(startHour).trim()) {
      return res.status(400).json({ message: "Boshlanish vaqti majburiy" });
    }

    const requestedFlavorIds = Array.isArray(flavorIds)
      ? flavorIds.map((id) => String(id).trim()).filter(Boolean)
      : flavorId
        ? [String(flavorId).trim()]
        : [];

    const requestedTableIds = Array.isArray(tableIds)
      ? tableIds.map((id) => String(id).trim()).filter(Boolean)
      : tableId
        ? [String(tableId).trim()]
        : [];

    if (!requestedFlavorIds.length) {
      return res.status(400).json({ message: "Kamida bitta ta'm tanlang" });
    }

    if (!requestedTableIds.length) {
      return res.status(400).json({ message: "Kamida bitta stol tanlang" });
    }

    const uniqueFlavorIds = [...new Set(requestedFlavorIds)];
    const uniqueTableIds = [...new Set(requestedTableIds)];
    const flavors = await Promise.all(uniqueFlavorIds.map((id) => HookahFlavor.findOne({ slug: id })));
    const tables = await Promise.all(uniqueTableIds.map((id) => Table.findOne({ slug: id })));

    if (flavors.some((flavor) => !flavor)) {
      return res.status(400).json({ message: "Ta'm topilmadi" });
    }

    if (tables.some((table) => !table)) {
      return res.status(400).json({ message: "Stol topilmadi" });
    }

    const hour = String(startHour).trim();
    const quantity = Math.max(1, Math.min(99, Number.parseInt(String(req.body?.quantity ?? 1), 10) || 1));
    const flavorTitles = flavors.map((flavor) => flavor.title).join(" + ");
    const tableTitles = tables.map((table) => table.title).join(" + ");
    const unitPrice = Math.max(...flavors.map((flavor) => flavor.price));
    const totalPrice = unitPrice * quantity;
    const quantityLabel = quantity > 1 ? `${quantity}× ` : "";
    const cartItem = {
      id: `hk-${Date.now()}`,
      type: "hookah",
      title: `${quantityLabel}${flavorTitles} (${tableTitles}) • ${hour}`,
      price: totalPrice,
    };

    req.userCart.cart.push(cartItem);
    await pushNotification("Kalyan buyurtmasi savatga qo'shildi.", "hookah");

    res.status(201).json(cartItem);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
