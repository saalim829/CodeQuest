
const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    questionText: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    options: {
      type: [
        {
          type: String,
          required: true,
          trim: true,
          maxlength: 500,
        },
      ],
      required: true,
      validate: {
        validator(options) {
          return (
            options.length >= 2 &&
            new Set(options).size === options.length &&
            options.every((option) => option.length > 0)
          );
        },
        message:
          "Each question must have at least two unique, non-empty options.",
      },
    },
    correctOptionIndex: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator(value) {
          return (
            Number.isInteger(value) &&
            Array.isArray(this.options) &&
            value < this.options.length
          );
        },
        message: "The correct option index must match an existing option.",
      },
    },
    explanation: {
      type: String,
      default: "",
      maxlength: 2000,
    },
    points: {
      type: Number,
      default: 1,
      min: 1,
      max: 100,
      validate: {
        validator: Number.isInteger,
        message: "Question points must be a whole number.",
      },
    },
  },
  { _id: true }
);

const quizSchema = new mongoose.Schema(
  {
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
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
      maxlength: 180,
    },
    description: {
      type: String,
      default: "",
      maxlength: 2000,
    },
    questions: {
      type: [questionSchema],
      required: true,
      validate: {
        validator(questions) {
          return questions.length >= 1;
        },
        message: "A quiz must contain at least one question.",
      },
    },
    passingPercentage: {
      type: Number,
      default: 70,
      min: 0,
      max: 100,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

quizSchema.index({ lesson: 1, slug: 1 }, { unique: true });
quizSchema.index({ isPublished: 1, lesson: 1 });

module.exports = mongoose.model("Quiz", quizSchema);
