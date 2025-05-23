import { Server } from "socket.io";
import { createServer } from "http";
import express from "express";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173", // Vite's default port
    methods: ["GET", "POST"],
  },
});

// Serve static files from the dist directory
app.use(express.static("dist"));

// Generate random data for testing
function generateTestData() {
  const now = Date.now();
  return [
    0, // ignored
    Math.random() * 100, // Elapsed Time
    Math.random() * 50, // Velocity
    Math.random() * 200, // Density
    Math.random() * 10, // Viscosity
    Math.random() * 500, // TDS
    Math.random() * 1000, // Mass
    now, // timestamp
  ];
}

io.on("connection", (socket) => {
  console.log("Client connected");

  // Send initial data
  const initialData = Array.from({ length: 20 }, () => generateTestData());
  socket.emit("update_data", { data: initialData });

  // Send updates every second
  const interval = setInterval(() => {
    socket.emit("update_data", { data: [generateTestData()] });
  }, 1000);

  socket.on("disconnect", () => {
    console.log("Client disconnected");
    clearInterval(interval);
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
