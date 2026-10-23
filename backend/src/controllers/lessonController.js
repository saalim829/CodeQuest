
const mongoose = require("mongoose");
const User = require("../models/User");
const Lesson = require("../models/Lesson");
const UserProgress = require("../models/UserProgress");

const GAMIFICATION_URL =
  process.env.GAMIFICATION_SERVICE_URL ||
  "http://127.0.0.1:8081";

async function requestGamification(payload) {
  const token = process.env.GAMIFICATION_SERVICE_TOKEN;

  if (!token) {
    throw new Error("Gamification service token is not configured");
  }

  const response = await fetch(
    `${GAMIFICATION_URL}/internal/gamification/award`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Service-Token": token,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Gamification service returned HTTP ${response.status}`
    );
  }

  const result = await response.json();

  if (
    !Number.isSafeInteger(result.xp) ||
    !Number.isSafeInteger(result.level) ||
    !Number.isSafeInteger(result.currentStreak) ||
    !Number.isSafeInteger(result.longestStreak) ||
    result.xp < 0 ||
    result.level < 1 ||
    result.currentStreak < 0 ||
    result.longestStreak < result.currentStreak
  ) {
    throw new Error("Gamification service returned invalid data");
  }

  return result;
}

exports.completeLesson = async (req, res, next) => {
  const { lessonId } = req.params;

  if (!mongoose.isValidObjectId(lessonId)) {
    return res.status(400).json({
      message: "Invalid lesson ID",
    });
  }

  // The authenticated identity comes from JWT middleware,
  // never from a user ID supplied in the request body.
  const userId = req.user._id;

  let session;

  try {
    const lesson = await Lesson.findById(lessonId);

    if (!lesson || !lesson.isPublished) {
      return res.status(404).json({
        message: "Published lesson not found",
      });
    }

    session = await mongoose.startSession();

    let result;

    await session.withTransaction(async () => {
      const user = await User.findById(userId).session(session);

      if (!user) {
        const error = new Error("User not found");
        error.status = 404;
        throw error;
      }

      const progress = await UserProgress.findOne({
        user: userId,
        lesson: lesson._id,
      }).session(session);

      if (progress?.status === "completed") {
        result = {
          alreadyCompleted: true,
          user,
        };
        return;
      }

      const activityDate = new Date().toISOString().slice(0, 10);

      const lastActivityDate = user.lastActivityDate
        ? user.lastActivityDate.toISOString().slice(0, 10)
        : "";

      // Go calculates the reward. MongoDB remains the source of
      // truth for the persisted user statistics.
      const stats = await requestGamification({
        currentXP: user.xp,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        lastActivityDate,
        xpReward: lesson.xpReward,
        activityDate,
      });

      user.xp = stats.xp;
      user.level = stats.level;
      user.currentStreak = stats.currentStreak;
      user.longestStreak = stats.longestStreak;
      user.lastActivityDate = new Date(
        `${stats.lastActivityDate}T00:00:00.000Z`
      );

      await user.save({ session });

      if (progress) {
        progress.status = "completed";
        progress.completedAt = new Date();
        progress.lastAccessedAt = new Date();

        if (!progress.startedAt) {
          progress.startedAt = new Date();
        }

        await progress.save({ session });
      } else {
        await UserProgress.create(
          [
            {
              user: userId,
              course: lesson.course,
              lesson: lesson._id,
              status: "completed",
              startedAt: new Date(),
              completedAt: new Date(),
              lastAccessedAt: new Date(),
              attempts: 1,
            },
          ],
          { session }
        );
      }

      result = {
        alreadyCompleted: false,
        user,
      };
    });

    if (result.alreadyCompleted) {
      return res.status(200).json({
        message: "Lesson already completed",
        alreadyCompleted: true,
        user: {
          id: result.user._id,
          xp: result.user.xp,
          level: result.user.level,
          currentStreak: result.user.currentStreak,
          longestStreak: result.user.longestStreak,
        },
      });
    }

    return res.status(200).json({
      message: "Lesson completed successfully",
      alreadyCompleted: false,
      user: {
        id: result.user._id,
        xp: result.user.xp,
        level: result.user.level,
        currentStreak: result.user.currentStreak,
        longestStreak: result.user.longestStreak,
      },
    });
  } catch (error) {
    next(error);
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};
