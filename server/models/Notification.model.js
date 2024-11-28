const mongoose = require("mongoose");

const noticeSchema = new mongoose.Schema(
  {
    team: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    text: { type: String },
    task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
    notiType: { type: String, default: "alert", enum: ["alert", "message"] },
    isRead: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

const Notice = mongoose.model("Notice", noticeSchema);

module.exports = Notice;
