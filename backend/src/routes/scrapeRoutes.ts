import { Router } from "express";
import { createScrapeHandler } from "../controllers/scrapeController";
import { DatabaseService } from "../services/databaseService";

export function createScrapeRoutes(databaseService: DatabaseService): Router {
  const router = Router();

  // Pass the databaseService to the handler
  router.post("/", createScrapeHandler(databaseService));

  return router;
}
