const express = require("express");
const AgentCommand = require("../models/AgentCommand");
const Device = require("../models/Device");
const { requireAgent } = require("../middleware/requireAgent");

const router = express.Router();

router.post("/heartbeat", requireAgent, async (req, res, next) => {
  try {
    const { status = "online", agentVersion } = req.body ?? {};
    const stationId = req.stationId;

    await Device.findOneAndUpdate(
      { $or: [{ stationId }, { slug: stationId }, { billingStationId: stationId }] },
      { $set: { agentHost: req.ip } },
    );

    res.json({
      ok: true,
      stationId,
      status,
      agentVersion: agentVersion || null,
      serverTime: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/commands", requireAgent, async (req, res, next) => {
  try {
    const stationId = req.stationId;
    const limit = Math.min(Number(req.query.limit) || 5, 20);

    const commands = await AgentCommand.find({
      stationId,
      status: "pending",
    })
      .sort({ createdAt: 1 })
      .limit(limit);

    if (commands.length) {
      await AgentCommand.updateMany(
        { _id: { $in: commands.map((c) => c._id) } },
        { $set: { status: "sent" } },
      );
    }

    res.json(commands.map((c) => c.toJSON()));
  } catch (error) {
    next(error);
  }
});

router.post("/commands/:id/ack", requireAgent, async (req, res, next) => {
  try {
    const { status = "completed", message } = req.body ?? {};
    const allowed = ["completed", "failed"];

    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "status: completed yoki failed" });
    }

    const command = await AgentCommand.findById(req.params.id);

    if (!command || command.stationId !== req.stationId) {
      return res.status(404).json({ message: "Buyruq topilmadi" });
    }

    command.status = status;
    command.resultMessage = message || null;
    await command.save();

    res.json(command.toJSON());
  } catch (error) {
    next(error);
  }
});

module.exports = router;
