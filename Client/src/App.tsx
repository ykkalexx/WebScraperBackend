import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { ScraperWebsite } from "./components/ScraperWebsite";
import { StartScraperModel } from "./components/StartScraperModel";
import { ScrapedProduct } from "./types";

function App() {
  const [currentJobData, setCurrentJobData] = useState<ScrapedProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Create a single socket connection
    socketRef.current = io("http://localhost:3000");

    socketRef.current.on("connect", () => {
      console.log("Connected to WebSocket server");
    });

    socketRef.current.on("jobComplete", (data) => {
      console.log("Job completed:", data);
      if (data.result?.data) {
        setCurrentJobData(
          data.result.data.filter((item: ScrapedProduct) => item.title !== null)
        );
      }
      setLoading(false);
    });

    socketRef.current.on("jobFailed", (error) => {
      console.error("Job failed:", error);
      setLoading(false);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const handleNewScrapeJob = (jobData: ScrapedProduct[], jobId: string) => {
    // Set initial data
    setCurrentJobData(jobData.filter((item) => item.title !== null));

    // Subscribe to job updates using existing socket connection
    if (socketRef.current) {
      socketRef.current.emit("subscribe", jobId);
    }
  };

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

          {loading ? (
            <div className="py-12 text-center text-gray-500">
              Scraping in progress...
            </div>
          ) : currentJobData.length > 0 ? (
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
