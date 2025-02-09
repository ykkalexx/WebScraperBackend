import { chromium, Browser, Page } from "playwright";
import { setTimeout } from "timers/promises";
import { ScrapingOptions, ScrapedResult, AutoScrapeResult } from "../types";
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
    searchTerms: Record<string, string>
  ): Promise<Record<string, string | null>[]> {
    // Changed return type to array
    const data: Record<string, any[]> = {
      titles: [],
      prices: [],
      descriptions: [],
    };

    try {
      const productContainers = await page.$$(
        '.item-container, .item-cell, [class*="item-"]'
      );

      for (const container of productContainers) {
        try {
          const title = await container.$eval(
            '.item-title, [class*="title"]',
            (el) => el.textContent?.trim()
          );
          const price = await container.$eval(
            '.price-current, [class*="price"]',
            (el) => el.textContent?.trim()
          );
          const description = await container.$eval(
            '.item-features, [class*="description"]',
            (el) => el.textContent?.trim()
          );

          if (title?.toLowerCase().includes(searchTerms.title.toLowerCase())) {
            data.titles.push(title);
            data.prices.push(price || null);
            data.descriptions.push(description || null);
          }
        } catch (err) {
          continue;
        }
      }

      // Return all matches as array of objects
      return data.titles.map((title, index) => ({
        title,
        price: data.prices[index],
        description: data.descriptions[index],
      }));
    } catch (err) {
      console.error("Error scraping page data:", err);
      return []; // Return empty array on error
    }
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

  // This function is used to calculate the similarity between two strings
  private calculateSimilarity(str1: string, str2: string): number {
    // I used an implementation of Levenshtein distance
    const track = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i += 1) {
      track[0][i] = i;
    }
    for (let j = 0; j <= str2.length; j += 1) {
      track[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j += 1) {
      for (let i = 1; i <= str1.length; i += 1) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        track[j][i] = Math.min(
          track[j][i - 1] + 1,
          track[j - 1][i] + 1,
          track[j - 1][i - 1] + indicator
        );
      }
    }

    return (
      1 - track[str2.length][str1.length] / Math.max(str1.length, str2.length)
    );
  }

  // This function is used to find the best selector for a given text
  // Rather than the user having to send the tags themselves
  private async findBestSelector(
    page: Page,
    searchText: string,
    type: "title" | "price" | "description" = "title"
  ): Promise<AutoScrapeResult> {
    const selectors = {
      // Newegg specific selectors
      title: [
        ".item-title",
        ".item-info a",
        ".item-container a",
        '[class*="item-title"]',
        '[title*="iPhone"]',
        '[aria-label*="iPhone"]',
        'a[href*="iPhone"]',
      ],
      price: [
        ".price-current",
        ".item-price",
        ".price-main-value",
        '[class*="price-current"]',
        '[class*="price-main"]',
        '[class*="item-price"]',
        "[data-price]",
        '[class*="price"]',
      ],
      description: [
        ".item-info",
        ".item-features",
        ".item-desc",
        ".item-description",
        '[class*="description"]',
        '[class*="features"]',
        '[class*="specs"]',
      ],
    };

    const possibleSelectors = [...selectors[type]];
    const results: AutoScrapeResult[] = [];
    console.log(`Searching for ${type}: "${searchText}"`);

    for (const baseSelector of possibleSelectors) {
      try {
        const elements = await page.$$(baseSelector);

        for (const element of elements) {
          const textContent =
            (await element.innerText()) || (await element.textContent());
          if (textContent) {
            const cleanText = textContent.trim();

            // Different matching strategies for different types
            let similarity = 0;
            if (type === "title") {
              similarity = cleanText
                .toLowerCase()
                .includes(searchText.toLowerCase())
                ? 0.8
                : 0;
            } else if (type === "price") {
              similarity = cleanText.match(/\$?\d+(\.\d{2})?/) ? 0.9 : 0;
            } else {
              similarity = this.calculateSimilarity(
                cleanText.toLowerCase(),
                searchText.toLowerCase()
              );
            }

            if (similarity > 0.3) {
              console.log(
                `Match found for ${type}: "${cleanText}" (similarity: ${similarity})`
              );
              results.push({
                selector: baseSelector,
                confidence: similarity,
                value: cleanText,
              });
            }
          }
        }
      } catch (error) {
        console.error(`Error with selector ${baseSelector}:`, error);
        continue;
      }
    }

    results.sort((a, b) => b.confidence - a.confidence);
    return results[0] || { selector: "", confidence: 0, value: null };
  }

  // The function where the magic happens meow :3
  public async launchScrapper(
    url: string,
    searchTerms: Record<string, string>,
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
          const pageData = await this.scrapePageData(page, searchTerms);
          results.push(...pageData); // Spread the array of results

          await setTimeout(mergedOptions.waitTime);

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
    searchTerms: Record<string, string>,
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
        const result = await this.launchScrapper(url, searchTerms, options);

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

  // This function is used to fetch the status of a job
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

  // This function is used to analyze the SEO of a website
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

  public async handleQueueResult(
    url: string,
    jobId: string,
    result: ScrapedResult
  ) {
    if (result.success && result.data.length > 0) {
      try {
        // Save all found products
        const products = result.data.map((item) => ({
          source_url: url,
          title: item.title,
          price: item.price,
          description: item.description,
          results: JSON.stringify(result.data),
        }));

        for (const product of products) {
          await pool.query(
            `INSERT INTO scraped_data 
             (source_url, title, price, description, results) 
             VALUES ($1, $2, $3, $4, $5)`,
            [
              product.source_url,
              product.title,
              product.price,
              product.description,
              product.results,
            ]
          );
        }

        console.log(`Saved ${products.length} products to database`);
      } catch (error: any) {
        console.error("Error saving to database:", error);
      }
    }

    this.scrapingStatus[jobId] = {
      status: result.success ? "completed" : "failed",
      result,
    };
  }
}
