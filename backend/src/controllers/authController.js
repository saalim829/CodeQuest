
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

function createToken(userId) {
  return jwt.sign(
    { sub: userId.toString() },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
      algorithm: "HS256",
    }
  );
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

exports.register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    if (
      typeof username !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        message: "Username, email, and password are required",
      });
    }

    const normalizedUsername = username.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (
      normalizedUsername.length < 3 ||
      normalizedUsername.length > 30
    ) {
      return res.status(400).json({
        message: "Username must be between 3 and 30 characters",
      });
    }

    if (
      normalizedEmail.length > 254 ||
      !isValidEmail(normalizedEmail)
    ) {
      return res.status(400).json({
        message: "Please provide a valid email address",
      });
    }

    // bcrypt has a 72-byte input limit. Reject longer passwords
    // rather than silently hashing only part of one.
    if (
      Buffer.byteLength(password, "utf8") < 8 ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      return res.status(400).json({
        message: "Password must be 8 to 72 bytes long",
      });
    }

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      username: normalizedUsername,
      email: normalizedEmail,
      passwordHash,
    });

    const token = createToken(user._id);

    return res.status(201).json({
      message: "Registration successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        xp: user.xp,
        level: user.level,
        currentStreak: user.currentStreak,
      },
    });
  } catch (error) {
    // Handles a duplicate email race between concurrent requests.
    if (error.code === 11000) {
      return res.status(409).json({
        message: "An account with this email already exists",
      });
    }

    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      email.trim().length === 0 ||
      password.length === 0
    ) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+passwordHash");

    // Use the same response for unknown emails and wrong passwords.
    if (
      !user ||
      !(await bcrypt.compare(password, user.passwordHash))
    ) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = createToken(user._id);

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        xp: user.xp,
        level: user.level,
        currentStreak: user.currentStreak,
      },
    });
  } catch (error) {
    next(error);
  }
};
