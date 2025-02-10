import { useState } from "react";
import { ScraperWebsite } from "./components/ScraperWebsite";
import { StartScraperModel } from "./components/StartScraperModel";
import { ScrapedProduct } from "./types";

function App() {
  const [currentJobData, setCurrentJobData] = useState<ScrapedProduct[]>([]);
  const [loading, setLoading] = useState(false);

  const handleNewScrapeJob = (jobData: ScrapedProduct[]) => {
    setCurrentJobData(jobData);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Loading results...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="container px-4 py-8 mx-auto">
        <div className="flex flex-col items-center justify-center space-y-8">
          <div className="space-y-3 text-center">
            <h1 className="text-4xl font-bold text-transparent md:text-5xl bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text">
              Website Scraper
            </h1>
            <p className="text-lg text-gray-600">
              Extract data from any website with ease
            </p>
          </div>

          <StartScraperModel
            onScrapeComplete={handleNewScrapeJob}
            setLoading={setLoading}
          />

          {currentJobData.length > 0 ? (
            <div className="w-full max-w-6xl">
              <ScraperWebsite data={currentJobData} />
            </div>
          ) : (
            <div className="py-12 text-center text-gray-500">
              Start a new scraping job to see results here
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
