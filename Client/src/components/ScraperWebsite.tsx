import { Button } from "@mantine/core";
import { ScrapedProduct } from "../types";

interface GroupedData {
  [key: string]: ScrapedProduct[];
}

interface ScraperWebsiteProps {
  data: ScrapedProduct[];
}

export const ScraperWebsite: React.FC<ScraperWebsiteProps> = ({ data }) => {
  // Group data by source_url
  const groupedData: GroupedData = data.reduce((acc, item) => {
    const url = new URL(item.source_url);
    const hostname = url.hostname;

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
            <Button
              color="blue"
              variant="light"
              onClick={() => console.log(`Download data for ${website}`)}
            >
              Download Results
            </Button>
          </div>

          <div className="space-y-4">
            {products.map(
              (product) =>
                product.title && (
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
                )
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
