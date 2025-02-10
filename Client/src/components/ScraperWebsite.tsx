import { Button } from "@mantine/core";

interface ScraperWebsiteProps {
  product: string;
  website: string;
  status: "In Progress" | "Completed" | "Failed";
}

export const ScraperWebsite: React.FC<ScraperWebsiteProps> = () => {
  return (
    <div className="p-4 text-sm font-light bg-white rounded-xl">
      <div className="flex flex-row items-center justify-between gap-40">
        <h1>Search Product</h1>
        <h2>Website Name</h2>
        <h3 className="px-3 text-yellow-700 bg-yellow-200 rounded-xl">
          In Progress
        </h3>
        <Button color="blue" variant="filled">
          Download
        </Button>
      </div>
    </div>
  );
};
