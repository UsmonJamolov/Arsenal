const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const express = require("express");

const { adminSecretKey } = require("../config");

const requireAdmin = require("../middleware/requireAdmin");
const Booking = require("../models/Booking");
const Device = require("../models/Device");
const HookahFlavor = require("../models/HookahFlavor");
const Table = require("../models/Table");
const User = require("../models/User");
const AppSettings = require("../models/AppSettings");
const { getSettings, pushNotification } = require("../services/settings");
const { broadcastUpdate } = require("../realtime");

const router = express.Router();

function syncClub(entity, message) {
  broadcastUpdate({ entity, message });
}

function normalizePhone(phone) {
  return String(phone).replace(/\s+/g, "").trim();
}

function normalizePersonName(value) {
  return String(value).trim().replace(/\s+/g, " ").toLocaleLowerCase("uz-UZ");
}

function namesMatch(userName, firstName, lastName) {
  return normalizePersonName(userName) === normalizePersonName(`${firstName} ${lastName}`);
}

function secretKeysMatch(provided, expected) {
  const left = Buffer.from(String(provided));
  const right = Buffer.from(String(expected));

  if (left.length !== right.length) {
    return false;
  }

  return crypto.timingSafeEqual(left, right);
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "");
}

router.post("/login", async (req, res, next) => {
  try {
    const { phone, firstName, lastName, password, secretKey } = req.body ?? {};

    if (!phone?.trim() || !firstName?.trim() || !lastName?.trim() || !password || !secretKey?.trim()) {
      return res.status(400).json({
        message: "Telefon, ism, familiya, parol va secret key majburiy",
      });
    }

    if (!secretKeysMatch(secretKey.trim(), adminSecretKey)) {
      return res.status(401).json({ message: "Admin ma'lumotlari noto'g'ri" });
    }

    const user = await User.findOne({ phone: normalizePhone(phone) }).select("+password");

    if (!user || user.role !== "admin") {
      return res.status(401).json({ message: "Admin ma'lumotlari noto'g'ri" });
    }

    if (!namesMatch(user.name, firstName, lastName)) {
      return res.status(401).json({ message: "Admin ma'lumotlari noto'g'ri" });
    }

    const valid = await bcrypt.compare(String(password), user.password);

    if (!valid) {
      return res.status(401).json({ message: "Admin ma'lumotlari noto'g'ri" });
    }

    res.json({ admin: user.toPublicJSON() });
  } catch (error) {
    next(error);
  }
});

router.use(requireAdmin);

router.get("/dashboard", async (req, res, next) => {
  try {
    const [users, devices, bookings, tables, flavors] = await Promise.all([
      User.countDocuments({ role: "user" }),
      Device.countDocuments(),
      Booking.countDocuments(),
      Table.countDocuments(),
      HookahFlavor.countDocuments(),
    ]);

    const availableDevices = await Device.countDocuments({ status: "available" });
    const customerActiveBookings = await Booking.aggregate([
      { $match: { status: "active", userId: { $ne: null } } },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "customer",
        },
      },
      { $unwind: "$customer" },
      { $match: { "customer.role": "user" } },
      { $count: "total" },
    ]);
    const activeBookings = customerActiveBookings[0]?.total ?? 0;
    const revenue = await Booking.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      { $group: { _id: null, total: { $sum: "$price" } } },
    ]);

    const activeBookingDocs = await Booking.find({
      status: "active",
      userId: { $ne: null },
    })
      .sort({ createdAt: -1 })
      .limit(20);

    const userIds = [
      ...new Set(
        activeBookingDocs
          .map((booking) => booking.userId?.toString())
          .filter(Boolean),
      ),
    ];

    const usersById = new Map();
    if (userIds.length) {
      const relatedUsers = await User.find({ _id: { $in: userIds }, role: "user" });
      for (const user of relatedUsers) {
        usersById.set(user._id.toString(), user);
      }
    }

    const incomingOrders = activeBookingDocs
      .filter((booking) => booking.userId && usersById.has(booking.userId.toString()))
      .map((booking) => {
      const user = usersById.get(booking.userId.toString());

      return {
        id: booking._id.toString(),
        type: "booking",
        title: `${booking.deviceName} bron`,
        price: booking.price,
        status: booking.status,
        deviceName: booking.deviceName,
        startHour: booking.startHour,
        durationHours: booking.durationHours,
        createdAt: booking.createdAt.toISOString(),
        customerName: user.name,
        customerPhone: user.phone,
      };
    });

    res.json({
      stats: {
        users,
        devices,
        availableDevices,
        bookings,
        activeBookings,
        tables,
        flavors,
        totalRevenue: revenue[0]?.total ?? 0,
      },
      incomingOrders,
    });
  } catch (error) {
    next(error);
  }
});

// Users
router.get("/users", async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ users: users.map((u) => u.toPublicJSON()) });
  } catch (error) {
    next(error);
  }
});

router.patch("/users/:id", async (req, res, next) => {
  try {
    const { name, phone, email, tier, loyaltyPoints, role } = req.body ?? {};
    const updates = {};

    if (name !== undefined) updates.name = String(name).trim();
    if (phone !== undefined) updates.phone = normalizePhone(phone);
    if (email !== undefined) updates.email = String(email).trim().toLowerCase();
    if (tier !== undefined) updates.tier = tier;
    if (loyaltyPoints !== undefined) updates.loyaltyPoints = Number(loyaltyPoints);
    if (role !== undefined) updates.role = role;

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });

    if (!user) {
      return res.status(404).json({ message: "Foydalanuvchi topilmadi" });
    }

    res.json({ user: user.toPublicJSON() });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Telefon yoki email band" });
    }
    next(error);
  }
});

router.delete("/users/:id", async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "Foydalanuvchi topilmadi" });
    }

    res.json({ message: "Foydalanuvchi o'chirildi" });
  } catch (error) {
    next(error);
  }
});

// Devices
router.get("/devices", async (req, res, next) => {
  try {
    const devices = await Device.find().sort({ createdAt: 1 });
    res.json({ devices: devices.map((d) => d.toJSON()) });
  } catch (error) {
    next(error);
  }
});

router.post("/devices", async (req, res, next) => {
  try {
    const { slug, name, type, pricePerHour, status } = req.body ?? {};

    if (!name || !type || pricePerHour === undefined) {
      return res.status(400).json({ message: "name, type, pricePerHour majburiy" });
    }

    const device = await Device.create({
      slug: slug?.trim() || slugify(name),
      name: name.trim(),
      type: type.trim(),
      pricePerHour: Number(pricePerHour),
      status: status || "available",
    });

    syncClub("devices", `Yangi qurilma: ${device.name}`);
    res.status(201).json({ device: device.toJSON() });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Bunday slug mavjud" });
    }
    next(error);
  }
});

router.patch("/devices/:id", async (req, res, next) => {
  try {
    const { name, type, pricePerHour, status } = req.body ?? {};
    const updates = {};

    if (name !== undefined) updates.name = String(name).trim();
    if (type !== undefined) updates.type = String(type).trim();
    if (pricePerHour !== undefined) updates.pricePerHour = Number(pricePerHour);
    if (status !== undefined) updates.status = status;

    const device = await Device.findOneAndUpdate({ slug: req.params.id }, updates, {
      new: true,
      runValidators: true,
    });

    if (!device) {
      return res.status(404).json({ message: "Qurilma topilmadi" });
    }

    syncClub("devices", `${device.name} yangilandi`);
    res.json({ device: device.toJSON() });
  } catch (error) {
    next(error);
  }
});

router.delete("/devices/:id", async (req, res, next) => {
  try {
    const device = await Device.findOneAndDelete({ slug: req.params.id });

    if (!device) {
      return res.status(404).json({ message: "Qurilma topilmadi" });
    }

    syncClub("devices", "Qurilma o'chirildi");
    res.json({ message: "Qurilma o'chirildi" });
  } catch (error) {
    next(error);
  }
});

// Tables
router.get("/tables", async (req, res, next) => {
  try {
    const tables = await Table.find().sort({ createdAt: 1 });
    res.json({ tables: tables.map((t) => t.toJSON()) });
  } catch (error) {
    next(error);
  }
});

router.post("/tables", async (req, res, next) => {
  try {
    const { slug, title, status } = req.body ?? {};

    if (!title) {
      return res.status(400).json({ message: "title majburiy" });
    }

    const table = await Table.create({
      slug: slug?.trim() || slugify(title),
      title: title.trim(),
      status: status || "available",
    });

    syncClub("tables", `Yangi stol: ${table.title}`);
    res.status(201).json({ table: table.toJSON() });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Bunday slug mavjud" });
    }
    next(error);
  }
});

router.patch("/tables/:id", async (req, res, next) => {
  try {
    const { title, status } = req.body ?? {};
    const updates = {};

    if (title !== undefined) updates.title = String(title).trim();
    if (status !== undefined) updates.status = status;

    const table = await Table.findOneAndUpdate({ slug: req.params.id }, updates, {
      new: true,
      runValidators: true,
    });

    if (!table) {
      return res.status(404).json({ message: "Stol topilmadi" });
    }

    syncClub("tables", `${table.title} holati yangilandi`);
    res.json({ table: table.toJSON() });
  } catch (error) {
    next(error);
  }
});

router.delete("/tables/:id", async (req, res, next) => {
  try {
    const table = await Table.findOneAndDelete({ slug: req.params.id });

    if (!table) {
      return res.status(404).json({ message: "Stol topilmadi" });
    }

    syncClub("tables", "Stol o'chirildi");
    res.json({ message: "Stol o'chirildi" });
  } catch (error) {
    next(error);
  }
});

// Hookah
router.get("/hookah", async (req, res, next) => {
  try {
    const flavors = await HookahFlavor.find().sort({ createdAt: 1 });
    res.json({ flavors: flavors.map((f) => f.toJSON()) });
  } catch (error) {
    next(error);
  }
});

router.post("/hookah", async (req, res, next) => {
  try {
    const { slug, title, price } = req.body ?? {};

    if (!title || price === undefined) {
      return res.status(400).json({ message: "title va price majburiy" });
    }

    const flavor = await HookahFlavor.create({
      slug: slug?.trim() || slugify(title),
      title: title.trim(),
      price: Number(price),
    });

    syncClub("hookah", `Yangi kalyan ta'mi: ${flavor.title}`);
    res.status(201).json({ flavor: flavor.toJSON() });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Bunday slug mavjud" });
    }
    next(error);
  }
});

router.patch("/hookah/:id", async (req, res, next) => {
  try {
    const { title, price } = req.body ?? {};
    const updates = {};

    if (title !== undefined) updates.title = String(title).trim();
    if (price !== undefined) updates.price = Number(price);

    const flavor = await HookahFlavor.findOneAndUpdate({ slug: req.params.id }, updates, {
      new: true,
      runValidators: true,
    });

    if (!flavor) {
      return res.status(404).json({ message: "Ta'm topilmadi" });
    }

    syncClub("hookah", `${flavor.title} yangilandi`);
    res.json({ flavor: flavor.toJSON() });
  } catch (error) {
    next(error);
  }
});

router.delete("/hookah/:id", async (req, res, next) => {
  try {
    const flavor = await HookahFlavor.findOneAndDelete({ slug: req.params.id });

    if (!flavor) {
      return res.status(404).json({ message: "Ta'm topilmadi" });
    }

    syncClub("hookah", "Kalyan ta'mi o'chirildi");
    res.json({ message: "Ta'm o'chirildi" });
  } catch (error) {
    next(error);
  }
});

// Bookings
router.get("/bookings", async (req, res, next) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json({ bookings: bookings.map((b) => b.toJSON()) });
  } catch (error) {
    next(error);
  }
});

router.patch("/bookings/:id", async (req, res, next) => {
  try {
    const { status } = req.body ?? {};

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true },
    );

    if (!booking) {
      return res.status(404).json({ message: "Bron topilmadi" });
    }

    if (status === "cancelled") {
      await Device.findOneAndUpdate({ slug: booking.deviceId }, { status: "available" });
    }

    syncClub("bookings", `Bron yangilandi: ${booking.deviceName}`);
    res.json({ booking: booking.toJSON() });
  } catch (error) {
    next(error);
  }
});

router.delete("/bookings/:id", async (req, res, next) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Bron topilmadi" });
    }

    await Device.findOneAndUpdate({ slug: booking.deviceId }, { status: "available" });
    syncClub("bookings", "Bron o'chirildi");
    res.json({ message: "Bron o'chirildi" });
  } catch (error) {
    next(error);
  }
});

// Settings
router.get("/settings", async (req, res, next) => {
  try {
    const settings = await getSettings();
    res.json({
      paymentMethods: settings.paymentMethods,
      notifications: settings.notifications,
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/settings", async (req, res, next) => {
  try {
    const { paymentMethods, notifications } = req.body ?? {};
    const settings = await getSettings();

    if (paymentMethods !== undefined) {
      settings.paymentMethods = paymentMethods;
    }

    if (notifications !== undefined) {
      settings.notifications = notifications;
    }

    await settings.save();
    syncClub("settings", "Sozlamalar yangilandi");
    res.json({
      paymentMethods: settings.paymentMethods,
      notifications: settings.notifications,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/settings/notifications", async (req, res, next) => {
  try {
    const { message } = req.body ?? {};

    if (!message?.trim()) {
      return res.status(400).json({ message: "Xabar matni majburiy" });
    }

    const notifications = await pushNotification(message.trim(), "settings");

    res.status(201).json({ notifications });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
