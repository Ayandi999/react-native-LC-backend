import "dotenv/config";
import app from "./routes/app.js";

const PORT = process.env.PORT || 8080;

try {
  if (!PORT) {
    throw new Error("Port is not defined.");
  }

  const server = app.listen(PORT, () => {
    console.log(`Server running at port ${PORT}`);
  });

  server.on("error", (error: Error) => {
    console.error(`Server error: ${error.message}`);
  });
} catch (error) {
  console.error("Failed to start server:", error);
}
