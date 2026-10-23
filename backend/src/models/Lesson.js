
const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      maxlength: 2000,
    },
    content: {
      type: String,
      required: true,
    },
    order: {
      type: Number,
      required: true,
      min: 1,
    },
    estimatedMinutes: {
      type: Number,
      default: 10,
      min: 1,
    },
    xpReward: {
      type: Number,
      default: 10,
      min: 0,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

lessonSchema.index({ course: 1, order: 1 }, { unique: true });
lessonSchema.index({ course: 1, slug: 1 }, { unique: true });

module.exports = mongoose.model("Lesson", lessonSchema);
