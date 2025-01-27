import { Router } from "express";
import { ScraperControllers } from "../controllers/ScraperControllers";

const router = Router();
const scraper = new ScraperControllers();

router.post("/scrape/single", scraper.scrapeWebsite);
router.post("/scrape/bulk", scraper.scrapeBulkWebsites);
router.get("/scraper/status", scraper.fetchStatus);
router.post("/scrape/seo", scraper.scrapeWebsiteSEO);
router.get("/data", scraper.getResults);

export default router;
