
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
  getPublishedCourses,
  getPublishedCourseBySlug,
} = require("../controllers/courseController");

router.get("/", authMiddleware, getPublishedCourses);
router.get("/:slug", authMiddleware, getPublishedCourseBySlug);

module.exports = router;
