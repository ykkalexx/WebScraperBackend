import { Router } from "express";
import { ScraperControllers } from "../controllers/ScraperControllers";
import {
  validateRequest,
  singleScrapeSchema,
  bulkScrapeSchema,
  seoSchema,
} from "../middleware/validation";

const router = Router();
const scraper = new ScraperControllers();

router.post("/scrape/single", scraper.scrapeWebsite);
router.post("/scrape/bulk", scraper.scrapeBulkWebsites);
router.get("/scrape/status", scraper.fetchStatus);
router.post("/scrape/seo", scraper.scrapeWebsiteSEO);
router.post("/data", validateRequest(seoSchema), scraper.getResults);
export default router;
