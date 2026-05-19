const express = require("express");
const Session = require("../models/Session");
const {
  unlockSessionWithPin,
  completeSession,
  cancelSessionById,
  expireDueSessions,
} = require("../services/sessionService");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const { userId, status } = req.query;
    const filter = {};

    if (userId) {
      filter.userId = userId;
    }
    if (status) {
      filter.status = status;
    }

    const sessions = await Session.find(filter).sort({ createdAt: -1 }).limit(50);
    res.json(sessions.map((s) => s.toJSON()));
  } catch (error) {
    next(error);
  }
});

router.post("/unlock", async (req, res, next) => {
  try {
    const { pin, deviceId, stationId } = req.body ?? {};

    if (!pin) {
      return res.status(400).json({ message: "PIN majburiy" });
    }

    const result = await unlockSessionWithPin({ pin, deviceId, stationId });

    if (!result.ok) {
      return res.status(400).json({ message: result.message });
    }

    const { unlockPin, ...safe } = result.session.toJSON();
    res.json({
      message: "Stansiya ochildi. O'yin vaqtingiz boshlandi.",
      session: safe,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/cancel", async (req, res, next) => {
  try {
    const { userId } = req.body ?? {};
    const session = await cancelSessionById(req.params.id, { userId });

    if (!session) {
      return res.status(400).json({
        message: "Sessiyani bekor qilib bo'lmadi yoki ruxsat yo'q",
      });
    }

    res.json({
      message: "Vaqt/sessiya bekor qilindi",
      session: session.toJSON(),
    });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/complete", async (req, res, next) => {
  try {
    const session = await completeSession(req.params.id, "completed");

    if (!session) {
      return res.status(404).json({ message: "Sessiya topilmadi yoki allaqachon yopilgan" });
    }

    res.json(session.toJSON());
  } catch (error) {
    next(error);
  }
});

router.post("/expire-due", async (req, res, next) => {
  try {
    const count = await expireDueSessions();
    res.json({ expired: count });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
