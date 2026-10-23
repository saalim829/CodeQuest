
const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  getQuizzesByLesson,
  getQuizById,
  submitQuiz,
} = require("../controllers/quizController");

const router = express.Router();

// All quiz endpoints require authentication.
router.use(authMiddleware);

router.get("/lesson/:lessonId", getQuizzesByLesson);
router.post("/:quizId/submit", submitQuiz);
router.get("/:quizId", getQuizById);

module.exports = router;
