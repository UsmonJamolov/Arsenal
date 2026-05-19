const express = require("express");
const Device = require("../models/Device");
const { pushNotification } = require("../services/settings");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const devices = await Device.find().sort({ createdAt: 1 });
    res.json(devices.map((d) => d.toJSON()));
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const device = await Device.findOne({ slug: req.params.id });

    if (!device) {
      return res.status(404).json({ message: "Qurilma topilmadi" });
    }

    res.json(device.toJSON());
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const device = await Device.findOne({ slug: req.params.id });

    if (!device) {
      return res.status(404).json({ message: "Qurilma topilmadi" });
    }

    const { status } = req.body ?? {};

    if (!status || !["available", "busy", "booked"].includes(status)) {
      return res.status(400).json({ message: "status: available | busy | booked" });
    }

    device.status = status;
    await device.save();
    await pushNotification(`${device.name} holati "${status}" ga o'zgartirildi.`, "devices");
    res.json(device.toJSON());
  } catch (error) {
    next(error);
  }
});

module.exports = router;
