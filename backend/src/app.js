const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const authRoutes = require("./routes/authRoutes");
const lessonRoutes = require("./routes/lessonRoutes");
const courseRoutes = require("./routes/courseRoutes");

const app = express();

app.disable("x-powered-by");

app.use(helmet());

const allowedOrigins = (
  process.env.CLIENT_ORIGIN || "http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests without a browser Origin header, such as
      // local command-line clients. This is not authentication.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "10kb" }));

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "CodeQuest API",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/lessons", lessonRoutes);
app.use("/api/courses", courseRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});


app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error.type === "entity.parse.failed") {
    return res.status(400).json({
      message: "Invalid JSON request body",
    });
  }

  if (error.message === "Origin not allowed by CORS") {
    return res.status(403).json({
      message: "Origin not allowed",
    });
  }

  console.error("API error:", error.message);

  return res.status(500).json({
    message: "Internal server error",
  });
});

module.exports = app;
