
const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { completeLesson } = require("../controllers/lessonController");

const router = express.Router();

router.post("/:lessonId/complete", authMiddleware, completeLesson);

module.exports = router;
