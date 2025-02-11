import { Button } from "@mantine/core";
import { ScrapedProduct } from "../types";

interface GroupedData {
  [key: string]: ScrapedProduct[];
}

interface ScraperWebsiteProps {
  data: ScrapedProduct[];
}

export const ScraperWebsite: React.FC<ScraperWebsiteProps> = ({ data }) => {
  // Group data by source_url with improved URL parsing
  const groupedData: GroupedData = data.reduce((acc, item) => {
    let hostname = "";

    // Sanitize URL
    try {
      let urlString = item.source_url.trim();

      // Handle common URL formats
      if (!urlString.match(/^https?:\/\//i)) {
        urlString = `https://${urlString}`;
      }

      // Try to extract hostname
      try {
        const url = new URL(urlString);
        hostname = url.hostname.replace(/^www\./, "");
      } catch {
        // If URL parsing fails, try regex extraction
        const domainMatch = urlString.match(/(?:www\.)?([^/]+)/i);
        hostname = domainMatch
          ? domainMatch[1].replace(/^www\./, "")
          : "unknown";
      }
    } catch (error) {
      console.warn(`Failed to parse URL: ${item.source_url}`, error);
      hostname = "unknown";
    }

    // Group by hostname
    if (!acc[hostname]) {
      acc[hostname] = [];
    }
    acc[hostname].push(item);
    return acc;
  }, {} as GroupedData);

  return (
    <div className="space-y-6">
      {Object.entries(groupedData).map(([website, products]) => (
        <div key={website} className="p-6 bg-white shadow-sm rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">{website}</h2>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {products.length} results found
              </span>
              <Button
                color="blue"
                variant="light"
                onClick={() => console.log(`Download data for ${website}`)}
              >
                Download Results
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="p-4 transition-colors rounded-lg bg-gray-50 hover:bg-gray-100"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <h3 className="font-medium text-gray-900">
                      {product.title}
                    </h3>
                    {product.price && (
                      <p className="text-gray-600">{product.price}</p>
                    )}
                    {product.description && (
                      <p className="text-sm text-gray-500">
                        {product.description}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(product.scraped_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
