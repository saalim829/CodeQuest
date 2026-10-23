
const express = require("express");
const rateLimit = require("express-rate-limit");

const {
  register,
  login,
} = require("../controllers/authController");

const authRouter = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message: "Too many authentication attempts. Try again later.",
  },
});

authRouter.post("/register", authLimiter, register);
authRouter.post("/login", authLimiter, login);

module.exports = authRouter;
