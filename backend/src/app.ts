import express, { Application } from "express";
import dotenv from "dotenv";
import scrapeRoutes from "./routes/scrapeRoutes";

// Load environment variables
dotenv.config();

const app: Application = express();

// Middleware
app.use(express.json());

// Routes
app.use("/api/scrape", scrapeRoutes);

export default app;
