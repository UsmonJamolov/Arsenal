const { Server } = require("socket.io");

const { isOriginAllowed } = require("./corsOrigins");

let io = null;

function initRealtime(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error(`Socket CORS: ${origin}`));
      },
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    socket.join("club");

    socket.on("join", (room) => {
      if (room === "admin" || room === "client") {
        socket.join(room);
      }

      if (typeof room === "string" && room.startsWith("user:")) {
        socket.join(room);
      }
    });
  });

  console.log("Socket.IO real-time yoqildi");
  return io;
}

function broadcastUpdate(payload) {
  if (!io) {
    return;
  }

  io.to("club").emit("club:update", payload);
}

function emitToUser(userId, event, payload) {
  if (!io || !userId) {
    return;
  }

  io.to(`user:${userId}`).emit(event, payload);
}

module.exports = { initRealtime, broadcastUpdate, emitToUser };
