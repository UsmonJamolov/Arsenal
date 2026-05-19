function notFound(req, res, next) {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.method} ${req.originalUrl} topilmadi`,
  });
}

function errorHandler(err, req, res, next) {
  if (err.name === "ValidationError") {
    return res.status(400).json({
      error: err.name,
      message: Object.values(err.errors)
        .map((item) => item.message)
        .join(", "),
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({
      error: err.name,
      message: "Noto'g'ri ID formati",
    });
  }

  const status = err.status || 500;
  res.status(status).json({
    error: err.name || "ServerError",
    message: err.message || "Ichki server xatosi",
  });
}

module.exports = { notFound, errorHandler };
