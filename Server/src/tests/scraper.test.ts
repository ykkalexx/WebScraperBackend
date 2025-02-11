import { Request, Response } from 'express';
import { ScraperControllers } from '../controllers/ScraperControllers';
import { scrapeQueue } from '../services/QueueService';
import { PlaywrightService } from '../services/PlaywrightService';
import pool from '../config/database';

jest.mock('../services/QueueService');
jest.mock('../services/PlaywrightService');
jest.mock('../config/database', () => ({
  __esModule: true,
  default: {
    connect: jest.fn().mockResolvedValue({}),
    query: jest.fn(),
  },
}));

describe('ScraperControllers', () => {
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

  describe('scrapeWebsite', () => {
    it('should return 400 if required fields are missing', async () => {
      req = { body: {} };
      await scraperControllers.scrapeWebsite(req as Request, res as Response);
      expect(status).toHaveBeenCalledWith(400);
      expect(json).toHaveBeenCalledWith({
        error: 'URL and search terms are required',
      });
    });

    it('should add job to queue and return 202 with jobId', async () => {
      req = {
        body: {
          url: 'https://example.com',
          searchTerms: {
            title: 'iPhone',
            price: '999',
            description: 'Pro Max',
          },
          options: {
            maxPages: 1,
            waitTime: 1000,
          },
        },
      };
      const mockJob = { id: 'single-123456789' };
      (scrapeQueue.add as jest.Mock).mockResolvedValue(mockJob);

      await scraperControllers.scrapeWebsite(req as Request, res as Response);
      expect(scrapeQueue.add).toHaveBeenCalledWith('scrape', {
        url: 'https://example.com',
        searchTerms: {
          title: 'iPhone',
          price: '999',
          description: 'Pro Max',
        },
        options: {
          maxPages: 1,
          waitTime: 1000,
        },
      });
      expect(status).toHaveBeenCalledWith(202);
      expect(json).toHaveBeenCalledWith({
        message: 'Scraping job queued',
        jobId: 'single-123456789',
      });
    });
  });

  describe('scrapeBulkWebsites', () => {
    it('should return 400 if required fields are missing', async () => {
      req = { body: {} };
      await scraperControllers.scrapeBulkWebsites(
        req as Request,
        res as Response
      );
      expect(status).toHaveBeenCalledWith(400);
      expect(json).toHaveBeenCalledWith({
        error: 'URLs and search terms are required',
      });
    });

    it('should add multiple jobs to queue and return jobIds', async () => {
      req = {
        body: {
          urls: ['https://example.com/1', 'https://example.com/2'],
          searchTerms: {
            title: 'iPhone',
            price: '999',
            description: 'Pro Max',
          },
          options: {
            maxPages: 1,
            waitTime: 1000,
          },
        },
      };
      (scrapeQueue.add as jest.Mock).mockImplementation((_, data) =>
        Promise.resolve({
          id: `bulk-${Date.now()}-${data.url.split('/').pop()}`,
        })
      );

      await scraperControllers.scrapeBulkWebsites(
        req as Request,
        res as Response
      );
      expect(scrapeQueue.add).toHaveBeenCalledTimes(2);
      expect(status).toHaveBeenCalledWith(202);
      expect(json).toHaveBeenCalledWith({
        message: 'Bulk scraping jobs queued',
        jobIds: expect.arrayContaining([
          expect.stringMatching(/^bulk-\d+-[12]$/),
        ]),
      });
    });
  });

  describe('getResults', () => {
    it('should return 400 if url is missing', async () => {
      req = { body: {} };
      await scraperControllers.getResults(req as Request, res as Response);
      expect(status).toHaveBeenCalledWith(400);
      expect(json).toHaveBeenCalledWith({
        error: 'The request is missing something',
      });
    });

    it('should query database and return results', async () => {
      req = { body: { url: 'https://example.com' } };
      const mockResult = {
        rows: [
          {
            id: 1,
            source_url: 'https://example.com',
            title: 'iPhone 14 Pro',
            price: '$999',
            description: 'Latest model',
            scraped_at: new Date().toISOString(),
          },
        ],
      };
      (pool.query as jest.Mock).mockResolvedValue(mockResult);

      await scraperControllers.getResults(req as Request, res as Response);
      expect(pool.query).toHaveBeenCalledWith(
        `SELECT * FROM scraped_data WHERE source_url = $1`,
        ['https://example.com']
      );
      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalledWith({ result: mockResult });
    });
  });

  describe('fetchStatus', () => {
    it('should return 400 if jobId is missing', async () => {
      req = { query: {} };
      await scraperControllers.fetchStatus(req as Request, res as Response);
      expect(status).toHaveBeenCalledWith(400);
      expect(json).toHaveBeenCalledWith({ error: 'Job ID is required' });
    });

    it('should return status from database if available', async () => {
      req = { query: { jobId: 'single-123456789' } };
      const mockDbResult = {
        rows: [
          {
            status: 'completed',
            result: {
              data: [
                {
                  title: 'iPhone 14 Pro',
                  price: '$999',
                  description: 'Latest model',
                },
              ],
              totalPages: 1,
              success: true,
            },
          },
        ],
      };
      (pool.query as jest.Mock).mockResolvedValue(mockDbResult);

      await scraperControllers.fetchStatus(req as Request, res as Response);
      expect(pool.query).toHaveBeenCalledWith(
        `SELECT status, result FROM scraping_jobs WHERE job_id = $1`,
        ['single-123456789']
      );
      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalledWith(mockDbResult.rows[0]);
    });
  });
});
