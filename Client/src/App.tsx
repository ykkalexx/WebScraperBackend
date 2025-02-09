import { ScraperWebsite } from "./components/ScraperWebsite";

function App() {
  return (
    <div className="flex flex-col  w-full h-full justify-center items-center">
      <h1 className="text-3xl font-semibold mb-10 mt-10">Website Scrapper</h1>
      <ScraperWebsite />
    </div>
  );
}

export default App;
