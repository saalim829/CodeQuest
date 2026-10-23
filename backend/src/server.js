
require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");

async function startServer() {
  if (!process.env.JWT_SECRET ||
      process.env.JWT_SECRET.length < 32) {
    throw new Error(
      "JWT_SECRET must be configured with a strong secret"
    );
  }

  await connectDB();

  const port = Number(process.env.PORT || 5000);

  const server = app.listen(port, () => {
    console.log(`CodeQuest API running on port ${port}`);
  });

  function shutdown(signal) {
    console.log(`${signal} received; shutting down`);

    server.close(async () => {
      const mongoose = require("mongoose");

      await mongoose.disconnect();
      process.exit(0);
    });

    setTimeout(() => process.exit(1), 10000).unref();
  }

  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
}

startServer().catch((error) => {
  console.error("Failed to start CodeQuest API:", error.message);
  process.exit(1);
});
