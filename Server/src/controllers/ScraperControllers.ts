import { Request, Response } from "express";
import { PlaywrightService } from "../services/PlaywrightService";
import pool from "../config/database";
import { scrapeQueue } from "../services/QueueService";

const playwrightService = new PlaywrightService();

export class ScraperControllers {
  // This controller is used for single website scraping
  /**
   * @swagger
   * /api/scrape/single:
   *   post:
   *     summary: Scrape a single website
   *     tags: [Scraper]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               url:
   *                 type: string
   *                 example: "https://www.newegg.com/p/pl?d=iphone"
   *               searchTerms:
   *                 type: object
   *                 properties:
   *                   title:
   *                     type: string
   *                     example: "iPhone"
   *                   price:
   *                     type: string
   *                     example: "999"
   *                   description:
   *                     type: string
   *                     example: "Pro Max"
   *               options:
   *                 type: object
   *                 properties:
   *                   maxPages:
   *                     type: number
   *                     example: 3
   *                   waitTime:
   *                     type: number
   *                     example: 1000
   */
  async scrapeWebsite(req: Request, res: Response) {
    try {
      const { url, searchTerms, options } = req.body;

      if (!url || !searchTerms) {
        return res
          .status(400)
          .json({ error: "URL and search terms are required" });
      }

      // Log the incoming request
      console.log("Scraping request:", {
        url,
        searchTerms,
        options,
      });

      const job = await scrapeQueue.add("scrape", {
        url,
        searchTerms,
        options,
      });

      return res.status(202).json({
        message: "Scraping job queued",
        jobId: job.id,
      });
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ error: error.message });
    }
  }

  // This controller is used to fetch the results from the database
  /**
   * @swagger
   * /api/data:
   *   post:
   *     summary: Get scraped results by URL
   *     tags: [Scraper]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               url:
   *                 type: string
   *                 example: "https://www.newegg.com/p/pl?d=iphone"
   *     responses:
   *       200:
   *         description: Scraped results
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 result:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       title:
   *                         type: string
   *                       price:
   *                         type: string
   *                       description:
   *                         type: string
   *                       source_url:
   *                         type: string
   *                       scraped_at:
   *                         type: string
   *                         format: date-time
   */
  async getResults(req: Request, res: Response) {
    try {
      const { url } = req.body;
      if (!url) {
        return res
          .status(400)
          .json({ error: "The request is missing something" });
      }

      const result = await pool.query(
        `SELECT * FROM scraped_data WHERE source_url = $1`,
        [url]
      );

      return res.status(200).json({ result: result });
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ error: error.message });
    }
  }

  // This controller is used to fetch the status of the scrapers
  /**
   * @swagger
   * /api/scrape/status:
   *   get:
   *     summary: Get scraping job status
   *     tags: [Scraper]
   *     parameters:
   *       - in: query
   *         name: jobId
   *         required: true
   *         schema:
   *           type: string
   *         example: "15"
   *     responses:
   *       200:
   *         description: Job status
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   enum: [pending, completed, failed]
   *                 result:
   *                   type: object
   *       400:
   *         description: Bad request
   *       500:
   *         description: Internal server error
   */
  async fetchStatus(req: Request, res: Response) {
    try {
      const { jobId } = req.query;

      if (!jobId) {
        return res.status(400).json({ error: "Job ID is required" });
      }

      // Check database first
      const dbResult = await pool.query(
        `SELECT status, result FROM scraping_jobs WHERE job_id = $1`,
        [jobId]
      );

      if (dbResult.rows.length > 0) {
        return res.status(200).json(dbResult.rows[0]);
      }

      // If not in database, check in-memory status
      const status = await playwrightService.fetchStatus(jobId as string);
      return res.status(200).json(status);
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ error: error.message });
    }
  }

  // Bulk website scraping
  /**
   * @swagger
   * /api/scrape/bulk:
   *   post:
   *     summary: Scrape multiple websites
   *     tags: [Scraper]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               urls:
   *                 type: array
   *                 items:
   *                   type: string
   *                 example: [
   *                   "https://www.newegg.com/p/pl?d=iphone",
   *                   "https://www.newegg.com/p/pl?d=iphone&page=2"
   *                 ]
   *               searchTerms:
   *                 type: object
   *                 properties:
   *                   title:
   *                     type: string
   *                     example: "iPhone"
   *                   price:
   *                     type: string
   *                     example: "999"
   *                   description:
   *                     type: string
   *                     example: "Pro Max"
   *               options:
   *                 type: object
   *                 properties:
   *                   maxPages:
   *                     type: number
   *                     example: 1
   *                   waitTime:
   *                     type: number
   *                     example: 1000
   */

  async scrapeBulkWebsites(req: Request, res: Response) {
    try {
      const { urls, searchTerms, options } = req.body;

      if (!urls || !searchTerms) {
        return res
          .status(400)
          .json({ error: "URLs and search terms are required" });
      }

      const jobs = await Promise.all(
        urls.map((url: string) =>
          scrapeQueue.add("bulk-scrape", {
            url,
            searchTerms,
            options,
          })
        )
      );

      return res.status(202).json({
        message: "Bulk scraping jobs queued",
        jobIds: jobs.map((job) => job.id),
      });
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ error: error.message });
    }
  }

  // This controller is used to scraped an website SEO
  /**
   * @swagger
   * /api/scrape/seo:
   *   post:
   *     summary: Analyze website SEO
   *     tags: [Scraper]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               url:
   *                 type: string
   *                 example: "https://www.newegg.com/p/pl?d=iphone"
   *     responses:
   *       200:
   *         description: SEO analysis results
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 title:
   *                   type: string
   *                 description:
   *                   type: string
   *                 keywords:
   *                   type: string
   *                 h1:
   *                   type: array
   *                   items:
   *                     type: string
   *                 h2:
   *                   type: array
   *                   items:
   *                     type: string
   *                 images:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       src:
   *                         type: string
   *                       alt:
   *                         type: string
   *                 links:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       href:
   *                         type: string
   *                       text:
   *                         type: string
   *       400:
   *         description: Bad request
   *       500:
   *         description: Internal server error
   */

  async scrapeWebsiteSEO(req: Request, res: Response) {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: "URL is missing" });
      }

      const seoData = await playwrightService.analyzeSeo(url);

      return res.status(200).json(seoData);
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ error: error.message });
    }
  }
}
