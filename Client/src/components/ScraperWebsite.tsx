import { Button } from "@mantine/core";

interface ScraperWebsiteProps {
  product: string;
  website: string;
  status: "In Progress" | "Completed" | "Failed";
}

export const ScraperWebsite: React.FC<ScraperWebsiteProps> = () => {
  return (
    <div className="font-light bg-white rounded-xl p-4 text-sm">
      <div className="flex flex-row items-center justify-between gap-40">
        <h1>Search Product</h1>
        <h2>Website Name</h2>
        <h3 className="bg-yellow-200 text-yellow-700 px-3 rounded-xl">
          In Progress
        </h3>
        <h4>4</h4>
        <Button color="blue" variant="filled">
          Download
        </Button>
      </div>
    </div>
  );
};
