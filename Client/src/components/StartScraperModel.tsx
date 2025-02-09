import { Button, Modal, TextInput, NumberInput, Stack } from "@mantine/core";
import { useState } from "react";

export const StartScraperModel = () => {
  const [opened, setOpened] = useState(false);
  const [formData, setFormData] = useState({
    url: "",
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

  const handleSubmit = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/scrape/single", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Scraping job started:", data);
        setOpened(false);
      } else {
        console.error("Failed to start scraping job");
      }
    } catch (error) {
      console.error("Error:", error);
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
        <Stack>
          <TextInput
            label="URL to Scrape"
            placeholder="https://www.example.com"
            value={formData.url}
            onChange={(e) =>
              setFormData({ ...formData, url: e.currentTarget.value })
            }
          />

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

          <p className="font-light">These are the default Settings</p>

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

          <Button onClick={handleSubmit} fullWidth color="blue">
            Start Scraping
          </Button>
        </Stack>
      </Modal>
    </div>
  );
};
