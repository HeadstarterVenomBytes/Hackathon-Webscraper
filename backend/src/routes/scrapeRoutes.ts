import { Router } from "express";
import { scrapeHandler } from "../controllers/scrapeController";

const router = Router();

router.post("/", scrapeHandler);

export default router;
