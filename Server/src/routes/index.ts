import { Router } from "express";
import { ScraperControllers } from "../controllers/ScraperControllers";

const router = Router();
const scraper = new ScraperControllers();

router.post("/scrape/single", scraper.scrapeWebsite);
router.post("/scrape/bulk", scraper.scrapeBulkWebsites);
router.get("/data", scraper.getResults);
router.get("/scraper/status", scraper.fetchStatus);

export default router;
