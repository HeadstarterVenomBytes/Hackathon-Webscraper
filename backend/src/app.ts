import express, { Application } from "express";
import dotenv from "dotenv";
import cors from "cors";
import { DatabaseService } from "./services/databaseService";
import { createScrapeRoutes } from "./routes/scrapeRoutes";

export async function initializeApp(): Promise<Application> {
  // Load environment variables
  dotenv.config();

  const app: Application = express();

  // Middleware
  app.use(express.json());

  // Or, for specific options:
  app.use(
    cors({
      origin: "https://hackathon-webscraper.vercel.app/",
      methods: ["GET", "POST"],
      optionsSuccessStatus: 200,
    })
  );

  // Initialize the database service and connect to the database
  const databaseService = new DatabaseService();
  await databaseService.connect();

  // Routes
  app.use("/api/scrape", createScrapeRoutes(databaseService));

  // Handle graceful shutdown
  process.on("SIGINT", async () => {
    console.log("Gracefully shutting down...");
    await databaseService.close();
    process.exit(0);
  });

  return app;
}
