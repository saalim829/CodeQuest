
const mongoose = require("mongoose");
const Quiz = require("../models/Quiz");
const QuizAttempt = require("../models/QuizAttempt");

function isValidObjectId(id) {
  return mongoose.isValidObjectId(id);
}

// Never send correct answers before a quiz is submitted.
function formatQuizForStudent(quiz) {
  return {
    id: quiz._id,
    lesson: quiz.lesson,
    title: quiz.title,
    slug: quiz.slug,
    description: quiz.description,
    passingPercentage: quiz.passingPercentage,
    questions: quiz.questions.map((question) => ({
      id: question._id,
      questionText: question.questionText,
      options: question.options,
      points: question.points,
    })),
  };
}

// GET /api/quizzes/lesson/:lessonId
async function getQuizzesByLesson(req, res) {
  try {
    const { lessonId } = req.params;

    if (!isValidObjectId(lessonId)) {
      return res.status(400).json({ message: "Invalid lesson ID." });
    }

    const quizzes = await Quiz.find({
      lesson: lessonId,
      isPublished: true,
    }).sort({ createdAt: 1 });

    return res.status(200).json({
      quizzes: quizzes.map(formatQuizForStudent),
    });
  } catch (error) {
    console.error("Get quizzes by lesson error:", error);
    return res.status(500).json({ message: "Failed to load quizzes." });
  }
}

// GET /api/quizzes/:quizId
async function getQuizById(req, res) {
  try {
    const { quizId } = req.params;

    if (!isValidObjectId(quizId)) {
      return res.status(400).json({ message: "Invalid quiz ID." });
    }

    const quiz = await Quiz.findOne({
      _id: quizId,
      isPublished: true,
    });

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found." });
    }

    return res.status(200).json({
      quiz: formatQuizForStudent(quiz),
    });
  } catch (error) {
    console.error("Get quiz error:", error);
    return res.status(500).json({ message: "Failed to load quiz." });
  }
}

// POST /api/quizzes/:quizId/submit
async function submitQuiz(req, res) {
  try {
    const { quizId } = req.params;
    const { answers } = req.body;

    if (!isValidObjectId(quizId)) {
      return res.status(400).json({ message: "Invalid quiz ID." });
    }

    if (!Array.isArray(answers)) {
      return res.status(400).json({
        message: "Answers must be provided as an array.",
      });
    }

    const quiz = await Quiz.findOne({
      _id: quizId,
      isPublished: true,
    });

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found." });
    }

    if (answers.length !== quiz.questions.length) {
      return res.status(400).json({
        message: "Please answer every question before submitting.",
      });
    }

    const questionsById = new Map(
      quiz.questions.map((question) => [
        question._id.toString(),
        question,
      ])
    );

    const seenQuestionIds = new Set();
    const savedAnswers = [];
    const results = [];

    let score = 0;
    const maxScore = quiz.questions.reduce(
      (total, question) => total + question.points,
      0
    );

    for (const answer of answers) {
      if (
        !answer ||
        typeof answer.questionId !== "string" ||
        !isValidObjectId(answer.questionId) ||
        !Number.isInteger(answer.selectedOptionIndex)
      ) {
        return res.status(400).json({
          message: "One or more answers are invalid.",
        });
      }

      const questionId = answer.questionId;
      const question = questionsById.get(questionId);

      if (!question) {
        return res.status(400).json({
          message: "An answer references a question outside this quiz.",
        });
      }

      if (seenQuestionIds.has(questionId)) {
        return res.status(400).json({
          message: "A question cannot be answered more than once.",
        });
      }

      seenQuestionIds.add(questionId);

      const selectedOptionIndex = answer.selectedOptionIndex;

      if (
        selectedOptionIndex < 0 ||
        selectedOptionIndex >= question.options.length
      ) {
        return res.status(400).json({
          message: "A selected option is out of range.",
        });
      }

      const isCorrect =
        selectedOptionIndex === question.correctOptionIndex;

      if (isCorrect) {
        score += question.points;
      }

      savedAnswers.push({
        questionId: question._id,
        selectedOptionIndex,
      });

      results.push({
        questionId: question._id,
        questionText: question.questionText,
        selectedOptionIndex,
        correctOptionIndex: question.correctOptionIndex,
        isCorrect,
        pointsEarned: isCorrect ? question.points : 0,
        pointsPossible: question.points,
        explanation: question.explanation,
      });
    }

    const percentage = Math.round((score / maxScore) * 100);
    const passed = percentage >= quiz.passingPercentage;

    const attempt = await QuizAttempt.create({
      user: req.user._id,
      quiz: quiz._id,
      answers: savedAnswers,
      score,
      maxScore,
      percentage,
      passed,
    });

    return res.status(201).json({
      message: "Quiz submitted successfully.",
      attempt: {
        id: attempt._id,
        quizId: quiz._id,
        score,
        maxScore,
        percentage,
        passingPercentage: quiz.passingPercentage,
        passed,
        submittedAt: attempt.submittedAt,
        results,
      },
    });
  } catch (error) {
    console.error("Submit quiz error:", error);
    return res.status(500).json({ message: "Failed to submit quiz." });
  }
}

module.exports = {
  getQuizzesByLesson,
  getQuizById,
  submitQuiz,
};
