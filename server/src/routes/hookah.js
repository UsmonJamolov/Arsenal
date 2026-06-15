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
    const { flavorId, tableId, startHour } = req.body ?? {};

    if (!startHour || !String(startHour).trim()) {
      return res.status(400).json({ message: "Boshlanish vaqti majburiy" });
    }

    const flavor = await HookahFlavor.findOne({ slug: flavorId });
    const table = await Table.findOne({ slug: tableId });

    if (!flavor) {
      return res.status(400).json({ message: "Ta'm topilmadi" });
    }

    if (!table) {
      return res.status(400).json({ message: "Stol topilmadi" });
    }

    const hour = String(startHour).trim();
    const cartItem = {
      id: `hk-${Date.now()}`,
      type: "hookah",
      title: `${flavor.title} (${table.title}) • ${hour}`,
      price: flavor.price,
    };

    req.userCart.cart.push(cartItem);
    await pushNotification("Kalyan buyurtmasi savatga qo'shildi.", "hookah");

    res.status(201).json(cartItem);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
