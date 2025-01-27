import { Request, Response } from "express";
import { PlaywrightService } from "../services/PlaywrightService";
import pool from "../config/database";
import { scrapeQueue } from "../services/QueueService";

const playwrightService = new PlaywrightService();

export class ScraperControllers {
  // This controller is used for single website scraping
  async scrapeWebsite(req: Request, res: Response) {
    try {
      const { url, item, selectors, options } = req.body;

      if (!url || !item || !selectors) {
        return res
          .status(400)
          .json({ error: "The request is missing something" });
      }

      // Add job to queue
      const job = await scrapeQueue.add("scrape", {
        url,
        item,
        selectors,
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
  async getResults(req: Request, res: Response) {
    try {
      const { url } = req.query;
      if (!url) {
        return res
          .status(400)
          .json({ error: "The request is missing something" });
      }

      const result = pool.query(
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
  async scrapeBulkWebsites(req: Request, res: Response) {
    try {
      const { urls, item, selectors, options } = req.body;

      if (!urls || !item || !selectors) {
        return res
          .status(400)
          .json({ error: "The request is missing something" });
      }

      // Add multiple jobs to queue
      const jobs = await Promise.all(
        urls.map((url: string) =>
          scrapeQueue.add("bulk-scrape", {
            url,
            item,
            selectors,
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
