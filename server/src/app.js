const cors = require("cors");
const express = require("express");

const { isOriginAllowed } = require("./corsOrigins");
const { errorHandler, notFound } = require("./middleware/errorHandler");
const { attachUserContext } = require("./middleware/userContext");
const apiRoutes = require("./routes");

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
app.use(express.json({ limit: "8mb" }));

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
