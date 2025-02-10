export interface ScrapedProduct {
  id: number;
  source_url: string;
  title: string | null;
  price: string | null;
  description: string | null;
  results: string;
  scraped_at: string;
}

export interface ScraperData {
  title: string;
  website: string;
  status: "In Progress" | "Completed" | "Failed";
}
