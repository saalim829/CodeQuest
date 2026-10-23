
const mongoose = require("mongoose");

const userProgressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
    },
    status: {
      type: String,
      enum: ["not_started", "in_progress", "completed"],
      default: "not_started",
    },
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    lastAccessedAt: {
      type: Date,
      default: null,
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

userProgressSchema.index(
  { user: 1, lesson: 1 },
  { unique: true }
);

userProgressSchema.index({ user: 1, course: 1, status: 1 });

module.exports = mongoose.model("UserProgress", userProgressSchema);
