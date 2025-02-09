import { ScraperWebsite } from "./components/ScraperWebsite";
import { StartScraperModel } from "./components/StartScraperModel";

function App() {
  return (
    <div className="flex flex-col gap-5  w-full h-full justify-center items-center">
      <h1 className="text-3xl font-semibold mb-10 mt-10 text-gray-00">
        Website Scrapper
      </h1>
      <StartScraperModel />
      <ScraperWebsite />
    </div>
  );
}

export default App;
