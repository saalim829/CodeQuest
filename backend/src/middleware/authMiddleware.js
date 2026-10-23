
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");

module.exports = async function authMiddleware(req, res, next) {
  try {
    const authorization = req.headers.authorization;

    if (
      !authorization ||
      !authorization.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        message: "Authentication token required",
      });
    }

    const token = authorization.slice(7).trim();

    if (!token) {
      return res.status(401).json({
        message: "Authentication token required",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });

    if (
      typeof decoded.sub !== "string" ||
      !mongoose.isValidObjectId(decoded.sub)
    ) {
      return res.status(401).json({
        message: "Invalid or expired token",
      });
    }

    const user = await User.findById(decoded.sub).select(
      "_id username email role xp level currentStreak"
    );

    if (!user) {
      return res.status(401).json({
        message: "User account not found",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        message: "Invalid or expired token",
      });
    }

    next(error);
  }
};
