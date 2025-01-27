import { Request, Response } from "express";
import { PlaywrightService } from "../services/PlaywrightService";
import pool from "../config/database";

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

      const result = await playwrightService.launchScrapper(
        url,
        item,
        selectors,
        options
      );

      if (!result.success) {
        return res.status(500).json({ error: result.error });
      } else {
        // add to database
        const db = await pool.query(
          `INSERT INTO scraped_data (source_url, title, price, description, results) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
          [
            url,
            item,
            selectors.title,
            selectors.price,
            JSON.stringify(result.data),
          ]
        );

        console.log("Added to Database Succesfully");
      }

      return res.status(200).json(result);
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

      const results = await playwrightService.launchBulkScrapper(
        urls,
        item,
        selectors,
        options
      );

      // Save each result to the database
      for (const result of results) {
        if (result.success) {
          await pool.query(
            `INSERT INTO scraped_data (source_url, title, price, description, results) VALUES ($1, $2, $3, $4, $5)`,
            [
              result.data[0]?.source_url || urls[0], // Use the first URL if source_url is not available
              item,
              selectors.title,
              selectors.price,
              JSON.stringify(result.data), // Only save result.data
            ]
          );
        }
      }

      console.log("All results added to the database successfully");

      return res.status(200).json(results);
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ error: error.message });
    }
  }
}
