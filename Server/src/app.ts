import express, { Request, Response, NextFunction } from "express";
import { json, urlencoded } from "express";
import routes from "./routes/index";
import pool from "./config/database";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(json());
app.use(urlencoded({ extended: true }));

// Routes
app.use("/api", routes);

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

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Database connection error:", err.message);
  });

export default app;
