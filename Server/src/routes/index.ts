import { Router } from "express";
import { ScraperControllers } from "../controllers/ScraperControllers";

const router = Router();
const scraper = new ScraperControllers();

router.post("/scrape", scraper.scrapeWebsite);
router.get("/data", scraper.getResults);

export default router;
