import { Worker, Queue } from "bullmq";
import { PlaywrightService } from "./PlaywrightService";
import pool from "../config/database";
import { websocketService } from "../app";

const playwrightService = new PlaywrightService();

export const scrapeQueue = new Queue("scraping", {
  connection: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || "6379"),
  },
});

new Worker(
  "scraping",
  async (job) => {
    console.log("Job started");
    const { url, item, selectors, options } = job.data;
    const result = await playwrightService.launchScrapper(
      url,
      item,
      selectors,
      options
    );
    console.log("hit2");

    // Save job status to database
    try {
      await pool.query(
        `INSERT INTO scraping_jobs (job_id, source_url, selectors, status, result) VALUES ($1, $2, $3, $4, $5)`,
        [
          job.id,
          url,
          JSON.stringify(selectors),
          result.success ? "completed" : "failed",
          JSON.stringify(result),
        ]
      );

      //  websocket notification
      if (result.success) {
        websocketService.notifyJobComplete(job.id!, result);
      } else {
        websocketService.notifyJobFailed(
          job.id!,
          result.error || "Unknown error"
        );
      }
    } catch (error: any) {
      websocketService.notifyJobFailed(job.id!, error.message);
      console.error("Error saving job status to database", error);
    }

    // Handle the result
    await playwrightService.handleQueueResult(url, job.id!, result);
    console.log("hit3");
    return result;
  },
  {
    connection: {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || "6379"),
    },
  }
);
