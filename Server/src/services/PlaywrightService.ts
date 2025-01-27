import { chromium, Browser, Page } from "playwright";
import { setTimeout } from "timers/promises";
import { ScrapingOptions, ScrapedResult } from "../types";
import redisClient from "../config/redis";
import pool from "../config/database";

export class PlaywrightService {
  private browser: Browser | null = null;
  private readonly defaultOptions: ScrapingOptions = {
    maxPages: 1,
    waitTime: 1000,
    retryAttempts: 3,
    concurrent: false,
    nextPageSelector: 'a[rel="next"]',
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
  };

  private scrapingStatus: Record<
    string,
    {
      status: "pending" | "completed" | "failed";
      result?: ScrapedResult | ScrapedResult[];
    }
  > = {};

  // Function used to initialize the playwright browser
  private async initBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
    }
    return this.browser;
  }

  // This is the function that is called per page to scrape the data
  private async scrapePageData(
    page: Page,
    selectors: Record<string, string>
  ): Promise<any> {
    const data: Record<string, string | null> = {};

    for (const [key, selector] of Object.entries(selectors)) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        data[key] = await page.textContent(selector);
      } catch (err: any) {
        data[key] = null;
      }
    }
    return data;
  }

  // This function is used so that if something fails, it has a couple of retries before it gives up
  private async retryOperation<T>(
    operation: () => Promise<T>,
    retryAttempts: number
  ): Promise<T> {
    let lastError;
    for (let attempt = 0; attempt < retryAttempts; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        await setTimeout(1000 * Math.pow(2, attempt));
      }
    }
    throw lastError;
  }

  // The function where the magic happens meow :3
  public async launchScrapper(
    url: string,
    item: string,
    selectors: Record<string, string>,
    options: ScrapingOptions = {}
  ): Promise<ScrapedResult> {
    const mergedOptions = { ...this.defaultOptions, ...options };
    const results: any[] = [];
    const jobId = `single-${Date.now()}`;
    this.scrapingStatus[jobId] = { status: "pending" };

    try {
      const browser = await this.initBrowser();
      const context = await browser.newContext({
        userAgent: mergedOptions.userAgent,
      });

      const page = await context.newPage();
      await page.goto(url);

      let currentPage = 1;
      let hasNextPage = true;

      while (hasNextPage && currentPage <= mergedOptions.maxPages!) {
        await this.retryOperation(async () => {
          const pageData = await this.scrapePageData(page, selectors);
          results.push(pageData);

          // wait before next action so the pages wont throw a tantrum
          await setTimeout(mergedOptions.waitTime);

          // Check for next page
          hasNextPage =
            (await page.$(mergedOptions.nextPageSelector!)) !== null;
          if (hasNextPage && currentPage < mergedOptions.maxPages!) {
            await page.click(mergedOptions.nextPageSelector!);
            await page.waitForLoadState("networkidle");
          }
        }, mergedOptions.retryAttempts!);

        currentPage++;
      }

      this.scrapingStatus[jobId] = {
        status: "completed",
        result: {
          data: results,
          totalPages: currentPage - 1,
          success: true,
        },
      };

      await context.close();

      return {
        data: results,
        totalPages: currentPage - 1,
        success: true,
      };
    } catch (error: any) {
      console.error("Scraping error:", error);
      this.scrapingStatus[jobId] = {
        status: "failed",
        result: {
          data: [],
          totalPages: 0,
          success: false,
          error: error.message,
        },
      };
      return {
        data: [],
        totalPages: 0,
        success: false,
        error: error.message,
      };
    } finally {
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
    }
  }

  // Function will be used for bulk scraping and concurrency
  public async launchBulkScrapper(
    urls: string[],
    item: string,
    selectors: Record<string, string>,
    options: ScrapingOptions = {}
  ): Promise<ScrapedResult[]> {
    const mergedOptions = { ...this.defaultOptions, ...options };
    const jobId = `bulk-${Date.now()}`; // Unique job ID for bulk scraping
    this.scrapingStatus[jobId] = { status: "pending" };

    //using redis for cache for all urls first
    const cachedResults: ScrapedResult[] = [];
    const uncachedUrls: string[] = [];

    for (const url of urls) {
      const cachedData = await redisClient.get(url);
      if (cachedData) {
        cachedResults.push(JSON.parse(cachedData));
      } else {
        uncachedUrls.push(url);
      }
    }

    // Scrape uncached URLs in parallel
    const scrapingPromises = uncachedUrls.map(async (url) => {
      try {
        const result = await this.launchScrapper(url, item, selectors, options);

        // Cache the result in Redis (which expires in 1 hour  after 1 hour)
        if (result.success) {
          await redisClient.set(url, JSON.stringify(result), { EX: 3600 });
        }

        return result;
      } catch (error: any) {
        console.error(`Scraping error for ${url}:`, error);
        return {
          data: [],
          totalPages: 0,
          success: false,
          error: error.message,
        };
      }
    });

    const scrapedResults = await Promise.all(scrapingPromises);

    // Update status after all URLs are processed
    this.scrapingStatus[jobId] = {
      status: "completed",
      result: [...cachedResults, ...scrapedResults],
    };

    // Combine cached and scraped results
    return [...cachedResults, ...scrapedResults];
  }

  public async fetchStatus(jobId: string): Promise<{
    status: "pending" | "completed" | "failed";
    result?: ScrapedResult | ScrapedResult[];
  }> {
    const jobStatus = this.scrapingStatus[jobId];
    if (!jobStatus) {
      // Check database if not found in memory
      const dbResult = await pool.query(
        `SELECT status, result FROM scraping_jobs WHERE job_id = $1`,
        [jobId]
      );

      if (dbResult.rows.length > 0) {
        return {
          status: dbResult.rows[0].status,
          result: dbResult.rows[0].result,
        };
      }
      throw new Error("Job ID not found");
    }
    return jobStatus;
  }

  public async analyzeSeo(url: string): Promise<any> {
    const browser = await this.initBrowser();
    const page = await browser.newPage();
    await page.goto(url);

    const seoData = await page.evaluate(() => {
      const getMeta = (name: string): string | undefined => {
        return (
          (document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement)
            ?.content ||
          (
            document.querySelector(
              `meta[property="og:${name}"]`
            ) as HTMLMetaElement
          )?.content
        );
      };

      return {
        title: document.title,
        description: getMeta("description"),
        keywords: getMeta("keywords"),
        h1: Array.from(document.querySelectorAll("h1")).map(
          (h) => h.textContent
        ),
        h2: Array.from(document.querySelectorAll("h2")).map(
          (h) => h.textContent
        ),
        images: Array.from(document.querySelectorAll("img")).map((img) => ({
          src: img.src,
          alt: img.alt,
        })),
        links: Array.from(document.querySelectorAll("a")).map((a) => ({
          href: a.href,
          text: a.textContent,
        })),
      };
    });

    await browser.close();
    return seoData;
  }
}
