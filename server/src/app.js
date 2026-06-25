const cors = require("cors");
const express = require("express");
const path = require("path");

const { isOriginAllowed } = require("./corsOrigins");
const { errorHandler, notFound } = require("./middleware/errorHandler");
const { attachUserContext } = require("./middleware/userContext");
const apiRoutes = require("./routes");

const WEB_PUBLIC_DIR = path.resolve(__dirname, "../../web/public");

const app = express();

app.use(
  cors({
    origin(origin, callback) {
      if (isOriginAllowed(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS: ${origin} ruxsat etilmagan`));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "12mb" }));

app.use(
  express.static(WEB_PUBLIC_DIR, {
    fallthrough: true,
    maxAge: process.env.NODE_ENV === "production" ? "1h" : 0,
  }),
);

app.get("/", (req, res) => {
  res.json({
    message: "Arsenal Union API",
    docs: "/api/health",
  });
});

app.use("/api", attachUserContext, apiRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
