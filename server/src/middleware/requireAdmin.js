const User = require("../models/User");

async function requireAdmin(req, res, next) {
  try {
    const adminId = req.headers["x-admin-id"];

    if (!adminId) {
      return res.status(401).json({ message: "Admin autentifikatsiyasi kerak" });
    }

    const user = await User.findById(adminId);

    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin huquqi yo'q" });
    }

    req.admin = user;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = requireAdmin;
