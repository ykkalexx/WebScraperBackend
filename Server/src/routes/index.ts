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

router.post(
  "/scrape/single",
  validateRequest(singleScrapeSchema),
  scraper.scrapeWebsite
);
router.post(
  "/scrape/bulk",
  validateRequest(bulkScrapeSchema),
  scraper.scrapeBulkWebsites
);
router.get("/scrape/status", scraper.fetchStatus);
router.post("/scrape/seo", scraper.scrapeWebsiteSEO);
router.post("/data", validateRequest(seoSchema), scraper.getResults);
export default router;
