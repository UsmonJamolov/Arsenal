const express = require("express");
const { STATUS_LABEL } = require("../data/seed");
const { getSettings } = require("../services/settings");

const router = express.Router();

router.get("/status-labels", (req, res) => {
  res.json(STATUS_LABEL);
});

router.get("/payment-methods", async (req, res, next) => {
  try {
    const settings = await getSettings();
    res.json(settings.paymentMethods);
  } catch (error) {
    next(error);
  }
});

router.get("/profile", async (req, res, next) => {
  try {
    const settings = await getSettings();
    res.json({
      profile: settings.profile ?? { phone: "", name: "Mehmon", loyaltyPoints: 0 },
      paymentStatus: "pending",
    });
  } catch (error) {
    next(error);
  }
});

router.get("/notifications", async (req, res, next) => {
  try {
    const settings = await getSettings();
    res.json(settings.notifications);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
