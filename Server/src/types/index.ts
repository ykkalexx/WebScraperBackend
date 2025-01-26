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
