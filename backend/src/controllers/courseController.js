
const mongoose = require("mongoose");
const Course = require("../models/Course");
const Lesson = require("../models/Lesson");

async function getPublishedCourses(req, res, next) {
  try {
    const courses = await Course.find({ isPublished: true })
      .select(
        "title slug description category difficulty createdAt"
      )
      .sort({ createdAt: -1 })
      .lean();

    const courseIds = courses.map((course) => course._id);

    const lessonCounts = await Lesson.aggregate([
      {
        $match: {
          course: { $in: courseIds },
          isPublished: true,
        },
      },
      {
        $group: {
          _id: "$course",
          count: { $sum: 1 },
        },
      },
    ]);

    const countByCourse = new Map(
      lessonCounts.map((item) => [
        String(item._id),
        item.count,
      ])
    );

    const result = courses.map((course) => ({
      ...course,
      publishedLessonCount:
        countByCourse.get(String(course._id)) || 0,
    }));

    return res.status(200).json({ courses: result });
  } catch (error) {
    console.error("Get published courses error:", error);
    return next(error);
  }
}

async function getPublishedCourseBySlug(req, res, next) {
  try {
    const { slug } = req.params;

    const course = await Course.findOne({
      slug,
      isPublished: true,
    })
      .select(
        "title slug description category difficulty createdAt"
      )
      .lean();

    if (!course) {
      return res.status(404).json({
        message: "Published course not found",
      });
    }

    const lessons = await Lesson.find({
      course: course._id,
      isPublished: true,
    })
      .select(
        "title slug description order estimatedMinutes xpReward"
      )
      .sort({ order: 1 })
      .lean();

    return res.status(200).json({
      course,
      lessons,
    });
  } catch (error) {
    console.error("Get published course details error:", error);
    return next(error);
  }
}

module.exports = {
  getPublishedCourses,
  getPublishedCourseBySlug,
};
