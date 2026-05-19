const mongoose = require("mongoose");

const agentCommandSchema = new mongoose.Schema(
  {
    stationId: { type: String, required: true, trim: true, index: true },
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "Session", default: null },
    command: {
      type: String,
      enum: ["start_session", "unlock", "stop_session", "lock", "heartbeat_ack"],
      required: true,
    },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: {
      type: String,
      enum: ["pending", "sent", "completed", "failed"],
      default: "pending",
      index: true,
    },
    resultMessage: { type: String, default: null },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "agent_commands" },
);

agentCommandSchema.methods.toJSON = function toJSON() {
  return {
    id: this._id.toString(),
    stationId: this.stationId,
    sessionId: this.sessionId?.toString() ?? null,
    command: this.command,
    payload: this.payload,
    status: this.status,
    resultMessage: this.resultMessage,
    expiresAt: this.expiresAt?.toISOString() ?? null,
    createdAt: this.createdAt.toISOString(),
  };
};

module.exports =
  mongoose.models.AgentCommand || mongoose.model("AgentCommand", agentCommandSchema);
