
const mongoose = require("mongoose");
const User = require("../models/User");
const Lesson = require("../models/Lesson");
const UserProgress = require("../models/UserProgress");
const Course = require("../models/Course");

const GAMIFICATION_URL =
  process.env.GAMIFICATION_SERVICE_URL || "http://127.0.0.1:8081";

/**
 * Request an XP and streak calculation from the Go service.
 */
async function requestGamification(payload) {
  const serviceToken = process.env.GAMIFICATION_SERVICE_TOKEN;

  if (!serviceToken) {
    throw new Error("Gamification service token is not configured");
  }

  const response = await fetch(
    `${GAMIFICATION_URL}/internal/gamification/award`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Service-Token": serviceToken,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    }
  );

  if (!response.ok) {
    const error = new Error(
      `Gamification service returned HTTP ${response.status}`
    );
    error.status = 502;
    throw error;
  }

  const result = await response.json();

  const requiredFields = [
    "xp",
    "level",
    "currentStreak",
    "longestStreak",
  ];

  for (const field of requiredFields) {
    if (
      !Number.isFinite(result[field]) ||
      result[field] < 0
    ) {
      throw new Error(
        `Invalid gamification response: ${field}`
      );
    }
  }

  return result;
}

/**
 * GET /api/lessons
 * Return published lessons for authenticated users.
 */

async function getPublishedLessons(req, res, next) {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const lessons = await Lesson.find({ isPublished: true })
      .select(
        "course title slug description content order estimatedMinutes xpReward"
      )
      .populate(
        "course",
        "title slug description category difficulty"
      )
      .sort({ course: 1, order: 1 })
      .lean();

    // Retrieve this user's completed lessons.
    const completedProgress = await UserProgress.find({
      user: req.user._id,
      status: "completed",
    })
      .select("lesson")
      .lean();

    const completedLessonIds = new Set(
      completedProgress.map((progress) =>
        String(progress.lesson)
      )
    );

    // Include completion status for each lesson.
    const lessonsWithProgress = lessons.map((lesson) => ({
      ...lesson,
      completed: completedLessonIds.has(String(lesson._id)),
    }));

    return res.status(200).json({
      lessons: lessonsWithProgress,
    });
  } catch (error) {
    console.error("Get published lessons error:", error);
    return next(error);
  }
}


/**
 * POST /api/lessons/:lessonId/complete
 * Complete a published lesson and award XP once.
 */
async function completeLesson(req, res, next) {
  const { lessonId } = req.params;

  if (!mongoose.isValidObjectId(lessonId)) {
    return res.status(400).json({
      message: "Invalid lesson ID",
    });
  }

  if (!req.user || !req.user._id) {
    return res.status(401).json({
      message: "Authentication required",
    });
  }

  const session = await mongoose.startSession();

  try {
    let outcome;

    await session.withTransaction(async () => {
      const lesson = await Lesson.findOne({
        _id: lessonId,
        isPublished: true,
      }).session(session);

      if (!lesson) {
        const error = new Error(
          "Published lesson not found"
        );
        error.status = 404;
        throw error;
      }

      const user = await User.findById(req.user._id).session(
        session
      );

      if (!user) {
        const error = new Error("User not found");
        error.status = 404;
        throw error;
      }

      let progress = await UserProgress.findOne({
        user: user._id,
        lesson: lesson._id,
      }).session(session);

      // Do not award XP again for an already-completed lesson.
      if (progress && progress.status === "completed") {
        outcome = {
          alreadyCompleted: true,
          user: {
            id: user._id.toString(),
            xp: user.xp,
            level: user.level,
            currentStreak: user.currentStreak,
            longestStreak: user.longestStreak,
          },
        };

        return;
      }

      const activityDate = new Date()
        .toISOString()
        .slice(0, 10);

      const gamification = await requestGamification({
        currentXP: user.xp,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        lastActivityDate: user.lastActivityDate
          ? new Date(user.lastActivityDate)
              .toISOString()
              .slice(0, 10)
          : null,
        xpReward: lesson.xpReward,
        activityDate,
      });

      user.xp = gamification.xp;
      user.level = gamification.level;
      user.currentStreak = gamification.currentStreak;
      user.longestStreak = gamification.longestStreak;

      if (gamification.lastActivityDate !== undefined) {
        user.lastActivityDate =
          gamification.lastActivityDate;
      } else {
        user.lastActivityDate = new Date(activityDate);
      }

      await user.save({ session });

      const now = new Date();

      if (!progress) {
        progress = new UserProgress({
          user: user._id,
          course: lesson.course,
          lesson: lesson._id,
          status: "completed",
          startedAt: now,
          completedAt: now,
          lastAccessedAt: now,
          attempts: 1,
        });
      } else {
        progress.status = "completed";
        progress.completedAt = now;
        progress.lastAccessedAt = now;
        progress.attempts = (progress.attempts || 0) + 1;
      }

      await progress.save({ session });

      outcome = {
        alreadyCompleted: false,
        xpAwarded: lesson.xpReward,
        user: {
          id: user._id.toString(),
          xp: user.xp,
          level: user.level,
          currentStreak: user.currentStreak,
          longestStreak: user.longestStreak,
        },
      };
    });

    return res.status(200).json({
      message: "Lesson completed successfully",
      ...outcome,
    });
  } catch (error) {
    console.error("Complete lesson error:", error);
    return next(error);
  } finally {
    await session.endSession();
  }
}

module.exports = {
  getPublishedLessons,
  completeLesson,
};
