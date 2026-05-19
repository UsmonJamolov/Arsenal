const express = require("express");
const Table = require("../models/Table");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const tables = await Table.find().sort({ createdAt: 1 });
    res.json(tables.map((t) => t.toJSON()));
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const table = await Table.findOne({ slug: req.params.id });

    if (!table) {
      return res.status(404).json({ message: "Stol topilmadi" });
    }

    res.json(table.toJSON());
  } catch (error) {
    next(error);
  }
});

module.exports = router;
