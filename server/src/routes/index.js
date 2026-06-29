const express = require("express");
const { mongoose } = require("../db/connect");
const { resetState } = require("../store");

const adminRoutes = require("./admin");
const authRoutes = require("./auth");
const catalogRoutes = require("./catalog");
const devicesRoutes = require("./devices");
const tablesRoutes = require("./tables");
const hookahRoutes = require("./hookah");
const bookingsRoutes = require("./bookings");
const cartRoutes = require("./cart");
const paymentsRoutes = require("./payments");
const sessionsRoutes = require("./sessions");
const productsRoutes = require("./products");
const agentRoutes = require("./agent");

const router = express.Router();

router.get("/health", (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = dbState === 1 ? "connected" : "disconnected";

  res.json({
    ok: dbState === 1,
    service: "arsenal-union-api",
    database: "arsenal_union",
    dbStatus,
    timestamp: new Date().toISOString(),
  });
});

router.post("/reset", (req, res) => {
  resetState();
  res.json({ message: "Ma'lumotlar boshlang'ich holatga qaytarildi" });
});

router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
router.use("/catalog", catalogRoutes);
router.use("/devices", devicesRoutes);
router.use("/tables", tablesRoutes);
router.use("/hookah", hookahRoutes);
router.use("/bookings", bookingsRoutes);
router.use("/cart", cartRoutes);
router.use("/payments", paymentsRoutes);
router.use("/sessions", sessionsRoutes);
router.use("/products", productsRoutes);
router.use("/agent", agentRoutes);

module.exports = router;
