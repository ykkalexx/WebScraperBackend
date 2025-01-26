import { chromium, Browser, Page } from "playwright";
import { setTimeout } from "timers/promises";
import { ScrapingOptions, ScrapedResult } from "../types";
import redisClient from "../config/redis";

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

  // This is the function that goes through the page and scrapes the data
  //prettier-ignore
  private async scrapePageData(page: Page,selectors: Record<string, string>): Promise<any> {
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
  //prettier-ignore
  private async retryOperation<T>(operation: () => Promise<T>,retryAttempts: number): Promise<T> {
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
  //prettier-ignore
  public async launchScrapper(url: string, item: string, selectors: Record<string, string>, options: ScrapingOptions = {}): Promise<ScrapedResult> {
    const mergedOptions = { ...this.defaultOptions, ...options };
    const results: any[] = [];

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
          const pageData = this.scrapePageData(page, selectors);
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

      await context.close();

      return {
        data: results,
        totalPages: currentPage - 1,
        success: true,
      };
    } catch (error: any) {
      console.error("Scraping error:", error);
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
  //prettier-ignore
  public async launchBulkScrapper(urls: string[],item: string,selectors: Record<string, string>,options: ScrapingOptions = {}): Promise<ScrapedResult[]> {
    const mergedOptions = { ...this.defaultOptions, ...options };

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

        // Cache the result in Redis (expire after 1 hour)
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

    // Combine cached and scraped results
    return [...cachedResults, ...scrapedResults];
  }
}
