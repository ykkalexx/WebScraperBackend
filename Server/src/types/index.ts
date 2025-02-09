export interface ScrapingOptions {
  maxPages?: number;
  waitTime?: number;
  retryAttempts?: number;
  concurrent?: boolean;
  nextPageSelector?: string;
  userAgent?: string;
}

export interface ScrapedResult {
  data: any[];
  totalPages: number;
  success: boolean;
  error?: string;
}

export interface Proxy {
  ip: string;
  port: string;
  country?: string;
  anonymity?: string;
  https?: boolean;
}

export interface AutoScrapeResult {
  selector: string;
  confidence: number;
  value: string | null;
}
