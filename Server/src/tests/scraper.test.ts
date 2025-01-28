import { Request, Response } from "express";
import { ScraperControllers } from "../controllers/ScraperControllers";
import { scrapeQueue } from "../services/QueueService";
import { PlaywrightService } from "../services/PlaywrightService";
import pool from "../config/database";

jest.mock("../services/QueueService");
jest.mock("../services/PlaywrightService");
jest.mock("../config/database");

describe("ScraperControllers", () => {
  let scraperControllers: ScraperControllers;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let status: jest.Mock;
  let json: jest.Mock;

  beforeEach(() => {
    scraperControllers = new ScraperControllers();
    status = jest.fn().mockReturnThis();
    json = jest.fn();
    res = { status, json };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("scrapeWebsite", () => {
    it("should return 400 if required fields are missing", async () => {
      req = { body: {} };
      await scraperControllers.scrapeWebsite(req as Request, res as Response);
      expect(status).toHaveBeenCalledWith(400);
      expect(json).toHaveBeenCalledWith({
        error: "The request is missing something",
      });
    });

    it("should add job to queue and return 202 with jobId", async () => {
      req = {
        body: {
          url: "https://example.com",
          item: "product",
          selectors: { title: "h1" },
        },
      };
      const mockJob = { id: "job-123" };
      (scrapeQueue.add as jest.Mock).mockResolvedValue(mockJob);

      await scraperControllers.scrapeWebsite(req as Request, res as Response);
      expect(scrapeQueue.add).toHaveBeenCalledWith("scrape", {
        url: "https://example.com",
        item: "product",
        selectors: { title: "h1" },
        options: undefined,
      });
      expect(status).toHaveBeenCalledWith(202);
      expect(json).toHaveBeenCalledWith({
        message: "Scraping job queued",
        jobId: "job-123",
      });
    });
  });

  describe("getResults", () => {
    it("should return 400 if url is missing", async () => {
      req = { query: {} };
      await scraperControllers.getResults(req as Request, res as Response);
      expect(status).toHaveBeenCalledWith(400);
      expect(json).toHaveBeenCalledWith({
        error: "The request is missing something",
      });
    });

    it("should query database and return results", async () => {
      req = { query: { url: "https://example.com" } };
      const mockResult = { rows: [{ id: 1, data: "test" }] };
      (pool.query as jest.Mock).mockResolvedValue(mockResult);

      await scraperControllers.getResults(req as Request, res as Response);
      expect(pool.query).toHaveBeenCalledWith(
        `SELECT * FROM scraped_data WHERE source_url = $1`,
        ["https://example.com"]
      );
      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalledWith({ result: mockResult });
    });
  });

  describe("fetchStatus", () => {
    it("should return 400 if jobId is missing", async () => {
      req = { query: {} };
      await scraperControllers.fetchStatus(req as Request, res as Response);
      expect(status).toHaveBeenCalledWith(400);
      expect(json).toHaveBeenCalledWith({ error: "Job ID is required" });
    });

    it("should return status from database if available", async () => {
      req = { query: { jobId: "job-123" } };
      const mockDbResult = { rows: [{ status: "completed", result: {} }] };
      (pool.query as jest.Mock).mockResolvedValue(mockDbResult);

      await scraperControllers.fetchStatus(req as Request, res as Response);
      expect(pool.query).toHaveBeenCalledWith(
        `SELECT status, result FROM scraping_jobs WHERE job_id = $1`,
        ["job-123"]
      );
      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalledWith(mockDbResult.rows[0]);
    });

    it("should return status from playwright service if not in database", async () => {
      req = { query: { jobId: "job-123" } };
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });
      const mockStatus = { status: "pending" };
      (PlaywrightService.prototype.fetchStatus as jest.Mock).mockResolvedValue(
        mockStatus
      );

      await scraperControllers.fetchStatus(req as Request, res as Response);
      expect(PlaywrightService.prototype.fetchStatus).toHaveBeenCalledWith(
        "job-123"
      );
      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalledWith(mockStatus);
    });
  });

  describe("scrapeBulkWebsites", () => {
    it("should return 400 if required fields are missing", async () => {
      req = { body: {} };
      await scraperControllers.scrapeBulkWebsites(
        req as Request,
        res as Response
      );
      expect(status).toHaveBeenCalledWith(400);
      expect(json).toHaveBeenCalledWith({
        error: "The request is missing something",
      });
    });

    it("should add multiple jobs to queue and return jobIds", async () => {
      req = {
        body: {
          urls: ["https://example.com/1", "https://example.com/2"],
          item: "product",
          selectors: { title: "h1" },
        },
      };
      const mockJobs = [{ id: "job-1" }, { id: "job-2" }];
      (scrapeQueue.add as jest.Mock).mockImplementation((_, data) =>
        Promise.resolve({ id: `job-${data.url.split("/").pop()}` })
      );

      await scraperControllers.scrapeBulkWebsites(
        req as Request,
        res as Response
      );
      expect(scrapeQueue.add).toHaveBeenCalledTimes(2);
      expect(status).toHaveBeenCalledWith(202);
      expect(json).toHaveBeenCalledWith({
        message: "Bulk scraping jobs queued",
        jobIds: ["job-1", "job-2"],
      });
    });
  });

  describe("scrapeWebsiteSEO", () => {
    it("should return 400 if url is missing", async () => {
      req = { body: {} };
      await scraperControllers.scrapeWebsiteSEO(
        req as Request,
        res as Response
      );
      expect(status).toHaveBeenCalledWith(400);
      expect(json).toHaveBeenCalledWith({ error: "URL is missing" });
    });

    it("should return SEO data from playwright service", async () => {
      req = { body: { url: "https://example.com" } };
      const mockSeoData = { title: "Test Page" };
      (PlaywrightService.prototype.analyzeSeo as jest.Mock).mockResolvedValue(
        mockSeoData
      );

      await scraperControllers.scrapeWebsiteSEO(
        req as Request,
        res as Response
      );
      expect(PlaywrightService.prototype.analyzeSeo).toHaveBeenCalledWith(
        "https://example.com"
      );
      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalledWith(mockSeoData);
    });
  });
});
