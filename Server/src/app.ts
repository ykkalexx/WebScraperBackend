import express, { Request, Response, NextFunction } from "express";
import { json, urlencoded } from "express";
import routes from "./routes/index";
import pool from "./config/database";
import swaggerSetup from "./config/swagger";
import WebSocketService from "./services/WebsocketsService";
import { createServer } from "http";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;
const httpServer = createServer(app);

// Configure CORS with specific options
const corsOptions = {
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 200,
};

// Apply CORS with options
app.use(cors(corsOptions));

// init websocket
export const websocketService = new WebSocketService(httpServer);

// Middleware
app.use(json());
app.use(urlencoded({ extended: true }));

// Routes
app.use("/api", routes);

// Swagger docs
swaggerSetup(app);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.message);
  res.status(400).json({ error: "Something went wrong!" });
});

// Test database connection and start server
pool
  .connect()
  .then((client) => {
    client.release();
    console.log("Connected to PostgreSQL database");

    httpServer.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log(`WebSocket server is running on ws://localhost:${PORT}`);
      console.log(`Swagger docs: http://localhost:${PORT}/api-docs`);
    });
  })
  .catch((err) => {
    console.error("Database connection error:", err.message);
  });

export default app;
