import { useEffect, useState } from "react";
import { ScraperWebsite } from "./components/ScraperWebsite";
import { StartScraperModel } from "./components/StartScraperModel";
import { fetchAllDataToday } from "./service/api";
import { ScraperData } from "./types";

function App() {
  const [data, setData] = useState<ScraperData[]>([]);
  useEffect(() => {
    fetchAllDataToday().then((data) => setData(data));
  }, []);

  console.log(data);

  if (!data)
    return (
      <div className="font-light">No Website has been scraped today..</div>
    );

  fetchAllDataToday().then((data) => console.log(data));
  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-5">
      <h1 className="mt-10 mb-10 text-3xl font-semibold text-gray-00">
        Website Scrapper
      </h1>
      <StartScraperModel />
      <div className="w-[1400px] h-[800px] gap-5 overflow-x-scroll">
        <ScraperWebsite />
      </div>
    </div>
  );
}

export default App;
