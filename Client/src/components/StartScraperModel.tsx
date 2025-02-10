import {
  Button,
  Modal,
  TextInput,
  NumberInput,
  Stack,
  Group,
} from "@mantine/core";
import { useState } from "react";
import { ScrapedProduct } from "../types";

interface StartScraperModelProps {
  onScrapeComplete: (data: ScrapedProduct[]) => void;
  setLoading: (loading: boolean) => void;
}

export const StartScraperModel: React.FC<StartScraperModelProps> = ({
  onScrapeComplete,
  setLoading,
}) => {
  const [opened, setOpened] = useState(false);
  const [urls, setUrls] = useState<string[]>([""]);
  const [formData, setFormData] = useState({
    searchTerms: {
      title: "",
      price: "",
      description: "",
    },
    options: {
      maxPages: 1,
      waitTime: 1000,
    },
  });

  const handleAddUrl = () => {
    setUrls([...urls, ""]);
  };

  const handleUrlChange = (index: number, value: string) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
  };

  const handleRemoveUrl = (index: number) => {
    if (urls.length > 1) {
      const newUrls = urls.filter((_, i) => i !== index);
      setUrls(newUrls);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const endpoint =
        urls.length > 1
          ? "http://localhost:3000/api/scrape/bulk"
          : "http://localhost:3000/api/scrape/single";

      const body =
        urls.length > 1
          ? {
              urls: urls.filter((url) => url.trim() !== ""),
              searchTerms: formData.searchTerms,
              options: formData.options,
            }
          : {
              url: urls[0],
              searchTerms: formData.searchTerms,
              options: formData.options,
            };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Scraping job started:", data);

        // Poll for results
        const resultResponse = await fetch(`http://localhost:3000/api/data`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: urls[0] }),
        });

        if (resultResponse.ok) {
          const resultData = await resultResponse.json();
          if (resultData.result?.rows) {
            onScrapeComplete(resultData.result.rows);
          }
        }

        setOpened(false);
      } else {
        console.error("Failed to start scraping job");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-light">
      <Button onClick={() => setOpened(true)} color="blue">
        Add Scraper
      </Button>

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title="Start New Scraping Job"
        size="lg"
      >
        <Stack spacing="md">
          {urls.map((url, index) => (
            <Group key={index} grow>
              <TextInput
                label={index === 0 ? "URL to Scrape" : "Additional URL"}
                placeholder="https://www.example.com"
                value={url}
                onChange={(e) => handleUrlChange(index, e.currentTarget.value)}
                style={{ flex: 1 }}
              />
              {urls.length > 1 && (
                <Button
                  color="red"
                  variant="subtle"
                  onClick={() => handleRemoveUrl(index)}
                  style={{ marginTop: 24 }}
                >
                  Remove
                </Button>
              )}
            </Group>
          ))}

          <Button
            variant="outline"
            color="blue"
            onClick={handleAddUrl}
            fullWidth
          >
            Add More URLs
          </Button>

          <TextInput
            label="Search Title"
            placeholder="e.g., iPhone"
            value={formData.searchTerms.title}
            onChange={(e) =>
              setFormData({
                ...formData,
                searchTerms: {
                  ...formData.searchTerms,
                  title: e.currentTarget.value,
                },
              })
            }
          />

          <TextInput
            label="Search Price (optional)"
            placeholder="e.g., 999"
            value={formData.searchTerms.price}
            onChange={(e) =>
              setFormData({
                ...formData,
                searchTerms: {
                  ...formData.searchTerms,
                  price: e.currentTarget.value,
                },
              })
            }
          />

          <TextInput
            label="Search Description (optional)"
            placeholder="e.g., Pro Max"
            value={formData.searchTerms.description}
            onChange={(e) =>
              setFormData({
                ...formData,
                searchTerms: {
                  ...formData.searchTerms,
                  description: e.currentTarget.value,
                },
              })
            }
          />

          <p className="text-sm text-gray-500">Advanced Settings</p>

          <NumberInput
            label="Max Pages (Optional)"
            value={formData.options.maxPages}
            min={1}
            max={10}
            onChange={(value) =>
              setFormData({
                ...formData,
                options: { ...formData.options, maxPages: value || 1 },
              })
            }
          />

          <NumberInput
            label="Wait Time (ms) (Optional)"
            value={formData.options.waitTime}
            min={500}
            max={5000}
            step={500}
            onChange={(value) =>
              setFormData({
                ...formData,
                options: { ...formData.options, waitTime: value || 1000 },
              })
            }
          />

          <Button
            onClick={handleSubmit}
            fullWidth
            color="blue"
            disabled={urls.every((url) => url.trim() === "")}
          >
            Start Scraping {urls.length > 1 ? `(${urls.length} URLs)` : ""}
          </Button>
        </Stack>
      </Modal>
    </div>
  );
};
